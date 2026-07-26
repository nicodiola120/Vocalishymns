// Find ALL files that reference module names without requiring them
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "node_modules/lamejs/src/js");
const files = fs.readdirSync(dir).filter(f => f.endsWith(".js") && f !== "Tests.js");

// Build a map of all module names (files without .js)
const moduleNames = files.map(f => f.replace(".js", ""));

for (const f of files) {
  const code = fs.readFileSync(path.join(dir, f), "utf8");
  
  // Find what this file requires
  const required = new Set();
  const reqRegex = /require\(['"]\.\/([^'"]+)['"]\)/g;
  let m;
  while ((m = reqRegex.exec(code)) !== null) {
    required.add(m[1].replace(".js", ""));
  }

  // Also find destructured imports from common.js
  // e.g., var VbrMode = common.VbrMode;
  // These are fine because 'common' is required

  // Check for bare references to other module names
  const bare = [];
  for (const name of moduleNames) {
    if (name === f.replace(".js", "")) continue; // skip self
    if (required.has(name)) continue; // already required
    // Check for bare usage (not as part of require statement)
    const regex = new RegExp("\\b" + name + "\\b", "g");
    const matches = code.match(regex);
    if (matches) {
      bare.push(name + " (" + matches.length + " refs)");
    }
  }
  if (bare.length > 0) {
    console.log(f + " missing requires: " + bare.join(", "));
  }
}
