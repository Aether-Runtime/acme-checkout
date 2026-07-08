import { expect, test } from '@playwright/test';

test('a declined card keeps the shopper on the checkout form', async ({ page }) => {
  await page.goto('/');

  await page.getByTestId('go-to-checkout').click();
  await page.getByTestId('field-name').fill('Ada Lovelace');
  await page.getByTestId('field-email').fill('ada@example.com');
  await page.getByTestId('field-card').fill('4000 0000 0000 0002');
  await page.getByTestId('pay').click();

  await expect(page.getByTestId('payment-error')).toContainText('card declined');
  await expect(page.getByTestId('checkout')).toBeVisible();
  await expect(page.getByTestId('confirmation')).not.toBeVisible();
});
