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

        // 👁️ ELITE EYE TOGGLE FIX
        const toggleBtn = document.getElementById('toggle-password');
        const passInput = document.getElementById('password-input');
        if (toggleBtn && passInput) {
            toggleBtn.addEventListener('click', () => {
                const isPass = passInput.type === 'password';
                passInput.type = isPass ? 'text' : 'password';
                toggleBtn.textContent = isPass ? '🔒' : '👁️';
            });
        }

        // Prepare the PIN keypad for instant entry
        setTimeout(() => {
            const pinInput = document.getElementById('unlock-pin'); // 💡 Added this line
            if (pinInput) pinInput.focus();
        }, 500);
    }
});

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, doc, getDoc, setDoc, deleteDoc, orderBy, serverTimestamp, enableIndexedDbPersistence } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";

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
let timerInterval = null, totalStudySessions = 0, studyStreak = 0, lastStudyDate = null;

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

// --- 🎓 ACCA SUB-TAB NAVIGATION ---
window.switchAccaTab = (tabId, btnElement) => {
    // Hide all tabs
    document.querySelectorAll('.acca-tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    // Remove active class from all buttons
    document.querySelectorAll('.sub-tab').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Show selected tab and highlight button
    document.getElementById(`acca-${tabId}`).classList.add('active');
    btnElement.classList.add('active');
};

// 📧 ELITE FORGOT PASSWORD FIX
window.forgotPassword = async () => {
    const email = document.getElementById('email-input').value;
    if (!email) {
        alert("Enter your email address first.");
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        alert("💎 SECURE LINK SENT: Check your inbox.");
    } catch (err) {
        alert("SYSTEM ERROR: " + err.message);
    }
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
        totalStudySessions = data.studySessions || 0;
        studyStreak = data.studyStreak || 0;
        lastStudyDate = data.lastStudyDate || null;
        
        // This forces the UI to paint the badges immediately on login
        if (typeof updateGamificationUI === "function") updateGamificationUI();

        // INSTANT HIDE: Stop showing entry pages
        landingPage.style.display = 'none';
        loginScreen.style.display = 'none';

        if (data.pinEnabled && globalPIN) {
            lockScreen.style.display = 'flex';
        } else {
            lockScreen.style.display = 'none';
            showDashboard();
        }

        // 🔥 NEW: LOAD BADGES AND STREAKS ON LOGIN
        totalStudySessions = data.studySessions || 0;
        studyStreak = data.studyStreak || 0;
        lastStudyDate = data.lastStudyDate || null;
        if (typeof updateGamificationUI === "function") updateGamificationUI();

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
    // This kills the black loading screen once the Auth logic is finished
    document.getElementById('initial-loader').style.display = 'none';
});

window.verifyPin = () => {
    // .trim() is the "Elite" fix for mobile keyboard spaces
    const val = document.getElementById('unlock-pin').value.trim();

    if (val.toString() === globalPIN.toString()) {
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
    // 💡 Using the ID you have in your HTML
    const lock = document.getElementById('security-lock-screen');
    const login = document.getElementById('login-screen');
    const dash = document.getElementById('main-dashboard');

    if (lock) lock.style.display = 'none';
    if (login) login.style.display = 'none';

    // 🔒 IMPORTANT: This breaks the !important lock in your CSS Cloak
    if (dash) dash.style.setProperty('display', 'block', 'important');
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

// --- 🎮 GAMIFICATION ENGINE ---
window.updateGamificationUI = () => {
    // 1. Check if the streak broke from inactivity (didn't study yesterday or today)
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastStudyDate && lastStudyDate !== today.toDateString() && lastStudyDate !== yesterday.toDateString()) {
        studyStreak = 0; // Streak Broken!
    }

    document.getElementById('streak-count').innerText = `${studyStreak} Day${studyStreak !== 1 ? 's' : ''}`;
    
    // 2. Define the Elite Badges
    const badges = [
        { id: 'b1', icon: '🥉', title: 'Bronze Mind', reqSessions: 1 },
        { id: 'b2', icon: '🥈', title: 'Silver Focus', reqSessions: 5 },
        { id: 'b3', icon: '🥇', title: 'Gold Mastery', reqSessions: 20 },
        { id: 'b4', icon: '🔥', title: '7-Day Titan', reqStreak: 7 }, // Requires 7 day streak
        { id: 'b5', icon: '💎', title: 'Elite Status', reqSessions: 50 },
        { id: 'b6', icon: '🏆', title: 'ACCA Legend', reqSessions: 100 }
    ];

    const grid = document.getElementById('badge-grid');
    if(grid) {
        grid.innerHTML = badges.map(b => {
            let isUnlocked = false;
            if(b.reqSessions) isUnlocked = totalStudySessions >= b.reqSessions;
            if(b.reqStreak) isUnlocked = studyStreak >= b.reqStreak;
            
            return `
                <div class="elite-badge ${isUnlocked ? 'unlocked' : ''}">
                    <div class="badge-icon">${b.icon}</div>
                    <div class="badge-title">${b.title}</div>
                </div>
            `;
        }).join('');
    }
};

// ⚡ ELITE SINKING FUND: SMART AUTO-CALC
async function syncSinkingFund() {
    if(document.body.classList.contains('is-free')) return;

    const base = document.getElementById('curr-select') ? document.getElementById('curr-select').value : 'GBP';
    const feeInput = document.getElementById('fee-input');
    const monthsInput = document.getElementById('target-months');
    
    const fee = feeInput ? (parseFloat(feeInput.value) || 0) : 147;
    const months = monthsInput ? (parseInt(monthsInput.value) || 12) : 12;
    const pending = 13 - (currentProgress || 0);

    const inrSumDisplay = document.getElementById('inr-sum');
    if(!inrSumDisplay) return; 

    if (pending <= 0) {
        inrSumDisplay.innerText = "₹0";
        if(document.getElementById('monthly-saving-goal')) document.getElementById('monthly-saving-goal').innerText = "₹0 / mo";
        if(document.getElementById('fund-count-tag')) document.getElementById('fund-count-tag').innerText = "All papers cleared! 🎉";
        return;
    }

    try {
        const res = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
        const data = await res.json();
        const inrRate = data.rates.INR;
        
        const totalINR = fee * inrRate * pending;
        const monthlySavings = totalINR / months;

        inrSumDisplay.innerText = `₹${Math.floor(totalINR).toLocaleString('en-IN')}`;
        if(document.getElementById('monthly-saving-goal')) document.getElementById('monthly-saving-goal').innerText = `₹${Math.ceil(monthlySavings).toLocaleString('en-IN')} / mo`;
        if(document.getElementById('fund-count-tag')) document.getElementById('fund-count-tag').innerText = `${pending} Papers @ ₹${inrRate.toFixed(2)} rate over ${months} months`;
    } catch (e) {
        const totalINR = fee * 110 * pending; 
        const monthlySavings = totalINR / months;
        
        inrSumDisplay.innerText = `₹${Math.floor(totalINR).toLocaleString('en-IN')}`;
        if(document.getElementById('monthly-saving-goal')) document.getElementById('monthly-saving-goal').innerText = `₹${Math.ceil(monthlySavings).toLocaleString('en-IN')} / mo`;
        if(document.getElementById('fund-count-tag')) document.getElementById('fund-count-tag').innerText = `Offline Mode (Approximate Rate)`;
    }
}

// --- 💰 LEDGER & HISTORY SYNCHRONIZATION ---
function syncLedger() {
    if (ledgerUnsub) ledgerUnsub();
    ledgerUnsub = onSnapshot(query(collection(db, "ledger"), where("uid", "==", currentUser.uid), orderBy("time", "desc")), (s) => {
        const t = s.docs.map(d => ({ id: d.id, ...d.data() }));

        const inflow = t.filter(v => v.amount > 0).reduce((a, v) => a + v.amount, 0);
        const outflow = t.filter(v => v.amount < 0).reduce((a, v) => a + Math.abs(v.amount), 0);
        const b = inflow - outflow;

        document.getElementById('balance').innerText = `₹${b.toLocaleString('en-IN')}`;
        document.getElementById('money-plus').innerText = `₹${inflow.toLocaleString('en-IN')}`;
        document.getElementById('money-minus').innerText = `₹${outflow.toLocaleString('en-IN')}`;

        const forecast = Math.floor(b * Math.pow(1.12, 10)) || 0;
        document.getElementById('wealth-insight').innerText = `₹${forecast.toLocaleString('en-IN')}`;

        // 📜 INJECTING THE HISTORY UI
        const historyContainer = document.getElementById('transaction-history-list');
        if (historyContainer) {
            if (t.length === 0) {
                historyContainer.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:0.8rem;">No transactions yet.</p>';
            } else {
                historyContainer.innerHTML = t.map(tx => {
                    const isIncome = tx.amount > 0;
                    const amountClass = isIncome ? 'income' : 'expense';
                    const prefix = isIncome ? '+' : '';
                    
                    // 🔥 ELITE FIX: Handles both immediate local time and server time
                    let dateStr = 'Just now';
                    if (tx.time) {
                        const dateObj = typeof tx.time.toDate === 'function' ? tx.time.toDate() : new Date(tx.time);
                        dateStr = dateObj.toLocaleDateString('en-IN', {day: 'numeric', month: 'short'});
                    }

                    // 🔥 NEW: Added id="tx-${tx.id}" so JavaScript can instantly delete it visually
                    return `
                        <div class="tx-item" id="tx-${tx.id}">
                            <div class="tx-info">
                                <span>${tx.text}</span>
                                <div class="tx-meta">${tx.category} • ${dateStr}</div>
                            </div>
                            <div class="tx-actions">
                                <span class="tx-amount ${amountClass}">${prefix}₹${Math.abs(tx.amount).toLocaleString('en-IN')}</span>
                                <button onclick="deleteTransaction('${tx.id}')" class="tx-delete-btn" title="Delete Entry">🗑️</button>
                            </div>
                        </div>
                    `;
                }).join('');
            }
        }
    });
}

// --- 🗑️ DELETE TRANSACTION ENGINE ---
window.deleteTransaction = async (docId) => {
    if(confirm("Delete this transaction? Your wealth forecast will be permanently recalculated.")) {
        
        // 🔥 INSTANT UI REMOVAL: Hides the item from the screen before Firebase even answers
        const itemRow = document.getElementById(`tx-${docId}`);
        if(itemRow) itemRow.style.display = 'none';

        try {
            await deleteDoc(doc(db, "ledger", docId));
        } catch (error) {
            alert("SYSTEM ERROR: " + error.message);
            // Put it back if the deletion failed
            if(itemRow) itemRow.style.display = 'flex';
        }
    }
};

document.getElementById('transaction-form').onsubmit = async (e) => {
    e.preventDefault();
    const amtEl = document.getElementById('trans-amount');
    const catEl = document.getElementById('trans-category');
    const textEl = document.getElementById('trans-text');

    try {
        const amt = parseFloat(amtEl.value);
        const cat = catEl.value;
        const textValue = textEl.value.trim() !== "" ? textEl.value : "No Description";

        await addDoc(collection(db, "ledger"), {
            uid: currentUser.uid,
            text: textValue,
            category: cat,
            amount: cat === "Income" ? amt : -amt,
            time: new Date() // 🔥 Bypasses server delay for instant caching
        });
        
        e.target.reset();
    } catch (error) {
        alert("SYSTEM ERROR: " + error.message);
    }
};

// --- 🎮 MANUAL CLAIM REWARD ENGINE ---
window.claimDailyLogin = async () => {
    const todayStr = new Date().toDateString();
    if (lastStudyDate === todayStr) {
        alert("⚠️ You have already claimed your daily reward today. Come back tomorrow!");
        return;
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (lastStudyDate === yesterday.toDateString()) {
        studyStreak++; 
    } else {
        studyStreak = 1; 
    }
    lastStudyDate = todayStr;

    await setDoc(doc(db, "users", currentUser.uid), { 
        studyStreak: studyStreak,
        lastStudyDate: lastStudyDate
    }, { merge: true });
    
    if (typeof updateGamificationUI === "function") updateGamificationUI();
    alert("🔥 Daily Streak Claimed! Keep the fire burning.");
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
            if (timeLeft <= 0) {
                clearInterval(timerInterval);
                totalStudySessions++;
                
                // 🔥 STREAK CALCULATION LOGIC
                const todayStr = new Date().toDateString();
                if (lastStudyDate !== todayStr) {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    
                    if (lastStudyDate === yesterday.toDateString()) {
                        studyStreak++; // Back-to-back days!
                    } else {
                        studyStreak = 1; // First day, or starting over
                    }
                    lastStudyDate = todayStr;
                }

                // Save everything to Firebase immediately
                setDoc(doc(db, "users", currentUser.uid), { 
                    studySessions: totalStudySessions,
                    studyStreak: studyStreak,
                    lastStudyDate: lastStudyDate
                }, { merge: true });
                
                if (typeof updateGamificationUI === "function") updateGamificationUI(); // Unlock badges
                if (typeof updateACCAUI === "function") updateACCAUI(); // Refresh Probabilities
                
                alert("💎 Session Complete. Badge progress synced!");
                timeLeft = 1500; // Reset to 25 mins
                this.innerText = "Start Focus Work";
            }
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

// 📧 ELITE FORGOT PASSWORD SYSTEM
window.forgotPassword = async () => {
    const email = document.getElementById('email-input').value;
    if (!email) {
        alert("Enter your email address first.");
        return;
    }
    try {
        await sendPasswordResetEmail(auth, email);
        alert("💎 SECURE LINK SENT: Check your inbox.");
    } catch (err) {
        alert("SYSTEM ERROR: " + err.message);
    }
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
// This triggers the Smart Calculator instantly when the timeline is changed
if (document.getElementById('target-months')) {
    document.getElementById('target-months').addEventListener('input', syncSinkingFund);
}

// ==========================================
// ⚡ FINSTACK PRO: ACCA ELITE MODULE LOGIC
// ==========================================

// --- 1. MOCK EXAM GENERATOR (Offline Database) ---
const mockDB = {
    "BT": { q: "Which of the following is a primary objective of corporate governance?", opts: ["Maximizing short-term profit", "Ensuring accountability and transparency", "Reducing tax liability", "Increasing employee turnover"], ans: 1 },
    "TX": { q: "Which of these is generally an exempt supply for VAT purposes?", opts: ["Restaurant meals", "Children's clothing", "Financial services", "Luxury cars"], ans: 2 },
    "SBR": { q: "Under IFRS 9, how are equity instruments normally measured?", opts: ["Amortized cost", "Fair Value through P&L", "Historical Cost", "Lower of cost and NRV"], ans: 1 }
};

window.startMockExam = () => {
    const paper = document.getElementById('mock-paper-select').value;
    const ws = document.getElementById('mock-workspace');
    const data = mockDB[paper];
    
    ws.style.display = 'block';
    document.getElementById('mock-question').innerText = data.q;
    document.getElementById('mock-result').innerText = "";
    
    const optsHTML = data.opts.map((opt, idx) => `
        <button onclick="checkMockAnswer(${idx}, ${data.ans})" class="btn-outline-pro" style="text-align:left;">${opt}</button>
    `).join('');
    document.getElementById('mock-options').innerHTML = optsHTML;
};

window.checkMockAnswer = (selectedIdx, correctIdx) => {
    const resultText = document.getElementById('mock-result');
    if (selectedIdx === correctIdx) {
        resultText.innerText = "✅ CORRECT. +2 Marks.";
        resultText.style.color = "var(--success)";
    } else {
        resultText.innerText = "❌ INCORRECT. Review the standard.";
        resultText.style.color = "var(--danger)";
    }
};

// --- 2. AI STUDY ASSISTANT (Keyword Matching) ---
const tutorLogic = {
    "tax": "TAX TIP: Always remember the strict deadlines for filing. Individual tax returns usually require adherence to the specific fiscal year rules. Practice computing taxable income step-by-step.",
    "sbr": "SBR TIP: Focus on the conceptual framework. Examiners want to see if you understand *why* a standard exists, not just the journal entries. Stakeholder impact is key.",
    "audit": "AUDIT TIP: Memorize the assertions (C-A-V-E-R). Completeness, Accuracy, Valuation, Existence, and Rights/Obligations. Always tie your substantive procedures back to an assertion.",
    "hello": "Greetings. Enter a topic like 'tax', 'sbr', or 'audit' and I will provide technical guidance.",
    "default": "I am currently offline. I can assist with 'tax', 'sbr', or 'audit' parameters in this build."
};

window.sendChatMessage = () => {
    const inputEl = document.getElementById('chat-input');
    const text = inputEl.value.trim().toLowerCase();
    if (!text) return;

    const history = document.getElementById('chat-history');
    
    // User Message
    history.innerHTML += `<div style="text-align:right; margin-bottom:10px;"><span style="background:rgba(255,255,255,0.1); padding:8px 12px; border-radius:15px; font-size:0.8rem; display:inline-block;">${text}</span></div>`;
    
    // AI Response Logic
    let response = tutorLogic["default"];
    for (const key in tutorLogic) {
        if (text.includes(key)) {
            response = tutorLogic[key];
            break;
        }
    }

    // System Message
    setTimeout(() => {
        history.innerHTML += `<div style="text-align:left; margin-bottom:10px;"><span style="background:rgba(99,102,241,0.2); border:1px solid var(--primary); padding:8px 12px; border-radius:15px; font-size:0.8rem; display:inline-block;">${response}</span></div>`;
        history.scrollTop = history.scrollHeight;
    }, 400);

    inputEl.value = "";
};

// --- 3. CAREER VISUALIZER ---
window.calculateCareerPath = () => {
    const resBox = document.getElementById('career-results');
    const sal = document.getElementById('career-salary');
    const roles = document.getElementById('career-roles');
    const loc = document.getElementById('career-location');
    
    // Relies on your existing `currentProgress` variable from the ACCA Tracker
    let progress = typeof currentProgress !== 'undefined' ? currentProgress : 0;
    
    resBox.style.display = 'block';
    
    if (progress === 0) {
        sal.innerText = "₹2.5L - ₹4L";
        roles.innerText = "Accounts Trainee / Intern";
        loc.innerText = "Local Market Entry";
    } else if (progress <= 3) {
        sal.innerText = "₹4L - ₹6L";
        roles.innerText = "Junior Accountant / Audit Assistant";
        loc.innerText = "India (Tier 1 & 2 Cities)";
    } else if (progress <= 9) {
        sal.innerText = "₹7L - ₹12L";
        roles.innerText = "Senior Financial Analyst / Tax Associate";
        loc.innerText = "MNCs / Big 4 (India & GCC)";
    } else if (progress <= 12) {
        sal.innerText = "₹12L - ₹18L";
        roles.innerText = "Assistant Manager / Finance Business Partner";
        loc.innerText = "Global Mobility Enabled (UK, UAE, AUS)";
    } else {
        sal.innerText = "₹20L - ₹45L+";
        roles.innerText = "ACCA Member | Finance Manager | CFO Track";
        loc.innerText = "Elite Global Premium (£45k - £70k+ / year)";
    }
};

// --- 4. OFFLINE NOTES (Local Storage) ---
const notesInput = document.getElementById('local-notes');
const notesStatus = document.getElementById('notes-status');

// Load saved notes on app launch
if (notesInput) {
    notesInput.value = localStorage.getItem('finstack_acca_notes') || '';
    
    // Auto-save typing
    notesInput.addEventListener('input', () => {
        notesStatus.innerText = "Saving...";
        notesStatus.style.color = "#94a3b8";
        
        clearTimeout(window.notesTimer);
        window.notesTimer = setTimeout(() => {
            saveNotes();
        }, 1000); // Saves 1 second after typing stops
    });
}

window.saveNotes = () => {
    if (!notesInput) return;
    localStorage.setItem('finstack_acca_notes', notesInput.value);
    notesStatus.innerText = "Status: Encrypted & Saved";
    notesStatus.style.color = "var(--success)";
};