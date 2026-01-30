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
const classSelect   = document.getElementById("classSelect");
const examSelect    = document.getElementById("examSelect");
const subjectSelect = document.getElementById("subjectSelect");
const marksTable    = document.getElementById("marksTable");
const saveBtn       = document.getElementById("saveBtn");
const msg           = document.getElementById("msg");

const addSubjectBtn        = document.getElementById("addSubjectBtn");
const newSubjectNameInput  = document.getElementById("newSubjectName");

/* =======================
   STATE
======================= */
let students = []; // ORDER DEFINES INDEX (LOCKED)

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
  renderTable(); // empty initially
}

/* =======================
   LOAD STUDENTS (INDEX LOCK)
======================= */
async function loadStudents(cls) {
  students = [];
  marksTable.innerHTML = "";

  const snap = await get(ref(db, `students/${cls}`));
  if (!snap.exists()) return;

  students = Object.entries(snap.val())
    .sort((a,b)=>Number(a[1].roll)-Number(b[1].roll))
    .map(([k,s],i)=>({
      index: i,      // 🔒 SINGLE SOURCE OF TRUTH
      roll : s.roll,
      name : s.name
    }));
}

/* =======================
   LOAD SUBJECTS
======================= */
async function loadSubjects(cls) {
  subjectSelect.innerHTML = `<option value="">Select Subject</option>`;

  const snap = await get(ref(db, `subjects/${cls}`));
  if (!snap.exists()) return;

  Object.entries(snap.val()).forEach(([k,v])=>{
    const opt = document.createElement("option");
    opt.value = k;       // lowercase key
    opt.textContent = v; // display name
    subjectSelect.appendChild(opt);
  });
}

/* =======================
   ADD SUBJECT (UNCHANGED)
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
   RENDER TABLE (INDEX BASED)
======================= */
function renderTable(existingMarks = {}) {
  marksTable.innerHTML = "";

  students.forEach(stu=>{
    const tr = document.createElement("tr");
    tr.innerHTML = `
      <td>${stu.index + 1}</td>
      <td>${stu.name}</td>
      <td>
        <input type="number"
               min="0"
               data-index="${stu.index}"
               value="${existingMarks[stu.index] ?? ""}">
      </td>
    `;
    marksTable.appendChild(tr);
  });
}

/* =======================
   LOAD MARKS (INDEX BASED)
======================= */
async function tryLoadMarks() {
  const cls     = classSelect.value;
  const exam    = examSelect.value;
  const subject = subjectSelect.value;

  if (!cls || !exam || !subject || students.length === 0) return;

  const snap = await get(ref(db, `marks/${cls}/${exam}/${subject}`));
  const data = snap.exists() ? snap.val() : {};

  renderTable(data);
}

/* =======================
   SAVE MARKS (FINAL FIX)
======================= */
async function saveMarks() {
  const cls     = classSelect.value;
  const exam    = examSelect.value;
  const subject = subjectSelect.value;

  if (!cls || !exam || !subject) {
    msg.textContent = "❌ Select class, exam and subject";
    return;
  }

  const inputs = marksTable.querySelectorAll("input");
  const data = {};

  inputs.forEach(inp=>{
    const idx = inp.dataset.index;
    if (inp.value !== "") {
      data[idx] = Number(inp.value); // 🔒 INDEX BASED
    }
  });

  if (Object.keys(data).length === 0) {
    msg.textContent = "❌ No marks entered";
    return;
  }

  await set(ref(db, `marks/${cls}/${exam}/${subject}`), data);
  msg.textContent = "✅ Marks saved successfully";
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
