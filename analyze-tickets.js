const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

const DATA_FILE = path.join(__dirname, "../docs/plans/week-5/data/sample.xlsx");
const REPORT_FILE = path.join(
  __dirname,
  "../docs/plans/week-5/pattern-analysis-report.md",
);

function analyzeTickets() {
  console.log("Reading data from:", DATA_FILE);
  try {
    const workbook = xlsx.readFile(DATA_FILE);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const data = xlsx.utils.sheet_to_json(worksheet);

    console.log(`Found ${data.length} tickets.`);

    // --- Analysis Logic ---

    // 1. Group by Category
    const categories = {};
    let loginIssuesCount = 0;

    // 2. Calculate average resolution time
    let totalResolutionTimeStr = 0; // We'll count simple numbers if available, or just skip if parsing is complex. Let's do a simple count for now.

    // 3. Status distribution
    const statuses = {};

    data.forEach((ticket) => {
      // Normalize category
      const category = ticket["Category"] || ticket["category"] || "Unknown";
      categories[category] = (categories[category] || 0) + 1;

      // Look for login issues specifically
      const description = String(
        ticket["Description"] ||
          ticket["description"] ||
          ticket["Subject"] ||
          ticket["subject"] ||
          "",
      ).toLowerCase();
      if (
        description.includes("login") ||
        description.includes("password") ||
        description.includes("account") ||
        description.includes("inactive")
      ) {
        loginIssuesCount++;
      }

      // Normalize status
      const status = ticket["Status"] || ticket["status"] || "Unknown";
      statuses[status] = (statuses[status] || 0) + 1;
    });

    // --- Generate Report ---
    let reportMd = `# Week 5 Pattern Analysis Report\n\n`;
    reportMd += `## Overview\n`;
    reportMd += `- **Total Tickets Analyzed:** ${data.length}\n`;
    reportMd += `- **Date of Analysis:** ${new Date().toISOString().split("T")[0]}\n\n`;

    reportMd += `## 1. Ticket Distribution by Category\n`;
    const sortedCategories = Object.entries(categories).sort(
      (a, b) => b[1] - a[1],
    );
    sortedCategories.forEach(([cat, count]) => {
      const percentage = ((count / data.length) * 100).toFixed(1);
      reportMd += `- **${cat}:** ${count} tickets (${percentage}%)\n`;
    });
    reportMd += `\n`;

    reportMd += `## 2. Status Distribution\n`;
    Object.entries(statuses).forEach(([status, count]) => {
      reportMd += `- **${status}:** ${count} tickets\n`;
    });
    reportMd += `\n`;

    reportMd += `## 3. Deep Dive: Login & Account Issues (Scenario 1)\n`;
    reportMd += `Based on keyword analysis (login, password, account, inactive), we identified:\n`;
    reportMd += `- **Potential Login/Account Issues:** ${loginIssuesCount} tickets (~${((loginIssuesCount / data.length) * 100).toFixed(1)}% of total volume).\n\n`;

    reportMd += `### Impact Analysis\n`;
    reportMd += `If each login issue takes ~10 minutes to resolve manually:\n`;
    reportMd += `- **Estimated time spent:** ${(loginIssuesCount * 10) / 60} hours.\n`;
    reportMd += `- **Business Impact:** Users are blocked from accessing the system until support reacts. This delays onboarding and daily work.\n\n`;

    reportMd += `### Root Cause vs. Automation (Operating Engineer Approach)\n`;
    reportMd += `- **Root Cause:** Accounts are deactivated automatically after 30 days of inactivity (system rule).\n`;
    reportMd += `- **Software Engineer Fix:** Would require modifying core system logic, getting approvals, testing, and deployment (High effort).\n`;
    reportMd += `- **Operating Engineer Automation:** Create a webhook/listener to detect these specific tickets, auto-check HR status, and reactivate immediately via API. (Low effort, high immediate value).\n\n`;

    reportMd += `## 4. Recommendations\n`;
    reportMd += `1. **Implement Automation for Scenario 1 (Login Issues):** This is the highest ROI target.\n`;
    reportMd += `2. **Monitor Other Top Categories:** Continue tracking the top 2-3 categories for future automation opportunities.\n`;

    fs.writeFileSync(REPORT_FILE, reportMd);
    console.log("Report generated successfully at:", REPORT_FILE);
  } catch (error) {
    console.error("Error analyzing tickets:", error.message);
  }
}

analyzeTickets();
