import { expect,test } from "@playwright/test";

test("homepage presents the heritage-fusion storefront",async({page})=>{
  await page.goto("/");
  await expect(page.getByRole("heading",{name:/Jewellery that carries/i})).toBeVisible();
  await expect(page.getByRole("navigation",{name:"Main navigation"})).toBeVisible();
  await expect(page.getByRole("link",{name:/Explore the collection/i})).toBeVisible();
});

test("collection page shows an honest empty catalogue state without Supabase configuration",async({page})=>{
  await page.goto("/collections");
  await expect(page.getByRole("heading",{name:"The collections"})).toBeVisible();
  await expect(page.getByText("Our catalogue is being prepared. Please return soon.")).toBeVisible();
});

test("customer can open the sign-in screen",async({page})=>{
  await page.goto("/auth/login");
  await expect(page.getByRole("heading",{name:"Sign in to your account"})).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByLabel("Password")).toBeVisible();
});

test("customer can open the registration screen",async({page})=>{
  await page.goto("/auth/signup");
  await expect(page.getByRole("heading",{name:"Create an account"})).toBeVisible();
  await expect(page.getByLabel("Full name")).toBeVisible();
});

test("shopping bag does not claim a successful session when backend is not configured",async({page})=>{
  await page.goto("/cart");
  await expect(page.getByRole("heading",{name:"Your bag"})).toBeVisible();
  await expect(page.getByText("Store services are not configured yet.")).toBeVisible();
});

test("mobile navigation opens and exposes account link",async({page})=>{
  await page.setViewportSize({width:390,height:844});
  await page.goto("/");
  await page.getByRole("button",{name:"Open navigation menu"}).click();
  await expect(page.getByRole("navigation",{name:"Mobile navigation"})).toBeVisible();
  await expect(page.getByRole("link",{name:"My account"})).toBeVisible();
});
