import os
from datetime import datetime, timezone
import boto3

dynamodb = boto3.resource("dynamodb", region_name="us-east-1")
s3 = boto3.client("s3", region_name="us-east-1")

TABLE_NAME = os.environ["DYNAMODB_TABLE_NAME"]
S3_PROPOSALS_BUCKET = os.environ["S3_PROPOSALS_BUCKET"]


def lambda_handler(event, context):
    lead_id = event.get("leadId")

    # Find the first PDF in the bucket root
    list_resp = s3.list_objects_v2(Bucket=S3_PROPOSALS_BUCKET, MaxKeys=20)
    pdf_key = None
    for obj in list_resp.get("Contents", []):
        key = obj["Key"]
        if key.endswith(".pdf") and "/" not in key.rstrip("/"):
            pdf_key = key
            break

    if not pdf_key:
        # Fallback: any PDF anywhere in the bucket
        for obj in list_resp.get("Contents", []):
            if obj["Key"].endswith(".pdf"):
                pdf_key = obj["Key"]
                break

    if not pdf_key:
        raise Exception("No proposal PDF found in bucket")

    presigned_url = s3.generate_presigned_url(
        "get_object",
        Params={"Bucket": S3_PROPOSALS_BUCKET, "Key": pdf_key},
        ExpiresIn=3600,
    )

    table = dynamodb.Table(TABLE_NAME)
    now = datetime.now(timezone.utc).isoformat()
    table.update_item(
        Key={"leadId": lead_id},
        UpdateExpression="SET proposal_url = :pu, updated_at = :ua",
        ExpressionAttributeValues={
            ":pu": presigned_url,
            ":ua": now,
        },
    )

    return {"leadId": lead_id, "proposal_url": presigned_url}
