import fs from "node:fs";
import path from "node:path";
import https from "node:https";
import crypto from "node:crypto";
import { getTelegramConfig } from "./telegram";

const UPLOADS_DIR = path.resolve(process.cwd(), "public", "images", "uploads");

function ensureUploadsDirExists() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

/**
 * Downloads a binary file from Telegram servers given its file_id.
 */
export async function downloadTelegramFile(
  fileId: string,
): Promise<{ buffer: Buffer; extension: string }> {
  const { token } = getTelegramConfig();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured.");

  // 1. Get file path from Telegram
  const fileInfo = await new Promise<{ ok: boolean; result?: { file_path: string } }>(
    (resolve, reject) => {
      https
        .get(
          `https://api.telegram.org/bot${token}/getFile?file_id=${encodeURIComponent(fileId)}`,
          { family: 4 },
          (res) => {
            let data = "";
            res.on("data", (chunk) => (data += chunk));
            res.on("end", () => {
              try {
                resolve(JSON.parse(data));
              } catch (e) {
                reject(e);
              }
            });
          },
        )
        .on("error", reject);
    },
  );

  if (!fileInfo.ok || !fileInfo.result?.file_path) {
    throw new Error("Could not retrieve file information from Telegram.");
  }

  const filePath = fileInfo.result.file_path;
  const extension = path.extname(filePath) || ".jpg";

  // 2. Download the binary stream
  return new Promise((resolve, reject) => {
    https
      .get(
        `https://api.telegram.org/file/bot${token}/${filePath}`,
        { family: 4 },
        (res) => {
          const chunks: Buffer[] = [];
          res.on("data", (chunk) => chunks.push(Buffer.from(chunk)));
          res.on("end", () => {
            resolve({
              buffer: Buffer.concat(chunks),
              extension,
            });
          });
        },
      )
      .on("error", reject);
  });
}

/**
 * Uploads an image buffer directly to Cloudinary using their REST API if credentials exist.
 */
async function uploadToCloudinary(
  buffer: Buffer,
  folder: string,
): Promise<string | null> {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME?.trim();
  const apiKey = process.env.CLOUDINARY_API_KEY?.trim();
  const apiSecret = process.env.CLOUDINARY_API_SECRET?.trim();

  if (!cloudName || !apiKey || !apiSecret) {
    return null; // Not configured, fallback to local
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const signatureString = `folder=${folder}&timestamp=${timestamp}${apiSecret}`;
  const signature = crypto.createHash("sha1").update(signatureString).digest("hex");

  const base64Image = `data:image/jpeg;base64,${buffer.toString("base64")}`;

  const payload = JSON.stringify({
    file: base64Image,
    api_key: apiKey,
    timestamp,
    signature,
    folder,
  });

  return new Promise((resolve) => {
    const req = https.request(
      `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(payload),
        },
        family: 4,
        timeout: 25000,
      },
      (res) => {
        let body = "";
        res.on("data", (chunk) => (body += chunk));
        res.on("end", () => {
          try {
            const data = JSON.parse(body);
            if (data.secure_url) {
              console.log("[Media] Uploaded image to Cloudinary:", data.secure_url);
              resolve(data.secure_url as string);
            } else {
              console.error("[Media] Cloudinary response missing secure_url:", data);
              resolve(null);
            }
          } catch {
            resolve(null);
          }
        });
      },
    );

    req.on("error", (err) => {
      console.error("[Media] Error uploading to Cloudinary:", err);
      resolve(null);
    });

    req.write(payload);
    req.end();
  });
}

/**
 * Saves Telegram photo: uses Cloudinary if configured, otherwise saves to local public/images/uploads/
 */
export async function saveTelegramPhoto(
  fileId: string,
  prefix = "upload",
): Promise<string> {
  const { buffer, extension } = await downloadTelegramFile(fileId);

  // 1. Try Cloudinary
  const cloudinaryUrl = await uploadToCloudinary(buffer, "markson_hotel");
  if (cloudinaryUrl) {
    return cloudinaryUrl;
  }

  // 2. Fallback to Local Storage
  ensureUploadsDirExists();
  const filename = `${prefix}-${Date.now()}${extension}`;
  const localFilePath = path.join(UPLOADS_DIR, filename);
  fs.writeFileSync(localFilePath, buffer);

  console.log("[Media] Saved image locally to:", localFilePath);
  return `/images/uploads/${filename}`;
}
