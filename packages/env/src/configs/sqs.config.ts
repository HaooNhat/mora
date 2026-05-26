import { registerAs } from "@nestjs/config";

export default registerAs("sqs", () => ({
  queueUrl: process.env.SQS_QUEUE_URL!,
  endpointUrl: process.env.SQS_ENDPOINT_URL,
  region: process.env.AWS_REGION ?? "us-east-1",
}));
