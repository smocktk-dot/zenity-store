// Vercel serverless entry point
// The server is pre-compiled to api/server.mjs by the build script
// This file imports the pre-compiled bundle
console.log("[Vercel] server.mjs loaded at", new Date().toISOString());
export { default } from "./server.mjs";
