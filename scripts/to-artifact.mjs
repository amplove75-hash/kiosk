// dist-single/index.html(완성 문서) → 미리보기 링크용 조각(HTML 본문만)으로 변환
import fs from "node:fs";
const html = fs.readFileSync("dist-single/index.html", "utf8");
const head = html.match(/<head>([\s\S]*?)<\/head>/)[1];
const body = html.match(/<body>([\s\S]*?)<\/body>/)[1];
const keep = [
  ...head.matchAll(/<title>[\s\S]*?<\/title>|<link[^>]*fonts[^>]*>|<style[\s\S]*?<\/style>|<script[\s\S]*?<\/script>/g),
].map((m) => m[0]);
// title을 맨 앞으로
keep.sort((a, b) => (a.startsWith("<title") ? -1 : b.startsWith("<title") ? 1 : 0));
fs.mkdirSync("artifact", { recursive: true });
fs.writeFileSync("artifact/kiosk-practice.html", keep.join("\n") + "\n" + body.trim() + "\n");
console.log("artifact/kiosk-practice.html", fs.statSync("artifact/kiosk-practice.html").size, "bytes");
