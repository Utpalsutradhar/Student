// firebase.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyA-CwOWgmeKTpQWqbnt9yzUrSmZs6naxdE",
  authDomain: "school-web-app-23fae.firebaseapp.com",
  databaseURL: "https://school-web-app-23fae-default-rtdb.firebaseio.com",
  projectId: "school-web-app-23fae",
  storageBucket: "school-web-app-23fae.firebasestorage.app",
  messagingSenderId: "720669262440",
  appId: "1:720669262440:web:9e921ec7f8fdc75bb031dd"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Realtime Database
const db = getDatabase(app);

// EXPORT db (THIS IS CRITICAL)
export { db };
