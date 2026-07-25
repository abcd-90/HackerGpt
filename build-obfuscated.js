const fs = require('fs');
const path = require('path');
const JavaScriptObfuscator = require('javascript-obfuscator');

console.log("=== OBFUSCATING HACKERGPT CLIENT SIDE CODE ===");

function obfuscateHtmlFile(htmlFilePath, outputJsPath, jsRefName) {
  if (!fs.existsSync(htmlFilePath)) {
    console.warn(`Warning: File not found ${htmlFilePath}`);
    return;
  }

  let htmlContent = fs.readFileSync(htmlFilePath, 'utf8');

  // Find all inline script tags that don't have src=
  const scriptRegex = /<script\b(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;
  
  let match;
  let lastMatch = null;
  
  while ((match = scriptRegex.exec(htmlContent)) !== null) {
    if (match[1].trim().length > 100) { // Main application script is large
      lastMatch = match;
    }
  }

  if (!lastMatch) {
    console.warn(`Warning: Could not locate main inline script in ${htmlFilePath}`);
    return;
  }

  const fullMatchStr = lastMatch[0];
  const rawJsCode = lastMatch[1].trim();
  const matchIndex = lastMatch.index;

  console.log(`[${path.basename(htmlFilePath)}] Extracted ${rawJsCode.length} characters of JS.`);

  const obfuscationResult = JavaScriptObfuscator.obfuscate(rawJsCode, {
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
  });

  const obfuscatedCode = obfuscationResult.getObfuscatedCode();
  fs.writeFileSync(outputJsPath, obfuscatedCode, 'utf8');

  const updatedHtml = htmlContent.substring(0, matchIndex) + 
    `<script src="${jsRefName}"></script>` + 
    htmlContent.substring(matchIndex + fullMatchStr.length);

  fs.writeFileSync(htmlFilePath, updatedHtml, 'utf8');
  console.log(`[${path.basename(htmlFilePath)}] Obfuscated code saved to ${jsRefName} (${obfuscatedCode.length} bytes).`);
}

// 1. Obfuscate index.html -> app.min.js
obfuscateHtmlFile(
  path.join(__dirname, 'hackerGPT', 'index.html'),
  path.join(__dirname, 'hackerGPT', 'app.min.js'),
  'app.min.js'
);

// 2. Obfuscate lws-control-hub.html -> hub.min.js
obfuscateHtmlFile(
  path.join(__dirname, 'hackerGPT', 'lws-control-hub.html'),
  path.join(__dirname, 'hackerGPT', 'hub.min.js'),
  'hub.min.js'
);

console.log("\n=== SUCCESS: All client JS encrypted & obfuscated ===");
