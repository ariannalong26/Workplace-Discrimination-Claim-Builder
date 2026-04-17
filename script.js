const chat = document.getElementById("chat");
const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");
const finalDocBtn = document.getElementById("final-doc-btn");
const chatCard = document.getElementById("chat-card");
const chatLauncher = document.getElementById("chat-launcher");
const minimizeBtn = document.getElementById("minimize-btn");

let history = [
  {
    role: "assistant",
    content: "Tell me briefly what happened at work. I’ll help organize it step by step and ask one question at a time."
  }
];

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

minimizeBtn.addEventListener("click", minimizeChat);
chatLauncher.addEventListener("click", openChat);

async function sendMessage(message) {
  if (!message || !message.trim()) return;

  renderMessage("user", message);
  history.push({ role: "user", content: message });

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
  } catch (err) {
    removeTyping();
    renderMessage("assistant", `Error: ${err.message}`);
  } finally {
    setLoadingState(false);
  }
}

renderMessage("assistant", history[0].content);

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
