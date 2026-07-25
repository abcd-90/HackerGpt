const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

console.log("=== OBFUSCATING HACKERGPT CLIENT SIDE CODE ===");

const obfuscationOptions = {
  compact: true,
  controlFlowFlattening: false,
  deadCodeInjection: false,
  debugProtection: false,
  debugProtectionInterval: 0,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'mangled',
  log: false,
  numbersToExpressions: false,
  renameGlobals: false,
  selfDefending: false,
  simplify: true,
  splitStrings: false,
  stringArray: true,
  stringArrayCallsTransform: false,
  stringArrayThreshold: 0.5,
  transformObjectKeys: false,
  unicodeEscapeSequence: false
};

// 1. Obfuscate src/app.js -> hackerGPT/app.min.js
const srcAppJsPath = path.join(__dirname, 'src', 'app.js');
const targetAppMinJsPath = path.join(__dirname, 'hackerGPT', 'app.min.js');
const indexHtmlPath = path.join(__dirname, 'hackerGPT', 'index.html');

if (fs.existsSync(srcAppJsPath)) {
  const rawJsCode = fs.readFileSync(srcAppJsPath, 'utf8');
  console.log(`[src/app.js] Obfuscating ${rawJsCode.length} characters of JavaScript code...`);

  const result = JavaScriptObfuscator.obfuscate(rawJsCode, obfuscationOptions);
  const obfuscatedCode = result.getObfuscatedCode();

  fs.writeFileSync(targetAppMinJsPath, obfuscatedCode, 'utf8');
  console.log(`[src/app.js] Obfuscated code saved to hackerGPT/app.min.js (${obfuscatedCode.length} bytes).`);
}

// Ensure index.html references app.min.js
if (fs.existsSync(indexHtmlPath)) {
  let htmlContent = fs.readFileSync(indexHtmlPath, 'utf8');
  if (!htmlContent.includes('src="app.min.js"')) {
    // If there's an inline script at the end, replace it
    const scriptRegex = /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
    let lastMatch = null;
    let match;
    while ((match = scriptRegex.exec(htmlContent)) !== null) {
      if (match[1].trim().length > 100) {
        lastMatch = match;
      }
    }
    if (lastMatch) {
      htmlContent = htmlContent.substring(0, lastMatch.index) + 
        '<script src="app.min.js"></script>' + 
        htmlContent.substring(lastMatch.index + lastMatch[0].length);
      fs.writeFileSync(indexHtmlPath, htmlContent, 'utf8');
      console.log("[index.html] Updated to reference app.min.js!");
    }
  }
}

// 2. Process lws-control-hub.html if needed
const hubHtmlPath = path.join(__dirname, 'hackerGPT', 'lws-control-hub.html');
const targetHubMinJsPath = path.join(__dirname, 'hackerGPT', 'hub.min.js');

if (fs.existsSync(hubHtmlPath)) {
  let hubContent = fs.readFileSync(hubHtmlPath, 'utf8');
  const scriptRegex = /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  let lastMatch = null;
  let match;
  while ((match = scriptRegex.exec(hubContent)) !== null) {
    if (match[1].trim().length > 100) {
      lastMatch = match;
    }
  }
  if (lastMatch) {
    const rawJs = lastMatch[1].trim();
    console.log(`[lws-control-hub.html] Obfuscating ${rawJs.length} characters of JS...`);
    const result = JavaScriptObfuscator.obfuscate(rawJs, obfuscationOptions);
    const obf = result.getObfuscatedCode();
    fs.writeFileSync(targetHubMinJsPath, obf, 'utf8');
    hubContent = hubContent.substring(0, lastMatch.index) + 
      '<script src="hub.min.js"></script>' + 
      hubContent.substring(lastMatch.index + lastMatch[0].length);
    fs.writeFileSync(hubHtmlPath, hubContent, 'utf8');
    console.log(`[lws-control-hub.html] Obfuscated code saved to hub.min.js (${obf.length} bytes).`);
  }
}

console.log("\n=== SUCCESS: All client JS encrypted & obfuscated ===");
