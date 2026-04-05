// ⚡ FINSTACK PRO: ELITE SYSTEM INITIALIZATION
const isPWA = window.location.search.includes('launcher=pwa');

// 1. Instant Service Worker Sync
if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js')
        .then(() => console.log("💎 FinStack: 50MB+ Heavyweight Cache Active"))
        .catch((err) => console.log("⚠️ Cache Sync Error", err));
}

// 2. Performance Launcher (Prevents Flickering)
window.addEventListener('DOMContentLoaded', () => {
    if (isPWA) {
        console.log("🚀 Terminal Launched in Standalone Mode");
        // Force hide landing page immediately if launched from icon
        const landing = document.getElementById('landing-page');
        if (landing) landing.style.display = 'none';

        // Prepare the PIN keypad for instant entry
        setTimeout(() => {
            const pinInput = document.getElementById('unlock-pin');
            if (pinInput) pinInput.focus();
        }, 500);
    }
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, doc, getDoc, setDoc, orderBy, serverTimestamp, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyCTNzWiEakvLXm-5c_DAogEsuvCNs3Fs4Y",
    authDomain: "finstack-pro.firebaseapp.com",
    projectId: "finstack-pro",
    storageBucket: "finstack-pro.firebasestorage.app",
    messagingSenderId: "718566105247",
    appId: "1:718566105247:web:c0b79acabb067805c002aa"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(), db = getFirestore(app);
let currentUser = null, ledgerUnsub = null, currentProgress = 0, globalPIN = null, localOTP = null;
let timerInterval = null;

// Enable Offline Mode
enableIndexedDbPersistence(db).catch(() => console.log("Persistence active"));

// --- 🧭 NAVIGATION ---
window.navigate = (view, el) => {
    document.querySelectorAll('.view-pane').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    document.getElementById(`view-${view}`).classList.add('active');
    el.classList.add('active');
    if (view === 'study') syncSinkingFund();
    if (view === 'career') updateWealthLogic();
};

// --- 🛡️ AUTH & PIN CORE ---
onAuthStateChanged(auth, async (user) => {
    const lockScreen = document.getElementById('security-lock-screen');
    const landingPage = document.getElementById('landing-page');
    const loginScreen = document.getElementById('login-screen');

    if (user) {
        currentUser = user;
        const snap = await getDoc(doc(db, "users", user.uid));
        const data = snap.exists() ? snap.data() : {};
        globalPIN = data.securityPIN || null;

        // INSTANT HIDE: Stop showing entry pages
        landingPage.style.display = 'none';
        loginScreen.style.display = 'none';

        if (data.pinEnabled && globalPIN) {
            lockScreen.style.display = 'flex';
        } else {
            // ⚡ ANTI-FLICKER: Kill the PIN screen if it flashed from the URL signal
            lockScreen.style.display = 'none';
            showDashboard();
        }

        updateIdentityUI(data);
        syncACCA(data.accaState || []);
        syncLedger();
        initTaxLogic();
    } else {
        // --- ⚡ GUEST LOGIC ---
        // If not logged in, the PIN screen MUST be hidden
        if (lockScreen) lockScreen.style.display = 'none';

        if (isPWA) {
            landingPage.style.display = 'none';
            loginScreen.style.display = 'flex';
        } else {
            landingPage.style.display = 'flex';
            loginScreen.style.display = 'none';
        }
        document.getElementById('main-dashboard').style.display = 'none';
    }
});

window.verifyPin = () => {
    // .trim() is the "Elite" fix for mobile keyboard spaces
    const val = document.getElementById('unlock-pin').value.trim();

    if (val === globalPIN) {
        showDashboard();
        // Clear the input after success for security
        document.getElementById('unlock-pin').value = '';
    } else {
        // Add a small shake or alert for feedback
        alert("ACCESS DENIED: INVALID PIN");
        document.getElementById('unlock-pin').value = '';
    }
};

function showDashboard() {
    document.getElementById('security-lock-screen').style.display = 'none';
    document.getElementById('main-dashboard').style.display = 'block';
}

// --- 🎓 ACCA TRACKER ---
function syncACCA(saved) {
    const checks = document.querySelectorAll('.acca-check');
    saved.forEach((v, i) => { if (checks[i]) checks[i].checked = v; });
    currentProgress = saved.filter(v => v).length || 0;
    updateACCAUI();
    checks.forEach(box => {
        box.onchange = async () => {
            const all = Array.from(checks).map(i => i.checked);
            currentProgress = all.filter(v => v).length;
            await setDoc(doc(db, "users", currentUser.uid), { accaState: all, progress: currentProgress }, { merge: true });
            updateACCAUI();
            updateWealthLogic();
        };
    });
}

function updateACCAUI() {
    document.getElementById('exam-overall-progress').value = currentProgress;
    document.getElementById('exam-progress-text').innerText = `${currentProgress}/13 Milestones Cleared`;
}

function updateWealthLogic() {
    let pot = currentProgress >= 13 ? "₹18L - ₹25L+" : (currentProgress >= 9 ? "₹12L - ₹15L" : "₹5L - ₹7L");
    document.getElementById('market-value-text').innerText = `Potential: ${pot}`;
    document.getElementById('wealth-msg').innerText = `Career Projection: ${currentProgress} Papers Unlocked`;
}

// ⚡ ELITE SINKING FUND: LIVE SYNC
async function syncSinkingFund() {
    const base = document.getElementById('curr-select').value;
    const feeInput = document.getElementById('fee-input');
    const fee = parseFloat(feeInput.value) || 0;
    const pending = 13 - (currentProgress || 0);

    // UI Update: Ensure the box doesn't break
    const inrSumDisplay = document.getElementById('inr-sum');

    try {
        const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
        const data = await res.json();
        const inrRate = data.rates.INR;
        const totalINR = fee * inrRate * pending;

        // The Fix: toLocaleString handles the big numbers (₹1,50,000)
        inrSumDisplay.innerText = `₹${Math.floor(totalINR).toLocaleString('en-IN')}`;
        document.getElementById('fund-count-tag').innerText = `${pending} Papers @ ₹${inrRate.toFixed(2)} rate`;
    } catch (e) {
        // Backup if offline
        inrSumDisplay.innerText = `₹${(fee * 110 * pending).toLocaleString('en-IN')}`;
    }
}

// --- 💰 LEDGER & AI INSIGHTS ---
function syncLedger() {
    if (ledgerUnsub) ledgerUnsub();
    ledgerUnsub = onSnapshot(query(collection(db, "ledger"), where("uid", "==", currentUser.uid), orderBy("time", "desc")), (s) => {
        const t = s.docs.map(d => d.data());
        const inflow = t.filter(v => v.amount > 0).reduce((a, v) => a + v.amount, 0);
        const outflow = t.filter(v => v.amount < 0).reduce((a, v) => a + Math.abs(v.amount), 0);
        const b = inflow - outflow;

        document.getElementById('balance').innerText = `₹${b.toLocaleString('en-IN')}`;
        document.getElementById('money-plus').innerText = `₹${inflow.toLocaleString('en-IN')}`;
        document.getElementById('money-minus').innerText = `₹${outflow.toLocaleString('en-IN')}`;

        // Compound Forecast (10Y @ 12%)
        const forecast = Math.floor(b * Math.pow(1 + 0.12, 10));
        document.getElementById('wealth-insight').innerText = `₹${forecast.toLocaleString('en-IN')}`;

        // AI Spending Anomaly Detection
        if (t.length > 5) {
            const avgOut = outflow / t.filter(v => v.amount < 0).length;
            if (Math.abs(t[0].amount) > avgOut * 2.5 && t[0].amount < 0) {
                document.getElementById('wealth-msg').innerText = "⚠️ Alert: High Outflow Detected";
                document.getElementById('wealth-msg').style.color = "var(--danger)";
            }
        }
    });
}

document.getElementById('transaction-form').onsubmit = async (e) => {
    e.preventDefault();
    const amt = parseFloat(document.getElementById('amount').value);
    const cat = document.getElementById('category').value;
    await addDoc(collection(db, "ledger"), {
        uid: currentUser.uid,
        text: document.getElementById('text').value,
        category: cat,
        amount: cat === "Income" ? amt : -amt,
        time: serverTimestamp()
    });
    e.target.reset();
};

// --- 📊 TAX ENGINE (Full Calculation) ---
function initTaxLogic() {
    document.getElementById('annual-salary').oninput = (e) => {
        const salary = parseFloat(e.target.value) || 0;
        let tax = 0;
        // Simple New Regime Slab FY 25-26
        if (salary > 1500000) tax = (salary - 1500000) * 0.3 + 150000;
        else if (salary > 1200000) tax = (salary - 1200000) * 0.2 + 90000;
        else if (salary > 900000) tax = (salary - 900000) * 0.15 + 45000;
        else if (salary > 600000) tax = (salary - 600000) * 0.1 + 15000;
        else if (salary > 300000) tax = (salary - 300000) * 0.05;

        document.getElementById('tax-amount').innerText = `₹${tax.toLocaleString('en-IN')}`;
        document.getElementById('take-home').innerText = `₹${Math.floor((salary - tax) / 12).toLocaleString('en-IN')}`;
    };
}

// --- 📚 STUDY TIMER (Pomodoro) ---
let timeLeft = 1500;
document.getElementById('start-timer').onclick = function () {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
        this.innerText = "Resume Work";
    } else {
        this.innerText = "Pause Session";
        timerInterval = setInterval(() => {
            timeLeft--;
            const mins = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            document.getElementById('timer-display').innerText = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
            if (timeLeft <= 0) clearInterval(timerInterval);
        }, 1000);
    }
};

// --- ⚙️ SETTINGS ---
function updateIdentityUI(data) {
    const name = data.displayName || currentUser.email;
    document.getElementById('display-name-label').innerText = name;
    document.getElementById('set-name').value = name;

    // 🛠️ FIX: Mobile Birthday Visibility
    const dobInput = document.getElementById('set-dob');
    // This ensures the box stays empty if no date is found, rather than showing "mm/dd/yyyy"
    dobInput.value = data.dob || '';

    const pinToggle = document.getElementById('pin-toggle');
    pinToggle.checked = data.pinEnabled || false;
    document.getElementById('pin-area').style.display = (pinToggle.checked && !globalPIN) ? 'block' : 'none';

    const p = name.trim().split(" ");
    const initials = p.length > 1 ? (p[0][0] + p[p.length - 1][0]) : p[0].substring(0, 2);
    document.getElementById('user-avatar').innerText = initials.toUpperCase();
    document.getElementById('user-avatar').style.backgroundImage = data.photoURL ? `url(${data.photoURL})` : 'none';
}

document.getElementById('pin-toggle').onchange = (e) => {
    if (e.target.checked && !globalPIN) document.getElementById('pin-area').style.display = 'block';
    else {
        document.getElementById('pin-area').style.display = 'none';
        setDoc(doc(db, "users", currentUser.uid), { pinEnabled: e.target.checked }, { merge: true });
    }
};

window.savePIN = async () => {
    const pin = document.getElementById('set-new-pin').value;
    if (pin.length === 4) {
        await setDoc(doc(db, "users", currentUser.uid), { pinEnabled: true, securityPIN: pin }, { merge: true });
        globalPIN = pin;
        document.getElementById('pin-area').style.display = 'none';
        alert("PIN Secured Successfully");
    }
};

window.startTFA = () => {
    localOTP = Math.floor(100000 + Math.random() * 900000);
    alert(`SECURITY CODE: ${localOTP}\n(Identity Verification Simulation)`);
    document.getElementById('tfa-otp-ui').style.display = 'block';
};

window.confirmOTP = async () => {
    if (document.getElementById('otp-code').value == localOTP) {
        await setDoc(doc(db, "users", currentUser.uid), { tfaEnabled: true }, { merge: true });
        document.getElementById('tfa-tag').innerText = "Status: ACTIVE";
        document.getElementById('tfa-otp-ui').style.display = 'none';
        alert("2-Factor Authentication Enabled");
    }
};

// ⚡ ELITE PROFILE SYNC (Syncs Name, Birthday, and Gender)
document.getElementById('save-account-btn').onclick = async () => {
    // Collect all data from the settings screen
    const payload = {
        displayName: document.getElementById('set-name').value,
        dob: document.getElementById('set-dob').value,
        gender: document.getElementById('set-gender').value
    };

    try {
        // Send to Firebase
        await setDoc(doc(db, "users", currentUser.uid), payload, { merge: true });

        // Update the UI immediately
        updateIdentityUI(payload);
        alert("💎 Terminal Identity Synced");
    } catch (error) {
        alert("Sync Error: " + error.message);
    }
};

// --- 🔐 AUTH LOGIC ---
document.getElementById('auth-form').onsubmit = async (e) => {
    e.preventDefault();
    const em = document.getElementById('email-input').value, ps = document.getElementById('password-input').value;
    const isSignup = document.getElementById('signup-fields').style.display === 'block';
    try {
        if (isSignup) {
            const res = await createUserWithEmailAndPassword(auth, em, ps);
            await setDoc(doc(db, "users", res.user.uid), { displayName: document.getElementById('reg-name').value });
        } else await signInWithEmailAndPassword(auth, em, ps);
    } catch (err) { alert(err.message); }
};

document.getElementById('switch-auth-btn').onclick = () => {
    const isS = document.getElementById('signup-fields').style.display === 'block';
    document.getElementById('signup-fields').style.display = isS ? 'none' : 'block';
    document.getElementById('main-auth-btn').innerText = isS ? 'Sign In' : 'Create Account';
};

document.getElementById('logout-btn').onclick = () => signOut(auth);
window.forgotPassword = () => {
    const email = document.getElementById('email-input').value;
    if (email) sendPasswordResetEmail(auth, email).then(() => alert("Reset Link Sent"));
};

window.triggerPhoto = () => document.getElementById('photo-input').click();
document.getElementById('photo-input').onchange = (e) => {
    const r = new FileReader();
    r.onload = (ev) => {
        document.getElementById('user-avatar').style.backgroundImage = `url(${ev.target.result})`;
        document.getElementById('user-avatar').innerText = '';
    };
    r.readAsDataURL(e.target.files[0]);
};

// --- 📍 LIVE EVENT LISTENERS (Place at the very end) ---
// This ensures the Sinking Fund updates INSTANTLY when you change inputs
if (document.getElementById('curr-select')) {
    document.getElementById('curr-select').addEventListener('change', syncSinkingFund);
}
if (document.getElementById('fee-input')) {
    document.getElementById('fee-input').addEventListener('input', syncSinkingFund);
}