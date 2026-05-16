/* =========================================================
   VERBE — dashboard.js (ES Module)
   ========================================================= */

import { createClient } from "https://cdn.jsdelivr.net/npm/@supabase/supabase-js/+esm";

// ── Supabase config ───────────────────────
const SUPABASE_URL  = "https://wbwmffhegokbnfgtfufz.supabase.co";
const SUPABASE_ANON = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Indid21mZmhlZ29rYm5mZ3RmdWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgwMzYzNTcsImV4cCI6MjA5MzYxMjM1N30.7KNAJ_nZwqbdFMlRmEclGPoGx2ywTUmVwn3LxfdBF-w";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON);

// ── Auth guard ───────────────────────────
const { data: { session } } = await supabase.getSession();

if (!session) {
  window.location.href = "login.html";
}

const user = session.user;

// ── UI elements ──────────────────────────
const emailEl  = document.getElementById("userEmail");
const avatarEl = document.getElementById("userAvatar");

// ── User display ─────────────────────────
const email = user.email || "Unknown";
emailEl.textContent = email;
avatarEl.textContent = email.charAt(0).toUpperCase();

const emailInput = document.getElementById("userEmailInput");
if (emailInput) emailInput.value = email;

// ── API KEY (still derived, but now stable per user.id) ─────
function generateApiKey(userId) {
  return `vrb_live_${userId.replace(/-/g, "").substring(0, 20)}`;
}

const apiKey = generateApiKey(user.id);

// store locally for dashboard use
sessionStorage.setItem("verbe_api_key", apiKey);

// ── API key UI ───────────────────────────
const apikeyDisplay = document.getElementById("apikeyDisplay");

if (apikeyDisplay) {
  apikeyDisplay.dataset.key = apiKey;
  apikeyDisplay.textContent = "vrb_live_••••••••••••••••";
}

// ── Logout ───────────────────────────────
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await supabase.auth.signOut();
  window.location.href = "login.html";
});

// ── Sidebar navigation ───────────────────
const navItems = document.querySelectorAll(".nav-item");

navItems.forEach(item => {
  item.addEventListener("click", (e) => {
    e.preventDefault();
    switchSection(item.dataset.section);
  });
});

window.switchSection = function(section) {
  navItems.forEach(i => i.classList.remove("active"));

  const target = document.querySelector(`[data-section="${section}"]`);
  if (target) target.classList.add("active");

  document.querySelectorAll(".section-panel")
    .forEach(p => p.classList.remove("active"));

  const panel = document.getElementById(`section-${section}`);
  if (panel) panel.classList.add("active");
};

// ── STEP 2 (FIXED: NOW VALIDATES BACKEND) ─────────
window.goToStep2 = async function () {

  const name = document.getElementById("userName")?.value?.trim() || "";
  const email = document.getElementById("userEmailInput")?.value?.trim() || "";
  const phone = document.getElementById("userPhone")?.value?.trim() || "";
  const website = document.getElementById("userWebsite")?.value?.trim() || "";
  const website_name = document.getElementById("userWebsiteName")?.value?.trim() || "";

  const errorEl = document.getElementById("formError");

  document.querySelectorAll(".field-input")
    .forEach(i => i.classList.remove("error"));

  if (!name) return showError("Enter name", "userName", errorEl);
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return showError("Invalid email", "userEmailInput", errorEl);
  if (!phone || phone.length < 8)
    return showError("Invalid phone", "userPhone", errorEl);
  if (!website)
    return showError("Enter website", "userWebsite", errorEl);
  if (!website_name)
    return showError("Enter business name", "userWebsiteName", errorEl);

  errorEl.textContent = "";

  try {
    const res = await fetch("https://website-server-9b3o.onrender.com/api/client", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        website,
        website_name,
        client_api_key: apiKey
      })
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      console.log("CLIENT CREATION FAILED:", data);
      errorEl.textContent = "Server error. Try again.";
      return;
    }

    // OPTIONAL: if backend returns canonical key
    if (data.client_api_key) {
      sessionStorage.setItem("verbe_api_key", data.client_api_key);
    }

  } catch (err) {
    console.log("SERVER OFFLINE", err);
    errorEl.textContent = "Server unreachable";
    return;
  }

  const scriptTag = buildScriptTag(apiKey, website_name);
  document.getElementById("scriptCode").textContent = scriptTag;

  document.getElementById("step1")?.classList.add("hidden");
  document.getElementById("step2")?.classList.remove("hidden");

  document.getElementById("step1-indicator")?.classList.replace("active", "done");
  document.getElementById("step2-indicator")?.classList.add("active");
};

// ── helper ─────────────────────────────
function showError(msg, inputId, errorEl) {
  errorEl.textContent = msg;
  document.getElementById(inputId)?.classList.add("error");
}

// ── step navigation ─────────────────────
window.goToStep1 = function() {
  document.getElementById("step2").classList.add("hidden");
  document.getElementById("step1").classList.remove("hidden");
};

window.goToStep3 = function() {
  document.getElementById("step2").classList.add("hidden");
  document.getElementById("step3").classList.remove("hidden");

  let width = 0;
  const fill = document.getElementById("loadingFill");

  const interval = setInterval(() => {
    width += 2;
    fill.style.width = width + "%";

    if (width >= 100) {
      clearInterval(interval);
      window.location.href = "payment.html";
    }
  }, 30);
};

// ── script builder ─────────────────────
function buildScriptTag(key, website_name) {
  return `<!-- Verbe Chatbot -->\n<script src="https://chatbot-connect.vercel.app/chatbot.js" data-key="${key}" data-client_name="${website_name}"><\/script>`;
}

// ── copy helpers ───────────────────────
window.copyScript = function() {
  navigator.clipboard.writeText(
    document.getElementById("scriptCode").textContent
  );
};

let keyVisible = false;

window.toggleKeyVisibility = function() {
  keyVisible = !keyVisible;

  const el = document.getElementById("apikeyDisplay");

  el.textContent = keyVisible
    ? el.dataset.key
    : "vrb_live_••••••••••••••••";
};

window.copyApiKey = function() {
  navigator.clipboard.writeText(
    document.getElementById("apikeyDisplay").dataset.key
  );
};

// ── cleanup ────────────────────────────
document.querySelectorAll(".field-input").forEach(input => {
  input.addEventListener("input", () => {
    input.classList.remove("error");
    document.getElementById("formError").textContent = "";
  });
});