const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

console.log("=== OBFUSCATING HACKERGPT CLIENT SIDE CODE ===");

const obfuscationOptions = {
  compact: true,
  controlFlowFlattening: true,
  controlFlowFlatteningThreshold: 0.75,
  deadCodeInjection: true,
  deadCodeInjectionThreshold: 0.4,
  debugProtection: true,
  debugProtectionInterval: 2000,
  disableConsoleOutput: false,
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: true,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 8,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64', 'rc4'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersType: 'variable',
  stringArrayThreshold: 0.8,
  transformObjectKeys: true,
  unicodeEscapeSequence: true
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
