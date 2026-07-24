export const MOCK_PAYMENT_SUCCESS_RATE = 0.9;
export const MOCK_PAYMENT_MIN_DELAY_MS = 1500;
export const MOCK_PAYMENT_MAX_DELAY_MS = 3500;

export function randomDelayMs(): number {
  return (
    MOCK_PAYMENT_MIN_DELAY_MS +
    Math.random() * (MOCK_PAYMENT_MAX_DELAY_MS - MOCK_PAYMENT_MIN_DELAY_MS)
  );
}

export function resolveMockOutcome(): "SUCCEEDED" | "FAILED" {
  return Math.random() < MOCK_PAYMENT_SUCCESS_RATE ? "SUCCEEDED" : "FAILED";
}
