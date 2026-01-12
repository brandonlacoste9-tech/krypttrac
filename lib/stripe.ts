interface CheckoutSessionParams {
  priceId: string
  feature: 'defi' | 'whale' | 'core' | 'magnum'
  trial?: number // Days
  userId?: string
  email?: string
}

export async function createCheckoutSession({ 
  priceId, 
  feature, 
  trial = 0,
  userId,
  email,
}: CheckoutSessionParams) {
  const response = await fetch('/api/checkout', {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      ...(userId && { 'x-user-id': userId }),
      ...(email && { 'x-user-email': email }),
    },
    body: JSON.stringify({
      priceId,
      feature,
      trial,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || 'Failed to create checkout session')
  }

  return response.json()
}
