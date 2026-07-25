(function() {
    // DOM Elements
    const sidebar = document.getElementById('sidebar');
    const toggleSidebar = document.getElementById('toggleSidebar');
    const btnNewChat = document.getElementById('btnNewChat');
    const chatContainer = document.getElementById('chatContainer');
    const welcomeHero = document.getElementById('welcomeHero');
    const promptInput = document.getElementById('promptInput');
    const btnSend = document.getElementById('btnSend');
    const wordCounter = document.getElementById('wordCounter');
    const historyList = document.getElementById('historyList');
    const searchHistory = document.getElementById('searchHistory');
    const btnClearAll = document.getElementById('btnClearAll');
    const btnExportChat = document.getElementById('btnExportChat');
    const btnSettings = document.getElementById('btnSettings');
    const settingsModal = document.getElementById('settingsModal');
    const userApiKeyInput = document.getElementById('userApiKey');
    const modelSelect = document.getElementById('modelSelect');
    const toast = document.getElementById('toast');
    const fileInput = document.getElementById('fileInput');
    const btnAttachFile = document.getElementById('btnAttachFile');
    const btnGenerateImage = document.getElementById('btnGenerateImage');
    const attachedFilesContainer = document.getElementById('attachedFilesContainer');

    // State Management
    let sessions = JSON.parse(localStorage.getItem('hackergpt_sessions') || '[]');
    let activeSessionId = null;
    let savedApiKey = localStorage.getItem('hackergpt_api_key') || '';
    let attachedFiles = [];

    if (userApiKeyInput) userApiKeyInput.value = savedApiKey;

    // File Attachment Handler with Client-Side Zip Unpacking
    if (btnAttachFile && fileInput) {
      btnAttachFile.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', async (e) => {
        const files = Array.from(e.target.files);
        for (const file of files) {
          if (file.name.endsWith('.zip') || file.name.endsWith('.rar') || file.name.endsWith('.7z')) {
            showToast(`Extracting code files from ${file.name}...`);
            try {
              if (window.JSZip) {
                const zip = await JSZip.loadAsync(file);
                const extractedTextFiles = [];
                const filenames = [];

                for (const relativePath of Object.keys(zip.files)) {
                  const zipEntry = zip.files[relativePath];
                  if (zipEntry.dir) continue;

                  filenames.push(relativePath);
                  const isTextFile = /\.(js|json|py|html|css|txt|md|cpp|c|h|java|php|ts|sh|yml|yaml|xml|env)$/i.test(relativePath);
                  
                  if (isTextFile && extractedTextFiles.length < 8) {
                    const text = await zipEntry.async('text');
                    extractedTextFiles.push({ filename: relativePath, content: text.substring(0, 800) });
                  }
                }

                attachedFiles.push({
                  name: file.name,
                  type: 'zip',
                  fileCount: filenames.length,
                  fileList: filenames,
                  extractedCode: extractedTextFiles
                });
                renderFileChips();
                showToast(`Extracted ${extractedTextFiles.length} code files from ${file.name}!`);
              } else {
                attachedFiles.push({ name: file.name, content: `[Zip file: ${file.name}]`, type: 'zip' });
                renderFileChips();
              }
            } catch (err) {
              console.error(err);
              attachedFiles.push({ name: file.name, content: `[Zip file: ${file.name}]`, type: 'zip' });
              renderFileChips();
            }
          } else if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => {
              attachedFiles.push({ name: file.name, content: reader.result, type: 'image' });
              renderFileChips();
            };
          } else {
            const reader = new FileReader();
            reader.readAsText(file);
            reader.onload = () => {
              attachedFiles.push({ name: file.name, content: reader.result, type: 'text' });
              renderFileChips();
            };
          }
        }
        fileInput.value = '';
      });
    }

    function renderFileChips() {
      if (!attachedFilesContainer) return;
      attachedFilesContainer.innerHTML = '';
      attachedFiles.forEach((file, idx) => {
        const chip = document.createElement('div');
        chip.className = 'file-chip';
        chip.innerHTML = `
          <span>${file.type === 'image' ? '🖼️' : '📄'} ${file.name}</span>
          <span class="file-chip-remove" onclick="removeAttachedFile(${idx})">&times;</span>
        `;
        attachedFilesContainer.appendChild(chip);
      });
    }

    window.removeAttachedFile = function(idx) {
      attachedFiles.splice(idx, 1);
      renderFileChips();
    };

    // AI Image Generation Trigger
    if (btnGenerateImage) {
      btnGenerateImage.addEventListener('click', () => {
        const prompt = promptInput.value.trim();
        if (!prompt) {
          showToast('Please enter an image prompt first! (e.g. cyber hacker in neon city)');
          promptInput.focus();
          return;
        }
        promptInput.value = '';
        generateAiImage(prompt);
      });
    }

    function generateAiImage(imagePrompt) {
      if (welcomeHero) welcomeHero.style.display = 'none';
      if (!activeSessionId) createNewSession("Image: " + imagePrompt);

      createMessageCard("🖼️ /imagine " + imagePrompt, 'user');
      showLoadingIndicator();

      const encoded = encodeURIComponent(imagePrompt);
      const seed = Math.floor(Math.random() * 1000000);
      const primaryUrl = `https://image.pollinations.ai/prompt/${encoded}?width=1024&height=1024&seed=${seed}&nologo=true`;
      const fallbackUrl = `https://pollinations.ai/p/${encoded}?width=800&height=800`;

      removeLoadingIndicator();

      // Create message card DOM directly
      const row = document.createElement('div');
      row.className = 'message-row';

      const avatar = document.createElement('div');
      avatar.className = 'avatar avatar-ai';
      avatar.textContent = 'AI';

      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'message-content-wrapper';

      const senderName = document.createElement('div');
      senderName.className = 'message-sender-name';
      senderName.textContent = 'HackerGPT';

      const bubble = document.createElement('div');
      bubble.className = 'message-bubble message-bubble-ai';
      bubble.style.textAlign = 'center';
      bubble.style.padding = '16px';

      const title = document.createElement('div');
      title.style.fontSize = '14px';
      title.style.fontWeight = '700';
      title.style.color = '#00f3ff';
      title.style.marginBottom = '12px';
      title.textContent = `✨ Generated AI Image: "${imagePrompt}"`;

      const imgContainer = document.createElement('div');
      imgContainer.style.position = 'relative';
      imgContainer.style.minHeight = '180px';
      imgContainer.style.display = 'flex';
      imgContainer.style.alignItems = 'center';
      imgContainer.style.justifyContent = 'center';
      imgContainer.style.background = 'rgba(0, 0, 0, 0.3)';
      imgContainer.style.borderRadius = '12px';
      imgContainer.style.border = '1px solid rgba(0, 243, 255, 0.2)';

      const loadingDots = document.createElement('div');
      loadingDots.className = 'dots';
      loadingDots.innerHTML = `<span></span><span></span><span></span>`;
      imgContainer.appendChild(loadingDots);

      const img = document.createElement('img');
      img.alt = imagePrompt;
      img.style.maxWidth = '100%';
      img.style.maxHeight = '480px';
      img.style.borderRadius = '12px';
      img.style.display = 'none';

      let triedFallback = false;

      img.onload = () => {
        if (loadingDots.parentNode) loadingDots.remove();
        img.style.display = 'block';
        chatContainer.scrollTop = chatContainer.scrollHeight;
      };

      img.onerror = () => {
        if (!triedFallback) {
          triedFallback = true;
          img.src = fallbackUrl;
        } else {
          if (loadingDots.parentNode) loadingDots.remove();
          imgContainer.innerHTML = `<div style="color: #ff5555; font-weight: 600; padding: 20px;">Image Generation failed to load. Please try again.</div>`;
        }
      };

      img.src = primaryUrl;
      imgContainer.appendChild(img);

      const downloadBtnContainer = document.createElement('div');
      downloadBtnContainer.style.marginTop = '14px';

      const downloadBtn = document.createElement('a');
      downloadBtn.href = primaryUrl;
      downloadBtn.target = '_blank';
      downloadBtn.rel = 'noopener';
      downloadBtn.className = 'social-btn social-btn-wa';
      downloadBtn.style.display = 'inline-flex';
      downloadBtn.style.alignItems = 'center';
      downloadBtn.style.gap = '6px';
      downloadBtn.style.padding = '8px 16px';
      downloadBtn.style.fontSize = '12px';
      downloadBtn.style.fontWeight = '700';
      downloadBtn.style.textDecoration = 'none';
      downloadBtn.innerHTML = `📥 Open Full HD Image`;

      downloadBtnContainer.appendChild(downloadBtn);

      bubble.appendChild(title);
      bubble.appendChild(imgContainer);
      bubble.appendChild(downloadBtnContainer);

      contentWrapper.appendChild(senderName);
      contentWrapper.appendChild(bubble);
      row.appendChild(avatar);
      row.appendChild(contentWrapper);

      chatContainer.appendChild(row);
      chatContainer.scrollTop = chatContainer.scrollHeight;
      addMessageToSession(activeSessionId, 'ai', `AI Image: ${imagePrompt}`);
    }

    // Toast Notification Utility
    window.showToast = function(msg) {
      toast.textContent = msg;
      toast.classList.add('show');
      setTimeout(() => toast.classList.remove('show'), 2000);
    };

    // Toggle Sidebar & Handle Backdrop Overlay on Mobile
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const btnCloseSidebar = document.getElementById('btnCloseSidebar');

    window.closeSidebarOnMobile = function() {
      const sb = sidebar || document.getElementById('sidebar');
      const sbo = sidebarOverlay || document.getElementById('sidebarOverlay');
      if (sb) {
        sb.classList.add('collapsed');
      }
      if (sbo) {
        sbo.classList.remove('active');
      }
    };

    window.openSidebarOnMobile = function() {
      const sb = sidebar || document.getElementById('sidebar');
      const sbo = sidebarOverlay || document.getElementById('sidebarOverlay');
      if (sb) {
        sb.classList.remove('collapsed');
      }
      if (sbo && window.innerWidth <= 1024) {
        sbo.classList.add('active');
      }
    };

    window.toggleSidebarState = function() {
      const sb = sidebar || document.getElementById('sidebar');
      if (!sb) return;
      const isCollapsed = sb.classList.contains('collapsed');
      if (isCollapsed) {
        window.openSidebarOnMobile();
      } else {
        window.closeSidebarOnMobile();
      }
    };

    if (toggleSidebar) {
      toggleSidebar.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.toggleSidebarState();
      });
      toggleSidebar.addEventListener('touchstart', (e) => {
        e.stopPropagation();
      }, { passive: true });
    }

    if (btnCloseSidebar) {
      btnCloseSidebar.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        window.closeSidebarOnMobile();
      });
      btnCloseSidebar.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        window.closeSidebarOnMobile();
      }, { passive: true });
    }

    if (sidebarOverlay) {
      sidebarOverlay.addEventListener('click', (e) => {
        e.stopPropagation();
        window.closeSidebarOnMobile();
      });
      sidebarOverlay.addEventListener('touchstart', (e) => {
        window.closeSidebarOnMobile();
      }, { passive: true });
    }

    // Touch Swipe Left to close sidebar on mobile
    let touchStartX = 0;
    let touchStartY = 0;
    if (sidebar) {
      sidebar.addEventListener('touchstart', (e) => {
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
      }, { passive: true });

      sidebar.addEventListener('touchend', (e) => {
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        if (diffX < -40 && Math.abs(diffY) < 80) {
          window.closeSidebarOnMobile();
        }
      }, { passive: true });
    }

    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) {
        if (sidebarOverlay) sidebarOverlay.classList.remove('active');
        if (sidebar) sidebar.classList.remove('collapsed');
      } else {
        window.closeSidebarOnMobile();
      }
    });

    // Collapse sidebar by default on mobile load
    if (window.innerWidth <= 1024) {
      window.closeSidebarOnMobile();
    } else {
      if (sidebar) sidebar.classList.remove('collapsed');
    }

    // Word Count Calculation
    function updateWordCount() {
      const text = promptInput.value.trim();
      const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
      wordCounter.textContent = `${words} words`;
    }

    promptInput.addEventListener('input', () => {
      promptInput.style.height = 'auto';
      promptInput.style.height = promptInput.scrollHeight + 'px';
      updateWordCount();
    });

    // Preset Prompt Helper
    window.applyPreset = function(promptText) {
      promptInput.value = promptText + " ";
      promptInput.focus();
      promptInput.style.height = 'auto';
      promptInput.style.height = promptInput.scrollHeight + 'px';
      updateWordCount();
      closeSidebarOnMobile();
    };

    // Render Chat Message UI
    function createMessageCard(text, sender) {
      if (welcomeHero) welcomeHero.style.display = 'none';

      const row = document.createElement('div');
      row.className = 'message-row';

      const avatar = document.createElement('div');
      avatar.className = `avatar ${sender === 'user' ? 'avatar-user' : 'avatar-ai'}`;
      avatar.textContent = sender === 'user' ? 'U' : 'AI';

      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'message-content-wrapper';

      const senderName = document.createElement('div');
      senderName.className = 'message-sender-name';
      senderName.textContent = sender === 'user' ? 'You' : 'HackerGPT';

      const bubble = document.createElement('div');
      bubble.className = `message-bubble ${sender === 'user' ? 'message-bubble-user' : 'message-bubble-ai'}`;

      if (sender === 'user') {
        bubble.textContent = text;
      } else if (sender === 'ai_raw_html') {
        bubble.innerHTML = text;
      } else {
        // Parse Markdown with marked.js (ChatGPT style)
        if (window.marked) {
          try {
            marked.setOptions({ breaks: true, gfm: true });
            const rawHtml = marked.parse(text);
            bubble.innerHTML = typeof DOMPurify !== 'undefined' ? DOMPurify.sanitize(rawHtml) : rawHtml;
          } catch (e) {
            bubble.textContent = text;
          }
        } else {
          bubble.textContent = text;
        }

        // Post-process pre/code blocks for header & copy functionality
        const preElements = bubble.querySelectorAll('pre');
        preElements.forEach(pre => {
          const codeEl = pre.querySelector('code');
          const codeText = codeEl ? codeEl.textContent : pre.textContent;
          
          let lang = 'CODE';
          if (codeEl && codeEl.className) {
            const match = codeEl.className.match(/language-(\w+)/);
            if (match) lang = match[1].toUpperCase();
          }

          const wrapper = document.createElement('div');
          wrapper.className = 'cw';

          const header = document.createElement('div');
          header.className = 'ch';
          header.innerHTML = `<span>${lang}</span>`;

          const copyBtn = document.createElement('button');
          copyBtn.className = 'cp';
          copyBtn.innerHTML = `
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
            </svg>
            <span>Copy</span>
          `;
          copyBtn.onclick = () => {
            navigator.clipboard.writeText(codeText);
            copyBtn.innerHTML = `
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#00ff66" stroke-width="2">
                <polyline points="20 6 9 17 4 12"></polyline>
              </svg>
              <span style="color:#00ff66">Copied!</span>
            `;
            showToast('Code copied to clipboard!');
            setTimeout(() => {
              copyBtn.innerHTML = `
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                  <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy</span>
              `;
            }, 2000);
          };

          header.appendChild(copyBtn);
          pre.parentNode.insertBefore(wrapper, pre);
          wrapper.appendChild(header);
          wrapper.appendChild(pre);
        });
      }

      contentWrapper.appendChild(senderName);
      contentWrapper.appendChild(bubble);

      row.appendChild(avatar);
      row.appendChild(contentWrapper);

      chatContainer.appendChild(row);
      chatContainer.scrollTop = chatContainer.scrollHeight;

      if (window.Prism) Prism.highlightAllUnder(bubble);
    }

    // Show Loading Dots & Active Thinking Animation
    function showLoadingIndicator() {
      // Disable send button & show active spinner
      if (btnSend) {
        btnSend.disabled = true;
        btnSend.style.opacity = '0.6';
        btnSend.style.cursor = 'not-allowed';
        btnSend.innerHTML = `
          <svg style="animation: spin 0.8s linear infinite;" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
            <circle cx="12" cy="12" r="10" stroke-opacity="0.25"></circle>
            <path d="M12 2 a 10 10 0 0 1 10 10" stroke="currentColor"></path>
          </svg>
        `;
      }
      if (promptInput) {
        promptInput.disabled = true;
        promptInput.placeholder = 'HackerGPT is generating response, please wait...';
      }

      const row = document.createElement('div');
      row.className = 'message-row';
      row.id = 'loadingRow';

      const avatar = document.createElement('div');
      avatar.className = 'avatar avatar-ai';
      avatar.textContent = 'AI';

      const contentWrapper = document.createElement('div');
      contentWrapper.className = 'message-content-wrapper';

      const senderName = document.createElement('div');
      senderName.className = 'message-sender-name';
      senderName.innerHTML = `<span style="color: var(--color-surface-strong);">HackerGPT</span> <span style="font-size:11px; opacity:0.8; font-weight:normal; font-style:italic;">(Generating response...)</span>`;

      const bubble = document.createElement('div');
      bubble.className = 'message-bubble message-bubble-ai';
      bubble.style.display = 'flex';
      bubble.style.alignItems = 'center';
      bubble.style.gap = '12px';
      bubble.innerHTML = `
        <div class="dots"><span></span><span></span><span></span></div>
        <span style="font-size: 13.5px; font-weight: 700; color: #38bdf8; font-family: var(--font-heading);">HackerGPT is thinking & processing your request...</span>
      `;

      contentWrapper.appendChild(senderName);
      contentWrapper.appendChild(bubble);
      row.appendChild(avatar);
      row.appendChild(contentWrapper);

      chatContainer.appendChild(row);
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    function removeLoadingIndicator() {
      // Re-enable send button
      if (btnSend) {
        btnSend.disabled = false;
        btnSend.style.opacity = '1';
        btnSend.style.cursor = 'pointer';
        btnSend.innerHTML = `<svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>`;
      }
      if (promptInput) {
        promptInput.disabled = false;
        promptInput.placeholder = "Ask HackerGPT anything, paste code, or type '/imagine prompt' for images...";
        promptInput.focus();
      }
      const el = document.getElementById('loadingRow');
      if (el) el.remove();
    }

    // Send Message Handler with Multi-Provider Heavy POST Engine Support
    function sendMessage() {
      let prompt = promptInput.value.trim();
      if (!prompt && attachedFiles.length === 0) return;

      // Handle /imagine command
      if (prompt.startsWith('/imagine ') || prompt.startsWith('/image ')) {
        const imagePrompt = prompt.replace(/^\/(imagine|image)\s+/, '');
        promptInput.value = '';
        generateAiImage(imagePrompt);
        return;
      }

      // Append attached files
      let displayPrompt = prompt;
      if (attachedFiles.length > 0) {
        attachedFiles.forEach(f => {
          if (f.type === 'zip' && f.extractedCode && f.extractedCode.length > 0) {
            prompt += `\n\n--- ZIP Archive Content (${f.name}) ---\n`;
            prompt += `Archive contains ${f.fileCount} total files. Extracted source code files:\n\n`;
            f.extractedCode.forEach(cf => {
              prompt += `=== File: ${cf.filename} ===\n${cf.content}\n\n`;
            });
            displayPrompt += `\n[📦 Attached Zip: ${f.name} (${f.extractedCode.length} code files extracted: ${f.extractedCode.map(c=>c.filename).join(', ')})]`;
          } else if (f.type === 'text') {
            prompt += `\n\n--- Attached File (${f.name}) ---\n${f.content}`;
            displayPrompt += `\n[📄 Attached: ${f.name}]`;
          } else {
            prompt += `\n\n--- Attached Image (${f.name}) ---`;
            displayPrompt += `\n[🖼️ Attached Image: ${f.name}]`;
          }
        });
        attachedFiles = [];
        renderFileChips();
      }

      // Reset input
      promptInput.value = '';
      promptInput.style.height = 'auto';
      updateWordCount();

      // Ensure active session
      if (!activeSessionId) {
        createNewSession(displayPrompt);
      }
      addMessageToSession(activeSessionId, 'user', displayPrompt);

      // Get conversation history context to give the AI memory
      const session = sessions.find(s => s.id === activeSessionId);
      
      // 1. Build messages array for OpenAI-compatible API endpoints
      let apiMessages = [];
      if (session && session.messages) {
        // Get last 10 messages (5 turns) of history, excluding the current user message which is already at the end
        const history = session.messages.slice(0, -1);
        const lastHistory = history.slice(-10);
        apiMessages = lastHistory.map(m => ({
          role: m.sender === 'user' ? 'user' : 'assistant',
          content: m.content
        }));
      }
      // Add the current prompt (with attachments if any) as the final message
      apiMessages.push({
        role: 'user',
        content: prompt
      });

      // 2. Format a single prompt containing history for single-prompt API endpoints (Vercel & default proxy)
      let promptWithHistory = prompt;
      if (session && session.messages && session.messages.length > 1) {
        let historyText = "Remember our previous conversation history:\n\n";
        // Get last 3 messages (excluding current one) — trim each to 120 chars to keep payload small
        const history = session.messages.slice(0, -1).slice(-3);
        history.forEach(m => {
          const truncatedContent = m.content.length > 120 ? m.content.substring(0, 120) + "..." : m.content;
          historyText += `${m.sender === 'user' ? 'User' : 'HackerGPT'}: ${truncatedContent}\n\n`;
        });
        historyText += `Current prompt:\n${prompt}`;
        promptWithHistory = historyText;
      }

      createMessageCard(displayPrompt, 'user');
      showLoadingIndicator();

      const selectedModel = modelSelect ? modelSelect.value : 'pollinations-large';
      const userApiKey = userApiKeyInput ? userApiKeyInput.value.trim() : '';

      const callBackendProxy = () => {
        fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: promptWithHistory,
            messages: apiMessages,
            apiKey: userApiKey,
            provider: selectedModel === 'groq-llama' ? 'groq' : 'default'
          })
        })
        .then(response => {
          if (!response.ok) {
            return response.json().then(errData => {
              throw new Error(errData.error || 'Server error');
            });
          }
          return response.json();
        })
        .then(data => {
          removeLoadingIndicator();
          const responseText = data.response || data.error || "No response generated.";
          createMessageCard(responseText, 'ai');
          addMessageToSession(activeSessionId, 'ai', responseText);
        })
        .catch(err => {
          removeLoadingIndicator();
          createMessageCard("Server Connection Error: " + err.message, 'ai');
        });
      };

      if (selectedModel === 'groq-llama' && userApiKey) {
        // Groq API (High Speed Llama-3 70B)
        fetch("https://api.groq.com/openai/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${userApiKey}`
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: apiMessages,
            temperature: 0.7,
            max_tokens: 4096
          })
        })
        .then(r => r.json())
        .then(data => {
          removeLoadingIndicator();
          const resp = data.choices && data.choices[0] ? data.choices[0].message.content : "No response";
          createMessageCard(resp, 'ai');
          addMessageToSession(activeSessionId, 'ai', resp);
        })
        .catch(err => {
          removeLoadingIndicator();
          createMessageCard("Groq API Error: " + err.message, 'ai');
        });
      } else if (selectedModel === 'openrouter-uncensored' && userApiKey) {
        // OpenRouter API
        fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${userApiKey}`
          },
          body: JSON.stringify({
            model: "nousresearch/hermes-3-llama-3.1-405b",
            messages: apiMessages
          })
        })
        .then(r => r.json())
        .then(data => {
          removeLoadingIndicator();
          const resp = data.choices && data.choices[0] ? data.choices[0].message.content : "No response";
          createMessageCard(resp, 'ai');
          addMessageToSession(activeSessionId, 'ai', resp);
        })
        .catch(err => {
          removeLoadingIndicator();
          createMessageCard("OpenRouter API Error: " + err.message, 'ai');
        });
      } else {
        // Call backend proxy directly to query our VIP Groq Engine!
        callBackendProxy();
      }
    }

    btnSend.addEventListener('click', sendMessage);
    promptInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });

    // Session & History Management
    function createNewSession(firstPrompt = 'New Session') {
      const newSession = {
        id: Date.now().toString(),
        title: firstPrompt.length > 28 ? firstPrompt.substring(0, 28) + '...' : firstPrompt,
        messages: []
      };
      sessions.unshift(newSession);
      activeSessionId = newSession.id;
      saveSessions();
      renderHistoryList();
    }

    function addMessageToSession(sessionId, sender, content) {
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        session.messages.push({ sender, content });
        saveSessions();
      }
    }

    function saveSessions() {
      localStorage.setItem('hackergpt_sessions', JSON.stringify(sessions));
    }

    function renderHistoryList(filter = '') {
      historyList.innerHTML = '';
      if (!Array.isArray(sessions)) {
        sessions = [];
      }
      
      const filtered = sessions.filter(s => {
        if (!s) return false;
        const title = s.title || 'New Session';
        return title.toLowerCase().includes(filter.toLowerCase());
      });

      filtered.forEach(session => {
        if (!session) return;
        const item = document.createElement('div');
        const isSel = session.id === activeSessionId;
        item.className = `history-item ${isSel ? 'active' : ''}`;
        
        const titleSpan = document.createElement('span');
        titleSpan.className = 'history-item-title';
        titleSpan.textContent = session.title || 'New Session';
        titleSpan.onclick = () => loadSession(session.id);

        const delBtn = document.createElement('button');
        delBtn.className = 'history-item-del';
        delBtn.innerHTML = '&times;';
        delBtn.onclick = (e) => {
          e.stopPropagation();
          deleteSession(session.id);
        };

        item.appendChild(titleSpan);
        item.appendChild(delBtn);
        historyList.appendChild(item);
      });
    }

    function loadSession(sessionId) {
      activeSessionId = sessionId;
      renderHistoryList();
      chatContainer.innerHTML = '';
      
      const session = sessions.find(s => s.id === sessionId);
      if (session && session.messages.length > 0) {
        if (welcomeHero) welcomeHero.style.display = 'none';
        session.messages.forEach(m => createMessageCard(m.content, m.sender));
      } else {
        if (welcomeHero) welcomeHero.style.display = 'block';
        chatContainer.appendChild(welcomeHero);
      }
      closeSidebarOnMobile();
    }

    function deleteSession(sessionId) {
      sessions = sessions.filter(s => s.id !== sessionId);
      saveSessions();
      if (activeSessionId === sessionId) {
        activeSessionId = null;
        chatContainer.innerHTML = '';
        if (welcomeHero) welcomeHero.style.display = 'block';
        chatContainer.appendChild(welcomeHero);
      }
      renderHistoryList();
      showToast('Session deleted');
    }

    btnNewChat.addEventListener('click', () => {
      activeSessionId = null;
      chatContainer.innerHTML = '';
      if (welcomeHero) welcomeHero.style.display = 'block';
      chatContainer.appendChild(welcomeHero);
      renderHistoryList();
      showToast('New session started');
      closeSidebarOnMobile();
    });

    searchHistory.addEventListener('input', (e) => {
      renderHistoryList(e.target.value);
    });

    btnClearAll.addEventListener('click', () => {
      if (confirm('Clear all chat history sessions?')) {
        sessions = [];
        activeSessionId = null;
        saveSessions();
        renderHistoryList();
        chatContainer.innerHTML = '';
        if (welcomeHero) welcomeHero.style.display = 'block';
        chatContainer.appendChild(welcomeHero);
        showToast('All history cleared');
      }
    });

    // Export Chat Functionality
    btnExportChat.addEventListener('click', () => {
      const session = sessions.find(s => s.id === activeSessionId);
      if (!session || session.messages.length === 0) {
        alert('No messages to export in current session.');
        return;
      }

      let markdown = `# HackerGPT Export - ${session.title}\n\n`;
      session.messages.forEach(m => {
        markdown += `### ${m.sender === 'user' ? 'User' : 'HackerGPT'}:\n${m.content}\n\n---\n\n`;
      });

      const blob = new Blob([markdown], { type: 'type/markdown' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hackergpt_session_${session.id}.md`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Chat exported as Markdown!');
    });

    // Settings Modal
    btnSettings.addEventListener('click', () => {
      settingsModal.classList.add('active');
    });

    window.closeSettings = function() {
      settingsModal.classList.remove('active');
    };

    window.saveSettings = function() {
      const key = userApiKeyInput ? userApiKeyInput.value.trim() : '';
      localStorage.setItem('hackergpt_api_key', key);
      settingsModal.classList.remove('active');
      showToast('API Key settings saved!');
      closeSidebarOnMobile();
    };

    window.exportBackup = function() {
      const dataStr = localStorage.getItem('hackergpt_sessions') || '[]';
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `hackergpt_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Backup exported successfully!');
    };

    window.triggerImportBackup = function() {
      document.getElementById('importBackupFile').click();
    };

    window.importBackup = function(event) {
      const file = event.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(e) {
        try {
          const imported = JSON.parse(e.target.result);
          if (Array.isArray(imported)) {
            const existing = JSON.parse(localStorage.getItem('hackergpt_sessions') || '[]');
            const existingIds = new Set(existing.map(s => s && s.id));
            const merged = [...existing];
            imported.forEach(s => {
              if (s && s.id && !existingIds.has(s.id)) {
                merged.push(s);
              }
            });
            merged.sort((a, b) => b.id.localeCompare(a.id));
            sessions = merged;
            saveSessions();
            renderHistoryList();
            showToast('Backup imported and merged successfully!');
            closeSettings();
          } else {
            alert('Invalid backup file structure!');
          }
        } catch (err) {
          alert('Failed to read backup file: ' + err.message);
        }
      };
      reader.readAsText(file);
      event.target.value = '';
    };

    // Initial Load
    renderHistoryList();
  })();