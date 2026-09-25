An empty cart is rejected before any checkout or charge is created.
A retry with no saved cart raises a RetryError so the webhook can requeue it.
A repeated webhook for a settled checkout returns the existing charge instead of charging again.
