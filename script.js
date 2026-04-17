const chat = document.getElementById("chat");
const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const finalDocBtn = document.getElementById("final-doc-btn");
const pdfBtn = document.getElementById("pdf-btn");
const chatCard = document.getElementById("chat-card");
const chatLauncher = document.getElementById("chat-launcher");
const minimizeBtn = document.getElementById("minimize-btn");
const progressFill = document.getElementById("progress-fill");
const progressPercent = document.getElementById("progress-percent");
const sectionItems = document.querySelectorAll(".section-item");

const riskFlagsContainer = document.getElementById("risk-flags");
const riskCount = document.getElementById("risk-count");
const badgesContainer = document.getElementById("badges-container");
const stepsContainer = document.getElementById("steps-container");
const stepsProgressText = document.getElementById("steps-progress-text");
const stepsTimeText = document.getElementById("steps-time-text");
const readyIndicator = document.getElementById("ready-indicator");
const filterButtons = document.querySelectorAll(".filter-btn");
const copyBtn = document.getElementById("copy-btn");
const calendarBtn = document.getElementById("calendar-btn");
const reminderBtn = document.getElementById("reminder-btn");
const emailBtn = document.getElementById("email-btn");

let history = [
  {
    role: "assistant",
    content:
      "Tell me briefly what happened at work. I’ll help organize it step by step and ask one question at a time."
  }
];

const progressKeywords = {
  personal: ["name", "phone", "email", "address", "birth", "race", "religion", "sex", "disability"],
  employer: ["employer", "company", "manager", "supervisor", "job title", "worked at", "employee", "firm"],
  basis: ["race", "pregnant", "pregnancy", "religion", "sex", "gender", "retaliation", "disability", "age", "color", "national origin"],
  dates: ["date", "month", "year", "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december", "2024", "2025", "2026"],
  harm: ["fired", "terminated", "demoted", "write-up", "written up", "cut my hours", "harassed", "denied", "reassigned", "removed", "taken off", "retaliated"],
  comparators: ["others", "coworkers", "co-workers", "same job", "treated differently", "similarly situated", "comparator"],
  complaints: ["complained", "reported", "hr", "human resources", "retaliated", "internal complaint"],
  witnesses: ["witness", "email", "text", "record", "document", "write-up", "proof", "screenshot"],
  particulars: ["because", "after", "then", "when", "timeline", "happened"]
};

const stepDefinitions = [
  {
    id: "employer",
    title: "Add employer name and work setting",
    description: "Identify the employer, company, firm, agency, or supervisor involved.",
    filterCategory: "recommended",
    urgency: "urgent",
    estimatedMinutes: 2,
    actionLabel: "Needed for intake form",
    match: (text) => /\bemployer\b|\bcompany\b|\bfirm\b|\bworked at\b|\bmanager\b|\bsupervisor\b/.test(text)
  },
  {
    id: "basis",
    title: "Identify at least one protected basis",
    description: "Clarify whether the issue involves race, sex, pregnancy, disability, religion, retaliation, age, or another protected basis.",
    filterCategory: "recommended",
    urgency: "urgent",
    estimatedMinutes: 2,
    actionLabel: "Needed to frame the claim",
    match: (text) => /\brace\b|\bpregnan|\bsex\b|\bgender\b|\breligion\b|\bdisabil|\bage\b|\bretaliation\b|\bcolor\b|\bnational origin\b/.test(text)
  },
  {
    id: "date",
    title: "Add at least one incident date",
    description: "Include a date, month, year, or time period for the harmful action.",
    filterCategory: "recommended",
    urgency: "urgent",
    estimatedMinutes: 1,
    actionLabel: "Needed for timing and deadlines",
    match: (text) => /\b(20\d{2})\b|\bjanuary\b|\bfebruary\b|\bmarch\b|\bapril\b|\bmay\b|\bjune\b|\bjuly\b|\baugust\b|\bseptember\b|\boctober\b|\bnovember\b|\bdecember\b|\blast week\b|\btwo weeks later\b/.test(text)
  },
  {
    id: "harm",
    title: "Describe the harmful action",
    description: "State what happened: firing, removal from projects, demotion, reduced hours, harassment, denial, or retaliation.",
    filterCategory: "recommended",
    urgency: "urgent",
    estimatedMinutes: 3,
    actionLabel: "Needed for particulars section",
    match: (text) => /\bfired\b|\bterminated\b|\bremoved\b|\btaken off\b|\bcut my hours\b|\bdemoted\b|\bharassed\b|\bdenied\b|\bretaliated\b|\bwrite-up\b/.test(text)
  },
  {
    id: "particulars",
    title: "Generate the final complaint narrative",
    description: "Use the facts collected so far to create a filing-style narrative.",
    filterCategory: "recommended",
    urgency: "normal",
    estimatedMinutes: 2,
    actionLabel: "Useful before exporting",
    match: () => !!getLatestFinalDocument()
  },
  {
    id: "comparators",
    title: "Add comparator information",
    description: "Identify similarly situated coworkers who were treated better.",
    filterCategory: "optional",
    urgency: "normal",
    estimatedMinutes: 3,
    actionLabel: "Strengthens disparate treatment",
    match: (text) => /\bcoworkers\b|\bco-workers\b|\bsame job\b|\bsimilarly situated\b|\btreated differently\b|\bothers\b/.test(text)
  },
  {
    id: "complaints",
    title: "Add internal complaint details",
    description: "State whether you complained to HR, leadership, or management and what happened afterward.",
    filterCategory: "recommended",
    urgency: "normal",
    estimatedMinutes: 2,
    actionLabel: "Important for retaliation theories",
    match: (text) => /\bcomplained\b|\breported\b|\bhr\b|\bhuman resources\b|\binternal complaint\b/.test(text)
  },
  {
    id: "witnesses",
    title: "Add witnesses or supporting documents",
    description: "Include emails, texts, screenshots, witnesses, write-ups, or records.",
    filterCategory: "optional",
    urgency: "normal",
    estimatedMinutes: 4,
    actionLabel: "Helpful evidentiary support",
    match: (text) => /\bwitness\b|\bemail\b|\btext\b|\bscreenshot\b|\bdocument\b|\bproof\b|\brecord\b|\bwrite-up\b/.test(text)
  }
];

let currentFilter = "recommended";

function buildSteps() {
  const allText = history.map((m) => m.content.toLowerCase()).join(" ");

  return stepDefinitions.map((step) => ({
    ...step,
    completed: Boolean(step.match(allText))
  }));
}

function getCompletedSteps() {
  return buildSteps().filter((step) => step.completed);
}

function getClaimFacts() {
  const allText = history.map((m) => m.content.toLowerCase()).join(" ");

  return {
    hasEmployer: /\bemployer\b|\bcompany\b|\bfirm\b|\bworked at\b|\bmanager\b|\bsupervisor\b/.test(allText),
    hasBasis: /\brace\b|\bpregnan|\bsex\b|\bgender\b|\breligion\b|\bdisabil|\bage\b|\bretaliation\b|\bcolor\b|\bnational origin\b/.test(allText),
    hasDate: /\b(20\d{2})\b|\bjanuary\b|\bfebruary\b|\bmarch\b|\bapril\b|\bmay\b|\bjune\b|\bjuly\b|\baugust\b|\bseptember\b|\boctober\b|\bnovember\b|\bdecember\b|\blast week\b|\btwo weeks later\b/.test(allText),
    hasHarm: /\bfired\b|\bterminated\b|\bremoved\b|\btaken off\b|\bcut my hours\b|\bdemoted\b|\bharassed\b|\bdenied\b|\bretaliated\b|\bwrite-up\b/.test(allText),
    hasComplaint: /\bcomplained\b|\breported\b|\bhr\b|\bhuman resources\b|\binternal complaint\b/.test(allText),
    hasWitnesses: /\bwitness\b|\bemail\b|\btext\b|\bscreenshot\b|\bdocument\b|\bproof\b|\brecord\b|\bwrite-up\b/.test(allText),
    hasComparators: /\bcoworkers\b|\bco-workers\b|\bsame job\b|\bsimilarly situated\b|\btreated differently\b|\bothers\b/.test(allText),
    hasFinalComplaint: !!getLatestFinalDocument()
  };
}

function getRiskFlags() {
  const facts = getClaimFacts();
  const flags = [];

  if (!facts.hasEmployer) {
    flags.push({
      level: "high",
      text: "No employer or workplace entity identified yet."
    });
  }

  if (!facts.hasBasis) {
    flags.push({
      level: "high",
      text: "No protected basis identified yet."
    });
  }

  if (!facts.hasDate) {
    flags.push({
      level: "high",
      text: "No incident date or time period identified yet."
    });
  }

  if (!facts.hasHarm) {
    flags.push({
      level: "high",
      text: "No adverse action or harmful treatment described yet."
    });
  }

  if (!facts.hasComplaint) {
    flags.push({
      level: "medium",
      text: "No internal complaint details captured yet. This can matter for retaliation."
    });
  }

  if (!facts.hasWitnesses) {
    flags.push({
      level: "medium",
      text: "No witnesses, emails, texts, or documents identified yet."
    });
  }

  return flags;
}

function getBadges() {
  const facts = getClaimFacts();
  const badges = [];

  if (history.filter((m) => m.role === "user").length > 0) {
    badges.push("Intake Started");
  }

  if (facts.hasEmployer && facts.hasBasis) {
    badges.push("Core Facts Captured");
  }

  if (facts.hasDate && facts.hasHarm) {
    badges.push("Timeline Built");
  }

  if (facts.hasFinalComplaint) {
    badges.push("Final Complaint Generated");
  }

  if (isReadyToFile()) {
    badges.push("Ready to File");
  }

  return badges;
}

function isReadyToFile() {
  const facts = getClaimFacts();
  return facts.hasEmployer && facts.hasBasis && facts.hasDate && facts.hasHarm && facts.hasFinalComplaint;
}

function formatMinutes(minutes) {
  if (minutes <= 1) return "1 min remaining";
  return `${minutes} min remaining`;
}

function renderRiskFlags() {
  const flags = getRiskFlags();
  riskCount.textContent = String(flags.length);

  if (!flags.length) {
    riskFlagsContainer.innerHTML = `<div class="empty-state">No major missing items detected yet.</div>`;
    return;
  }

  riskFlagsContainer.innerHTML = flags
    .map((flag) => `<div class="risk-flag ${flag.level}">${flag.text}</div>`)
    .join("");
}

function renderBadges() {
  const badges = getBadges();

  if (!badges.length) {
    badgesContainer.innerHTML = `<div class="empty-state">Milestones will appear as facts are completed.</div>`;
    return;
  }

  badgesContainer.innerHTML = badges
    .map((badge) => `<span class="badge-chip">${badge}</span>`)
    .join("");
}

function renderSteps() {
  const steps = buildSteps();

  let filteredSteps = [];

  if (currentFilter === "urgent") {
    filteredSteps = steps.filter((step) => step.urgency === "urgent" && !step.completed);
  } else if (currentFilter === "optional") {
    filteredSteps = steps.filter((step) => step.filterCategory === "optional" && !step.completed);
  } else if (currentFilter === "archived") {
    filteredSteps = steps.filter((step) => step.completed);
  } else {
    filteredSteps = steps.filter((step) => step.filterCategory !== "optional" && !step.completed);
  }

  if (!filteredSteps.length) {
    stepsContainer.innerHTML = `<div class="empty-state">${
      currentFilter === "archived"
        ? "Completed items will appear here."
        : "No steps in this view right now."
    }</div>`;
    return;
  }

  stepsContainer.innerHTML = filteredSteps
    .map((step) => {
      const archivedClass = step.completed ? "archived" : "";
      const optionalClass = step.filterCategory === "optional" ? "optional" : "";
      const urgentClass = step.urgency === "urgent" ? "urgent" : "";

      return `
        <div class="step-card ${urgentClass} ${optionalClass} ${archivedClass}">
          <div class="step-top">
            <div class="step-title-wrap">
              <div class="step-title">${step.title}</div>
              <div class="step-meta-row">
                <span class="step-pill">${step.filterCategory}</span>
                <span class="step-pill">${step.urgency}</span>
                <span class="step-pill">${step.estimatedMinutes} min</span>
              </div>
            </div>
          </div>

          <div class="step-desc">${step.description}</div>

          <div class="step-footer">
            <span class="step-action-label">${step.actionLabel}</span>
            <label class="step-check">
              <input type="checkbox" ${step.completed ? "checked" : ""} disabled />
              <span>${step.completed ? "Done" : "Pending"}</span>
            </label>
          </div>
        </div>
      `;
    })
    .join("");
}

function updateStepsMeta() {
  const steps = buildSteps();
  const completedCount = steps.filter((step) => step.completed).length;
  const total = steps.length;
  const percent = Math.round((completedCount / total) * 100);
  const remainingMinutes = steps
    .filter((step) => !step.completed)
    .reduce((sum, step) => sum + step.estimatedMinutes, 0);

  stepsProgressText.textContent = `${percent}% complete`;
  stepsTimeText.textContent = formatMinutes(remainingMinutes);

  if (isReadyToFile()) {
    readyIndicator.classList.remove("hidden");
  } else {
    readyIndicator.classList.add("hidden");
  }
}

function renderMessage(role, content) {
  const div = document.createElement("div");
  div.className = `message ${role === "user" ? "user" : "bot"}`;
  div.textContent = content;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

function showTyping() {
  const div = document.createElement("div");
  div.className = "message bot";
  div.id = "typing-indicator";
  div.innerHTML = `
    <div class="typing">
      <span></span>
      <span></span>
      <span></span>
    </div>
  `;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

function removeTyping() {
  const typing = document.getElementById("typing-indicator");
  if (typing) typing.remove();
}

function setLoadingState(isLoading) {
  sendBtn.disabled = isLoading;
  finalDocBtn.disabled = isLoading;
  pdfBtn.disabled = isLoading;

  if (copyBtn) copyBtn.disabled = isLoading;
  if (calendarBtn) calendarBtn.disabled = isLoading;
  if (reminderBtn) reminderBtn.disabled = isLoading;
  if (emailBtn) emailBtn.disabled = isLoading;

  sendBtn.textContent = isLoading ? "Sending..." : "Send";
}

function fillPrompt(text) {
  input.value = text;
  input.focus();
}

window.fillPrompt = fillPrompt;

function minimizeChat() {
  if (!chatCard || !chatLauncher) return;
  chatCard.classList.add("minimized");
  chatLauncher.style.display = "block";
}

function openChat() {
  if (!chatCard || !chatLauncher) return;
  chatCard.classList.remove("minimized");
  chatLauncher.style.display = "none";
}

function updateProgress() {
  if (!progressFill || !progressPercent || !sectionItems.length) return;

  const allText = history.map((m) => m.content.toLowerCase()).join(" ");
  let completed = 0;

  sectionItems.forEach((item) => {
    const key = item.dataset.section;
    const words = progressKeywords[key] || [];
    const matched = words.some((word) => allText.includes(word));

    item.classList.remove("active");

    if (matched) {
      item.classList.add("active");
      completed += 1;
    }
  });

  const percent = Math.round((completed / sectionItems.length) * 100);
  progressFill.style.width = `${percent}%`;
  progressPercent.textContent = `${percent}%`;

  renderRiskFlags();
  renderBadges();
  renderSteps();
  updateStepsMeta();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function getLatestFinalDocument() {
  for (let i = history.length - 1; i >= 0; i--) {
    const msg = history[i];
    if (
      msg.role === "assistant" &&
      (
        msg.content.includes("WORKPLACE DISCRIMINATION / RETALIATION INTAKE SUMMARY") ||
        msg.content.includes("1. PERSONAL INFORMATION") ||
        msg.content.includes("DESCRIPTION OF EVENTS (PARTICULARS)")
      )
    ) {
      return msg.content;
    }
  }
  return null;
}

function buildFallbackDocument() {
  const userFacts = history
    .filter((msg) => msg.role === "user")
    .map((msg) => msg.content.trim())
    .filter(Boolean);

  const chronology = userFacts.length
    ? userFacts.map((fact) => `- ${fact}`).join("\n")
    : "[Not yet provided]";

  return `WORKPLACE DISCRIMINATION / RETALIATION INTAKE SUMMARY

1. PERSONAL INFORMATION
- Full Name: [User should fill in]
- Address: [User should fill in]
- City/State/ZIP: [User should fill in]
- Phone: [User should fill in]
- Email: [User should fill in]
- Date of Birth: [User should fill in]
- Sex: [User should fill in]
- Disability Status: [User should fill in]
- Race / Color: [User should fill in]
- Ethnicity: [User should fill in]
- Religion: [User should fill in]
- Other Protected Basis Identified: [Not yet provided]

2. EMPLOYER INFORMATION
- Employer Name: [Not yet provided]
- Employer Address: [Not yet provided]
- Work Location: [Not yet provided]
- Number of Employees: [Not yet provided]
- Supervisor / Manager Involved: [Not yet provided]
- Job Title: [Not yet provided]
- Dates of Employment: [Not yet provided]

3. PROTECTED BASIS
- Basis or Bases Claimed: [Not yet provided]
- Why User Thinks This Basis Applies: [Not yet provided]

4. DATES OF HARM
- Earliest Date of Harm: [Not yet provided]
- Most Recent Date of Harm: [Not yet provided]
- Date Employment Ended (if applicable): [Not yet provided]

5. ADVERSE ACTION OR HARMFUL TREATMENT
- What Happened: [Not yet provided]
- Type of Action: [Not yet provided]
- Who Made the Decision: [Not yet provided]
- Reason Given by Employer (if any): [Not yet provided]

6. COMPARATOR INFORMATION
- Similarly Situated Employees: [Not yet provided]
- How They Were Treated Differently: [Not yet provided]
- Comparator Names / Roles (if known): [Not yet provided]

7. INTERNAL COMPLAINTS / PROTECTED ACTIVITY
- Whether User Complained Internally: [Not yet provided]
- Date of Complaint: [Not yet provided]
- Who Received Complaint: [Not yet provided]
- What User Reported: [Not yet provided]
- What Happened After the Complaint: [Not yet provided]

8. WITNESSES / DOCUMENTS
- Witnesses: [Not yet provided]
- Emails / Texts / Write-Ups / Records: [Not yet provided]
- Other Supporting Information: [Not yet provided]

9. DESCRIPTION OF EVENTS (PARTICULARS)
The user has provided the following facts so far:

${chronology}

10. REQUESTED NEXT-STEP DRAFT NOTES
- Main Issue to Report: [User should clarify]
- Missing Information Still to Fill In: [Several sections still incomplete]
- Questions User Should Be Ready to Answer in an Intake Form: [Employer name, dates, basis, action, witnesses, documents]

11. SIGNATURE BLOCK
I declare under penalty of perjury that the information above is true and correct to the best of my knowledge.

Signature: ______________________________
Date: ______________________________`;
}

function formatComplaintDocumentToHtml(text) {
  const escaped = escapeHtml(text);
  const paragraphs = escaped.split("\n").map((line) => {
    const trimmed = line.trim();

    if (!trimmed) {
      return `<div class="spacer"></div>`;
    }

    if (
      trimmed === "WORKPLACE DISCRIMINATION / RETALIATION INTAKE SUMMARY" ||
      /^\d+\.\s[A-Z][A-Z\s/()\-\u2014]+$/.test(trimmed)
    ) {
      return `<h2>${trimmed}</h2>`;
    }

    if (trimmed.startsWith("- ")) {
      return `<p class="field">${trimmed}</p>`;
    }

    return `<p>${trimmed}</p>`;
  });

  return paragraphs.join("");
}

function downloadPDF() {
  const finalDocument = getLatestFinalDocument() || buildFallbackDocument();
  const documentHtml = formatComplaintDocumentToHtml(finalDocument);

  const win = window.open("", "_blank");
  if (!win) return;

  win.document.write(`
    <html>
      <head>
        <title>EEOC Intake Summary</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 44px;
            line-height: 1.55;
            color: #111;
            max-width: 900px;
            margin: 0 auto;
          }
          h1 {
            font-size: 24px;
            margin: 0 0 24px 0;
            border-bottom: 2px solid #222;
            padding-bottom: 10px;
          }
          h2 {
            font-size: 16px;
            margin-top: 24px;
            margin-bottom: 10px;
            text-transform: none;
          }
          p {
            margin: 0 0 10px 0;
            white-space: pre-wrap;
          }
          .field {
            margin-left: 10px;
          }
          .spacer {
            height: 8px;
          }
          .footer-note {
            margin-top: 28px;
            font-size: 12px;
            color: #555;
            border-top: 1px solid #ccc;
            padding-top: 12px;
          }
          @media print {
            body {
              padding: 24px;
            }
          }
        </style>
      </head>
      <body>
        <h1>EEOC Intake Summary</h1>
        ${documentHtml}
        <div class="footer-note">
          Generated from Workplace Discrimination Claim Builder.
        </div>
      </body>
    </html>
  `);

  win.document.close();
  win.focus();
  win.print();
}

function copyFinalComplaint() {
  const finalDocument = getLatestFinalDocument() || buildFallbackDocument();
  navigator.clipboard.writeText(finalDocument).catch(() => {});
}

function buildGoogleCalendarLink(title, details) {
  const start = "20260424T170000Z";
  const end = "20260424T173000Z";
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: title,
    dates: `${start}/${end}`,
    details
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

function buildOutlookCalendarLink(title, details) {
  const start = encodeURIComponent("2026-04-24T13:00:00");
  const end = encodeURIComponent("2026-04-24T13:30:00");
  return `https://outlook.live.com/calendar/0/deeplink/compose?path=/calendar/action/compose&rru=addevent&subject=${encodeURIComponent(title)}&startdt=${start}&enddt=${end}&body=${encodeURIComponent(details)}`;
}

function downloadICS(title, description) {
  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Claim Builder//EN
BEGIN:VEVENT
UID:${Date.now()}@claimbuilder.local
DTSTAMP:20260417T120000Z
DTSTART:20260424T170000Z
DTEND:20260424T173000Z
SUMMARY:${title}
DESCRIPTION:${description.replace(/\n/g, "\\n")}
END:VEVENT
END:VCALENDAR`;

  const blob = new Blob([icsContent], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "claim-builder-reminder.ics";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function emailDraft() {
  const finalDocument = getLatestFinalDocument() || buildFallbackDocument();
  const subject = encodeURIComponent("EEOC Claim Draft for Review");
  const body = encodeURIComponent(finalDocument);
  window.location.href = `mailto:?subject=${subject}&body=${body}`;
}

async function sendMessage(message) {
  if (!message || !message.trim()) return;

  renderMessage("user", message);
  history.push({ role: "user", content: message });
  updateProgress();

  setLoadingState(true);
  showTyping();

  try {
    const response = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ history })
    });

    const data = await response.json();

    removeTyping();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong.");
    }

    const reply = data.reply || "I’m sorry, something went wrong.";
    renderMessage("assistant", reply);
    history.push({ role: "assistant", content: reply });
    updateProgress();
  } catch (err) {
    removeTyping();
    renderMessage("assistant", `Error: ${err.message}`);
  } finally {
    setLoadingState(false);
  }
}

if (minimizeBtn) minimizeBtn.addEventListener("click", minimizeChat);
if (chatLauncher) chatLauncher.addEventListener("click", openChat);
if (pdfBtn) pdfBtn.addEventListener("click", downloadPDF);

if (copyBtn) {
  copyBtn.addEventListener("click", copyFinalComplaint);
}

if (emailBtn) {
  emailBtn.addEventListener("click", emailDraft);
}

if (calendarBtn) {
  calendarBtn.addEventListener("click", () => {
    const details = "Review filing deadline and complete remaining claim-builder steps.";
    const googleLink = buildGoogleCalendarLink("EEOC Filing Deadline", details);
    window.open(googleLink, "_blank");
  });
}

if (reminderBtn) {
  reminderBtn.addEventListener("click", () => {
    downloadICS(
      "Claim Builder Follow-Up Reminder",
      "Return to the claim builder, review missing facts, and finalize the complaint draft."
    );
  });
}

filterButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    filterButtons.forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    currentFilter = btn.dataset.filter;
    renderSteps();
  });
});

renderMessage("assistant", history[0].content);
updateProgress();

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = input.value.trim();
  if (!message) return;

  input.value = "";
  await sendMessage(message);
});

if (finalDocBtn) {
  finalDocBtn.addEventListener("click", async () => {
    const prompt = "Generate the final complaint document based on the information I have given so far.";
    await sendMessage(prompt);
  });
}
