let ledger = [];
let sessionHash = null;
let db = null;
let chart = null;
let isVoting = false;

const LS_KEY = 'official_vote_v5';
const IDB_DB = 'GovSystemDB';
const IDB_STORE = 'ledger';
const VVPAT_DISPLAY_TIME = 7000;
const VVPAT_DROP_TIME = 600;

const candidates = [
    { id: '1', name: 'Indian National Congress', party: 'INC', logo: 'assets/img/party_inc.png', color: '#19AAED' },
    { id: '2', name: 'Bharatiya Janata Party', party: 'BJP', logo: 'assets/img/party_bjp.png', color: '#FF9933' },
    { id: '3', name: 'Aam Aadmi Party', party: 'AAP', logo: 'assets/img/party_aap.png', color: '#0066A4' },
    { id: '4', name: 'Independent Alliance', party: 'IND', logo: 'assets/img/party_ind.png', color: '#666666' },
    { id: '5', name: 'None of the Above (NOTA)', party: 'NOTA', logo: 'assets/img/party_nota.png', color: '#333333' }
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
        console.error('System initialization failed:', error);
        showError('System initialization failed. Please refresh the page.');
    }
}

function updateSystemClock() {
    let timerArea = document.getElementById('live-timer');
    setInterval(function () {
        let now = new Date();
        timerArea.innerText = now.toLocaleDateString() + ' | ' + now.toLocaleTimeString();
    }, 1000);
}

function makeSessionCode() {
    let code = Math.random().toString(36).substring(2, 8).toUpperCase();
    document.getElementById('session-code').innerText = code;
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
            console.error('Database error:', e);
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
            let localHashes = [];
            for (let i = 0; i < ledger.length; i++) {
                localHashes.push(ledger[i].hash);
            }

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
        let alertSection = document.getElementById('integrity-announcement');
        alertSection.innerHTML = '<div class="gov-warning" style="margin: 0 0 2rem 0;"><i class="fa-solid fa-triangle-exclamation"></i> <strong>Integrity Mismatch:</strong> Local register count discrepancy detected. Check internal browser logs.</div>';
    }
}

async function getMyHash(input) {
    let encoder = new TextEncoder();
    let data = encoder.encode(input.toUpperCase().trim());
    let buffer = await crypto.subtle.digest('SHA-256', data);
    let hashArray = Array.from(new Uint8Array(buffer));
    let hashString = '';
    for (let i = 0; i < hashArray.length; i++) {
        hashString += hashArray[i].toString(16).padStart(2, '0');
    }
    return hashString;
}

function goToView(viewName) {
    let allSections = document.querySelectorAll('section');
    for (let i = 0; i < allSections.length; i++) {
        allSections[i].classList.add('d-none');
    }
    document.getElementById('view-' + viewName).classList.remove('d-none');
    if (viewName === 'results') {
        showMyResults();
    }
}

async function loginUser() {
    let userInput = document.getElementById('voter-id-input').value.trim();
    let errorArea = document.getElementById('login-error');

    if (userInput.length < 5 || !/^[A-Za-z0-9]+$/.test(userInput)) {
        errorArea.classList.remove('d-none');
        return;
    }

    errorArea.classList.add('d-none');
    document.getElementById('btn-login').disabled = true;
    
    try {
        sessionHash = await getMyHash(userInput);

        let alreadyVoted = ledger.some(record => record.hash === sessionHash);

        if (alreadyVoted) {
            goToView('results');
        } else {
            showBallot();
            goToView('ballot');
        }
    } catch (error) {
        console.error('Login error:', error);
        showError('Authentication failed. Please try again.');
    } finally {
        document.getElementById('btn-login').disabled = false;
    }
}

function showBallot() {
    let container = document.getElementById('evm-rows');
    container.innerHTML = '';

    for (let i = 0; i < candidates.length; i++) {
        let c = candidates[i];
        let serial = (i + 1).toString().padStart(2, '0');

        // EVM Row HTML
        let rowHtml = `
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
        container.innerHTML += rowHtml;
    }
}

async function pressBlueButton(cid, index) {
    if (isVoting) return;
    isVoting = true;

    let allBtns = document.querySelectorAll('.evm-button');
    allBtns.forEach(b => b.disabled = true);

    let candidate = candidates[index];

    let led = document.getElementById('led-' + cid);
    led.classList.add('active');

    playBeep();

    await runVVPATSequence(candidate);

    led.classList.remove('active');

    saveVoteInternal(cid);
    isVoting = false;
}

function playBeep() {
    let audio = new Audio('assets/beep-329314.mp3');
    audio.play().catch(e => console.warn("Audio playback failed:", e));
}

async function runVVPATSequence(candidate) {
    let glass = document.getElementById('vvpat-glass');
    let slip = document.getElementById('vvpat-slip');

    let candidateIndex = candidates.findIndex(c => c.id === candidate.id);
    document.getElementById('v-serial').innerText = (candidateIndex + 1).toString().padStart(2, '0');
    document.getElementById('v-name').innerText = candidate.name;
    let symbolImg = document.getElementById('v-symbol');
    symbolImg.src = candidate.logo;
    symbolImg.alt = candidate.party + ' symbol';

    glass.classList.add('lit');

    slip.classList.remove('drop');
    slip.classList.add('visible');

    await new Promise(r => setTimeout(r, VVPAT_DISPLAY_TIME));

    slip.classList.remove('visible');
    slip.classList.add('drop');

    await new Promise(r => setTimeout(r, VVPAT_DROP_TIME));

    glass.classList.remove('lit');
}

function saveVoteInternal(cid) {
    let newRecord = {
        hash: sessionHash,
        candidateId: cid,
        ts: new Date().toISOString()
    };

    ledger.push(newRecord);
    localStorage.setItem(LS_KEY, JSON.stringify(ledger));
    localStorage.setItem(LS_KEY + '_meta', ledger.length.toString());

    if (db) {
        try {
            let tx = db.transaction(IDB_STORE, "readwrite");
            let store = tx.objectStore(IDB_STORE);
            store.put({ id: sessionHash, ...newRecord });
        } catch (error) {
            console.error('Database save error:', error);
        }
    }

    setTimeout(function () {
        goToView('results');
    }, 1000);
}

function showMyResults() {
    document.getElementById('total-count').innerText = ledger.length;
    makeMyChart();
}

function makeMyChart() {
    let canvas = document.getElementById('resultsChart');
    if (!canvas) return;
    
    let ctx = canvas.getContext('2d');
    if (chart) {
        chart.destroy();
    }

    let dataValues = candidates.map(candidate => {
        return ledger.filter(record => record.candidateId === candidate.id).length;
    });

    chart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: candidates.map(c => c.party),
            datasets: [{
                label: 'Valid Polled Votes',
                data: dataValues,
                backgroundColor: candidates.map(c => c.color + 'CC'),
                borderColor: candidates.map(c => c.color),
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: { precision: 0 }
                }
            },
            plugins: {
                legend: { display: false }
            }
        }
    });
}

function setupMyButtons() {
    document.getElementById('btn-login').onclick = loginUser;
    document.getElementById('voter-id-input').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') loginUser();
    });
    document.getElementById('btn-results-link').onclick = function () {
        sessionHash = null;
        goToView('results');
    };
    document.getElementById('btn-reset-session').onclick = function () {
        sessionHash = null;
        document.getElementById('voter-id-input').value = '';
        makeSessionCode();
        goToView('login');
    };
}

function setupKeyboardShortcuts() {
    document.addEventListener('keydown', function(e) {
        if (e.ctrlKey && e.key === 'r') {
            e.preventDefault();
            let resetBtn = document.getElementById('btn-reset-session');
            if (resetBtn && !resetBtn.classList.contains('d-none')) {
                resetBtn.click();
            }
        }
    });
}

function showError(message) {
    let alertSection = document.getElementById('integrity-announcement');
    alertSection.innerHTML = `<div class="gov-warning" style="margin: 0 0 2rem 0;"><i class="fa-solid fa-triangle-exclamation"></i> <strong>Error:</strong> ${message}</div>`;
    setTimeout(() => {
        alertSection.innerHTML = '';
    }, 5000);
}

window.onload = initSystem;
window.pressBlueButton = pressBlueButton;
