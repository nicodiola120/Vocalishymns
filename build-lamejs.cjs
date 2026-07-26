// Builds lamejs into a single browser-safe IIFE
// lamejs uses bare globals across files, so all code must be in one scope
const fs = require("fs");
const path = require("path");

const srcDir = path.join(__dirname, "node_modules/lamejs/src/js");
const loaded = new Set();
const fileOrder = [];

function collectFiles(file) {
  if (loaded.has(file)) return;
  loaded.add(file);
  const code = fs.readFileSync(path.join(srcDir, file), "utf8");
  const reqRegex = /require\(['"]\.\/([^'"]+)['"]\);?/g;
  let m;
  while ((m = reqRegex.exec(code)) !== null) {
    collectFiles(m[1]);
  }
  fileOrder.push(file);
}

collectFiles("index.js");

// Read all source code
const sources = {};
for (const file of fileOrder) {
  sources[file] = fs.readFileSync(path.join(srcDir, file), "utf8");
}

// Read the banner (defines bare globals like MPEGMode that some files expect)
const banner = fs.readFileSync(path.join(__dirname, "public/banner.js"), "utf8");

// Build the output
let output = `(function() {
var _modules = {};
function _require(name) {
  if (_modules[name]) return _modules[name].exports;
  var m = _modules[name] = { exports: {} };
  _loaders[name](m, m.exports);
  return m.exports;
}
var _loaders = {};
// Bare globals expected by Lame.js, Encoder.js, PsyModel.js etc.
${banner}
`;

for (const file of fileOrder) {
  let code = sources[file];
  // Replace require() calls with _require()
  code = code.replace(/require\(['"]\.\/([^'"]+)['"]\)/g, "_require('$1')");
  // Remove module.exports lines — we'll handle them via the m.exports pattern
  // Actually keep module.exports but wrap the factory

  output += `_loaders[${JSON.stringify(file)}]=function(m,exports){\n${code}\n};\n`;
}

output += `var _exports = _require("index.js");
window.lamejs = _exports || {};
})();`;

fs.writeFileSync(path.join(__dirname, "public/lamejs.bundle.js"), output);
console.log("Built lamejs bundle:", (output.length / 1024).toFixed(0), "KB");
