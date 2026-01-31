// js/protect.js
import { auth, onAuthStateChanged } from "./auth.js";

console.log("✅ protect.js loaded");

function checkAuth() {
  onAuthStateChanged(auth, user => {
    console.log("🔐 auth state:", user);

    if (!user) {
      window.location.replace("login.html");
    }
  });
}

// normal load
checkAuth();

// back/forward cache fix
window.addEventListener("pageshow", () => {
  checkAuth();
});
