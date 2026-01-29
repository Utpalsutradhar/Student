import { ref, get, set } 
from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { db } from "./firebase.js";

const classSelect   = document.getElementById("classSelect");
const studentSelect = document.getElementById("studentSelect");
const msg           = document.getElementById("msg");

/* =========================
   CO-SCHOLASTIC FIELDS
   ========================= */
const gradeFields = [
  "confidence",
  "uniform",
  "discipline",
  "spoken_english",
  "punctuality",
  "supw"
];

/* =========================
   ATTENDANCE FIELDS
   ========================= */
const attendanceFields = [
  "sem1_working",
  "sem1_present",
  "sem2_working",
  "sem2_present"
];

/* =========================
   POPULATE GRADE DROPDOWNS
   ========================= */
gradeFields.forEach(id => {
  const sel = document.getElementById(id);
  sel.innerHTML = `
    <option value="">–</option>
    <option value="A">A</option>
    <option value="B">B</option>
    <option value="C">C</option>
    <option value="D">D</option>
  `;
});

/* =========================
   LOAD STUDENTS
   ========================= */
classSelect.addEventListener("change", async () => {
  const cls = classSelect.value;
  studentSelect.innerHTML = `<option value="">Select Student</option>`;
  studentSelect.disabled = true;

  if (!cls) return;

  const snap = await get(ref(db, `students/${cls}`));
  if (!snap.exists()) return;

  Object.entries(snap.val())
    .sort((a, b) => a[1].roll - b[1].roll)
    .forEach(([key, stu]) => {
      const opt = document.createElement("option");
      opt.value = key; // roll_12
      opt.textContent = `Roll ${String(stu.roll).padStart(2,"0")} – ${stu.name}`;
      studentSelect.appendChild(opt);
    });

  studentSelect.disabled = false;
});

/* =========================
   LOAD EXISTING DATA
   ========================= */
studentSelect.addEventListener("change", async () => {

  // reset UI
  gradeFields.forEach(id => document.getElementById(id).value = "");
  attendanceFields.forEach(id => document.getElementById(id).value = "");

  const cls = classSelect.value;
  const rollKey = studentSelect.value;
  if (!cls || !rollKey) return;

  // ---------- FIND STUDENT INDEX ----------
  const stuSnap = await get(ref(db, `students/${cls}`));
  if (!stuSnap.exists()) return;

  const orderedStudents = Object.entries(stuSnap.val())
    .sort((a, b) => a[1].roll - b[1].roll);

  const studentIndex = orderedStudents.findIndex(
    ([key]) => key === rollKey
  );

  if (studentIndex === -1) return;

  // ---------- LOAD CO-SCHOLASTIC ----------
  const csSnap = await get(ref(db, `co_scholastic/${cls}/${studentIndex}`));
  if (csSnap.exists()) {
    const data = csSnap.val();
    gradeFields.forEach(id => {
      if (data[id]) document.getElementById(id).value = data[id];
    });
  }

  // ---------- LOAD ATTENDANCE ----------
  const attSnap = await get(ref(db, `attendance/${cls}/${studentIndex}`));
  if (attSnap.exists()) {
    const a = attSnap.val();
    attendanceFields.forEach(id => {
      if (a[id] !== undefined) {
        document.getElementById(id).value = a[id];
      }
    });
  }
});

/* =========================
   SAVE CO-SCHOLASTIC + ATTENDANCE
   ========================= */
window.saveCoScholastic = async function () {
  const cls = classSelect.value;
  const rollKey = studentSelect.value;

  if (!cls || !rollKey) {
    msg.textContent = "Select class and student";
    msg.style.color = "red";
    return;
  }

  // ---------- FIND STUDENT INDEX ----------
  const stuSnap = await get(ref(db, `students/${cls}`));
  if (!stuSnap.exists()) return;

  const orderedStudents = Object.entries(stuSnap.val())
    .sort((a, b) => a[1].roll - b[1].roll);

  const studentIndex = orderedStudents.findIndex(
    ([key]) => key === rollKey
  );

  if (studentIndex === -1) {
    msg.textContent = "Student index error";
    msg.style.color = "red";
    return;
  }

  // ---------- BUILD PAYLOADS ----------
  const csPayload = {};
  gradeFields.forEach(id => {
    csPayload[id] = document.getElementById(id).value || "";
  });

  const attPayload = {};
  attendanceFields.forEach(id => {
    attPayload[id] = document.getElementById(id).value || "";
  });

  // ---------- SAVE (AUTO-CREATE) ----------
  await set(ref(db, `co_scholastic/${cls}/${studentIndex}`), csPayload);
  await set(ref(db, `attendance/${cls}/${studentIndex}`), attPayload);

  msg.textContent = "Co-Scholastic & Attendance saved successfully";
  msg.style.color = "green";
};
