import fs from "node:fs";
import path from "node:path";

const emojiDir = "node_modules/@twemoji/svg";
const outFile = "src/emoji-data.json";

const files = fs.readdirSync(emojiDir).filter((f) => f.endsWith(".svg"));
const data: Record<string, string> = {};

for (const file of files) {
  const code = file.replace(".svg", "");
  const svg = fs.readFileSync(path.join(emojiDir, file), "utf8");
  data[code] = Buffer.from(svg).toString("base64");
}

fs.writeFileSync(outFile, JSON.stringify(data, null, 2));
