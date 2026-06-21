import { expect, test } from "@playwright/test";

test.use({ viewport: { width: 390, height: 844 } });

test("mobile contact menu opens in the right order and collapses on upward scroll", async ({ page }) => {
  await page.goto("/", { waitUntil: "domcontentloaded" });
  await page.evaluate(() => window.scrollTo(0, 1400));

  const contactButton = page.getByRole("button", { name: "Open contact options" });
  await expect(contactButton).toBeVisible();
  await expect(contactButton).toHaveCSS("animation-name", "mobile-contact-bounce");

  await contactButton.click({ force: true });
  const whatsapp = page.getByRole("link", { name: "Chat on WhatsApp" });
  const explorationCall = page.getByRole("link", { name: "Book an exploration call" });
  await expect(whatsapp).toBeVisible();
  await expect(explorationCall).toBeVisible();

  const whatsappBox = await whatsapp.boundingBox();
  const explorationBox = await explorationCall.boundingBox();
  expect(whatsappBox?.y).toBeLessThan(explorationBox?.y ?? 0);

  await page.evaluate(() => window.scrollBy(0, -80));
  await expect(contactButton).toBeVisible();
  await expect(whatsapp).toBeHidden();
  await expect(explorationCall).toBeHidden();
});

test("an expired password-reset link is validated exactly once", async ({ page }) => {
  let validationRequests = 0;

  await page.route("**/auth/password-reset/validate/", async (route) => {
    validationRequests += 1;
    await route.fulfill({
      status: 400,
      contentType: "application/json",
      body: JSON.stringify({ detail: "This password reset link has expired or has already been used." }),
    });
  });

  await page.goto("/?therapist_reset_uid=expired-user&therapist_reset_token=expired-token", {
    waitUntil: "domcontentloaded",
  });
  await expect(page.getByRole("heading", { name: "Reset Link Expired" })).toBeVisible();
  await page.waitForTimeout(500);
  expect(validationRequests).toBe(1);
});
