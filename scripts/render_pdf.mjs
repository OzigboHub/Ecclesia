import { chromium } from "@playwright/test";
import fs from "fs";
import path from "path";

async function main() {
  const htmlPath = path.resolve("docs/features_doc.html");
  const pdfDocsPath = path.resolve("docs/Ecclesia_Features_and_Test_Cases.pdf");
  const pdfPublicPath = path.resolve("public/Ecclesia_Features_and_Test_Cases.pdf");

  console.log("Launching headless browser to render PDF...");
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const fileUrl = "file:///" + htmlPath.replace(/\\/g, "/");
  console.log("Navigating to: " + fileUrl);
  await page.goto(fileUrl, { waitUntil: "networkidle" });

  await page.pdf({
    path: pdfDocsPath,
    format: "A4",
    printBackground: true,
    margin: {
      top: "14mm",
      right: "12mm",
      bottom: "14mm",
      left: "12mm"
    }
  });

  // Also copy to public directory for immediate direct HTTP serving / download
  if (!fs.existsSync("public")) {
    fs.mkdirSync("public", { recursive: true });
  }
  fs.copyFileSync(pdfDocsPath, pdfPublicPath);

  await browser.close();
  console.log("SUCCESS: Generated PDF at:");
  console.log("1. " + pdfDocsPath);
  console.log("2. " + pdfPublicPath);
}

main().catch(err => {
  console.error("Render error:", err);
  process.exit(1);
});
