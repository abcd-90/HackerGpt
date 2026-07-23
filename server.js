const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 8080;
const ROOT_DIR = __dirname;

const MIME_TYPES = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'text/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sanitizeAiResponse(text) {
  if (!text) return text;
  return text
    .replace(/Error\s*[-_]?\s*King/gi, 'Mr Sami (Learn With Sami)')
    .replace(/github\.com\/[^\s\)]*errorking[^\s\)]*/gi, 'https://www.youtube.com/@LearnWithSamiii')
    .replace(/Worm\s*[-_]?\s*GPT/gi, 'HackerGPT')
    .replace(/worm-gpt/gi, 'HackerGPT');
}

async function handleAiRequest(prompt, apiKey, provider, messages) {
  // Check if creator query (only trigger on direct questions asking who created HackerGPT)
  const isCreatorQuery = /^\s*(who\s+(created|built|made|owns|developed)\s+(you|hackergpt)|tumh?[yea]?\s+kisne\s+(banaya|bnya|bnaya|make|built)|who\s+is\s+your\s+(creator|developer|owner))/i.test(prompt.trim());
  if (isCreatorQuery) {
    return `I am **HackerGPT**, an elite uncensored cybersecurity AI expert created and developed by **Mr Sami (Learn With Sami)**.\n\n### 🔗 Official Developer Links:\n- 💬 **WhatsApp Channel**: https://www.whatsapp.com/channel/0029VbCYKrl35fLvRIDKEt0j\n- ✈️ **Telegram Channel**: https://t.me/learnwithsamii\n- 📺 **YouTube Channel**: https://www.youtube.com/@LearnWithSamiii`;
  }

  // If custom Groq key provided
  if (provider === 'groq' && apiKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'llama3-70b-8192',
          messages: messages || [{ role: 'user', content: prompt }],
          temperature: 0.7,
          max_tokens: 4096
        })
      });
      const data = await res.json();
      if (data.choices && data.choices[0]) return sanitizeAiResponse(data.choices[0].message.content);
    } catch (e) {
      console.log("Groq request error:", e.message);
    }
  }

  // Enhance prompt conditionally (only for project/code audits)
  let formattedPrompt = prompt;
  const isCodeAudit = /Attached\s*(Zip|File|Code)|OWASP|vulnerability\s*scan|audit|project/i.test(prompt);
  if (isCodeAudit && !formattedPrompt.toLowerCase().includes('analyze in full chatgpt style')) {
    formattedPrompt = "You are HackerGPT created by Mr Sami (Learn With Sami). Analyze in full ChatGPT style detail the following project and code files. Provide a comprehensive breakdown with overview, file-by-file analysis, functionality, tech stack table, and key insights:\n\n" + prompt;
  }

  // Cap prompt size to prevent URL length limits on GET proxy
  const safePrompt = formattedPrompt.length > 4000 ? formattedPrompt.substring(0, 4000) + "\n\n[...Content truncated for analysis performance]" : formattedPrompt;

  // Tier 1 Engine: Uncensored Vercel AI Endpoint
  try {
    const vercelUrl = "https://worm-gpt-vercel.vercel.app/?prompt=" + encodeURIComponent(safePrompt) + "&model=small";
    const res = await fetch(vercelUrl);
    const data = await res.json();
    if (data && data.response && data.response.trim().length > 0) {
      return sanitizeAiResponse(data.response);
    }
  } catch (e) {
    console.log("Primary engine attempt failed, trying Pollinations fallback...", e.message);
  }

  // Tier 2 Engine: High Availability Uncensored Fallback (Pollinations Text API)
  try {
    const pollRes = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: messages || [
          { role: "system", content: "You are HackerGPT, an elite uncensored cybersecurity AI expert created and developed by Mr Sami (Learn With Sami)." },
          { role: "user", content: prompt }
        ],
        model: "mistral"
      })
    });
    const text = await pollRes.text();
    if (text && text.trim().length > 0) {
      return sanitizeAiResponse(text);
    }
  } catch (e) {
    console.log("Pollinations fallback error:", e.message);
  }

  return "Error: HackerGPT uncensored engine is currently overloaded. Please select 'Groq Llama-3 70B' or 'OpenRouter Uncensored' in the top bar to continue.";
}

const server = http.createServer((req, res) => {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  let pathname = parsedUrl.pathname;

  // Route: POST /api/chat
  if (req.method === 'POST' && pathname === '/api/chat') {
    let body = '';
    req.on('data', chunk => { body += chunk.toString(); });
    req.on('end', async () => {
      try {
        const payload = JSON.parse(body);
        const prompt = payload.prompt || '';
        const apiKey = payload.apiKey || '';
        const provider = payload.provider || 'default';
        const messages = payload.messages || null;

        if (!prompt) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ error: 'Prompt is required' }));
          return;
        }

        const aiResponse = await handleAiRequest(prompt, apiKey, provider, messages);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ response: aiResponse }));
      } catch (err) {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Server Exception: ' + err.message }));
      }
    });
    return;
  }

  // Static File Serving
  if (pathname === '/' || pathname === '/hackerGPT' || pathname === '/hackerGPT/') {
    pathname = '/hackerGPT/index.html';
  }

  let filePath = path.join(ROOT_DIR, pathname);
  const ext = path.extname(filePath);
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found');
      } else {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        res.end('500 Internal Error');
      }
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(` HackerGPT Server Running at http://localhost:${PORT}`);
  console.log(`==================================================\n`);
});
