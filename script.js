/* =========================================================
   VERBE — script.js (REAL BACKEND VERSION)
   ========================================================= */

/* ── Sticky Header ───────────────────────────────────────── */
const header = document.getElementById('header');

window.addEventListener('scroll', () => {
  if (window.scrollY > 40) header.classList.add('scrolled');
  else header.classList.remove('scrolled');
}, { passive: true });

/* ── Mobile Nav Toggle ───────────────────────────────────── */
const navToggle = document.getElementById('navToggle');
const nav = document.getElementById('nav');

navToggle.addEventListener('click', () => {
  nav.classList.toggle('open');
  document.body.style.overflow = nav.classList.contains('open') ? 'hidden' : '';
});

nav.querySelectorAll('a').forEach(link => {
  link.addEventListener('click', () => {
    nav.classList.remove('open');
    document.body.style.overflow = '';
  });
});

/* ── Reveal on Scroll ────────────────────────────────────── */
const revealElements = document.querySelectorAll(
  '.flow-step, .stat-card, .testimonial-card, .pricing-card, .install-step, .demo-widget-wrap, .demo-text'
);

revealElements.forEach(el => el.classList.add('reveal'));

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('visible');
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

revealElements.forEach(el => revealObserver.observe(el));

/* ── Counter Animation ───────────────────────────────────── */
function animateCounter(el, target, duration = 1500) {
  let start = null;
  const step = (timestamp) => {
    if (!start) start = timestamp;
    const progress = Math.min((timestamp - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3);
    el.textContent = Math.floor(eased * target);
    if (progress < 1) requestAnimationFrame(step);
    else el.textContent = target;
  };
  requestAnimationFrame(step);
}

const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      animateCounter(entry.target, parseInt(entry.target.dataset.target, 10));
      counterObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.5 });

document.querySelectorAll('.stat-number[data-target]').forEach(el => {
  counterObserver.observe(el);
});

/* ── Chatbot (REAL) ─────────────────────────────────────── */
const chatMessages = document.getElementById('chatMessages');
const chatInput = document.getElementById('chatInput');

let messages = [];
const BACKEND_URL = "https://server-vls8.onrender.com/chat";
const SESSION_ID = "demo_" + Date.now();

/* ── NEW: Client email capture ───────────────────────────── */

let clientEmail = "";

const emailInput = document.getElementById("client-email");

if (emailInput) {
  emailInput.addEventListener("input", (e) => {
    clientEmail = e.target.value.trim();
  });
}

/* ── Chat UI ────────────────────────────────────────────── */
function addMessage(text, isUser = false) {
  const msg = document.createElement('div');
  msg.className = `msg ${isUser ? 'user' : 'bot'}`;

  const now = new Date();
  const time = now.getHours() + ':' + String(now.getMinutes()).padStart(2, '0');

  msg.innerHTML = `
    <div class="msg-bubble">${text}</div>
    <div class="msg-time">${time}</div>
  `;

  chatMessages.appendChild(msg);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

/* ── Send Message ───────────────────────────────────────── */
async function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text) return;

  chatInput.value = '';
  addMessage(text, true);

  messages.push({ role: "user", content: text });

  // typing indicator
  const typing = document.createElement('div');
  typing.className = 'msg bot';
  typing.innerHTML = '<div class="msg-bubble">typing…</div>';
  chatMessages.appendChild(typing);
  chatMessages.scrollTop = chatMessages.scrollHeight;

  try {
    const res = await fetch(BACKEND_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        messages: messages,
        api_key: "acjczgdvdfxcg",
        session_id: SESSION_ID,
        client_email: clientEmail   // ✅ NEW FIELD ADDED
      })
    });

    const data = await res.json();
    chatMessages.removeChild(typing);

    addMessage(data.reply, false);
    messages.push({ role: "assistant", content: data.reply });

  } catch (err) {
    chatMessages.removeChild(typing);
    addMessage("Server error", false);
  }
}

/* ── Enter to Send ───────────────────────────────────────── */
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendChatMessage();
});
/* ── Copy API Key ───────────────────── */
function copyApiKey() {

  const key = document.getElementById("apiKeyDisplay").innerText;

  navigator.clipboard.writeText(key)
    .then(() => {
      console.log("API key copied");
    })
    .catch(err => {
      console.error("Copy failed:", err);
    });
}


/* ── Copy Install Snippet ───────────── */
function copySnippet() {

  const snippet = document.getElementById("codeSnippet").innerText;

  navigator.clipboard.writeText(snippet)
    .then(() => {

      const btnText = document.getElementById("copyBtnText");

      btnText.textContent = "Copied!";

      setTimeout(() => {
        btnText.textContent = "Copy";
      }, 2000);

    })
    .catch(err => {
      console.error("Copy failed:", err);
    });
}
