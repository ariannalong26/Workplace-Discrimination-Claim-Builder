const chat = document.getElementById("chat");
const form = document.getElementById("chat-form");
const input = document.getElementById("user-input");
const sendBtn = document.getElementById("send-btn");

function fillPrompt(text) {
  input.value = text;
  form.dispatchEvent(new Event("submit"));
}

let history = [
  {
    role: "assistant",
    content: "Hi — describe what happened at work, when it happened, who was involved, and why you think it may have been discrimination or retaliation."
  }
];

function renderMessage(role, content) {
  const div = document.createElement("div");
  div.className = `message ${role === "user" ? "user" : "bot"}`;
  div.textContent = content;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
}

renderMessage("assistant", history[0].content);

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const message = input.value.trim();
  if (!message) return;

  renderMessage("user", message);
  history.push({ role: "user", content: message });
  input.value = "";
  sendBtn.disabled = true;

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

    renderMessage("assistant", data.reply);
    history.push({ role: "assistant", content: data.reply });
  } catch (err) {
    renderMessage("assistant", `Error: ${err.message}`);
  } finally {
    sendBtn.disabled = false;
  }
});
