import { ref, get } from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";
import { db } from "./firebase.js";

/* ================= DOM ================= */
const classSelect   = document.getElementById("classSelect");
const studentSelect = document.getElementById("studentSelect");
const tbody         = document.getElementById("marks-body");

const displayClass  = document.getElementById("displayClass");
const displayRoll   = document.getElementById("displayRoll");
const displayName   = document.getElementById("displayName");

const overallTotalEl = document.getElementById("overallTotal");
const percentageEl   = document.getElementById("percentage");

const attSem1Percent = document.getElementById("attSem1Percent");
const attSem2Percent = document.getElementById("attSem2Percent");

/* ================= CACHE ================= */
let orderedStudents = [];

/* ================= HELPERS ================= */
const pad2 = v => (v === "" || v == null) ? "" : String(v).padStart(2, "0");

/* ===== FINAL GRADE LOGIC (PERCENTAGE BASED) ===== */
function getGradeFromPercentage(p) {
  p = Number(p);
  if (isNaN(p)) return "—";

  return p >= 90 ? "A+" :
         p >= 80 ? "A"  :
         p >= 60 ? "B"  :
         p >= 45 ? "C"  :
         p >= 33 ? "D"  : "E";
}

/* ===== CLASS NAME FORMATTER ===== */
function formatClassName(key) {
  const roman = {
    1: "I", 2: "II", 3: "III", 4: "IV", 5: "V",
    6: "VI", 7: "VII", 8: "VIII", 9: "IX",
    10: "X", 11: "XI", 12: "XII"
  };

  if (/^class\d+$/i.test(key)) {
    const num = key.match(/\d+/)[0];
    return roman[num] || num;
  }

  if (/^nursery/i.test(key)) {
    return key.replace(/^nursery/i, "NURSERY ")
              .replace(/([A-Z])$/, " $1")
              .toUpperCase();
  }

  if (/^lkg/i.test(key)) {
    return key.replace(/^lkg/i, "LKG ")
              .replace(/([A-Z])$/, " $1")
              .toUpperCase();
  }

  if (/^ukg/i.test(key)) {
    return key.replace(/^ukg/i, "UKG ")
              .replace(/([A-Z])$/, " $1")
              .toUpperCase();
  }

  if (/^playgroup$/i.test(key)) {
    return "PLAY GROUP";
  }
  
  return key.toUpperCase();
}

/* ===== SUBJECT NAME FORMATTER ===== */
function formatSubjectName(key) {
  const map = {
    gk: "GK",
    assamese: "ASSAMESE",
    assameseoral: "ASSAMESE ORAL",
    assamesedictation: "ASSAMESE DICTATION",
    englishliterature: "ENGLISH LITERATURE",
    englishgrammar: "ENGLISH GRAMMAR",
    englishdictation: "ENGLISH DICTATION",
    englishoral: "ENGLISH ORAL",
    hindidictation: "HINDI DICTATION",
    hindioral: "HINDI ORAL",
    socialstudies: "SOCIAL STUDIES",
    computerscience: "COMPUTER SCIENCE",
    evsoral: "EVS ORAL"
  };
  return map[key] || key.toUpperCase();
}

/* ================= RESET EXTRAS ================= */
function resetExtras() {
  [
    "attSem1Work","attSem1Present","attSem1Percent",
    "attSem2Work","attSem2Present","attSem2Percent",
    "csConfidence","csUniform","csDiscipline",
    "csSpoken","csPunctuality","csSupw"
  ].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.textContent = "—";
  });
}

/* ================= LOAD CLASSES ================= */
async function loadClasses() {
  const snap = await get(ref(db, "students"));
  if (!snap.exists()) return;

  Object.keys(snap.val()).forEach(cls => {
    const opt = document.createElement("option");
    opt.value = cls;
    opt.textContent = formatClassName(cls);
    classSelect.appendChild(opt);
  });
}

/* ================= LOAD STUDENTS ================= */
async function loadStudents(cls) {
  studentSelect.innerHTML = `<option value="">Select Student</option>`;
  resetExtras();
  tbody.innerHTML = "";

  const snap = await get(ref(db, `students/${cls}`));
  if (!snap.exists()) return;

  orderedStudents = Object.entries(snap.val())
    .sort((a, b) => Number(a[1].roll) - Number(b[1].roll));

  orderedStudents.forEach(([_, s], i) => {
    const opt = document.createElement("option");
    opt.value = i;
    opt.textContent = `Roll ${pad2(s.roll)} - ${s.name}`;
    studentSelect.appendChild(opt);
  });

  studentSelect.disabled = false;
}

/* ================= LOAD REPORT ================= */
async function loadReport(cls, index) {
  index = Number(index);
  resetExtras();
  tbody.innerHTML = "";

  const [, stu] = orderedStudents[index];

  displayClass.textContent = formatClassName(cls);
  displayRoll.textContent  = pad2(stu.roll);
  displayName.textContent  = stu.name.toUpperCase();

  const [subSnap, markSnap] = await Promise.all([
    get(ref(db, `subjects/${cls}`)),
    get(ref(db, `marks/${cls}`))
  ]);

  if (!subSnap.exists()) return;

  const marks = markSnap.exists() ? markSnap.val() : {};
  let grandTotal = 0;
  let subjectCount = 0;

  Object.keys(subSnap.val()).forEach(sk => {
    const i1 = Number(marks.internal1?.[sk]?.[index] ?? 0);
    const mt = Number(marks.midterm?.[sk]?.[index] ?? 0);
    const i2 = Number(marks.internal2?.[sk]?.[index] ?? 0);
    const fe = Number(marks.final?.[sk]?.[index] ?? 0);

    const sem1Total = i1 + mt;
    const sem2Total = i2 + fe;

    const weighted40 = Math.round(sem1Total * 0.4);
    const weighted60 = Math.round(sem2Total * 0.6);
    const subjectTotal = weighted40 + weighted60;

    grandTotal += subjectTotal;
    subjectCount++;

    const subjectGrade = getGradeFromPercentage(subjectTotal);

    tbody.insertAdjacentHTML("beforeend", `
      <tr>
        <td>${formatSubjectName(sk)}</td>
        <td>${pad2(i1)}</td>
        <td>${pad2(mt)}</td>
        <td>${pad2(sem1Total)}</td>
        <td>${pad2(i2)}</td>
        <td>${pad2(fe)}</td>
        <td>${pad2(sem2Total)}</td>
        <td>${pad2(weighted40)}</td>
        <td>${pad2(weighted60)}</td>
        <td>${pad2(subjectTotal)}</td>
        <td>${subjectGrade}</td>
      </tr>
    `);
  });

  /* ===== OVERALL TOTAL & PERCENTAGE ===== */
  overallTotalEl.textContent = grandTotal;

  const overallPercentage = subjectCount
    ? (grandTotal / subjectCount)
    : 0;

  percentageEl.textContent = subjectCount
    ? overallPercentage.toFixed(2) + "%"
    : "—";

  /* ===== CO-SCHOLASTIC ===== */
  const cs = await get(ref(db, `co_scholastic/${cls}/${index}`));
  if (cs.exists()) {
    const c = cs.val();
    csConfidence.textContent  = c.confidence || "—";
    csUniform.textContent     = c.uniform || "—";
    csDiscipline.textContent  = c.discipline || "—";
    csSpoken.textContent      = c.spoken_english || "—";
    csPunctuality.textContent = c.punctuality || "—";
    csSupw.textContent        = c.supw || "—";
  }

  /* ===== ATTENDANCE ===== */
  const at = await get(ref(db, `attendance/${cls}/${index}`));
  if (at.exists()) {
    const a = at.val();

    attSem1Work.textContent    = a.sem1_working || "—";
    attSem1Present.textContent = a.sem1_present || "—";
    attSem2Work.textContent    = a.sem2_working || "—";
    attSem2Present.textContent = a.sem2_present || "—";

    attSem1Percent.textContent =
      a.sem1_working
        ? ((a.sem1_present / a.sem1_working) * 100).toFixed(2) + "%"
        : "—";

    attSem2Percent.textContent =
      a.sem2_working
        ? ((a.sem2_present / a.sem2_working) * 100).toFixed(2) + "%"
        : "—";
  }
}

/* ================= EVENTS ================= */
classSelect.onchange   = () => loadStudents(classSelect.value);
studentSelect.onchange = () => loadReport(classSelect.value, studentSelect.value);

window.printReport = () => window.print();
window.onload      = loadClasses;
