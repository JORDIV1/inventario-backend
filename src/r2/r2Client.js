import { S3Client } from "@aws-sdk/client-s3";

const endpoint = process.env.R2_ENDPOINT;
const accessKeyId = process.env.R2_ACCESS_KEY;
const secretAccessKey = process.env.R2_SECRET_KEY;
export const r2BucketName = process.env.R2_BUCKET_NAME;
if (!endpoint || !accessKeyId || !secretAccessKey || !r2BucketName) {
  throw new Error("R2 configuration missing env vars");
}
export const r2Client = new S3Client({
  region: "auto",
  endpoint,
  credentials: {
    accessKeyId,
    secretAccessKey,
  },
});
