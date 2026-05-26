import { registerAs } from "@nestjs/config";

export default registerAs("redis", () => ({
  url: process.env.REDIS_URL ?? "localhost:6379",
  password: process.env.REDIS_PASSWORD,
  username: process.env.REDIS_USERNAME,
  tls: process.env.REDIS_TLS === "true",
}));
