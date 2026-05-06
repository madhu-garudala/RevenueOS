# RevenueOS — Autonomous Revenue Intelligence

RevenueOS is an AWS-native autonomous agent that watches customer conversations on Slack, analyses voice call recordings, and acts — simultaneously sending a personalised email, generating a Stripe payment link, attaching a proposal PDF, and posting a Slack notification — without any human coordination. If anything fails, it self-corrects. If the customer goes quiet, it follows up automatically.

## Architecture

```
Slack / Web / Voice
        ↓
API Gateway (HTTP API)
        ↓
ingest_event Lambda
        ↓
analyze_intent Lambda  ←  Amazon Bedrock (Claude Sonnet 4.6)
        ↓
Step Functions (parallel)
   ├── reply_lambda       → Amazon SES (personalised email)
   ├── payment_lambda     → Stripe (payment link)
   └── proposal_lambda    → S3 (presigned PDF URL)
        ↓
slack_notify_lambda    → Slack webhook
        ↓
schedule_followup_lambda → EventBridge Scheduler
        ↓  (2 min / 48 hr later)
followup_lambda        → Amazon Bedrock + SES

On any failure → fallback_lambda → SNS escalation
```

**AWS services used:** Bedrock, Lambda, Step Functions, DynamoDB, API Gateway, SES, S3, Transcribe, EventBridge Scheduler, SNS, Secrets Manager

---

## Prerequisites

- AWS CLI configured (`aws configure`)
- AWS SAM CLI installed (`brew install aws-sam-cli`)
- Python 3.12 (`brew install python@3.12`)
- Node.js 18+
- A Slack app with Event Subscriptions
- A Stripe account (test mode is fine)

---

## Setup

### 1. Create AWS Secrets Manager secrets

All credentials live in Secrets Manager — never in code or environment variables.

```bash
# Stripe secret key
aws secretsmanager create-secret \
  --name revenueos/stripe/secret-key \
  --secret-string '{"STRIPE_SECRET_KEY":"sk_test_YOUR_KEY"}' \
  --region us-east-1

# Slack incoming webhook URL
aws secretsmanager create-secret \
  --name revenueos/slack/webhook-url \
  --secret-string '{"SLACK_WEBHOOK_URL":"https://hooks.slack.com/services/YOUR/WEBHOOK"}' \
  --region us-east-1

# Slack bot token
aws secretsmanager create-secret \
  --name revenueos/slack/bot-token \
  --secret-string '{"SLACK_BOT_TOKEN":"xoxb-YOUR-BOT-TOKEN"}' \
  --region us-east-1
```

### 2. Verify your email in SES

```bash
aws ses verify-email-identity --email-address your-email@gmail.com --region us-east-1
```

Check your inbox for the verification link.

### 3. Create an S3 bucket and upload your proposal PDF

```bash
aws s3 mb s3://your-proposals-bucket --region us-east-1
aws s3 cp your_proposal.pdf s3://your-proposals-bucket/ --region us-east-1
```

### 4. Deploy the backend

Edit `backend/samconfig.toml` and set your values:

```toml
parameter_overrides = "StageName=prod SESEmail=your-email@gmail.com S3ProposalsBucket=your-proposals-bucket FollowUpMinutes=2"
```

Then deploy:

```bash
cd backend
sam build && sam deploy
```

After deploy, copy the `ApiGatewayUrl` from the Outputs.

### 5. Set up the frontend

```bash
cd frontend
cp .env.example .env
# Edit .env — set VITE_API_URL to the ApiGatewayUrl from step 4
npm install
npm run dev       # local preview at http://localhost:3000
npm run build     # production build
```

### 6. Set up Slack Event Subscriptions

1. Go to [api.slack.com/apps](https://api.slack.com/apps) → your app → **Event Subscriptions**
2. Enable Events and set the Request URL to:
   `https://YOUR_API_GATEWAY_URL/prod/slack/events`
3. Under **Subscribe to bot events** → add `message.channels`
4. Save Changes, then reinstall the app to your workspace
5. Invite the bot to your alerts channel: `/invite @YourBotName`

---

## Sending a test lead

```bash
curl -X POST "https://YOUR_API_GATEWAY_URL/prod/event" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Priya Mehta",
    "company": "Razorpay",
    "email": "priya@razorpay.com",
    "message": "We are ready to move forward with RevenueOS. Can you send a proposal and pricing?",
    "channel": "web"
  }'
```

Within 30 seconds you should see:
- Lead appear on the dashboard: NEW → ANALYZED → EXECUTING → COMPLETED
- Personalised email in your inbox
- Clickable Stripe payment link on the lead card
- Proposal PDF presigned URL on the lead card
- Rich Slack notification in your alerts channel
- Follow-up email scheduled (fires after `FollowUpMinutes`)

---

## Project structure

```
RevenueOS/
├── backend/
│   ├── template.yaml                  # SAM template — all AWS resources
│   ├── samconfig.toml                 # SAM deploy config
│   ├── functions/
│   │   ├── ingest_event/              # Entry point — Slack + web events
│   │   ├── analyze_intent/            # Bedrock intent + sentiment analysis
│   │   ├── reply_lambda/              # Bedrock email draft + SES send
│   │   ├── payment_lambda/            # Stripe payment link creation
│   │   ├── proposal_lambda/           # S3 presigned URL generation
│   │   ├── slack_notify_lambda/       # Slack Block Kit notification
│   │   ├── fallback_lambda/           # Self-correction + SNS escalation
│   │   ├── followup_lambda/           # Autonomous follow-up email
│   │   ├── schedule_followup_lambda/  # EventBridge Scheduler creation
│   │   ├── transcribe_lambda/         # AWS Transcribe + Bedrock voice analysis
│   │   └── get_leads_lambda/          # Dashboard feed API
│   └── statemachine/
│       └── revenue_os_workflow.asl.json
├── frontend/
│   ├── src/
│   │   ├── components/                # React components
│   │   └── utils/                     # API calls + formatters
│   ├── .env.example                   # Copy to .env and set VITE_API_URL
│   └── package.json
└── assets/
    └── demo_call_script.txt           # Sample voice call script for demos
```

---

## Key design decisions

- **Single DynamoDB table** — all lead state in one place, StatusIndex GSI for dashboard queries
- **No hardcoded credentials** — everything via AWS Secrets Manager
- **Step Functions for orchestration** — parallel execution with retry + catch for self-correction
- **EventBridge Scheduler for follow-ups** — serverless, no polling, fires once and deletes itself
- **Bedrock cross-region inference profile** — `us.anthropic.claude-sonnet-4-6` for higher throughput
