import type { Express, Request, Response } from "express";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { getCustomToken, verifyCustomJwt } from "./routers";

const MAX_UPLOAD_BYTES = 500 * 1024 * 1024; // 500 MB

async function requireFullAdmin(req: Request): Promise<boolean> {
  const token = getCustomToken(req);
  const payload = token ? await verifyCustomJwt(token) : null;
  return !!payload && payload.role === "admin" && payload.adminRole !== "support";
}

/**
 * Upload de arquivos (até 500MB) para a aba Downloads.
 *
 * O arquivo não passa pelo servidor serverless — o cliente sobe direto pro
 * Vercel Blob usando um token gerado aqui. Requer BLOB_READ_WRITE_TOKEN
 * configurado nas env vars do projeto Vercel (Storage → Blob → connect).
 */
export function registerUploadApi(app: Express) {
  // Status: o frontend chama antes do upload para detectar configuração faltando
  app.get("/api/admin/blob-upload", async (req: Request, res: Response) => {
    if (!(await requireFullAdmin(req))) {
      return res.status(403).json({ error: "forbidden" });
    }
    return res.json({ configured: !!process.env.BLOB_READ_WRITE_TOKEN });
  });

  app.post("/api/admin/blob-upload", async (req: Request, res: Response) => {
    if (!(await requireFullAdmin(req))) {
      return res.status(403).json({ error: "forbidden" });
    }
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return res.status(500).json({
        error: "blob_not_configured",
        message: "BLOB_READ_WRITE_TOKEN não configurado — crie um Blob Store na Vercel (Storage → Blob) e faça redeploy",
      });
    }

    try {
      const jsonResponse = await handleUpload({
        body: req.body as HandleUploadBody,
        request: req as any,
        onBeforeGenerateToken: async () => ({
          maximumSizeInBytes: MAX_UPLOAD_BYTES,
          addRandomSuffix: true,
          allowOverwrite: false,
          tokenPayload: JSON.stringify({ adminId: "admin" }),
        }),
      });
      return res.json(jsonResponse);
    } catch (err: any) {
      console.error("[Upload] blob-upload error:", err);
      return res.status(400).json({ error: err?.message || "upload_error" });
    }
  });
}
