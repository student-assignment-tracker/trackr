import { getAuth, createUserWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.7.0/firebase-auth.js";
import app from "./firebase-config.js";

const auth = getAuth(app);
const signupForm = document.getElementById("signup-form");
const formError = document.getElementById("form-error");
const signupBtn = document.getElementById("signup-btn");

signupForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;
  
  formError.textContent = "";
  signupBtn.disabled = true;
  
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    window.location.href = "index.html";
  } catch (error) {
    formError.textContent = error.message;
  } finally {
    signupBtn.disabled = false;
  }
});
