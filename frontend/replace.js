const fs = require("fs");
const path = require("path");

// Folder to scan
const FRONTEND_DIR = path.join(__dirname, "app"); // adjust if your folder is "src"

// Mapping of replacements
const replacements = [
  { search: /HospiNav Pro/g, replace: "Vazhikatti" },
  { search: /HN/g, replace: "VZ" },
  { search: /https:\/\/hospinav\.pro/g, replace: "https://vazhikatti.pro" },
  // Add dynamic QR URL patterns if any
  { search: /hospinav\.pro\/nav/g, replace: "vazhikatti.pro/nav" }
];

// Recursively get all .tsx files
function getAllTSXFiles(dir) {
  let results = [];
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(getAllTSXFiles(filePath));
    } else if (filePath.endsWith(".tsx")) {
      results.push(filePath);
    }
  });
  return results;
}

// Replace content in files
function replaceInFiles(files) {
  files.forEach(file => {
    let content = fs.readFileSync(file, "utf8");
    replacements.forEach(r => {
      content = content.replace(r.search, r.replace);
    });
    fs.writeFileSync(file, content, "utf8");
    console.log(`Updated: ${file}`);
  });
}

const tsxFiles = getAllTSXFiles(FRONTEND_DIR);
replaceInFiles(tsxFiles);

console.log("\n✅ All frontend files updated!");

