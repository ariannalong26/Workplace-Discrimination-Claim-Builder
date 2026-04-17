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
    content: "Tell me briefly what happened at work. I’ll help organize it step by step and ask one question at a time."
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
  chatCard.classList.add("minimized");
  chatLauncher.style.display = "block";
}

function openChat() {
  chatCard.classList.remove("minimized");
  chatLauncher.style.display = "none";
}

function updateProgress() {
  const allText = history.map(m => m.content.toLowerCase()).join(" ");
  let completed = 0;
  let latestActive = null;

  sectionItems.forEach((item) => {
    const key = item.dataset.section;
    const words = progressKeywords[key] || [];
    const matched = words.some(word => allText.includes(word));

    item.classList.remove("active");

    if (matched) {
      item.classList.add("active");
      completed += 1;
      latestActive = item;
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
    .filter(msg => msg.role === "user")
    .map(msg => `• ${msg.content}`)
    .slice(-6);

  summaryContent.textContent = userMessages.join("\n");
}

function downloadPDF() {
  const printable = history
    .map(msg => `${msg.role === "user" ? "User" : "Assistant"}:\n${msg.content}`)
    .join("\n\n");

  const win = window.open("", "_blank");
  if (!win) return;

  win.document.write(`
    <html>
      <head>
        <title>Workplace Discrimination Claim Builder PDF</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            line-height: 1.6;
            color: #111;
          }
          h1 {
            margin-bottom: 20px;
          }
          .entry {
            margin-bottom: 20px;
            white-space: pre-wrap;
          }
          .label {
            font-weight: bold;
            margin-bottom: 6px;
          }
        </style>
      </head>
      <body>
        <h1>Workplace Discrimination Claim Builder</h1>
        ${history.map(msg => `
          <div class="entry">
            <div class="label">${msg.role === "user" ? "User" : "Assistant"}</div>
            <div>${msg.content.replace(/\n/g, "<br>")}</div>
          </div>
        `).join("")}
      </body>
    </html>
  `);

  win.document.close();
  win.focus();
  win.print();
}

minimizeBtn.addEventListener("click", minimizeChat);
chatLauncher.addEventListener("click", openChat);
pdfBtn.addEventListener("click", downloadPDF);

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

renderMessage("assistant", history[0].content);
updateProgress();

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = input.value.trim();
  if (!message) return;

  input.value = "";
  await sendMessage(message);
});

finalDocBtn.addEventListener("click", async () => {
  const prompt = "Generate the final complaint document based on the information I have given so far.";
  await sendMessage(prompt);
});
