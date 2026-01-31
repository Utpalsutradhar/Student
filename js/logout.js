import { auth, signOut } from "./auth.js";

console.log("🚪 logout.js loaded");

const logoutBtn = document.getElementById("logoutBtn");

if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      console.log("✅ signed out");

      // 🔥 HARD REDIRECT (clears history + cache)
      window.location.replace("login.html");

    } catch (err) {
      console.error("❌ logout failed", err);
    }
  });
}
