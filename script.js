let ledger = [];
let sessionHash = null;
let db = null;
let myChartInstance = null;
let isVoting = false;
let audioCtx = null;

const LS_KEY = 'official_vote_v5';
const IDB_DB = 'GovSystemDB';
const IDB_STORE = 'ledger';
const VVPAT_DISPLAY_TIME = 7000;
const VVPAT_DROP_TIME = 600;

const candidates = [
    { id: '1', name: 'Bharatiya Janata Party', party: 'BJP', logo: 'assets/img/party_bjp.png', color: '#FF9933', cssClass: 'bg-orange' },
    { id: '2', name: 'Janata Dal', party: 'JD(U)', logo: 'assets/img/party_jdu.png', color: '#2ecc71', cssClass: 'bg-green' },
    { id: '3', name: 'Aam Aadmi Party', party: 'AAP', logo: 'assets/img/party_aap.png', color: '#f1c40f', cssClass: 'bg-yellow' },
    { id: '4', name: 'National People Party', party: 'NPP', logo: 'assets/img/party_npp.png', color: '#9b59b6', cssClass: 'bg-magenta' },
    { id: '5', name: 'Indian National Congress', party: 'INC', logo: 'assets/img/party_inc.png', color: '#19AAED', cssClass: 'bg-blue' },
    { id: '6', name: 'None of the above', party: 'NOTA', logo: 'assets/img/party_nota.png', color: '#95A5A6', cssClass: 'bg-olive' }
];

async function initSystem() {
    try {
        updateSystemClock();
        makeSessionCode();

        await openMyDatabase();
        loadMyLocalData();
        await syncMyData();

        checkMyData();
        setupMyButtons();
        setupKeyboardShortcuts();
    } catch (error) {
        console.error(error);
    }
}

function updateSystemClock() {
    let timerArea = document.getElementById('live-timer');
    setInterval(function () {
        let now = new Date();
        if (timerArea) timerArea.innerText = now.toLocaleDateString() + ' | ' + now.toLocaleTimeString() + ' | SYSTEM ONLINE';
    }, 1000);
}

function toggleLanguage() {
    document.body.classList.toggle('show-hindi');
}

function makeSessionCode() {
    let code = Math.random().toString(36).substring(2, 8).toUpperCase();
    let sc = document.getElementById('session-code');
    if (sc) sc.innerText = code;
}

function openMyDatabase() {
    return new Promise(function (resolve, reject) {
        let request = indexedDB.open(IDB_DB, 1);
        request.onupgradeneeded = function (e) {
            let database = e.target.result;
            if (!database.objectStoreNames.contains(IDB_STORE)) {
                database.createObjectStore(IDB_STORE, { keyPath: "id" });
            }
        };
        request.onsuccess = function (e) {
            db = e.target.result;
            resolve(db);
        };
        request.onerror = function (e) {
            reject(e);
        };
    });
}

function loadMyLocalData() {
    let data = localStorage.getItem(LS_KEY);
    if (data) {
        ledger = JSON.parse(data);
    } else {
        ledger = [];
    }
}

async function syncMyData() {
    if (!db) return;
    let transaction = db.transaction(IDB_STORE, "readwrite");
    let store = transaction.objectStore(IDB_STORE);

    for (let i = 0; i < ledger.length; i++) {
        store.put({ id: ledger[i].hash, ...ledger[i] });
    }

    return new Promise(function (resolve) {
        let req = store.getAll();
        req.onsuccess = function (e) {
            let idbData = e.target.result;
            let localHashes = ledger.map(l => l.hash);

            for (let i = 0; i < idbData.length; i++) {
                if (localHashes.indexOf(idbData[i].id) === -1) {
                    ledger.push({ hash: idbData[i].id, ...idbData[i] });
                }
            }
            localStorage.setItem(LS_KEY, JSON.stringify(ledger));
            resolve();
        };
    });
}

function checkMyData() {
    let metaKey = LS_KEY + '_meta';
    let expected = parseInt(localStorage.getItem(metaKey) || "0");
    if (ledger.length < expected) {
        let ia = document.getElementById('integrity-announcement');
        if (ia) ia.innerHTML = '<div class="gov-warning">Integrity Error</div>';
    }
}

async function getMyHash(input) {
    let hash = 0;
    let str = input.toUpperCase().trim();
    for (let i = 0; i < str.length; i++) {
        let char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return Math.abs(hash).toString(16);
}

function goToView(viewName) {
    let allSections = document.querySelectorAll('section');
    allSections.forEach(s => s.classList.add('d-none'));
    let target = document.getElementById('view-' + viewName);
    if (target) target.classList.remove('d-none');
    if (viewName === 'results') {
        showMyResults();
    }
}

async function loginUser() {
    let inputEl = document.getElementById('voter-id-input');
    let userInput = inputEl ? inputEl.value.trim() : "";
    let errorArea = document.getElementById('login-error');
    let loginBtn = document.getElementById('btn-login');

    if (errorArea) errorArea.classList.add('d-none');
    if (loginBtn) loginBtn.disabled = true;

    if (userInput.length < 5 || !/^[A-Za-z0-9]+$/.test(userInput)) {
        if (errorArea) errorArea.classList.remove('d-none');
        if (loginBtn) loginBtn.disabled = false;
        return;
    }

    try {
        sessionHash = await getMyHash(userInput);
        let alreadyVoted = ledger.some(record => record.hash === sessionHash);

        if (alreadyVoted) {
            showError('Already Voted');
        } else {
            showBallot();
            goToView('ballot');
        }
    } catch (error) {
        console.error(error);
        showError('Login Failed');
    } finally {
        if (loginBtn) loginBtn.disabled = false;
    }
}

function handleAdminLogin() {
    let user = prompt("Official ID:");
    let pass = prompt("Password:");
    if (user === 'ADMIN' && pass === 'ECI2024') {
        goToView('results');
    } else {
        alert("Access Denied");
    }
}

function showBallot() {
    let container = document.getElementById('evm-rows');
    if (!container) return;
    container.innerHTML = '';

    candidates.forEach((c, i) => {
        let serial = (i + 1).toString().padStart(2, '0');
        container.innerHTML += `
            <div class="candidate-row" id="row-${c.id}">
                <div class="col-serial">${serial}</div>
                <div class="col-details">
                    <div class="c-name">${c.name}</div>
                    <img src="${c.logo}" class="c-symbol" alt="${c.party}">
                </div>
                <div class="col-action">
                    <div class="led-bulb" id="led-${c.id}"></div>
                    <button class="evm-button" onclick="pressBlueButton('${c.id}', ${i})" id="btn-${c.id}"></button>
                </div>
            </div>
        `;
    });
}

function playBeep() {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.type = 'square';
    osc.frequency.setValueAtTime(2000, audioCtx.currentTime);
    gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0.5, audioCtx.currentTime + 0.1);
    gain.gain.linearRampToValueAtTime(0.1, audioCtx.currentTime + 1.5);
    gain.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 2.0);
    osc.start();
    osc.stop(audioCtx.currentTime + 2.0);
}

async function runVVPATSequence(candidate) {
    let glass = document.getElementById('vvpat-glass');
    let slip = document.getElementById('vvpat-slip');
    let candidateIndex = candidates.findIndex(c => c.id === candidate.id);
    document.getElementById('v-serial').innerText = (candidateIndex + 1).toString().padStart(2, '0');
    document.getElementById('v-name').innerText = candidate.name;
    let symbolImg = document.getElementById('v-symbol');
    symbolImg.src = candidate.logo;
    symbolImg.alt = candidate.party;
    if (glass) glass.classList.add('lit');
    if (slip) {
        slip.classList.remove('drop');
        slip.classList.add('visible');
    }
    await new Promise(r => setTimeout(r, VVPAT_DISPLAY_TIME));
    if (slip) {
        slip.classList.remove('visible');
        slip.classList.add('drop');
    }
    await new Promise(r => setTimeout(r, VVPAT_DROP_TIME));
    if (glass) glass.classList.remove('lit');
}

async function pressBlueButton(cid, index) {
    if (isVoting) return;
    showConfirmation(cid, index);
}

function showConfirmation(cid, index) {
    const modal = document.getElementById('confirmation-modal');
    const nameDisplay = document.getElementById('confirm-candidate-name');
    const confirmBtn = document.getElementById('btn-modal-confirm');
    const cancelBtn = document.getElementById('btn-modal-cancel');

    if (!modal || !nameDisplay || !confirmBtn || !cancelBtn) return;

    nameDisplay.innerText = candidates[index].name;
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');

    confirmBtn.onclick = () => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
        proceedWithVote(cid, index);
    };

    cancelBtn.onclick = () => {
        modal.classList.remove('active');
        modal.setAttribute('aria-hidden', 'true');
    };
}

async function proceedWithVote(cid, index) {
    isVoting = true;
    document.querySelectorAll('.evm-button').forEach(b => b.disabled = true);
    let led = document.getElementById('led-' + cid);
    if (led) led.classList.add('active');
    playBeep();
    await runVVPATSequence(candidates[index]);
    if (led) led.classList.remove('active');
    saveVoteInternal(cid);
    isVoting = false;
}

function saveVoteInternal(cid) {
    let newRecord = { hash: sessionHash, candidateId: cid, ts: new Date().toISOString() };
    ledger.push(newRecord);
    localStorage.setItem(LS_KEY, JSON.stringify(ledger));
    localStorage.setItem(LS_KEY + '_meta', ledger.length.toString());
    if (db) {
        let tx = db.transaction(IDB_STORE, "readwrite");
        tx.objectStore(IDB_STORE).put({ id: sessionHash, ...newRecord });
    }
    setTimeout(() => {
        goToView('results');
    }, 1500);
}

function showMyResults() {
    let counts = {};
    candidates.forEach(c => counts[c.party] = 0);
    ledger.forEach(entry => {
        if (entry.candidateId) {
            let candidate = candidates.find(c => c.id === entry.candidateId);
            if (candidate) counts[candidate.party]++;
        } else if (entry.vote && counts[entry.vote] !== undefined) {
            counts[entry.vote]++;
        }
    });

    let cardContainer = document.getElementById('scorecards');
    if (cardContainer) {
        cardContainer.innerHTML = '';
        candidates.forEach(c => {
            let card = document.createElement('div');
            card.className = `result-card ${c.cssClass || 'bg-blue'}`;
            card.innerHTML = `<h4>${c.party}</h4><div class="count">${counts[c.party]}</div>`;
            cardContainer.appendChild(card);
        });
    }

    let canvas = document.getElementById('resultsChart');
    if (!canvas) return;
    let ctx = canvas.getContext('2d');
    if (myChartInstance) myChartInstance.destroy();
    let totalV = Object.values(counts).reduce((a, b) => a + b, 0);

    if (totalV === 0) {
        myChartInstance = new Chart(ctx, {
            type: 'pie',
            data: { labels: ['No Votes Cast'], datasets: [{ data: [1], backgroundColor: ['#e0e0e0'] }] },
            options: { responsive: true, maintainAspectRatio: false }
        });
    } else {
        myChartInstance = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: candidates.map(c => c.party),
                datasets: [{
                    data: candidates.map(c => counts[c.party]),
                    backgroundColor: candidates.map(c => c.color)
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: {
                        callbacks: {
                            label: function (context) {
                                let val = context.raw;
                                let pct = ((val / totalV) * 100).toFixed(1);
                                return `${context.label}: ${val} votes (${pct}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
}

function setupMyButtons() {
    let loginBtn = document.getElementById('btn-login');
    if (loginBtn) loginBtn.onclick = loginUser;
    let inputEl = document.getElementById('voter-id-input');
    if (inputEl) inputEl.addEventListener('keypress', e => { if (e.key === 'Enter') loginUser(); });
    let resBtn = document.getElementById('btn-result-access');
    if (resBtn) resBtn.onclick = () => goToView('results');
    let resetBtn = document.getElementById('btn-reset-session');
    if (resetBtn) resetBtn.onclick = () => { sessionHash = null; location.reload(); };

    // Bind Modal Cancel button (as secondary safety)
    let modalCancel = document.getElementById('btn-modal-cancel');
    if (modalCancel) modalCancel.onclick = () => {
        let modal = document.getElementById('confirmation-modal');
        if (modal) {
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
        }
    };

    // Bind Admin Login to the ECI Emblem in the header
    let emblem = document.querySelector('.emblem-box img');
    if (emblem) emblem.onclick = handleAdminLogin;
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', e => {
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            let resetBtn = document.getElementById('btn-reset-session');
            if (resetBtn) resetBtn.click();
        }
    });
}

function showError(message) {
    let alertSection = document.getElementById('integrity-announcement');
    if (alertSection) {
        alertSection.innerHTML = `<div class="gov-warning">${message}</div>`;
        setTimeout(() => { alertSection.innerHTML = ''; }, 5000);
    }
}

window.onload = initSystem;
window.pressBlueButton = pressBlueButton;
