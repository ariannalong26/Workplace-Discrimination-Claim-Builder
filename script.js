const chat = document.getElementById("chat");
const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

function renderMessage(role, content) {
  const div = document.createElement("div");
  div.className = `message ${role === "user" ? "user" : "bot"}`;
  div.textContent = content;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

let history = [
  {
    role: "assistant",
    content:
      "Tell me briefly what happened at work. I’ll help organize it step by step and ask one question at a time."
  }
];

renderMessage("assistant", history[0].content);

function fillPrompt(text) {
  input.value = text;
  input.focus();
}

window.fillPrompt = fillPrompt;

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = input.value.trim();
  if (!message) return;

  renderMessage("user", message);
  history.push({ role: "user", content: message });
  input.value = "";
  sendBtn.disabled = true;
  sendBtn.textContent = "Sending...";

  try {
    const response = await fetch("/.netlify/functions/chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ history })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Something went wrong.");
    }

    const reply = data.reply || "I’m sorry, something went wrong.";
    renderMessage("assistant", reply);
    history.push({ role: "assistant", content: reply });
  } catch (err) {
    renderMessage("assistant", `Error: ${err.message}`);
  } finally {
    sendBtn.disabled = false;
    sendBtn.textContent = "Send";
  }
});
