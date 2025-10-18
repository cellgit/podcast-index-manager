import type { Prisma } from "@prisma/client";
import nodemailer from "nodemailer";

import { logger } from "./logger";

export type AlertSeverity = "info" | "warning" | "critical";

export type AlertMessage = {
  title: string;
  severity: AlertSeverity;
  description: string;
  metadata?: Prisma.JsonObject;
};

const severityColorMap: Record<AlertSeverity, string> = {
  info: "#3b82f6",
  warning: "#f97316",
  critical: "#dc2626",
};

type EmailTransporter = nodemailer.Transporter | null;

const globalRef = globalThis as unknown as {
  __alertEmailTransporter?: EmailTransporter;
};

function getSlackWebhookUrl() {
  return process.env.SLACK_WEBHOOK_URL;
}

function getEmailRecipients() {
  const to = process.env.ALERT_EMAIL_TO;
  return to ? to.split(",").map((item) => item.trim()).filter(Boolean) : [];
}

function getEmailTransporter(): EmailTransporter {
  if (globalRef.__alertEmailTransporter !== undefined) {
    return globalRef.__alertEmailTransporter;
  }

  const host = process.env.ALERT_EMAIL_SMTP_HOST;
  const port = process.env.ALERT_EMAIL_SMTP_PORT
    ? Number.parseInt(process.env.ALERT_EMAIL_SMTP_PORT, 10)
    : undefined;
  const user = process.env.ALERT_EMAIL_SMTP_USER;
  const pass = process.env.ALERT_EMAIL_SMTP_PASS;
  const secure =
    (process.env.ALERT_EMAIL_SMTP_SECURE ?? "").toLowerCase() === "true";

  if (!host || !port || !user || !pass) {
    globalRef.__alertEmailTransporter = null;
    return null;
  }

  globalRef.__alertEmailTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return globalRef.__alertEmailTransporter;
}

function renderMetadata(metadata?: Record<string, unknown>) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return null;
  }

  return Object.entries(metadata)
    .map(([key, value]) => `• ${key}: ${formatMetadataValue(value)}`)
    .join("\n");
}

function formatMetadataValue(value: unknown) {
  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return `${value}`;
  }
  if (!value) {
    return "";
  }
  return JSON.stringify(value);
}

async function sendSlackAlert(alert: AlertMessage) {
  const webhook = getSlackWebhookUrl();
  if (!webhook || alert.severity === "info") {
    return;
  }

  const metadataText = renderMetadata(alert.metadata);

  try {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `[${alert.severity.toUpperCase()}] ${alert.title}`,
        attachments: [
          {
            color: severityColorMap[alert.severity],
            blocks: [
              {
                type: "section",
                text: {
                  type: "mrkdwn",
                  text: `*${alert.description}*`,
                },
              },
              ...(metadataText
                ? [
                    {
                      type: "section",
                      text: {
                        type: "mrkdwn",
                        text: metadataText,
                      },
                    },
                  ]
                : []),
            ],
          },
        ],
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      logger.error(
        { msg: "Slack webhook failed", status: response.status, text },
        "Slack notification failure",
      );
    }
  } catch (error) {
    logger.error({ err: error }, "Slack notification error");
  }
}

async function sendEmailAlert(alert: AlertMessage) {
  const recipients = getEmailRecipients();
  if (recipients.length === 0) {
    return;
  }
  const transporter = getEmailTransporter();
  if (!transporter) {
    logger.warn(
      "Email transport is not configured. Skip sending alert email.",
    );
    return;
  }

  const from = process.env.ALERT_EMAIL_FROM;
  if (!from) {
    logger.warn("ALERT_EMAIL_FROM is not configured. Skip sending email.");
    return;
  }

  const metadataLines = renderMetadata(alert.metadata);

  const subjectPrefix = process.env.ALERT_EMAIL_SUBJECT_PREFIX ?? "[Podcast]";
  const subject = `${subjectPrefix} ${alert.severity.toUpperCase()} ${alert.title}`;

  const htmlParts = [
    `<p>${alert.description}</p>`,
    metadataLines ? `<pre>${metadataLines}</pre>` : "",
  ];
  const textParts = [
    alert.description,
    metadataLines ? `\n${metadataLines}` : "",
  ];

  try {
    await transporter.sendMail({
      from,
      to: recipients,
      subject,
      text: textParts.filter(Boolean).join("\n"),
      html: htmlParts.filter(Boolean).join(""),
    });
  } catch (error) {
    logger.error({ err: error }, "Email notification error");
  }
}

export async function notifyAlert(alert: AlertMessage) {
  await Promise.all([sendSlackAlert(alert), sendEmailAlert(alert)]);
}
