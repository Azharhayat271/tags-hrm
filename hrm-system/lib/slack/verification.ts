import crypto from "crypto";

/**
 * Verify that the request came from Slack
 * https://api.slack.com/authentication/verifying-requests-from-slack
 */
export function verifySlackRequest(
  body: string,
  timestamp: string,
  signature: string,
  signingSecret: string
): boolean {
  // Reject old requests (older than 5 minutes)
  const currentTime = Math.floor(Date.now() / 1000);
  if (Math.abs(currentTime - parseInt(timestamp)) > 60 * 5) {
    return false;
  }

  // Create signature base string
  const sigBaseString = `v0:${timestamp}:${body}`;

  // Create HMAC SHA256 hash
  const hmac = crypto.createHmac("sha256", signingSecret);
  hmac.update(sigBaseString);
  const mySignature = `v0=${hmac.digest("hex")}`;

  // Compare signatures using timing-safe comparison
  return crypto.timingSafeEqual(
    Buffer.from(mySignature),
    Buffer.from(signature)
  );
}
