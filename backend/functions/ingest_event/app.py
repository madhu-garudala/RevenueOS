import json
import os
import uuid
from datetime import datetime, timezone
import boto3

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
lambda_client = boto3.client("lambda", region_name="us-east-1")

TABLE_NAME = os.environ["DYNAMODB_TABLE_NAME"]
ANALYZE_INTENT_FUNCTION_NAME = os.environ["ANALYZE_INTENT_FUNCTION_NAME"]


def lambda_handler(event, context):
    body = {}
    if event.get("body"):
        try:
            parsed = json.loads(event["body"])
            body = parsed if isinstance(parsed, dict) else {}
        except Exception:
            body = {}
    elif isinstance(event, dict):
        body = event

    # Slack URL verification challenge
    if body.get("type") == "url_verification":
        return {
            "statusCode": 200,
            "headers": {"Content-Type": "application/json"},
            "body": json.dumps({"challenge": body["challenge"]}),
        }

    # Slack event callback
    if body.get("type") == "event_callback":
        slack_event = body.get("event", {})
        # Ignore bot messages
        if slack_event.get("bot_id") or slack_event.get("subtype") == "bot_message":
            return {"statusCode": 200, "body": json.dumps({"ok": True})}
        text = slack_event.get("text", "")
        user_id = slack_event.get("user", "unknown")
        channel_id = slack_event.get("channel", "unknown")
        payload = {
            "name": user_id,
            "company": "Unknown (Slack)",
            "email": "",
            "message": text,
            "channel": "slack",
            "slack_user_id": user_id,
            "slack_channel_id": channel_id,
        }
    else:
        # Direct POST /event
        payload = {
            "name": body.get("name", "Unknown"),
            "company": body.get("company", "Unknown"),
            "email": body.get("email", ""),
            "message": body.get("message", ""),
            "channel": body.get("channel", "web"),
        }

    lead_id = str(uuid.uuid4())
    now = datetime.now(timezone.utc).isoformat()

    item = {
        "leadId": lead_id,
        "name": payload["name"],
        "company": payload["company"],
        "email": payload.get("email", ""),
        "message": payload["message"],
        "channel": payload["channel"],
        "status": "NEW",
        "intent": None,
        "urgency": None,
        "sentiment": None,
        "revenue_risk": None,
        "intent_reasoning": None,
        "reply_sent": False,
        "reply_content": None,
        "stripe_link": None,
        "proposal_url": None,
        "slack_notified": False,
        "followup_scheduled": False,
        "followup_sent": False,
        "transcript": None,
        "call_action_items": [],
        "call_sentiment": None,
        "call_deal_risk": None,
        "escalated": False,
        "error_log": [],
        "created_at": now,
        "updated_at": now,
    }

    table = dynamodb.Table(TABLE_NAME)
    table.put_item(Item=item)

    # Synchronously invoke analyze_intent
    lambda_client.invoke(
        FunctionName=ANALYZE_INTENT_FUNCTION_NAME,
        InvocationType="Event",
        Payload=json.dumps({"leadId": lead_id}),
    )

    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
        },
        "body": json.dumps({"leadId": lead_id, "status": "NEW"}),
    }
