import sharp from "sharp";
import { GetObjectCommand, PutObjectCommand } from "@aws-sdk/client-s3";
import crypto from "crypto";
import { r2BucketName, r2Client } from "../r2/r2Client.js";
const MAX_UPLOAD_SIZE_BITES = 25 * 1024 * 1024; //25mb
const MAX_WIDTH = 1200;
const MAX_HEIGHT = 1200;
const OUTPUT_QUALITY = 80;

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];

export async function uploadAvatarToR2({ userId, file }) {
  if (!file || !file.buffer) {
    throw new Error("IMAGE_FILE_REQUIRED");
  }
  if (file.size > MAX_UPLOAD_SIZE_BITES) {
    throw new Error("IMAGE_TOO_LARGE");
  }
  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new Error("IMAGE_INVALID_TYPE");
  }

  const compressedBuffer = await sharp(file.buffer)
    .rotate()
    .resize({
      width: MAX_WIDTH,
      height: MAX_HEIGHT,
      fit: "inside",
      withoutEnlargement: true,
    })
    .toFormat("webp", { quality: OUTPUT_QUALITY })
    .toBuffer();

  const ext = "webp";
  const random = crypto.randomBytes(8).toString("hex");
  const objectKey = `avatars/${userId}-${random}.${ext}`;

  const putCommand = new PutObjectCommand({
    Bucket: r2BucketName,
    Key: objectKey,
    Body: compressedBuffer,
    ContentType: "image/webp",
  });

  await r2Client.send(putCommand);

  return objectKey;
}
export async function getAvatarFromR2({ objectKey }) {
  if (!objectKey) {
    throw new Error("AVATAR_KEY_REQUIRED");
  }

  const getCommand = new GetObjectCommand({
    Bucket: r2BucketName,
    Key: objectKey,
  });

  const resp = await r2Client.send(getCommand);

  // resp.Body es un stream legible
  return {
    stream: resp.Body, // Readable
    contentType: resp.ContentType ?? "image/webp",
    contentLength: resp.ContentLength ?? undefined,
  };
}
