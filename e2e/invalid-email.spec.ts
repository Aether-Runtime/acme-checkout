import { expect, test } from '@playwright/test';

test('an email the browser allows but is missing a TLD is rejected server-side', async ({
  page,
}) => {
  await page.goto('/');

  await page.getByTestId('go-to-checkout').click();
  await page.getByTestId('field-name').fill('Ada Lovelace');
  // Passes the browser's native type="email" constraint (no dot required in
  // the domain) but should still be rejected by the server's stricter check.
  await page.getByTestId('field-email').fill('ada@example');
  await page.getByTestId('field-card').fill('4242 4242 4242 4242');
  await page.getByTestId('pay').click();

  await expect(page.getByTestId('payment-error')).toContainText('valid email');
  await expect(page.getByTestId('checkout')).toBeVisible();
  await expect(page.getByTestId('confirmation')).not.toBeVisible();
});
