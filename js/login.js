// js/login.js
import { auth, signInWithEmailAndPassword } from "./auth.js";

const emailInput = document.getElementById("email");
const passInput  = document.getElementById("password");
const msg        = document.getElementById("msg");
const loginBtn   = document.getElementById("loginBtn");

loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const pass  = passInput.value.trim();

  msg.textContent = "";

  if (!email || !pass) {
    msg.textContent = "Enter email and password";
    return;
  }

  try {
    await signInWithEmailAndPassword(auth, email, pass);
    console.log("✅ login success");
    window.location.href = "add_students.html";
  } catch (err) {
    console.error(err.code, err.message);
    msg.textContent = err.message;
  }
});
