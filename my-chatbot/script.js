{\rtf1\ansi\ansicpg1252\cocoartf2709
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 const chat = document.getElementById("chat");\
const form = document.getElementById("chat-form");\
const input = document.getElementById("user-input");\
const sendBtn = document.getElementById("send-btn");\
\
let history = [\
  \{\
    role: "assistant",\
    content: "Hi \'97 describe what happened at work, when it happened, who was involved, and why you think it may have been discrimination or retaliation."\
  \}\
];\
\
function renderMessage(role, content) \{\
  const div = document.createElement("div");\
  div.className = `message $\{role === "user" ? "user" : "bot"\}`;\
  div.textContent = content;\
  chat.appendChild(div);\
  chat.scrollTop = chat.scrollHeight;\
\}\
\
renderMessage("assistant", history[0].content);\
\
form.addEventListener("submit", async (e) => \{\
  e.preventDefault();\
\
  const message = input.value.trim();\
  if (!message) return;\
\
  renderMessage("user", message);\
  history.push(\{ role: "user", content: message \});\
  input.value = "";\
  sendBtn.disabled = true;\
\
  try \{\
    const response = await fetch("/.netlify/functions/chat", \{\
      method: "POST",\
      headers: \{\
        "Content-Type": "application/json"\
      \},\
      body: JSON.stringify(\{ history \})\
    \});\
\
    const data = await response.json();\
\
    if (!response.ok) \{\
      throw new Error(data.error || "Something went wrong.");\
    \}\
\
    renderMessage("assistant", data.reply);\
    history.push(\{ role: "assistant", content: data.reply \});\
  \} catch (err) \{\
    renderMessage("assistant", `Error: $\{err.message\}`);\
  \} finally \{\
    sendBtn.disabled = false;\
  \}\
\});}