import { db } from "./firebase.js";
import {
  ref,
  get,
  update,
  remove
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const classSelect = document.getElementById("viewClass");
const studentList = document.getElementById("studentList");

classSelect.addEventListener("change", loadStudents);

async function loadStudents() {
  const cls = classSelect.value;

  // HARD RESET tbody (critical)
  studentList.innerHTML = "";

  if (!cls) {
    addMessageRow("Select a class to view students");
    return;
  }

  try {
    const snapshot = await get(ref(db, `students/${cls}`));

    if (!snapshot.exists()) {
      addMessageRow("No students found");
      return;
    }

    const students = [];

    snapshot.forEach(snap => {
      students.push({
        key: snap.key,
        roll: Number(snap.val().roll),
        name: snap.val().name
      });
    });

    students.sort((a, b) => a.roll - b.roll);

    students.forEach(stu => {
      const tr = document.createElement("tr");

      // Roll
      const tdRoll = document.createElement("td");
      tdRoll.className = "col-roll";
      tdRoll.textContent = stu.roll;

      // Name
      const tdName = document.createElement("td");
      tdName.className = "col-name";

      const input = document.createElement("input");
      input.type = "text";
      input.id = `name_${stu.key}`;
      input.value = stu.name;

      tdName.appendChild(input);

      // Actions
      const tdAction = document.createElement("td");
      tdAction.className = "col-action";

      const btnUpdate = document.createElement("button");
      btnUpdate.textContent = "Update";
      btnUpdate.onclick = () => updateStudent(cls, stu.key);

      const btnDelete = document.createElement("button");
      btnDelete.textContent = "Delete";
      btnDelete.onclick = () => deleteStudent(cls, stu.key);

      tdAction.appendChild(btnUpdate);
      tdAction.appendChild(btnDelete);

      tr.appendChild(tdRoll);
      tr.appendChild(tdName);
      tr.appendChild(tdAction);

      studentList.appendChild(tr);
    });

  } catch (err) {
    console.error(err);
    addMessageRow("Error loading students");
  }
}

/* =========================
   MESSAGE ROW HELPER
   ========================= */
function addMessageRow(msg) {
  const tr = document.createElement("tr");
  const td = document.createElement("td");
  td.colSpan = 3;
  td.style.textAlign = "center";
  td.textContent = msg;
  tr.appendChild(td);
  studentList.appendChild(tr);
}

/* =========================
   UPDATE STUDENT
   ========================= */
async function updateStudent(classKey, rollKey) {
  const input = document.getElementById(`name_${rollKey}`);
  const newName = input.value.trim();
  if (!newName) return;

  await update(ref(db, `students/${classKey}/${rollKey}`), {
    name: newName
  });

  alert("Student updated");
}

/* =========================
   DELETE STUDENT
   ========================= */
async function deleteStudent(classKey, rollKey) {
  if (!confirm("Delete this student?")) return;

  await remove(ref(db, `students/${classKey}/${rollKey}`));
  loadStudents();
}
