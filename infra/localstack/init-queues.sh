#!/bin/bash
set -euo pipefail

echo "Creating SQS queues..."

# Dead letter queue first
awslocal sqs create-queue --queue-name mora-jobs-dlq >/dev/null

DLQ_URL=$(awslocal sqs get-queue-url \
  --queue-name mora-jobs-dlq \
  --query 'QueueUrl' \
  --output text)

DLQ_ARN=$(awslocal sqs get-queue-attributes \
  --queue-url "$DLQ_URL" \
  --attribute-names QueueArn \
  --query 'Attributes.QueueArn' \
  --output text)

# Main queue with redrive policy (3 failures → DLQ)
awslocal sqs create-queue \
  --queue-name mora-jobs \
  --attributes "{\"RedrivePolicy\":\"{\\\"deadLetterTargetArn\\\":\\\"${DLQ_ARN}\\\",\\\"maxReceiveCount\\\":\\\"3\\\"}\"}" >/dev/null

echo "SQS queues ready:"
awslocal sqs list-queues

echo "Creating S3 buckets..."
awslocal s3api head-bucket \
  --bucket mora-uploads 2>/dev/null \
|| awslocal s3api create-bucket \
  --bucket mora-uploads
echo "S3 buckets ready."
