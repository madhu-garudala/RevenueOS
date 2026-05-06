import json
import os
from datetime import datetime, timezone
import boto3

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")

TABLE_NAME = os.environ["DYNAMODB_TABLE_NAME"]
BEDROCK_MODEL_ID = os.environ["BEDROCK_MODEL_ID"]
SES_EMAIL = os.environ["SES_EMAIL"]
SES_REGION = os.environ.get("SES_REGION", "us-east-1")

ses = boto3.client("ses", region_name=SES_REGION)

EMAIL_PROMPT = """You are a senior sales executive writing a personalised reply to a customer.

Customer name: "{name}"
Company: "{company}"
Their message: "{message}"
Detected intent: "{intent}"
Detected urgency: "{urgency}"
Detected sentiment: "{sentiment}"

Write a professional, warm, personalised email reply. 3 paragraphs maximum.
- Paragraph 1: Acknowledge their specific message. Reference their company name naturally.
- Paragraph 2: Address their intent directly. If proposal_request — confirm it is being sent. If pricing_inquiry — provide a clear next step.
- Paragraph 3: Clear single CTA. If urgency=high — suggest a call today or tomorrow.

Sign off as: "The RevenueOS Team"
Subject line: include a subject line at the very top prefixed with "Subject: "
Do not use placeholders like [name] or [company]. Write the actual content.
Return only the email text. No explanation. No markdown."""


def lambda_handler(event, context):
    lead_id = event.get("leadId") or (event.get("Payload", {}) or {}).get("leadId", event.get("leadId"))
    if not lead_id:
        # Step Functions passes input directly
        lead_id = event.get("leadId")

    table = dynamodb.Table(TABLE_NAME)
    resp = table.get_item(Key={"leadId": lead_id})
    lead = resp["Item"]

    prompt = EMAIL_PROMPT.format(
        name=lead["name"],
        company=lead["company"],
        message=lead["message"],
        intent=lead.get("intent", "general_inquiry"),
        urgency=lead.get("urgency", "medium"),
        sentiment=lead.get("sentiment", "neutral"),
    )

    bedrock_response = bedrock.converse(
        modelId=BEDROCK_MODEL_ID,
        messages=[{"role": "user", "content": [{"text": prompt}]}],
        inferenceConfig={"maxTokens": 1024, "temperature": 0.4},
    )

    email_body = bedrock_response["output"]["message"]["content"][0]["text"].strip()

    # Extract subject
    lines = email_body.split("\n")
    subject = "Following up on your inquiry"
    body_lines = lines
    if lines[0].startswith("Subject:"):
        subject = lines[0].replace("Subject:", "").strip()
        body_lines = lines[1:]
    body_text = "\n".join(body_lines).strip()

    ses.send_email(
        Source=SES_EMAIL,
        Destination={"ToAddresses": [SES_EMAIL]},
        Message={
            "Subject": {"Data": subject},
            "Body": {"Text": {"Data": body_text}},
        },
    )

    now = datetime.now(timezone.utc).isoformat()
    table.update_item(
        Key={"leadId": lead_id},
        UpdateExpression="SET reply_sent = :rs, reply_content = :rc, updated_at = :ua",
        ExpressionAttributeValues={
            ":rs": True,
            ":rc": email_body,
            ":ua": now,
        },
    )

    return {"leadId": lead_id, "reply_sent": True, "subject": subject}
