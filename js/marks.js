import { db } from "./firebase.js";
import {
  ref,
  get,
  child,
  update
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

/* =========================
   DOM ELEMENTS
========================= */
const classSelect   = document.getElementById("classSelect");
const examSelect    = document.getElementById("examSelect");
const subjectSelect = document.getElementById("subjectSelect");
const marksTable    = document.getElementById("marksTable");
const saveBtn       = document.getElementById("saveBtn");
const msg           = document.getElementById("msg");

let maxMarks = 0;

/* =========================
   EXAM CHANGE → SET MAX
========================= */
examSelect.addEventListener("change", () => {
  const opt = examSelect.options[examSelect.selectedIndex];
  maxMarks = Number(opt?.dataset?.max || 0);
});

/* =========================
   CLASS CHANGE → LOAD STUDENTS
========================= */
classSelect.addEventListener("change", loadStudents);

async function loadStudents() {
  const cls = classSelect.value;
  marksTable.innerHTML = "";

  if (!cls) return;

  try {
    const snapshot = await get(child(ref(db), "students/" + cls));

    if (!snapshot.exists()) {
      marksTable.innerHTML =
        "<tr><td colspan='3'>No students found</td></tr>";
      return;
    }

    // Convert snapshot to array
    const students = [];
    snapshot.forEach(snap => {
      students.push({
        id: snap.key,
        ...snap.val()
      });
    });

    // Sort by roll number
    students.sort((a, b) => a.roll - b.roll);

    // Render table
    students.forEach((stu, index) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${index + 1}</td>
        <td>${stu.roll}. ${stu.name}</td>
        <td>
          <input type="number"
                 min="0"
                 max="${maxMarks}"
                 data-id="${stu.id}">
        </td>
      `;
      marksTable.appendChild(row);
    });

  } catch (err) {
    console.error("Failed to load students:", err);
    marksTable.innerHTML =
      "<tr><td colspan='3'>Error loading students</td></tr>";
  }
}

/* =========================
   SAVE MARKS
========================= */
saveBtn.addEventListener("click", saveMarks);

async function saveMarks() {
  const cls     = classSelect.value;
  const exam    = examSelect.value;
  const subject = subjectSelect.value;

  if (!cls || !exam || !subject) {
    msg.textContent = "Select class, exam and subject";
    msg.style.color = "red";
    return;
  }

  if (!maxMarks) {
    msg.textContent = "Select exam first";
    msg.style.color = "red";
    return;
  }

  const inputs = marksTable.querySelectorAll("input");
  const updates = {};

  inputs.forEach(input => {
    const marks = Number(input.value);
    const studentId = input.dataset.id;

    if (Number.isNaN(marks)) return;

    if (marks < 0 || marks > maxMarks) {
      msg.textContent = `Marks must be between 0 and ${maxMarks}`;
      msg.style.color = "red";
      return;
    }

    updates[
      `marks/${cls}/${studentId}/${subject}/${exam}`
    ] = marks;
  });

  try {
    await update(ref(db), updates);
    msg.textContent = "Marks saved successfully";
    msg.style.color = "green";
  } catch (err) {
    console.error("Save failed:", err);
    msg.textContent = "Error saving marks";
    msg.style.color = "red";
  }
}
