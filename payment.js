// ─────────────────────────────────────
// PAYMENT.JS
// ─────────────────────────────────────

const payBtn = document.getElementById("payBtn");
const trialBtn = document.getElementById("trialBtn");

// Razorpay test key
const RAZORPAY_KEY = "rzp_test_XXXXXXXXXXXXXXXX";

// ─────────────────────────────────────
// FREE TRIAL
// ─────────────────────────────────────

trialBtn.addEventListener("click", () => {

  localStorage.setItem("verbe_trial_active", "true");
  localStorage.setItem("verbe_trial_start", Date.now());

  // redirect to actual leads dashboard
  window.location.href = "client-dashboard.html";
});

// ─────────────────────────────────────
// PAID PLAN
// ─────────────────────────────────────

payBtn.addEventListener("click", async () => {

  payBtn.disabled = true;
  payBtn.innerText = "Opening Razorpay...";

  const options = {

    key: RAZORPAY_KEY,

    amount: 499900, // ₹4999

    currency: "INR",

    name: "Verbe AI",

    description: "Monthly Subscription",

    handler: function (response) {

      console.log("PAYMENT SUCCESS:", response);

      localStorage.setItem("verbe_paid", "true");

      // remove trial if exists
      localStorage.removeItem("verbe_trial_active");

      // redirect
      window.location.href = "client-dashboard.html";
    },

    prefill: {
      name: "",
      email: ""
    },

    theme: {
      color: "#1a73e8"
    }
  };

  const rzp = new Razorpay(options);

  rzp.on("payment.failed", function (response) {

    console.error(response.error);

    alert("Payment failed.");

    payBtn.disabled = false;
    payBtn.innerText = "Upgrade Now";
  });

  rzp.open();
});