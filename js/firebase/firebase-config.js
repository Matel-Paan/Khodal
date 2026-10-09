import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-database.js";
import { getAuth, GoogleAuthProvider } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyBHftpk6Z-JtHsK3PV-jbNH-klNvoqODLA",
    authDomain: "khodal-81a54.firebaseapp.com",
    databaseURL: "https://khodal-81a54-default-rtdb.firebaseio.com",
    projectId: "khodal-81a54",
    storageBucket: "khodal-81a54.firebasestorage.app",
    messagingSenderId: "71002380705",
    appId: "1:71002380705:web:baf1fbb8fe77ff91e6d3e0"
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const provider = new GoogleAuthProvider();
