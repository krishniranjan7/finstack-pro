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
let currentUser = null, currentProgress = 0, globalPIN = null, localOTP = null;
let timerInterval = null, totalStudySessions = 0, studyStreak = 0, lastStudyDate = null;

// Enable Offline Mode
enableIndexedDbPersistence(db).catch(() => console.log("Persistence active"));

// --- 🧭 NAVIGATION ---
window.navigate = (view, el) => {
    // 1. Deactivate all old tabs
    document.querySelectorAll('.view-pane').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-item').forEach(i => i.classList.remove('active'));
    
    // 2. Activate new tab
    document.getElementById(`view-${view}`).classList.add('active');
    el.classList.add('active');
    
    // 3. ⚡ ELITE FIX: Scroll to top on navigation to prevent weird scroll states when switching tabs
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
    
    // 4. If user is on the study tab, sync the sinking fund calculator to ensure it reflects the latest progress and exchange rates
    if (view === 'study') syncSinkingFund();
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

        // --- SECURE ROUTING SYSTEM ---
        if (data.tfaEnabled) {
            // Route 1: 2FA Gate
            window.loginOTP = Math.floor(100000 + Math.random() * 900000);
            alert(`[SIMULATED SMS] Your FinStack Login Code is: ${window.loginOTP}`); // Simulating SMS
            document.getElementById('tfa-verification-screen').style.display = 'flex';
            lockScreen.style.display = 'none';
        } else if (data.pinEnabled && globalPIN) {
            // Route 2: PIN Gate
            lockScreen.style.display = 'flex';
            document.getElementById('tfa-verification-screen').style.display = 'none';
        } else {
            // Route 3: Direct Access
            lockScreen.style.display = 'none';
            document.getElementById('tfa-verification-screen').style.display = 'none';
            showDashboard();
        }

        // 🔥 NEW: LOAD BADGES AND STREAKS ON LOGIN
        totalStudySessions = data.studySessions || 0;
        studyStreak = data.studyStreak || 0;
        lastStudyDate = data.lastStudyDate || null;
        if (typeof updateGamificationUI === "function") updateGamificationUI();

        updateIdentityUI(data);
        syncACCA(data.accaState || []);
        initSQLite(); // 👈 Initializes Local DB, then triggers syncLedger & Tax
        initTaxLogic();
        if (typeof loadSecureNotes === "function") loadSecureNotes(); // 👈 ADD THIS EXACT LINE
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

// 🛡️ ONE-WAY CRYPTO HASH ENGINE
async function hashPIN(pin) {
    const msgBuffer = new TextEncoder().encode(pin.toString());
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

window.verifyPin = async () => {
    const val = document.getElementById('unlock-pin').value.trim();
    const hashedInput = await hashPIN(val); // Hash what they typed

    if (hashedInput === globalPIN) {
        showDashboard();
        document.getElementById('unlock-pin').value = '';
    } else {
        // Professional Shake Animation triggers via CSS class addition
        const pinCard = document.querySelector('.login-gate .login-card');
        pinCard.classList.add('shake');
        setTimeout(() => pinCard.classList.remove('shake'), 400);
        
        document.getElementById('unlock-pin').value = '';
    }
};

window.verifyLoginTFA = () => {
    const inputCode = document.getElementById('verify-tfa-code').value;
    
    if (inputCode == window.loginOTP) {
        document.getElementById('tfa-verification-screen').style.display = 'none';
        
        // 2FA cleared. Now check if they ALSO have a PIN lock enabled
        if (globalPIN) {
            document.getElementById('security-lock-screen').style.display = 'flex';
            const pinInput = document.getElementById('unlock-pin');
            if (pinInput) pinInput.focus();
        } else {
            showDashboard();
        }
        document.getElementById('verify-tfa-code').value = '';
    } else {
        // Professional shake animation for failure
        const tfaCard = document.querySelector('#tfa-verification-screen .login-card');
        tfaCard.classList.add('shake');
        setTimeout(() => tfaCard.classList.remove('shake'), 400);
        document.getElementById('verify-tfa-code').value = '';
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

// --- 🎓 ACCA TRACKER (LOCAL STORAGE + FIREBASE SYNC) ---
function syncACCA(saved) {
    const checks = document.querySelectorAll('.acca-check');
    const uid = currentUser?.uid || 'guest';
    
    // 1. Prioritize Firebase data on load, fallback to Local Storage
    let localState = JSON.parse(localStorage.getItem(`fs_acca_${uid}`)) || [];
    let activeState = (saved && saved.length > 0) ? saved : localState;

    checks.forEach((box, i) => { 
        if (activeState[i] !== undefined) box.checked = activeState[i]; 
    });
    
    updateACCAUI();

    checks.forEach(box => {
        box.onchange = async () => {
            const all = Array.from(checks).map(i => i.checked);
            currentProgress = all.filter(v => v).length;
            
            // ⚡ Instantly save to Local Storage
            localStorage.setItem(`fs_acca_${uid}`, JSON.stringify(all));
            
            // 🌐 Sync to Firebase if authenticated
            if (currentUser) {
                setDoc(doc(db, "users", currentUser.uid), { accaState: all, progress: currentProgress }, { merge: true });
            }
            updateACCAUI();
        };
    });
}

function updateACCAUI() {
    const checks = Array.from(document.querySelectorAll('.acca-check'));
    currentProgress = checks.filter(box => box.checked).length;
    
    document.getElementById('exam-overall-progress').value = currentProgress;
    document.getElementById('exam-progress-text').innerText = `${currentProgress}/13 Milestones Cleared`;

    // Calculate Micro-Progress for the 3 Tiers
    const levels = ['knowledge', 'skills', 'strategic'];
    levels.forEach(lvl => {
        const lvlChecks = checks.filter(b => b.dataset.level === lvl);
        const cleared = lvlChecks.filter(b => b.checked).length;
        const total = lvlChecks.length;
        
        const progBar = document.getElementById(`${lvl}-progress`);
        const fracText = document.getElementById(`${lvl}-fraction`);
        
        if (progBar) progBar.value = cleared;
        if (fracText) fracText.innerText = `${cleared}/${total}`;
    });
}

function updateWealthLogic() {
    let pot = currentProgress >= 13 ? "₹18L - ₹25L+" : (currentProgress >= 9 ? "₹12L - ₹15L" : "₹5L - ₹7L");
    document.getElementById('market-value-text').innerText = `Potential: ${pot}`;
    document.getElementById('wealth-msg').innerText = `Career Projection: ${currentProgress} Papers Unlocked`;
}

// --- 🎮 GAMIFICATION ENGINE (LOCAL STORAGE FIRST) ---
window.updateGamificationUI = () => {
    const uid = currentUser?.uid || 'guest';
    
    // 1. Pull directly from Local Storage for zero-latency
    totalStudySessions = parseInt(localStorage.getItem(`fs_sessions_${uid}`)) || totalStudySessions || 0;
    studyStreak = parseInt(localStorage.getItem(`fs_streak_${uid}`)) || studyStreak || 0;
    lastStudyDate = localStorage.getItem(`fs_last_study_${uid}`) || lastStudyDate || null;

    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Auto-break streak if inactive
    if (lastStudyDate && lastStudyDate !== todayStr && lastStudyDate !== yesterday.toDateString()) {
        studyStreak = 0; 
        localStorage.setItem(`fs_streak_${uid}`, 0);
    }

    const streakCountEl = document.getElementById('streak-count');
    if (streakCountEl) streakCountEl.innerText = `${studyStreak} Day${studyStreak !== 1 ? 's' : ''}`;
    
    const badges = [
        { id: 'b1', icon: '🥉', title: 'Bronze Mind', reqSessions: 1 },
        { id: 'b2', icon: '🥈', title: 'Silver Focus', reqSessions: 5 },
        { id: 'b3', icon: '🥇', title: 'Gold Mastery', reqSessions: 20 },
        { id: 'b4', icon: '🔥', title: '7-Day Titan', reqStreak: 7 },
        { id: 'b5', icon: '💎', title: 'Elite Status', reqSessions: 50 },
        { id: 'b6', icon: '🏆', title: 'ACCA Legend', reqSessions: 100 }
    ];

    const grid = document.getElementById('badge-grid');
    if (grid) {
        grid.innerHTML = badges.map(b => {
            let isUnlocked = false;
            if (b.reqSessions) isUnlocked = totalStudySessions >= b.reqSessions;
            if (b.reqStreak) isUnlocked = studyStreak >= b.reqStreak;
            
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

// ==========================================
// 🗄️ SQLITE OFFLINE STORAGE ENGINE (INDEXED-DB)
// ==========================================
let localDB = null;
let userGoal = { title: "ACCA Exam Fees (Default)", target: 14700 }; // Default Goal

// ⚡ Elite IndexedDB Wrapper (Bypasses 5MB limit)
const idb = {
    open: () => new Promise((res, rej) => {
        const req = indexedDB.open("FinstackDB", 1);
        req.onupgradeneeded = e => e.target.result.createObjectStore("ledgers");
        req.onsuccess = e => res(e.target.result);
        req.onerror = () => rej("IDB Error");
    }),
    get: async (key) => {
        const db = await idb.open();
        return new Promise(res => {
            const tx = db.transaction("ledgers", "readonly");
            const req = tx.objectStore("ledgers").get(key);
            req.onsuccess = () => res(req.result);
        });
    },
    set: async (key, val) => {
        const db = await idb.open();
        return new Promise(res => {
            const tx = db.transaction("ledgers", "readwrite");
            tx.objectStore("ledgers").put(val, key);
            tx.oncomplete = () => res();
        });
    }
};

window.initSQLite = async () => {
    const SQL = await window.initSqlJs({ locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.8.0/${file}` });
    
    // Fetch directly from IndexedDB as a raw binary array (Lightning Fast)
    const savedDB = await idb.get(`fs_ledger_${currentUser.uid}`);
    
    if (savedDB) {
        localDB = new SQL.Database(savedDB);
    } else {
        localDB = new SQL.Database();
        localDB.run("CREATE TABLE transactions (id TEXT PRIMARY KEY, text TEXT, category TEXT, amount REAL, time INTEGER);");
        localDB.run("CREATE TABLE tax_data (id TEXT PRIMARY KEY, salary REAL);");
        saveLocalDB();
    }
    
    // Load Custom Goal Profile
    const savedGoal = localStorage.getItem(`fs_goal_${currentUser.uid}`);
    if(savedGoal) userGoal = JSON.parse(savedGoal);
    
    syncLedger();
    initTaxLogic();
};

const saveLocalDB = () => {
    // Save raw binary directly. No more Base64 crashes.
    idb.set(`fs_ledger_${currentUser.uid}`, localDB.export());
};

// --- 💰 ELITE SQLITE LEDGER & RATIO ENGINE ---
window.syncLedger = () => {
    if (!localDB) return;
    
    const res = localDB.exec("SELECT id, text, category, amount, time FROM transactions ORDER BY time DESC");
    const t = res.length > 0 ? res[0].values.map(row => ({
        id: row[0], text: row[1], category: row[2], amount: row[3], time: row[4]
    })) : [];

    const inflow = t.filter(v => v.amount > 0).reduce((a, v) => a + v.amount, 0);
    const outflow = t.filter(v => v.amount < 0).reduce((a, v) => a + Math.abs(v.amount), 0);
    const balance = inflow - outflow;

    // 🔥 Ratio Analysis Engine
    const expenseRatio = inflow > 0 ? ((outflow / inflow) * 100).toFixed(1) : 0;
    const savingsRatio = inflow > 0 ? (((inflow - outflow) / inflow) * 100).toFixed(1) : 0;

    document.getElementById('balance').innerText = `₹${balance.toLocaleString('en-IN')}`;
    document.getElementById('money-plus').innerText = `₹${inflow.toLocaleString('en-IN')}`;
    document.getElementById('money-minus').innerText = `₹${outflow.toLocaleString('en-IN')}`;
    
    document.getElementById('savings-ratio').innerText = `${savingsRatio}% Saved`;
    document.getElementById('expense-ratio').innerText = `${expenseRatio}% Spent`;

    const forecast = Math.floor(balance * Math.pow(1.12, 10)) || 0;
    document.getElementById('wealth-insight').innerText = `₹${forecast.toLocaleString('en-IN')}`;

    // 🎯 Strategic Goal Engine
    const progressPct = Math.min((balance / userGoal.target) * 100, 100).toFixed(1);
    document.getElementById('goal-title').innerText = userGoal.title;
    document.getElementById('goal-target').innerText = `Target: ₹${userGoal.target.toLocaleString('en-IN')}`;
    document.getElementById('goal-current').innerText = `₹${Math.max(balance, 0).toLocaleString('en-IN')}`;
    document.getElementById('goal-progress-bar').style.width = `${progressPct}%`;

    // 📜 Render History UI
    const historyContainer = document.getElementById('transaction-history-list');
    if (historyContainer) {
        if (t.length === 0) {
            historyContainer.innerHTML = '<p style="text-align:center; color:#94a3b8; font-size:0.8rem;">No transactions yet.</p>';
        } else {
            historyContainer.innerHTML = t.map(tx => {
                const isIncome = tx.amount > 0;
                const amountClass = isIncome ? 'income' : 'expense';
                const prefix = isIncome ? '+' : '';
                const dateStr = new Date(tx.time).toLocaleDateString('en-IN', {day: 'numeric', month: 'short'});

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
};

document.getElementById('transaction-form').onsubmit = (e) => {
    e.preventDefault();
    if (!localDB) return alert("Database initializing... please wait.");
    
    const amt = parseFloat(document.getElementById('trans-amount').value);
    const cat = document.getElementById('trans-category').value;
    const textRaw = document.getElementById('trans-text').value.trim();
    const textValue = textRaw !== "" ? textRaw : "No Description";
    
    const finalAmt = cat === "Income" ? amt : -amt;
    const txId = Date.now().toString() + Math.floor(Math.random() * 1000);
    const time = Date.now();

    localDB.run("INSERT INTO transactions (id, text, category, amount, time) VALUES (?, ?, ?, ?, ?)", [txId, textValue, cat, finalAmt, time]);
    saveLocalDB();
    syncLedger();
    e.target.reset();
};

window.deleteTransaction = (docId) => {
    if(confirm("Delete transaction? Ratios and wealth forecast will immediately recalculate.")) {
        localDB.run("DELETE FROM transactions WHERE id = ?", [docId]);
        saveLocalDB();
        syncLedger();
    }
};

window.editGoal = () => {
    const newTitle = prompt("Enter goal description:", userGoal.title);
    if(!newTitle) return;
    const newTarget = prompt("Enter target amount (₹):", userGoal.target);
    if(!newTarget || isNaN(newTarget)) return;

    userGoal = { title: newTitle, target: parseFloat(newTarget) };
    localStorage.setItem(`fs_goal_${currentUser.uid}`, JSON.stringify(userGoal));
    syncLedger();
};

// --- 📊 TAX ENGINE (SQLite Powered) ---
function initTaxLogic() {
    const salaryInput = document.getElementById('annual-salary');
    
    if (localDB) {
        const res = localDB.exec("SELECT salary FROM tax_data WHERE id = 'current'");
        if (res.length > 0) {
            salaryInput.value = res[0].values[0][0];
            calculateTax(salaryInput.value);
        }
    }

    salaryInput.oninput = (e) => {
        const salary = parseFloat(e.target.value) || 0;
        calculateTax(salary);
        
        if (localDB) {
            localDB.run("INSERT OR REPLACE INTO tax_data (id, salary) VALUES ('current', ?)", [salary]);
            saveLocalDB();
        }
    };
}

function calculateTax(salary) {
    let tax = 0;
    if (salary > 1500000) tax = (salary - 1500000) * 0.3 + 150000;
    else if (salary > 1200000) tax = (salary - 1200000) * 0.2 + 90000;
    else if (salary > 900000) tax = (salary - 900000) * 0.15 + 45000;
    else if (salary > 600000) tax = (salary - 600000) * 0.1 + 15000;
    else if (salary > 300000) tax = (salary - 300000) * 0.05;

    document.getElementById('tax-amount').innerText = `₹${tax.toLocaleString('en-IN')}`;
    document.getElementById('take-home').innerText = `₹${Math.floor((salary - tax) / 12).toLocaleString('en-IN')}`;
}

// --- 🎮 MANUAL CLAIM REWARD ENGINE ---
window.claimDailyLogin = async () => {
    const uid = currentUser?.uid || 'guest';
    const todayStr = new Date().toDateString();
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Fetch latest from LS
    lastStudyDate = localStorage.getItem(`fs_last_study_${uid}`);
    studyStreak = parseInt(localStorage.getItem(`fs_streak_${uid}`)) || 0;

    if (lastStudyDate === todayStr) {
        alert("⚠️ You have already claimed your daily reward today. Come back tomorrow!");
        return;
    }

    if (lastStudyDate === yesterday.toDateString()) {
        studyStreak++; 
    } else {
        studyStreak = 1; 
    }
    
    lastStudyDate = todayStr;

    // ⚡ Local Storage Priority Write
    localStorage.setItem(`fs_streak_${uid}`, studyStreak);
    localStorage.setItem(`fs_last_study_${uid}`, lastStudyDate);

    // 🌐 Silent Firebase Sync
    if (currentUser) {
        setDoc(doc(db, "users", uid), { studyStreak, lastStudyDate }, { merge: true });
    }
    
    updateGamificationUI();
    alert("🔥 Daily Streak Claimed! Progress secured locally.");
};

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
                const uid = currentUser?.uid || 'guest';
                
                // 1. Update Sessions in Local Storage
                totalStudySessions = (parseInt(localStorage.getItem(`fs_sessions_${uid}`)) || 0) + 1;
                localStorage.setItem(`fs_sessions_${uid}`, totalStudySessions);
                
                const todayStr = new Date().toDateString();
                lastStudyDate = localStorage.getItem(`fs_last_study_${uid}`);
                studyStreak = parseInt(localStorage.getItem(`fs_streak_${uid}`)) || 0;

                // 2. Auto-manage the streak
                if (lastStudyDate !== todayStr) {
                    const yesterday = new Date();
                    yesterday.setDate(yesterday.getDate() - 1);
                    
                    if (lastStudyDate === yesterday.toDateString()) {
                        studyStreak++;
                    } else {
                        studyStreak = 1;
                    }
                    lastStudyDate = todayStr;
                    
                    localStorage.setItem(`fs_streak_${uid}`, studyStreak);
                    localStorage.setItem(`fs_last_study_${uid}`, lastStudyDate);
                }

                // 3. Silent Firebase Backup
                if (currentUser) {
                    setDoc(doc(db, "users", uid), { 
                        studySessions: totalStudySessions,
                        studyStreak: studyStreak,
                        lastStudyDate: lastStudyDate
                    }, { merge: true });
                }
                
                updateGamificationUI();
                updateACCAUI();
                
                alert("💎 Session Complete. Badge progress synced locally!");
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
    // --- 2FA UI SYNC LOGIC ---
    const tfaSetup = document.getElementById('tfa-setup-ui');
    const tfaDisable = document.getElementById('tfa-disable-ui');
    const tfaTag = document.getElementById('tfa-tag');

    if (data.tfaEnabled) {
        if (tfaSetup) tfaSetup.style.display = 'none';
        if (tfaDisable) tfaDisable.style.display = 'block';
        if (tfaTag) {
            tfaTag.innerText = "Status: ACTIVE 🟢";
            tfaTag.style.color = "var(--success)";
        }
    } else {
        if (tfaSetup) tfaSetup.style.display = 'block';
        if (tfaDisable) tfaDisable.style.display = 'none';
        if (tfaTag) {
            tfaTag.innerText = "Status: INACTIVE 🔴";
            tfaTag.style.color = "#94a3b8";
        }
    }
}

document.getElementById('pin-toggle').onchange = async (e) => {
    if (e.target.checked) {
        if (!globalPIN) document.getElementById('pin-area').style.display = 'block';
    } else {
        // REALITY FIX: If they turn it off, we must wipe the hash from the database
        document.getElementById('pin-area').style.display = 'none';
        globalPIN = null;
        await setDoc(doc(db, "users", currentUser.uid), { pinEnabled: false, securityPIN: null }, { merge: true });
        alert("🔓 App Lock Disabled");
    }
};

window.savePIN = async () => {
    const pin = document.getElementById('set-new-pin').value;
    if (pin.length === 4) {
        const hashedPin = await hashPIN(pin); // Secure it before transmission
        
        await setDoc(doc(db, "users", currentUser.uid), { pinEnabled: true, securityPIN: hashedPin }, { merge: true });
        
        globalPIN = hashedPin;
        document.getElementById('pin-area').style.display = 'none';
        alert("🔒 Bank-Grade PIN Secured Successfully");
    } else {
        alert("PIN must be exactly 4 digits.");
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
        
        // Hide setup inputs, show disable button
        document.getElementById('tfa-otp-ui').style.display = 'none';
        document.getElementById('tfa-setup-ui').style.display = 'none';
        document.getElementById('tfa-disable-ui').style.display = 'block';
        
        const tfaTag = document.getElementById('tfa-tag');
        tfaTag.innerText = "Status: ACTIVE 🟢";
        tfaTag.style.color = "var(--success)";
        
        alert("🛡️ 2-Factor Authentication Enabled");
        document.getElementById('otp-code').value = ''; // Input box clean kar do
    } else {
        alert("Incorrect OTP");
    }
};

window.disableTFA = async () => {
    // REALITY CHECK: Disabling 2FA should require confirmation due to security implications
    if (confirm("Are you sure you want to disable 2-Factor Authentication? This reduces your account security.")) {
        
        // Set the TFA status to false in Firebase
        await setDoc(doc(db, "users", currentUser.uid), { tfaEnabled: false }, { merge: true });
        
        // Update the UI immediately
        document.getElementById('tfa-setup-ui').style.display = 'block';
        document.getElementById('tfa-disable-ui').style.display = 'none';
        
        const tfaTag = document.getElementById('tfa-tag');
        tfaTag.innerText = "Status: INACTIVE 🔴";
        tfaTag.style.color = "#94a3b8";
        
        alert("🔓 2-Factor Authentication Disabled Successfully");
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

// --- 1. CAREER VISUALIZER ---
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

// --- 2. SECURE NOTES ENGINE (AES-256 UPGRADED) ---
const notesInput = document.getElementById('local-notes');
const notesStatus = document.getElementById('notes-status');

window.loadSecureNotes = () => {
    if (!notesInput || !currentUser) return;
    const encryptedData = localStorage.getItem(`fs_notes_${currentUser.uid}`);
    
    if (encryptedData) {
        try {
            // Decrypt using user's unique UID as the master key
            const bytes = CryptoJS.AES.decrypt(encryptedData, currentUser.uid + "-fs-elite");
            notesInput.value = bytes.toString(CryptoJS.enc.Utf8);
        } catch (e) {
            console.log("Decryption failed. Data corrupted or key mismatch.");
            notesInput.value = "";
        }
    } else {
        notesInput.value = "";
    }
    notesStatus.innerText = "Status: AES-256 Secured";
    notesStatus.style.color = "var(--success)";
};

if (notesInput) {
    notesInput.addEventListener('input', () => {
        notesStatus.innerText = "Encrypting...";
        notesStatus.style.color = "#94a3b8";
        
        clearTimeout(window.notesTimer);
        window.notesTimer = setTimeout(() => {
            saveNotes();
        }, 1000);
    });
}

window.saveNotes = () => {
    if (!notesInput || !currentUser) return;
    // Encrypt the plain text before it ever touches the hard drive
    const encryptedData = CryptoJS.AES.encrypt(notesInput.value, currentUser.uid + "-fs-elite").toString();
    localStorage.setItem(`fs_notes_${currentUser.uid}`, encryptedData);
    
    notesStatus.innerText = "Status: AES Encrypted & Saved";
    notesStatus.style.color = "var(--success)";
};