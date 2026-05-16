/* =========================================================
   VERBE — login.js (ES Module)
   Supabase Google OAuth + Email/Password
   ========================================================= */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ── Your Supabase config ──────────────────────────────────────
// Find these in: Supabase Dashboard → Settings → API
const SUPABASE_URL  = "https://wbwmffhegokbnfgtfufz.supabase.co";  // Project URL
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indid21mZmhlZ29rYm5mZ3RmdWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMzYzNTcsImV4cCI6MjA5MzYxMjM1N30.7KNAJ_nZwqbdFMlRmEclGPoGx2ywTUmVwn3LxfdBF-w";                   // anon public key

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── Element refs ─────────────────────────────────────────────
const googleBtn     = document.getElementById("googleLoginBtn");
const emailLoginBtn = document.getElementById("emailLoginBtn");
const emailInput    = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const togglePwdBtn  = document.getElementById("togglePassword");
const errorMsg      = document.getElementById("errorMsg");
const btnText       = document.getElementById("btnText");
const btnSpinner    = document.getElementById("btnSpinner");
const eyeIcon       = document.getElementById("eyeIcon");

// ── Check existing session on load ───────────────────────────
const { data: { session } } = await supabase.auth.getSession();
if (session) redirectToDashboard();

// Fires when Google redirects back to your site after login
supabase.auth.onAuthStateChange((_event, session) => {
  if (session) redirectToDashboard();
});

// ── Google Sign-In ───────────────────────────────────────────
googleBtn.addEventListener("click", async () => {
  clearError();
  setGoogleLoading(true);

  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/dashboard.html`,
    },
  });

  if (error) {
    setGoogleLoading(false);
    showError(error.message);
  }
  // No error = browser is already being redirected to Google
});

// ── Email / Password ─────────────────────────────────────────
emailLoginBtn.addEventListener("click", handleEmailLogin);
emailInput.addEventListener("keydown",    (e) => { if (e.key === "Enter") handleEmailLogin(); });
passwordInput.addEventListener("keydown", (e) => { if (e.key === "Enter") handleEmailLogin(); });
emailInput.addEventListener("input",    clearError);
passwordInput.addEventListener("input", clearError);

async function handleEmailLogin() {
  clearError();

  const email    = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email) {
    showError("Please enter your email address.");
    emailInput.classList.add("error");
    emailInput.focus();
    return;
  }
  if (!isValidEmail(email)) {
    showError("Please enter a valid email address.");
    emailInput.classList.add("error");
    emailInput.focus();
    return;
  }
  if (!password) {
    showError("Please enter your password.");
    passwordInput.classList.add("error");
    passwordInput.focus();
    return;
  }
  if (password.length < 6) {
    showError("Password must be at least 6 characters.");
    passwordInput.classList.add("error");
    passwordInput.focus();
    return;
  }

  setEmailLoading(true);

  // Try signing in first
  let { data, error } = await supabase.auth.signInWithPassword({ email, password });

  // No account exists → sign them up automatically
  if (error?.message === "Invalid login credentials") {
    ({ data, error } = await supabase.auth.signUp({ email, password }));

    if (!error) {
      showSuccess("Account created! Check your email to confirm, then sign in.");
      setEmailLoading(false);
      return;
    }
  }

  if (error) {
    setEmailLoading(false);
    showError(error.message);
    return;
  }
  // onAuthStateChange fires → redirectToDashboard()
}

// ── Forgot Password ──────────────────────────────────────────
document.querySelector(".forgot-link")?.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();

  if (!email || !isValidEmail(email)) {
    showError("Enter your email above first, then click 'Forgot password?'");
    emailInput.classList.add("error");
    emailInput.focus();
    return;
  }

  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password.html`,
  });

  if (error) showError(error.message);
  else showSuccess("Password reset email sent! Check your inbox.");
});

// ── Toggle Password Visibility ───────────────────────────────
togglePwdBtn?.addEventListener("click", () => {
  const isPassword = passwordInput.type === "password";
  passwordInput.type = isPassword ? "text" : "password";

  eyeIcon.innerHTML = isPassword
    ? `<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/>`
    : `<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>`;
});

// ── Helpers ──────────────────────────────────────────────────
function redirectToDashboard() {
  window.location.href = "dashboard.html";
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function showError(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.add("visible");
  errorMsg.style.color = "var(--red)";
}

function showSuccess(msg) {
  errorMsg.textContent = msg;
  errorMsg.classList.add("visible");
  errorMsg.style.color = "var(--green)";
}

function clearError() {
  errorMsg.textContent = "";
  errorMsg.classList.remove("visible");
  emailInput?.classList.remove("error");
  passwordInput?.classList.remove("error");
}

function setEmailLoading(loading) {
  emailLoginBtn.disabled = loading;
  btnText.textContent    = loading ? "Signing in…" : "Sign in";
  btnSpinner.classList.toggle("hidden", !loading);
}

function setGoogleLoading(loading) {
  googleBtn.disabled = loading;
  googleBtn.querySelector("span").textContent = loading
    ? "Redirecting to Google…"
    : "Continue with Google";
}
