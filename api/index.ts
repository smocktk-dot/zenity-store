// Vercel serverless entry point
// The server is pre-compiled to api/server.mjs by the build script
// This file imports the pre-compiled bundle
// Build ref: 9afd5c6
// @ts-ignore
import server from "./server.mjs";
console.log("[Vercel] server.mjs loaded, build ref: 9afd5c6");
export default server;
