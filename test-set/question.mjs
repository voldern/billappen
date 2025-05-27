import { stripHtml } from "string-strip-html";
import fs from "fs";

function cleanExplanation(htmlText) {
  if (!htmlText) return "";

  // First, extract text from span elements with class "sm2-sound-text notranslate"
  const spanRegex = /<span class="sm2-sound-text notranslate">(.*?)<\/span>/g;
  const spanMatches = [];
  let match;

  while ((match = spanRegex.exec(htmlText)) !== null) {
    spanMatches.push(match[1].trim());
  }

  // If we found span content, use that as it's the clean text
  if (spanMatches.length > 0) {
    return spanMatches.join("\n\n");
  }

  // Fallback: clean up the HTML more carefully
  let cleaned = htmlText;

  // Replace paragraph tags with double newlines
  cleaned = cleaned.replace(/<\/p>\s*<p[^>]*>/g, "\n\n");
  cleaned = cleaned.replace(/<p[^>]*>/g, "");
  cleaned = cleaned.replace(/<\/p>/g, "");

  // Remove all other HTML tags
  cleaned = stripHtml(cleaned).result;

  // Clean up extra whitespace and normalize line breaks
  cleaned = cleaned.replace(/\s+/g, " ").trim();
  cleaned = cleaned.replace(/\n\s*\n/g, "\n\n");

  return cleaned;
}

const questions = JSON.parse(fs.readFileSync("./questions.json", "utf8"));

const qs = questions.questions
  .filter((q) => q.image === null)
  .map((q) => ({
    question: q.question,
    answers: q.answers.map((a) => a.answer),
    correct_answer: q.correct_answer - 1,
    explanation: cleanExplanation(q.explanation),
  }));

console.log("<examples>");
qs.forEach((q) =>
  console.log(
    `<example>
  ${JSON.stringify(q, "", 2)}
</example>`
  )
);
console.log("</examples>");
