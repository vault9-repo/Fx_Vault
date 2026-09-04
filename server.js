const express = require("express");
const cors = require("cors");
const path = require("path");

const {
  BetaAnalyticsDataClient
} = require("@google-analytics/data");


const app = express();

app.use(cors());
app.use(express.json());


/* =========================================================
   CONFIGURATION
========================================================= */

const PORT = process.env.PORT || 10000;


/*
   Your GA4 Property ID
*/

const PROPERTY_ID =
  process.env.GA4_PROPERTY_ID || "506138300";


/*
   Google service account credentials
*/

const CLIENT_EMAIL =
  process.env.GA_SERVICE_ACCOUNT_EMAIL;


const PRIVATE_KEY =
  process.env.GA_SERVICE_ACCOUNT_PRIVATE_KEY;


/* =========================================================
   GOOGLE ANALYTICS CLIENT
========================================================= */

function getAnalyticsClient() {

  if (!CLIENT_EMAIL || !PRIVATE_KEY) {

    throw new Error(
      "Missing GA_SERVICE_ACCOUNT_EMAIL or GA_SERVICE_ACCOUNT_PRIVATE_KEY"
    );

  }


  return new BetaAnalyticsDataClient({

    credentials: {

      client_email:
        CLIENT_EMAIL,

      private_key:
        PRIVATE_KEY.replace(/\\n/g, "\n")

    }

  });

}


/* =========================================================
   DATE RANGE
========================================================= */

function getDateRange(range) {

  switch (range) {

    case "7":

      return {
        startDate: "7daysAgo",
        endDate: "today"
      };


    case "30":

      return {
        startDate: "30daysAgo",
        endDate: "today"
      };


    case "all":

      return {
        startDate: "3650daysAgo",
        endDate: "today"
      };


    case "today":

    default:

      return {
        startDate: "today",
        endDate: "today"
      };

  }

}


/* =========================================================
   ANALYTICS API
========================================================= */

app.get(
  "/api/analytics",
  async (req, res) => {

    try {

      const range =
        getDateRange(
          req.query.range
        );


      const analyticsDataClient =
        getAnalyticsClient();


      /*
         Ask GA4 specifically for:

         join_fxvault_click

         Nothing else.
      */

      const [response] =
        await analyticsDataClient.runReport({

          property:
            `properties/${PROPERTY_ID}`,

          dateRanges: [
            range
          ],

          dimensions: [
            {
              name: "eventName"
            }
          ],

          metrics: [
            {
              name: "eventCount"
            }
          ],

          dimensionFilter: {

            filter: {

              fieldName:
                "eventName",

              stringFilter: {

                matchType:
                  "EXACT",

                value:
                  "join_fxvault_click"

              }

            }

          }

        });


      let clicks = 0;


      /*
         Read the GA4 result.
      */

      for (
        const row of response.rows || []
      ) {

        const eventName =
          row
            .dimensionValues?.[0]
            ?.value || "";


        if (
          eventName ===
          "join_fxvault_click"
        ) {

          clicks += Number(
            row
              .metricValues?.[0]
              ?.value || 0
          );

        }

      }


      /*
         Return ONLY the event
         needed by stats.html.
      */

      res.json({

        join_fxvault_click:
          clicks

      });


    } catch (error) {

      console.error(
        "GA4 ERROR:",
        error
      );


      res.status(500).json({

        error:
          "GA4 request failed",

        message:
          error.message

      });

    }

  }
);


/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  "/health",
  (req, res) => {

    res.json({

      ok: true,

      service:
        "fxvault-analytics-api",

      property:
        PROPERTY_ID,

      event:
        "join_fxvault_click"

    });

  }
);


/* =========================================================
   OPTIONAL: SERVE STATIC FILES
========================================================= */

app.use(
  express.static(
    path.join(__dirname, ".")
  )
);


/* =========================================================
   START SERVER
========================================================= */

app.listen(
  PORT,
  () => {

    console.log(
      `FxVault Analytics API running on port ${PORT}`
    );

    console.log(
      `GA4 Property: ${PROPERTY_ID}`
    );

    console.log(
      `Tracked event: join_fxvault_click`
    );

  }
);
