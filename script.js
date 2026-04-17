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
const summaryContent = document.getElementById("summary-content");
const sectionItems = document.querySelectorAll(".section-item");

let history = [
  {
    role: "assistant",
    content:
      "Tell me briefly what happened at work. I’ll help organize it step by step and ask one question at a time."
  }
];

const progressKeywords = {
  personal: ["name", "phone", "email", "address", "birth", "race", "religion", "sex", "disability"],
  employer: ["employer", "company", "manager", "supervisor", "job title", "worked at", "employee"],
  basis: ["race", "pregnant", "pregnancy", "religion", "sex", "gender", "retaliation", "disability", "age", "color"],
  dates: ["date", "month", "year", "january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"],
  harm: ["fired", "terminated", "demoted", "write-up", "written up", "cut my hours", "harassed", "denied", "reassigned", "removed"],
  comparators: ["others", "coworkers", "co-workers", "same job", "treated differently", "similarly situated"],
  complaints: ["complained", "reported", "hr", "human resources", "retaliated", "internal complaint"],
  witnesses: ["witness", "email", "text", "record", "document", "write-up", "proof"],
  particulars: ["because", "after", "then", "when", "timeline", "happened"]
};

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
  if (!progressFill || !progressPercent || !summaryContent || !sectionItems.length) return;

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

  if (history.length <= 1) {
    summaryContent.textContent = "No facts captured yet.";
    return;
  }

  const userMessages = history
    .filter((msg) => msg.role === "user")
    .map((msg) => `• ${msg.content}`)
    .slice(-6);

  summaryContent.textContent = userMessages.join("\n");
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
      /^\\d+\\.\\s[A-Z][A-Z\\s/()\\-]+$/.test(trimmed)
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
