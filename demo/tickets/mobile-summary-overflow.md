# Cart summary overflows the card on phones

**Priority:** high
**Component:** storefront

## Observed

On phone-width viewports the cart summary is unusable: the quantity steppers
and the order total stick out past the right edge of the card, and item names
collapse into a letter-wide column. Desktop looks fine, which is how it got
through review — the totals column was given a fixed 300px width to line the
prices up, and at 390px wide there is no 300px to give.

## Expected

The summary lays out fluidly at any viewport width: names, prices, steppers,
and the total all stay inside the card, and the Check out button is fully
visible and tappable on a phone.

## Reproduction

Run the storefront (`npm run dev:web`), open the cart at a ~390px-wide
viewport (or any phone), and look at the item rows and total. Desktop-width
e2e stays green, so CI does not catch it.
