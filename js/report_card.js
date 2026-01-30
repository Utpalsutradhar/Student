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

/* ================= CACHE ================= */
let orderedStudents = [];

/* ================= HELPERS ================= */
const pad2 = v => (v === "" || v == null) ? "" : String(v).padStart(2,"0");
const grade = t => t>=90?"A":t>=75?"B":t>=60?"C":t>=45?"D":"E";

/* ===== SUBJECT NAME FORMATTER ===== */
function formatSubjectName(key) {
  const map = {
    gk: "GK",
    assamese: "ASSAMESE",
    english: "ENGLISH",
    computerscience: "COMPUTER SCIENCE",
    socialstudies: "SOCIAL STUDIES",
    evs: "EVS",
    math: "MATHEMATICS",
    maths: "MATHEMATICS"
  };
  return map[key] || key.toUpperCase();
}

/* ================= RESET EXTRAS ================= */
function resetExtras(){
  [
    "attSem1Work","attSem1Present",
    "attSem2Work","attSem2Present",
    "csConfidence","csUniform","csDiscipline",
    "csSpoken","csPunctuality","csSupw"
  ].forEach(id=>{
    const el = document.getElementById(id);
    if(el) el.textContent = "—";
  });
}

/* ================= LOAD CLASSES ================= */
async function loadClasses(){
  const snap = await get(ref(db,"students"));
  if(!snap.exists()) return;

  Object.keys(snap.val()).forEach(cls=>{
    const opt = document.createElement("option");
    opt.value = cls;
    opt.textContent = cls.replace("class","Class ");
    classSelect.appendChild(opt);
  });
}

/* ================= LOAD STUDENTS ================= */
async function loadStudents(cls){
  studentSelect.innerHTML = `<option value="">Select Student</option>`;
  resetExtras();
  tbody.innerHTML = "";

  const snap = await get(ref(db,`students/${cls}`));
  if(!snap.exists()) return;

  orderedStudents = Object.entries(snap.val())
    .sort((a,b)=>Number(a[1].roll)-Number(b[1].roll));

  orderedStudents.forEach(([k,s],i)=>{
    const opt = document.createElement("option");
    opt.value = i; // 🔒 INDEX IS TRUTH
    opt.textContent = `Roll ${pad2(s.roll)} - ${s.name}`;
    studentSelect.appendChild(opt);
  });

  studentSelect.disabled = false;
}

/* ================= LOAD REPORT ================= */
async function loadReport(cls,index){
  index = Number(index);
  resetExtras();
  tbody.innerHTML = "";

  const [rk,stu] = orderedStudents[index];

  displayClass.textContent = cls.replace("class","Class ");
  displayRoll.textContent  = pad2(stu.roll);
  displayName.textContent  = stu.name.toUpperCase();

  const [subSnap,markSnap] = await Promise.all([
    get(ref(db,`subjects/${cls}`)),
    get(ref(db,`marks/${cls}`))
  ]);

  if(!subSnap.exists()) return;

  const marks = markSnap.exists() ? markSnap.val() : {};
  let total = 0, count = 0;

  Object.keys(subSnap.val()).forEach(sk=>{
    const i1 = marks.internal1?.[sk]?.[index] ?? "";
    const mt = marks.midterm?.[sk]?.[index] ?? "";
    const i2 = marks.internal2?.[sk]?.[index] ?? "";
    const fe = marks.final?.[sk]?.[index] ?? "";

    const s1 = +i1 + +mt;
    const s2 = +i2 + +fe;
    const w40 = Math.round(s1 * 0.4);
    const w60 = Math.round(s2 * 0.6);
    const g   = w40 + w60;

    total += g; count++;


    
    
    tbody.insertAdjacentHTML("beforeend",`
      <tr>
        <td>${formatSubjectName(sk)}</td>

        <!-- Semester I -->
        <td>${pad2(i1)}</td>
        <td>${pad2(mt)}</td>
        <td>${pad2(s1)}</td>

    <!-- Semester II -->
        <td>${pad2(i2)}</td>
        <td>${pad2(fe)}</td>
        <td>${pad2(s2)}</td>

    <!-- Final calculation -->
        <td>${pad2(w40)}</td>
        <td>${pad2(w60)}</td>
        <td>${pad2(g)}</td>
        <td>${grade(g)}</td>    
      </tr>
    `);
  });

  overallTotalEl.textContent = total;
  percentageEl.textContent   = count ? (total/count).toFixed(2) : "0.00";

  /* ===== CO-SCHOLASTIC ===== */
  const cs = await get(ref(db,`co_scholastic/${cls}/${index}`));
  if(cs.exists()){
    const c = cs.val();
    csConfidence.textContent  = c.confidence || "—";
    csUniform.textContent     = c.uniform || "—";
    csDiscipline.textContent  = c.discipline || "—";
    csSpoken.textContent      = c.spoken_english || "—";
    csPunctuality.textContent = c.punctuality || "—";
    csSupw.textContent        = c.supw || "—";
  }

  /* ===== ATTENDANCE ===== */
  const at = await get(ref(db,`attendance/${cls}/${index}`));
  if(at.exists()){
    const a = at.val();
    attSem1Work.textContent    = a.sem1_working || "—";
    attSem1Present.textContent = a.sem1_present || "—";
    attSem2Work.textContent    = a.sem2_working || "—";
    attSem2Present.textContent = a.sem2_present || "—";
  }
}

/* ================= EVENTS ================= */
classSelect.onchange   = () => loadStudents(classSelect.value);
studentSelect.onchange = () => loadReport(classSelect.value, studentSelect.value);

window.printReport = () => window.print();
window.onload      = loadClasses;
