const express = require("express");
const bodyParser = require("body-parser");
const axios = require("axios"); // For making requests to Odoo or HR if needed

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

// --- MOCK HR SYSTEM ---
const MOCK_HR_DB = {
  "john.doe@example.com": { status: "active", department: "Engineering" },
  "jane.smith@example.com": { status: "terminated", department: "Sales" },
  "alex.wong@example.com": { status: "active", department: "Marketing" },
};

function checkHRStatus(email) {
  console.log(`[HR Check] Verifying status for ${email}...`);
  // Simulate network delay
  return new Promise((resolve) => {
    setTimeout(() => {
      const record = MOCK_HR_DB[email];
      if (record) {
        resolve(record.status);
      } else {
        resolve("unknown");
      }
    }, 500);
  });
}

// --- NLP / PATTERN MATCHING ---
function analyzeTicket(ticket) {
  const text =
    `${ticket.subject || ""} ${ticket.description || ""}`.toLowerCase();
  const keywords = [
    "login",
    "password",
    "account",
    "inactive",
    "cannot access",
    "locked",
    "đăng nhập",
    "dang nhap",
    "mật khẩu",
    "mat khau",
    "tài khoản",
    "tai khoan",
    "vô hiệu",
    "vo hieu",
    "khoá",
    "khoa",
    "lms",
  ];
  const isLoginRelated = keywords.some((kw) => text.includes(kw));
  return {
    isLoginRelated,
  };
}

// --- HEALTH CHECK ENDPOINT (for Railway/Deployment) ---
app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// --- WEBHOOK ENDPOINT ---
app.post("/webhook/odoo", async (req, res) => {
  console.log("\n--- Received New Webhook Event ---");
  const ticket = req.body;

  // Basic validation
  if (!ticket || !ticket.id) {
    console.error("Invalid ticket payload received.");
    return res.status(400).send("Invalid payload");
  }

  console.log(
    `Processing Ticket #${ticket.id}: "${ticket.subject}" from ${ticket.email}`,
  );

  // 1. Analyze Ticket
  const analysis = analyzeTicket(ticket);

  if (!analysis.isLoginRelated) {
    console.log("Ticket is not a login issue. Ignoring for automation.");
    return res.status(200).send("Ignored - Not a login issue");
  }

  console.log("Login issue detected. Initiating Automation Workflow...");

  // 2. HR Check
  if (!ticket.email) {
    console.log("No email provided. Cannot check HR status.");
    return res.status(200).send("Processed - Missing email");
  }

  const hrStatus = await checkHRStatus(ticket.email);
  console.log(`HR Status for ${ticket.email}: ${hrStatus}`);

  // 3. Decision & Action
  if (hrStatus === "active") {
    console.log(
      "Action: Employee is ACTIVE. Reactivating LMS account automatically.",
    );
    // Mock API call to LMS
    // await axios.post('https://api.lms.example.com/reactivate', { email: ticket.email });

    console.log("Action: Sending auto-resolution email to user.");
    sendMockEmail(
      ticket.email,
      "Account Reactivated",
      "Your account has been reactivated. Please try logging in again.",
    );

    console.log("Action: Updating Odoo Ticket status to Resolved.");
    updateOdooTicketMock(
      ticket.id,
      "Resolved",
      "Auto-resolved: Account reactivated based on active HR status.",
    );
  } else if (hrStatus === "terminated") {
    console.log("Action: Employee is TERMINATED. Will not reactivate.");

    console.log("Action: Adding private note to Odoo Ticket for IT review.");
    updateOdooTicketMock(
      ticket.id,
      "Pending IT Review",
      "Automation Note: HR status is terminated. Account not reactivated. Please review manually.",
    );
  } else {
    console.log(
      "Action: Employee HR status UNKNOWN. Escalating to manual queue.",
    );
    updateOdooTicketMock(
      ticket.id,
      "Pending HR Review",
      "Automation Note: User not found in HR database. Manual verification required.",
    );
  }

  console.log("--- Workflow Complete ---\n");
  res.status(200).send("Workflow executed successfully");
});

// --- MOCK ACTIONS ---
function sendMockEmail(to, subject, body) {
  console.log(`[EMAIL SEND] To: ${to} | Subject: ${subject}`);
  console.log(`[EMAIL BODY] ${body}`);
}

function updateOdooTicketMock(ticketId, newStatus, note) {
  console.log(`[ODOO UPDATE] Ticket #${ticketId} | Status -> ${newStatus}`);
  console.log(`[ODOO NOTE] ${note}`);
}

app.listen(PORT, () => {
  console.log(`Automation Server running on port ${PORT}`);
  console.log(`Webhook endpoint: http://localhost:${PORT}/webhook/odoo`);
});
