const auth = firebase.getAuth();
const signupForm = document.getElementById("signup-form");
const formError = document.getElementById("form-error");
const signupBtn = document.getElementById("signup-btn");

if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    const email = document.getElementById("email").value;
    const password = document.getElementById("password").value;
    
    formError.textContent = "";
    signupBtn.disabled = true;
    
    try {
      await firebase.createUserWithEmailAndPassword(auth, email, password);
      window.location.href = "index.html";
    } catch (error) {
      formError.textContent = error.message;
    } finally {
      signupBtn.disabled = false;
    }
  });
}
