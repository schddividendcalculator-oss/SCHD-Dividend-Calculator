# SCHD Dividend Calculator

A modern, user-friendly single-page application to estimate dividend income from the Schwab U.S. Dividend Equity ETF™ (SCHD). Calculate potential earnings, view historical payout data, and analyze dividend growth with a clean and responsive interface.

**Live Demo:** https://schddividend.com/

<!-- ![SCHD Dividend Calculator Screenshot](placeholder.png) -->

---

## ✨ Features

-   **Live Share Price:** Automatically fetches the latest SCHD share price from [Finnhub](https://finnhub.io/) on load for up-to-date calculations.
-   **Dynamic Dividend Calculation:** Instantly see your projected dividend income broken down by daily, weekly, monthly, quarterly, and yearly periods.
-   **Customizable Inputs:** Adjust the investment amount, current share price, and dividend yield to model different scenarios.
-   **Key Dividend Statistics:** View important metrics at a glance, including current yield, trailing-twelve-months (TTM) average annual dividend, and 1-year dividend growth.
-   **Interactive Data Visualization:** An interactive bar chart displays historical quarterly dividend payouts.
-   **Detailed Payout History:** A scrollable table provides the exact dividend per share for recent quarters.
-   **Informative Sections:** Includes an "About SCHD" section, a comprehensive FAQ, and a clear disclaimer.
-   **SEO Optimized:** Implemented with best practices for SEO, including canonical URLs, meta tags, and rich JSON-LD schema markup for WebSite, WebApplication, FAQPage, and HowTo.
-   **Modern & Responsive UI:** Clean design built with Tailwind CSS that works seamlessly on all devices.

---

## 🚀 Technologies Used

-   **Frontend:** React, TypeScript
-   **Backend:** Netlify Functions (for API calls)
-   **Styling:** Tailwind CSS
-   **Charts:** Recharts
-   **Dependencies:** Loaded via ESM (`esm.sh`) for a build-free setup.

---

## 📊 Data Source

Live share price data is provided by [Finnhub](https://finnhub.io/). Historical dividend data is manually updated and included in the application.

---

## ⚙️ Configuration

To fetch live share price data, the application uses the Finnhub API.

### Environment Variables

You need to create an environment variable to store your Finnhub API key. If deploying on Netlify, set this in your site's "Build & deploy" > "Environment" settings:

-   `Finhub_API`: Your API key from [Finnhub](https://finnhub.io/).

The application uses a Netlify Function to securely access this API key and fetch data, so it is never exposed on the frontend.

---

## 🛠️ Getting Started

This project is set up to run without a complex build process. You just need a simple local server to serve the `index.html` file. For the live price fetching to work locally, you'll need the Netlify CLI.

### Prerequisites

-   A modern web browser.
-   [Node.js](https://nodejs.org/) and [Netlify CLI](https://docs.netlify.com/cli/get-started/): `npm install -g netlify-cli`

### Installation & Running Locally

1.  **Clone the repository (or download the files):**
    ```bash
    git clone https://github.com/schddividendcalculator-oss/SCHD-Dividend-Calculator.git
    cd SCHD-Dividend-Calculator
    ```

2.  **Set up local environment variables:**
    Create a file named `.env` in the root of the project and add your API key:
    ```
    Finhub_API=your_finnhub_api_key_here
    ```

3.  **Run with Netlify Dev:**
    This command will start a local server and make your environment variables and functions available.
    ```bash
    netlify dev
    ```

4.  **Open in browser:**
    Open your web browser and navigate to the URL provided by the server (usually `http://localhost:8888`).

---

## 📁 File Structure

```
.
├── netlify/
│   └── functions/
│       └── get-schd-price.js  # Serverless function to fetch live price.
├── netlify.toml      # Netlify configuration for functions.
├── index.html        # Main HTML file, includes all meta tags, styles, and schema markup.
├── index.tsx         # The entry point for the React application.
├── App.tsx           # The main React component containing all UI and logic.
├── constants.ts      # Contains static data like dividend history and FAQ content.
├── types.ts          # TypeScript type definitions for the application.
└── metadata.json     # Project metadata.
```

---

## ⚖️ Disclaimer

This calculator is a protype version, original and live site may be different also website is for educational and informational purposes only and does not constitute financial advice. The calculations are estimates and do not guarantee future results. Always conduct your own research and consult a financial professional before making investment decisions.
