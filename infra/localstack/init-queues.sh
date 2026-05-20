#!/bin/bash
set -e

echo "Creating SQS queues..."

# Dead letter queue first
awslocal sqs create-queue --queue-name mora-jobs-dlq

DLQ_ARN=$(awslocal sqs get-queue-attributes \
  --queue-url http://localstack:4566/000000000000/mora-jobs-dlq \
  --attribute-names QueueArn \
  --query 'Attributes.QueueArn' \
  --output text)

# Main queue with redrive policy (3 failures → DLQ)
awslocal sqs create-queue \
  --queue-name mora-jobs \
  --attributes "{\"RedrivePolicy\":\"{\\\"deadLetterTargetArn\\\":\\\"${DLQ_ARN}\\\",\\\"maxReceiveCount\\\":\\\"3\\\"}\"}"

echo "SQS queues ready:"
awslocal sqs list-queues

echo "Creating S3 buckets..."
awslocal s3 mb s3://mora-uploads
echo "S3 buckets ready."
