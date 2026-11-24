const MAX_REQUEST_BODY_BYTES = 16 * 1024;

type JsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; response: Response };

function badRequest() {
  return Response.json({ error: "Please submit valid booking details." }, { status: 400 });
}

export async function readJsonBody(request: Request): Promise<JsonBodyResult> {
  if (!request.headers.get("content-type")?.toLowerCase().startsWith("application/json")) {
    return {
      ok: false,
      response: Response.json({ error: "Content-Type must be application/json." }, { status: 415 }),
    };
  }

  const reader = request.body?.getReader();
  if (!reader) return { ok: false, response: badRequest() };

  const chunks: Uint8Array[] = [];
  let totalBytes = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      totalBytes += value.byteLength;
      if (totalBytes > MAX_REQUEST_BODY_BYTES) {
        try {
          await reader.cancel();
        } catch (error) {
          console.error("Could not stop an oversized booking request body.", error);
        }
        return {
          ok: false,
          response: Response.json({ error: "Request body is too large." }, { status: 413 }),
        };
      }
      chunks.push(value);
    }
  } catch (error) {
    console.error("Could not read a booking request body.", error);
    return { ok: false, response: badRequest() };
  } finally {
    reader.releaseLock();
  }

  const bytes = new Uint8Array(totalBytes);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.byteLength;
  }

  try {
    return { ok: true, value: JSON.parse(new TextDecoder().decode(bytes)) as unknown };
  } catch {
    return { ok: false, response: badRequest() };
  }
}
