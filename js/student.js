/* =======================
   FIREBASE IMPORTS
======================= */
import { db } from "./firebase.js";
import {
  ref,
  get,
  set
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

/* =======================
   DOM ELEMENTS
======================= */
const classSelect = document.getElementById("classSelect");
const examSelect = document.getElementById("examSelect");
const subjectSelect = document.getElementById("subjectSelect");
const marksTable = document.getElementById("marksTable");
const saveBtn = document.getElementById("saveBtn");
const msg = document.getElementById("msg");

const addSubjectBtn = document.getElementById("addSubjectBtn");
const newSubjectNameInput = document.getElementById("newSubjectName");

/* =======================
   STATE
======================= */
let students = [];

/* =======================
   HELPERS
======================= */
function normalizeRoll(roll) {
  // converts: "s1", "01", "roll_10" → "1", "10"
  return String(roll).replace(/\D/g, "");
}

/* =======================
   EVENT LISTENERS
======================= */
classSelect?.addEventListener("change", onClassChange);
examSelect?.addEventListener("change", tryLoadMarks);
subjectSelect?.addEventListener("change", tryLoadMarks);
saveBtn?.addEventListener("click", saveMarks);
addSubjectBtn?.addEventListener("click", addSubject);

/* =======================
   CLASS CHANGE
======================= */
async function onClassChange() {
  const cls = classSelect.value;
  resetUI();
  if (!cls) return;

  await loadStudents(cls);
  await loadSubjects(cls);
  renderTable(); // empty marks initially
}

/* =======================
   LOAD STUDENTS
======================= */
async function loadStudents(cls) {
  students = [];

  const snap = await get(ref(db, `students/${cls}`));
  if (!snap.exists()) return;

  snap.forEach(s => {
    students.push({
      roll: s.key,
      name: s.val().name
    });
  });

  // BULLETPROOF NUMERIC SORT
  students.sort((a, b) => {
    const ra = parseInt(normalizeRoll(a.roll), 10);
    const rb = parseInt(normalizeRoll(b.roll), 10);
    return ra - rb;
  });
}

/* =======================
   LOAD SUBJECTS
======================= */
async function loadSubjects(cls) {
  if (!subjectSelect) return;

  subjectSelect.innerHTML = `<option value="">Select Subject</option>`;

  const snap = await get(ref(db, `subjects/${cls}`));
  if (!snap.exists()) return;

  snap.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s.key;
    opt.textContent = s.val();
    subjectSelect.appendChild(opt);
  });
}

/* =======================
   ADD SUBJECT
======================= */
async function addSubject() {
  const cls = classSelect.value;
  const subjectName = newSubjectNameInput.value.trim();

  if (!cls) return alert("Select class first");
  if (!subjectName) return alert("Enter subject name");

  const key = subjectName.toLowerCase().replace(/\s+/g, "");
  const path = `subjects/${cls}/${key}`;

  const snap = await get(ref(db, path));
  if (snap.exists()) return alert("Subject already exists");

  await set(ref(db, path), subjectName);
  newSubjectNameInput.value = "";

  await loadSubjects(cls);
  msg.textContent = `✅ Subject "${subjectName}" added`;
}

/* =======================
   RENDER MARK ENTRY TABLE
======================= */
function renderTable(existingMarks = {}) {
  if (!marksTable) return;
  marksTable.innerHTML = "";

  // Normalize marks keys ONCE
  const normalizedMarks = {};
  for (const key in existingMarks) {
    normalizedMarks[normalizeRoll(key)] = existingMarks[key];
  }

  students.forEach((stu, index) => {
    const rollNum = normalizeRoll(stu.roll);

    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>${stu.name}</td>
      <td>
        <input type="number"
               data-roll="${stu.roll}"
               value="${normalizedMarks[rollNum] ?? ""}">
      </td>
    `;

    marksTable.appendChild(tr);
  });
}

/* =======================
   LOAD MARKS
======================= */
async function tryLoadMarks() {
  const cls = classSelect.value;
  const exam = examSelect.value;
  const subject = subjectSelect.value;

  if (!cls || !exam || !subject || students.length === 0) return;

  const snap = await get(ref(db, `marks/${cls}/${exam}/${subject}`));
  const data = snap.exists() ? snap.val() : {};

  renderTable(data);
}

/* =======================
   SAVE MARKS
======================= */
async function saveMarks() {
  const cls = classSelect.value;
  const exam = examSelect.value;
  const subject = subjectSelect.value;

  if (!cls || !exam || !subject) {
    msg.textContent = "❌ Select class, exam, subject";
    return;
  }

  const inputs = marksTable.querySelectorAll("input");
  const data = {};

  inputs.forEach(input => {
    if (input.value !== "") {
      data[input.dataset.roll] = Number(input.value);
    }
  });

  if (Object.keys(data).length === 0) {
    msg.textContent = "❌ No marks entered";
    return;
  }

  await set(ref(db, `marks/${cls}/${exam}/${subject}`), data);
  msg.textContent = "✅ Marks saved";
}

/* =======================
   RESET UI
======================= */
function resetUI() {
  students = [];
  marksTable.innerHTML = "";
  subjectSelect.innerHTML = `<option value="">Select Subject</option>`;
  msg.textContent = "";
}
