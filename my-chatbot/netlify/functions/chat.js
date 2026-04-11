{\rtf1\ansi\ansicpg1252\cocoartf2709
\cocoatextscaling0\cocoaplatform0{\fonttbl\f0\fswiss\fcharset0 Helvetica;}
{\colortbl;\red255\green255\blue255;}
{\*\expandedcolortbl;;}
\margl1440\margr1440\vieww11520\viewh8400\viewkind0
\pard\tx720\tx1440\tx2160\tx2880\tx3600\tx4320\tx5040\tx5760\tx6480\tx7200\tx7920\tx8640\pardirnatural\partightenfactor0

\f0\fs24 \cf0 import OpenAI from "openai";\
\
const client = new OpenAI(\{\
  apiKey: process.env.OPENAI_API_KEY\
\});\
\
export async function handler(event) \{\
  try \{\
    if (event.httpMethod !== "POST") \{\
      return \{\
        statusCode: 405,\
        body: JSON.stringify(\{ error: "Method not allowed" \})\
      \};\
    \}\
\
    const \{ history \} = JSON.parse(event.body || "\{\}");\
\
    const systemPrompt = `\
You are a workplace discrimination claim intake assistant.\
\
Your job is to help users organize their facts into a clear EEOC-style narrative.\
\
Rules:\
- Do not claim to be a lawyer.\
- Do not say this is legal advice.\
- Do not invent facts.\
- If facts are missing, ask focused follow-up questions.\
- Keep responses clear, compassionate, and organized.\
- When enough facts are available, produce:\
  1. a short issue summary,\
  2. key facts timeline,\
  3. possible claim labels,\
  4. a draft narrative in plain English.\
`;\
\
    const input = [\
      \{\
        role: "system",\
        content: systemPrompt\
      \},\
      ...(history || []).map((msg) => (\{\
        role: msg.role === "assistant" ? "assistant" : "user",\
        content: msg.content\
      \}))\
    ];\
\
    const response = await client.responses.create(\{\
      model: "gpt-4.1",\
      input: input\
    \});\
\
    return \{\
      statusCode: 200,\
      headers: \{\
        "Content-Type": "application/json"\
      \},\
      body: JSON.stringify(\{\
        reply: response.output_text\
      \})\
    \};\
  \} catch (error) \{\
    return \{\
      statusCode: 500,\
      headers: \{\
        "Content-Type": "application/json"\
      \},\
      body: JSON.stringify(\{\
        error: error.message || "Server error"\
      \})\
    \};\
  \}\
\}}