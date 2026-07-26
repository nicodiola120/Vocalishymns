// Find lamejs files that use variables without importing them
const fs = require("fs");
const path = require("path");

const dir = path.join(__dirname, "node_modules/lamejs/src/js");
const files = fs.readdirSync(dir).filter(f => f.endsWith(".js") && f !== "Tests.js");

// For each file, find what it uses and what it requires
for (const f of files) {
  const code = fs.readFileSync(path.join(dir, f), "utf8");
  const required = new Set();
  const reqRegex = /var\s+\w+\s*=\s*require\(['"]\.\/([^'"]+)['"]\);/g;
  let m;
  while ((m = reqRegex.exec(code)) !== null) {
    required.add(m[1]);
  }

  // Find bare references to known module names that aren't required
  const knownModules = ["MPEGMode", "common"];
  const bare = [];
  for (const mod of knownModules) {
    if (!required.has(mod + ".js") && code.includes(mod)) {
      bare.push(mod);
    }
  }
  if (bare.length > 0) {
    console.log(f + " missing requires for: " + bare.join(", "));
  }
}
