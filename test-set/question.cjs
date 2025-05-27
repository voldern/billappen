import { stripHtml } from "string-strip-html";
import fs from "fs";

const questions = JSON.parse(fs.readFileSync("./questions.json", "utf8"));

const qs = questions.questions
  .filter((q) => q.image === null)
  .map((q) => ({
    question: q.question,
    answers: q.answers.map((a) => a.answer),
    correct_answer: q.correct_answer - 1,
    explanation: stripHtml(q.explanation),
  }));

console.log(qs);
