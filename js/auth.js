// js/auth.js
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
} from
"https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

import { app } from "./firebase.js";

export const auth = getAuth(app);

export {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut
};
