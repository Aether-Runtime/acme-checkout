import { expect, test } from '@playwright/test';

test('a shopper can check out the seeded cart', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByTestId('cart-line')).toHaveCount(2);
  await expect(page.getByTestId('cart-total')).toHaveText('$177.00');

  // One more beanie for the road.
  await page.getByRole('button', { name: 'Add one Merino beanie' }).click();
  await expect(page.getByTestId('qty-prod_beanie')).toHaveText('2');
  await expect(page.getByTestId('cart-total')).toHaveText('$205.00');

  await page.getByTestId('go-to-checkout').click();
  await page.getByTestId('field-name').fill('Ada Lovelace');
  await page.getByTestId('field-email').fill('ada@example.com');
  await page.getByTestId('field-card').fill('4242 4242 4242 4242');
  await page.getByTestId('pay').click();

  await expect(page.getByTestId('confirmation')).toBeVisible();
  await expect(page.getByTestId('order-id')).toContainText('ord_');
});
