import { createEnv } from "@t3-oss/env-nextjs";
import { z } from "zod";

export const env = createEnv({
  server: {
    METAL_API_KEY: z.string(),
  },
  client: {
    NEXT_PUBLIC_WEBSOCKET_URL: z.string().url(),
  },
  runtimeEnv: {
    METAL_API_KEY: process.env.METAL_API_KEY,
    NEXT_PUBLIC_WEBSOCKET_URL: process.env.NEXT_PUBLIC_WEBSOCKET_URL,
  },
});
