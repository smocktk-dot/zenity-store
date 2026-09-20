import type { Express, Request, Response } from "express";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCustomToken, verifyCustomJwt } from "./routers";

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024; // 500 MB

/**
 * Upload de arquivos (até 500MB) para a aba Downloads.
 *
 * O arquivo não passa pelo servidor serverless — o cliente sobe direto pro
 * Vercel Blob usando um token gerado aqui. Requer BLOB_READ_WRITE_TOKEN
 * configurado nas env vars do projeto Vercel.
 */
export function registerUploadApi(app: Express) {
  app.post("/api/admin/blob-upload", async (req: Request, res: Response) => {
    const token = getCustomToken(req);
    const payload = token ? await verifyCustomJwt(token) : null;
    if (!payload || payload.role !== "admin" || payload.adminRole === "support") {
      return res.status(403).json({ error: "forbidden" });
    }

    try {
      const jsonResponse = await handleUpload({
        body: req.body as HandleUploadBody,
        request: req as any,
        onBeforeGenerateToken: async () => ({
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          allowOverwrite: false,
          tokenPayload: JSON.stringify({ adminId: payload.sub }),
        }),
      });
      return res.json(jsonResponse);
    } catch (err: any) {
      console.error("[Upload] blob-upload error:", err);
      return res.status(400).json({ error: err?.message || "upload_error" });
    }
  });
}
