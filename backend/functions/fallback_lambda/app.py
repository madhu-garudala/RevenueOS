import json
import os
from datetime import datetime, timezone
import boto3

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
ses = boto3.client("ses", region_name="us-east-1")
sns = boto3.client("sns", region_name="us-east-1")

TABLE_NAME = os.environ["DYNAMODB_TABLE_NAME"]
SES_EMAIL = os.environ["SES_EMAIL"]
SNS_TOPIC_ARN = os.environ["SNS_TOPIC_ARN"]


def lambda_handler(event, context):
    lead_id = event.get("leadId")
    error_info = event.get("Error", "Unknown")
    cause = event.get("Cause", "Unknown cause")
    failed_branch = event.get("failed_branch", "unknown")

    table = dynamodb.Table(TABLE_NAME)
    resp = table.get_item(Key={"leadId": lead_id})
    lead = resp["Item"]

    now = datetime.now(timezone.utc).isoformat()

    error_entry = {
        "timestamp": now,
        "error": error_info,
        "cause": cause,
        "branch": failed_branch,
    }

    recovery_succeeded = False

    # Attempt recovery for reply failure
    if "reply" in failed_branch.lower() or "reply" in cause.lower():
        try:
            ses.send_email(
                Source=SES_EMAIL,
                Destination={"ToAddresses": [SES_EMAIL]},
                Message={
                    "Subject": {"Data": f"RevenueOS: Follow-up for {lead.get('name', 'Lead')}"},
                    "Body": {
                        "Text": {
                            "Data": (
                                f"Hi {lead.get('name', 'there')},\n\n"
                                f"Thank you for reaching out to RevenueOS. "
                                f"A member of our team will be in touch shortly.\n\n"
                                f"Best regards,\nThe RevenueOS Team"
                            )
                        }
                    },
                },
            )
            recovery_succeeded = True
            error_entry["recovery"] = "plain_text_email_sent"
        except Exception as e:
            error_entry["recovery_error"] = str(e)
    elif "payment" in failed_branch.lower():
        error_entry["recovery"] = "payment_link_generation_failed_manual_follow_up_required"
        recovery_succeeded = True
    elif "proposal" in failed_branch.lower():
        error_entry["recovery"] = "proposal_delivery_failed_manual_follow_up_required"
        recovery_succeeded = True

    if not recovery_succeeded:
        # Escalate via SNS
        try:
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject=f"RevenueOS Escalation: Lead {lead_id}",
                Message=json.dumps(
                    {
                        "leadId": lead_id,
                        "name": lead.get("name"),
                        "company": lead.get("company"),
                        "error": error_info,
                        "cause": cause,
                        "lead": {k: str(v) for k, v in lead.items()},
                    },
                    indent=2,
                ),
            )
            error_entry["escalated_via_sns"] = True
        except Exception as e:
            error_entry["sns_error"] = str(e)

        new_status = "ESCALATED"
    else:
        new_status = "COMPLETED"

    table.update_item(
        Key={"leadId": lead_id},
        UpdateExpression=(
            "SET #st = :st, escalated = :esc, "
            "error_log = list_append(if_not_exists(error_log, :empty), :el), "
            "updated_at = :ua"
        ),
        ExpressionAttributeNames={"#st": "status"},
        ExpressionAttributeValues={
            ":st": new_status,
            ":esc": not recovery_succeeded,
            ":empty": [],
            ":el": [error_entry],
            ":ua": now,
        },
    )

    return {"leadId": lead_id, "status": new_status, "recovery_succeeded": recovery_succeeded}
