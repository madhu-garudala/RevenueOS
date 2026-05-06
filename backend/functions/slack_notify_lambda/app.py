import json
import os
from datetime import datetime, timezone
import urllib.request
import boto3

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
secrets = boto3.client("secretsmanager", region_name="us-east-1")

TABLE_NAME = os.environ["DYNAMODB_TABLE_NAME"]
SECRET_SLACK_WEBHOOK = os.environ["SECRET_SLACK_WEBHOOK"]


def get_webhook_url():
    response = secrets.get_secret_value(SecretId=SECRET_SLACK_WEBHOOK)
    secret = json.loads(response["SecretString"])
    return secret["SLACK_WEBHOOK_URL"]


SENTIMENT_EMOJI = {
    "positive": ":green_circle:",
    "neutral": ":white_circle:",
    "frustrated": ":yellow_circle:",
    "negative": ":red_circle:",
}

URGENCY_EMOJI = {
    "high": ":fire:",
    "medium": ":large_orange_circle:",
    "low": ":large_blue_circle:",
}


def lambda_handler(event, context):
    lead_id = event.get("leadId")

    table = dynamodb.Table(TABLE_NAME)
    resp = table.get_item(Key={"leadId": lead_id})
    lead = resp["Item"]

    webhook_url = get_webhook_url()

    sentiment_icon = SENTIMENT_EMOJI.get(lead.get("sentiment", "neutral"), ":white_circle:")
    urgency_icon = URGENCY_EMOJI.get(lead.get("urgency", "low"), ":large_blue_circle:")

    blocks = [
        {
            "type": "header",
            "text": {
                "type": "plain_text",
                "text": f":zap: RevenueOS — New Lead Actioned",
            },
        },
        {
            "type": "section",
            "fields": [
                {"type": "mrkdwn", "text": f"*Customer:*\n{lead['name']}"},
                {"type": "mrkdwn", "text": f"*Company:*\n{lead.get('company', 'N/A')}"},
                {"type": "mrkdwn", "text": f"*Intent:*\n`{lead.get('intent', 'unknown')}`"},
                {
                    "type": "mrkdwn",
                    "text": f"*Urgency:*\n{urgency_icon} {lead.get('urgency', 'unknown').upper()}",
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Sentiment:*\n{sentiment_icon} {lead.get('sentiment', 'unknown').capitalize()}",
                },
                {
                    "type": "mrkdwn",
                    "text": f"*Revenue Risk:*\n`{lead.get('revenue_risk', 'unknown').upper()}`",
                },
            ],
        },
        {"type": "divider"},
        {
            "type": "section",
            "text": {
                "type": "mrkdwn",
                "text": (
                    f":email: *Email sent* — personalised reply dispatched via SES\n"
                    f":white_check_mark: *Proposal* — "
                    + (
                        f"<{lead['proposal_url']}|View PDF>"
                        if lead.get("proposal_url")
                        else "Not available"
                    )
                    + f"\n:credit_card: *Payment link* — "
                    + (
                        f"<{lead['stripe_link']}|Open Stripe Checkout>"
                        if lead.get("stripe_link")
                        else "Not available"
                    )
                ),
            },
        },
        {
            "type": "context",
            "elements": [
                {
                    "type": "mrkdwn",
                    "text": f"Lead ID: `{lead_id}` | RevenueOS Autonomous Agent | AWS us-east-1",
                }
            ],
        },
    ]

    payload = {"blocks": blocks}
    data = json.dumps(payload).encode("utf-8")
    req = urllib.request.Request(
        webhook_url,
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    urllib.request.urlopen(req)

    now = datetime.now(timezone.utc).isoformat()
    table.update_item(
        Key={"leadId": lead_id},
        UpdateExpression="SET slack_notified = :sn, updated_at = :ua",
        ExpressionAttributeValues={":sn": True, ":ua": now},
    )

    return {"leadId": lead_id, "slack_notified": True}
