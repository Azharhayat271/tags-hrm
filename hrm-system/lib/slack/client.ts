/**
 * Slack API client for sending messages
 */

const SLACK_BOT_TOKEN = process.env.SLACK_BOT_TOKEN;

interface SlackMessage {
  channel: string;
  text: string;
  blocks?: any[];
}

export async function sendSlackMessage(message: SlackMessage) {
  if (!SLACK_BOT_TOKEN) {
    throw new Error("SLACK_BOT_TOKEN is not configured");
  }

  const response = await fetch("https://slack.com/api/chat.postMessage", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SLACK_BOT_TOKEN}`,
    },
    body: JSON.stringify(message),
  });

  const data = await response.json();

  if (!data.ok) {
    throw new Error(`Slack API error: ${data.error}`);
  }

  return data;
}

export async function respondToSlackCommand(
  responseUrl: string,
  text: string,
  ephemeral: boolean = true
) {
  const response = await fetch(responseUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      response_type: ephemeral ? "ephemeral" : "in_channel",
      text,
    }),
  });

  return response.ok;
}
