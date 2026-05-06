import json
import os
from datetime import datetime, timezone
import boto3

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")
ses = boto3.client("ses", region_name="us-east-1")
scheduler = boto3.client("scheduler", region_name="us-east-1")

TABLE_NAME = os.environ["DYNAMODB_TABLE_NAME"]
BEDROCK_MODEL_ID = os.environ["BEDROCK_MODEL_ID"]
SES_EMAIL = os.environ["SES_EMAIL"]
FOLLOWUP_FUNCTION_ARN = os.environ.get("FOLLOWUP_FUNCTION_ARN", "")
SCHEDULER_ROLE_ARN = os.environ.get("SCHEDULER_ROLE_ARN", "")

FOLLOWUP_PROMPT = """You are writing a follow-up email to a customer who has not replied.

Customer name: "{name}"
Company: "{company}"
Original message they sent: "{message}"
Days since first contact: "{days}"
Previous email subject: "{previous_subject}"

Write a SHORT follow-up email. Maximum 3 sentences.
- Do NOT repeat the original pitch.
- Use a completely different angle or hook.
- End with a simple yes/no question to lower the barrier to reply.
- Subject line must be different from the previous email.

Prefix with "Subject: " on the first line.
Return only the email. No explanation."""


def lambda_handler(event, context):
    lead_id = event.get("leadId")

    table = dynamodb.Table(TABLE_NAME)
    resp = table.get_item(Key={"leadId": lead_id})
    lead = resp["Item"]

    # Skip dead or escalated leads
    if lead.get("status") in ("DEAD", "ESCALATED"):
        return {"leadId": lead_id, "action": "skipped", "reason": lead["status"]}

    now = datetime.now(timezone.utc).isoformat()

    # If already sent follow-up, mark dead
    if lead.get("followup_sent"):
        table.update_item(
            Key={"leadId": lead_id},
            UpdateExpression="SET #st = :st, updated_at = :ua",
            ExpressionAttributeNames={"#st": "status"},
            ExpressionAttributeValues={":st": "DEAD", ":ua": now},
        )
        return {"leadId": lead_id, "action": "marked_dead"}

    created = datetime.fromisoformat(lead.get("created_at", now).replace("Z", "+00:00"))
    days_since = (datetime.now(timezone.utc) - created).days or 1

    # Extract previous subject from reply_content
    previous_subject = "Your RevenueOS inquiry"
    if lead.get("reply_content"):
        first_line = lead["reply_content"].split("\n")[0]
        if first_line.startswith("Subject:"):
            previous_subject = first_line.replace("Subject:", "").strip()

    prompt = FOLLOWUP_PROMPT.format(
        name=lead["name"],
        company=lead.get("company", "your company"),
        message=lead["message"],
        days=days_since,
        previous_subject=previous_subject,
    )

    bedrock_response = bedrock.converse(
        modelId=BEDROCK_MODEL_ID,
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        inferenceConfig={"maxTokens": 512, "temperature": 0.5},
    )

    email_body = bedrock_response["output"]["message"]["content"][0]["text"].strip()
    lines = email_body.split("\n")
    subject = "Quick question"
    if lines[0].startswith("Subject:"):
        subject = lines[0].replace("Subject:", "").strip()
        email_body = "\n".join(lines[1:]).strip()

    recipient = lead.get("email") or SES_EMAIL
    ses.send_email(
        Source=SES_EMAIL,
        Destination={"ToAddresses": [recipient]},
        Message={
            "Subject": {"Data": subject},
            "Body": {"Text": {"Data": email_body}},
        },
    )

    table.update_item(
        Key={"leadId": lead_id},
        UpdateExpression="SET followup_sent = :fs, #st = :st, updated_at = :ua",
        ExpressionAttributeNames={"#st": "status"},
        ExpressionAttributeValues={
            ":fs": True,
            ":st": "FOLLOW_UP_SENT",
            ":ua": now,
        },
    )

    # Schedule a second check in 2 more minutes
    if FOLLOWUP_FUNCTION_ARN and SCHEDULER_ROLE_ARN:
        import uuid as _uuid
        schedule_name = f"followup-check-{lead_id[:8]}-{_uuid.uuid4().hex[:6]}"
        from datetime import timedelta
        fire_at = datetime.now(timezone.utc) + timedelta(minutes=2)
        fire_str = fire_at.strftime("%Y-%m-%dT%H:%M:%S")
        try:
            scheduler.create_schedule(
                Name=schedule_name,
                ScheduleExpression=f"at({fire_str})",
                ScheduleExpressionTimezone="UTC",
                FlexibleTimeWindow={"Mode": "OFF"},
                Target={
                    "Arn": FOLLOWUP_FUNCTION_ARN,
                    "RoleArn": SCHEDULER_ROLE_ARN,
                    "Input": json.dumps({"leadId": lead_id}),
                },
                ActionAfterCompletion="DELETE",
            )
        except Exception:
            pass  # Non-critical — follow-up already sent

    return {"leadId": lead_id, "action": "followup_sent", "subject": subject}
