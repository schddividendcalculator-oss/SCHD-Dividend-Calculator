# SCHD Dividend Calculator

A modern, user-friendly single-page application to estimate dividend income from the Schwab U.S. Dividend Equity ETF™ (SCHD). Calculate potential earnings, view historical payout data, and analyze dividend growth with a clean and responsive interface.

**Live Demo:** https://schddividend.com/

<!-- ![SCHD Dividend Calculator Screenshot](placeholder.png) -->

---

## ✨ Features

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
-   **Styling:** Tailwind CSS
-   **Charts:** Recharts
-   **Dependencies:** Loaded via ESM (`esm.sh`) for a build-free setup.

---

## 🛠️ Getting Started

This project is set up to run without a complex build process. You just need a simple local server to serve the `index.html` file.

### Prerequisites

-   A modern web browser.
-   A local web server. If you have Node.js installed, you can use `serve`.

### Installation & Running

1.  **Clone the repository (or download the files):**
    ```bash
    git clone https://github.com/schddividendcalculator-oss/SCHD-Dividend-Calculator.git
    cd schd-dividend-calculator
    ```

2.  **Serve the project:**
    If you don't have a local server, you can use the `serve` package from npm:
    ```bash
    # Install serve globally if you haven't already
    npm install -g serve

    # Run the server in the project directory
    serve .
    ```

3.  **Open in browser:**
    Open your web browser and navigate to the URL provided by the server (usually `http://localhost:3000`).

---

## 📁 File Structure

```
.
├── index.html        # Main HTML file, includes all meta tags, styles, and schema markup.
├── index.tsx         # The entry point for the React application.
├── App.tsx           # The main React component containing all UI and logic.
├── constants.ts      # Contains static data like dividend history and FAQ content.
├── types.ts          # TypeScript type definitions for the application.
└── metadata.json     # Project metadata.
```

---

## ⚖️ Disclaimer

This calculator is for educational and informational purposes only and does not constitute financial advice. The calculations are estimates and do not guarantee future results. Always conduct your own research and consult a financial professional before making investment decisions.
