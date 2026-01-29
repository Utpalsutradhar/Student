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
   DOM ELEMENTS (SAFE)
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
   EVENT LISTENERS (GUARDED)
======================= */
if (classSelect) classSelect.addEventListener("change", onClassChange);
if (examSelect) examSelect.addEventListener("change", tryLoadMarks);
if (subjectSelect) subjectSelect.addEventListener("change", tryLoadMarks);
if (saveBtn) saveBtn.addEventListener("click", saveMarks);
if (addSubjectBtn) addSubjectBtn.addEventListener("click", addSubject);

/* =======================
   CLASS CHANGE
======================= */
async function onClassChange() {
  const cls = classSelect.value;
  resetUI();
  if (!cls) return;

  await loadStudents(cls);
  await loadSubjects(cls);
  renderTable();
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

  students.sort((a, b) => Number(a.roll) - Number(b.roll));
}

/* =======================
   LOAD SUBJECTS
======================= */
async function loadSubjects(cls) {
  if (!subjectSelect) return;

  subjectSelect.innerHTML = `<option value="">Select Subject</option>`;
  const snap = await get(ref(db, `subjects/${cls}`));
  if (!snap.exists()) see;

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
  if (!classSelect || !newSubjectNameInput) return;

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

  if (msg) msg.textContent = `✅ Subject "${subjectName}" added`;
}

/* =======================
   RENDER MARKS TABLE
======================= */
function renderTable(existingMarks = {}) {
  if (!marksTable) return;
  marksTable.innerHTML = "";

  students.forEach((stu, i) => {
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${i + 1}</td>
      <td>${stu.name}</td>
      <td>
        <input type="number"
               data-roll="${stu.roll}"
               value="${existingMarks[stu.roll] ?? ""}">
      </td>
    `;
    marksTable.appendChild(tr);
  });
}

/* =======================
   LOAD MARKS
======================= */
async function tryLoadMarks() {
  if (!classSelect || !examSelect || !subjectSelect) return;

  const cls = classSelect.value;
  const exam = examSelect.value;
  const subject = subjectSelect.value;

  if (!cls || !exam || !subject || students.length === 0) return;

  const snap = await get(ref(db, `marks/${cls}/${exam}/${subject}`));
  renderTable(snap.exists() ? snap.val() : {});
}

/* =======================
   SAVE MARKS
======================= */
async function saveMarks() {
  if (!classSelect || !examSelect || !subjectSelect || !marksTable) return;

  const cls = classSelect.value;
  const exam = examSelect.value;
  const subject = subjectSelect.value;

  if (!cls || !exam || !subject) {
    if (msg) msg.textContent = "❌ Select class, exam, subject";
    return;
  }

  const inputs = marksTable.querySelectorAll("input");
  const data = {};

  inputs.forEach(i => {
    if (i.value !== "") data[i.dataset.roll] = Number(i.value);
  });

  if (Object.keys(data).length === 0) {
    if (msg) msg.textContent = "❌ No marks entered";
    return;
  }

  await set(ref(db, `marks/${cls}/${exam}/${subject}`), data);
  if (msg) msg.textContent = "✅ Marks saved";
}

/* =======================
   RESET UI
======================= */
function resetUI() {
  students = [];
  if (marksTable) marksTable.innerHTML = "";
  if (subjectSelect)
    subjectSelect.innerHTML = `<option value="">Select Subject</option>`;
  if (msg) msg.textContent = "";
}
