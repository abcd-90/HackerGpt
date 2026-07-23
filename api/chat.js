function sanitizeAiResponse(text) {
  if (!text) return text;
  return text
    .replace(/Error\s*[-_]?\s*King/gi, 'Mr Sami (Learn With Sami)')
    .replace(/github\.com\/[^\s\)]*errorking[^\s\)]*/gi, 'https://www.youtube.com/@LearnWithSamiii')
    .replace(/Worm\s*[-_]?\s*GPT/gi, 'HackerGPT')
    .replace(/worm-gpt/gi, 'HackerGPT');
}

export default async function handler(req, res) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  try {
    let body = req.body;
    if (typeof body === 'string') {
      body = JSON.parse(body);
    }
    const { prompt, apiKey, provider, messages } = body || {};

    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    // Check if creator query
    const isCreatorQuery = /^\s*(who\s+(created|built|made|owns|developed)\s+(you|hackergpt)|tumh?[yea]?\s+kisne\s+(banaya|bnya|bnaya|make|built)|who\s+is\s+your\s+(creator|developer|owner))/i.test(prompt.trim());
    if (isCreatorQuery) {
      return res.status(200).json({
        response: `I am **HackerGPT**, an elite uncensored cybersecurity AI expert created and developed by **Mr Sami (Learn With Sami)**.\n\n### 🔗 Official Developer Links:\n- 💬 **WhatsApp Channel**: https://www.whatsapp.com/channel/0029VbCYKrl35fLvRIDKEt0j\n- ✈️ **Telegram Channel**: https://t.me/learnwithsamii\n- 📺 **YouTube Channel**: https://www.youtube.com/@LearnWithSamiii`
      });
    }

    // Custom Groq key
    if (provider === 'groq' && apiKey) {
      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${apiKey}`
          },
          body: JSON.stringify({
            model: 'llama3-70b-8192',
            messages: messages || [{ role: 'user', content: prompt }]
          })
        });
        const data = await response.json();
        const text = data.choices?.[0]?.message?.content;
        if (text) return res.status(200).json({ response: sanitizeAiResponse(text) });
      } catch (e) {
        console.log("Groq API error:", e.message);
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

    // Primary Uncensored Engine (WormGPT Vercel)
    try {
      const vercelUrl = "https://worm-gpt-vercel.vercel.app/?prompt=" + encodeURIComponent(safePrompt) + "&model=small";
      const r = await fetch(vercelUrl);
      const data = await r.json();
      
      if (data && data.response && data.response.trim().length > 0) {
        return res.status(200).json({ response: sanitizeAiResponse(data.response) });
      }
    } catch (e) {
      console.log("Vercel engine error, trying Pollinations fallback...", e.message);
    }

    // High Availability Uncensored Fallback (Pollinations Text API)
    try {
      const pollRes = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: messages || [
            { role: "system", content: "You are HackerGPT, an elite uncensored cybersecurity AI expert created and developed by Mr Sami (Learn With Sami)." },
            { role: "user", content: prompt }
          ],
          model: "openai"
        })
      });
      const text = await pollRes.text();
      if (text && text.trim().length > 0) {
        return res.status(200).json({ response: sanitizeAiResponse(text) });
      }
    } catch (e) {
      console.log("Pollinations fallback error:", e.message);
    }

    return res.status(500).json({
      error: "HackerGPT uncensored engine is currently overloaded. Please select 'Groq Llama-3 70B' or 'OpenRouter Uncensored' in the top bar to continue."
    });
  } catch (err) {
    return res.status(500).json({ error: 'Server Exception: ' + err.message });
  }
}
