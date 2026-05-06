import json
import os
import uuid
from datetime import datetime, timezone, timedelta
import boto3

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
scheduler = boto3.client("scheduler", region_name="us-east-1")

TABLE_NAME = os.environ["DYNAMODB_TABLE_NAME"]
FOLLOWUP_FUNCTION_ARN = os.environ["FOLLOWUP_FUNCTION_ARN"]
SCHEDULER_ROLE_ARN = os.environ["SCHEDULER_ROLE_ARN"]
FOLLOW_UP_MINUTES = int(os.environ.get("FOLLOW_UP_MINUTES", "2"))


def lambda_handler(event, context):
    lead_id = event.get("leadId")

    fire_at = datetime.now(timezone.utc) + timedelta(minutes=FOLLOW_UP_MINUTES)
    fire_str = fire_at.strftime("%Y-%m-%dT%H:%M:%S")
    schedule_name = f"followup-{lead_id[:8]}-{uuid.uuid4().hex[:6]}"

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

    table = dynamodb.Table(TABLE_NAME)
    from datetime import datetime as dt
    now = dt.now(timezone.utc).isoformat()
    table.update_item(
        Key={"leadId": lead_id},
        UpdateExpression="SET followup_scheduled = :fs, updated_at = :ua",
        ExpressionAttributeValues={":fs": True, ":ua": now},
    )

    return {"leadId": lead_id, "schedule_name": schedule_name, "fire_at": fire_str}
