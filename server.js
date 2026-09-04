const express = require("express");
const cors = require("cors");
const { BetaAnalyticsDataClient } = require("@google-analytics/data");

const app = express();
app.use(cors());

const PORT = process.env.PORT || 10000;
const PROPERTY_ID = process.env.GA4_PROPERTY_ID;
const STATS_TOKEN = process.env.STATS_TOKEN;

function getAnalyticsClient() {
  const clientEmail = process.env.GA_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GA_SERVICE_ACCOUNT_PRIVATE_KEY;

  if (!clientEmail || !privateKey) {
    throw new Error("Missing GA_SERVICE_ACCOUNT_EMAIL or GA_SERVICE_ACCOUNT_PRIVATE_KEY");
  }

  return new BetaAnalyticsDataClient({
    credentials: {
      client_email: clientEmail,
      private_key: privateKey.replace(/\\n/g, "\n")
    }
  });
}

function authorized(req) {
  if (!STATS_TOKEN) return false;
  return req.get("x-stats-token") === STATS_TOKEN;
}

function dateRange(range) {
  if (range === "7") return { startDate: "7daysAgo", endDate: "today" };
  if (range === "30") return { startDate: "30daysAgo", endDate: "today" };
  if (range === "all") return { startDate: "3650daysAgo", endDate: "today" };
  return { startDate: "today", endDate: "today" };
}

app.get("/api/analytics", async (req, res) => {
  try {
    if (!authorized(req)) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    if (!PROPERTY_ID) {
      return res.status(500).json({ error: "Missing GA4_PROPERTY_ID" });
    }

    const analyticsDataClient = getAnalyticsClient();
    const range = dateRange(req.query.range);

    const [response] = await analyticsDataClient.runReport({
      property: `properties/${PROPERTY_ID}`,
      dateRanges: [range],
      dimensions: [{ name: "eventName" }],
      metrics: [{ name: "eventCount" }, { name: "activeUsers" }]
    });

    const result = {
      visitors: 0,
      join_fxvault_click: 0,
      patreon_click: 0,
      app_download_click: 0,
      element_click: 0
    };

    for (const row of response.rows || []) {
      const eventName = row.dimensionValues?.[0]?.value || "";
      const eventCount = Number(row.metricValues?.[0]?.value || 0);
      const activeUsers = Number(row.metricValues?.[1]?.value || 0);

      result.visitors += activeUsers;

      if (Object.prototype.hasOwnProperty.call(result, eventName)) {
        result[eventName] += eventCount;
      }
    }

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "GA4 request failed",
      message: error.message
    });
  }
});

app.get("/health", (req, res) => {
  res.json({ ok: true, service: "fxvault-analytics-api" });
});

app.listen(PORT, () => {
  console.log(`FxVault Analytics API running on port ${PORT}`);
});
