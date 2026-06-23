# Ticket Automation Service - Week 5

This directory contains the Node.js Express application that serves as the Automation API for handling IT support tickets from Odoo Helpdesk. It automates ticket analysis, HR verification, and resolution workflows.

## Project Deliverables

The complete documentation and analysis report are hosted on Notion:
* **Notion Report:** [Week 5 Report and Documentation](https://xitthui0111.notion.site/week5?pvs=73)

## Core Capabilities

1. **Webhook Receiver Endpoint:** Accepts HTTP POST requests (`/webhook/odoo`) triggered by Odoo Helpdesk.
2. **NLP Pattern Matching:** Analyzes ticket subject and description fields to identify accounts requiring reactivation or password resets.
3. **HR Database Verification:** Integrates with a mock HR system to check employee status (Active or Terminated).
4. **Automated Decisions and Actions:**
   * **Active Employees:** Automatically reactivates LMS accounts, sends confirmation emails, and updates Odoo ticket status to `Resolved`.
   * **Terminated Employees:** Flags the request, adds a warning note to Odoo, and routes the ticket to `Pending IT Review`.
   * **Unknown status:** Routes the ticket to `Pending HR Review`.

---

## Local Setup and Installation

### Prerequisites
* Node.js (version 18 or higher)
* npm or pnpm

### Installation
1. Install project dependencies:
   ```bash
   npm install
   ```

2. Start the local server:
   ```bash
   npm start
   ```
   The application will start on port 3000: `http://localhost:3000`.

---

## Webhook Payload Formats

The endpoint `/webhook/odoo` accepts payloads in the following formats.

### Standard Format (Custom Scripts)
```json
{
  "id": "1001",
  "subject": "Unable to log in to LMS",
  "description": "The system indicates my account has been deactivated.",
  "email": "john.doe@example.com"
}
```

### Native Odoo Webhook Format
The service automatically maps the native Odoo field names to the system's internal payload format:
* `name` maps to `subject`
* `partner_email` maps to `email`

```json
{
  "id": 12,
  "name": "Unable to log in to LMS",
  "description": "My account is inactive.",
  "partner_email": "john.doe@example.com"
}
```

---

## Verification Test Cases

Execute the following `curl` commands to test the automation logic.

### Case 1: Active Employee (Automatic Resolution)
```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "id": "1001",
  "subject": "Cannot access LMS",
  "description": "Account is inactive",
  "email": "john.doe@example.com"
}' http://localhost:3000/webhook/odoo
```

### Case 2: Terminated Employee (Escalation)
```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "id": "1002",
  "subject": "Password reset request",
  "description": "Please reactivate my account",
  "email": "jane.smith@example.com"
}' http://localhost:3000/webhook/odoo
```

### Case 3: Unrelated Ticket (Bypass)
```bash
curl -X POST -H "Content-Type: application/json" -d '{
  "id": "1003",
  "subject": "Request for new keyboard",
  "description": "My keyboard is broken",
  "email": "alex.wong@example.com"
}' http://localhost:3000/webhook/odoo
```
