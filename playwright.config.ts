import { defineConfig,devices } from "@playwright/test";

export default defineConfig({
  testDir:"./tests/e2e",
  fullyParallel:true,
  reporter:"list",
  use:{
    baseURL:"http://127.0.0.1:3000",
    trace:"retain-on-failure",
  },
  projects:[{name:"chromium",use:{...devices["Desktop Chrome"]}}],
  webServer:{
    command:"npm run start",
    url:"http://127.0.0.1:3000",
    reuseExistingServer:!process.env.CI,
    timeout:120000,
    env:{
      NEXT_PUBLIC_SUPABASE_URL:"",
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:"",
      NEXT_PUBLIC_SUPABASE_ANON_KEY:"",
    },
  },
});
