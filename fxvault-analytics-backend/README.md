# FxVault GA4 Analytics API

This backend supplies real GA4 numbers to `stats.html`.

## 1. Google Analytics Property ID

Your Measurement ID is:

`G-6BC335GSHF`

That is NOT the numeric GA4 Property ID required by the Data API.

In Google Analytics:
Admin → Property settings → Property ID

It will be a number such as `123456789`.

## 2. Google Cloud / service account

Enable the Google Analytics Data API for your Google Cloud project.

Create a service account and create/download its credentials.

Then add the service account's email as a Viewer to the GA4 property.

Google's official Data API documentation uses a service account and the `properties/PROPERTY_ID` format.

## 3. Render environment variables

Create a Render Web Service for this backend and add:

GA4_PROPERTY_ID = your numeric property ID

GA_SERVICE_ACCOUNT_EMAIL = service-account-email@project.iam.gserviceaccount.com

GA_SERVICE_ACCOUNT_PRIVATE_KEY = the private_key from the JSON credentials file

STATS_TOKEN = create-a-long-random-secret

Do NOT put the service account JSON or private key in your HTML or GitHub repository.

## 4. Render start command

Build command:

npm install

Start command:

npm start

## 5. Connect stats.html

Change:

const API_URL = "/api/analytics";

to the URL of this backend, for example:

const API_URL = "https://YOUR-BACKEND.onrender.com/api/analytics";

Then add the same token in the request:

headers: {
  "x-stats-token": "YOUR-STATS-TOKEN"
}

IMPORTANT:
For a public static stats page, putting the token in HTML is not truly private. For a private dashboard, protect the stats page/API with proper authentication or host both behind authentication.

## 6. Test

Open:

https://YOUR-BACKEND.onrender.com/health

You should get:

{"ok":true,"service":"fxvault-analytics-api"}

Then test `/api/analytics?range=today` with the x-stats-token header.

Google Analytics data is not guaranteed to be instantaneous; normal GA4 reporting can have processing delay. For immediate activity, use the GA4 Realtime report/API.
