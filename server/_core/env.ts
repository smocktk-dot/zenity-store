export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  keyauthSellerKey: process.env.KEYAUTH_SELLER_KEY,
  pubEmuApiKey:
    process.env.PUB_EMU_API_KEY ||
    process.env.EMU_PUB_API_KEY ||
    process.env.PUBEMU_API_KEY ||
    process.env.EMU_API_PUB_KEY,
  adminSetupKey: process.env.ADMIN_SETUP_KEY,
  resendApiKey: process.env.RESEND_API_KEY,
  resendFrom: process.env.RESEND_FROM,
};
