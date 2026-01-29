// add_student.js
import {
  ref,
  get,
  set
} from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { db } from "./firebase.js";

console.log("✅ add_student.js loaded");

window.addStudent = async function () {
  const classKey = document.getElementById("classSelect").value;
  const name     = document.getElementById("studentName").value.trim();
  const msg      = document.getElementById("msg");

  msg.textContent = "";

  if (!classKey || !name) {
    msg.textContent = "Select class and enter name";
    msg.style.color = "red";
    return;
  }

  try {
    const classRef = ref(db, `students/${classKey}`);
    const snap = await get(classRef);

    let nextIndex = 0;

    if (snap.exists()) {
      const data = snap.val();

      const numericKeys = Object.keys(data)
        .map(k => Number(k))
        .filter(n => Number.isInteger(n));

      if (numericKeys.length > 0) {
        nextIndex = Math.max(...numericKeys) + 1;
      }
    }

    const rollNumber = nextIndex + 1; // 🔴 ALWAYS NUMBER

    await set(ref(db, `students/${classKey}/${nextIndex}`), {
      name: name,
      roll: rollNumber,   // ✅ number (1,2,3…)
      index: nextIndex,   // ✅ number (0,1,2…)
      class: classKey     // ✅ "class1"
    });

    msg.textContent = `Student added (Roll ${rollNumber})`;
    msg.style.color = "green";
    document.getElementById("studentName").value = "";

  } catch (error) {
    console.error(error);
    msg.textContent = "Error adding student";
    msg.style.color = "red";
  }
};
