National E-Voting Portal
Client-Side Web Application
Overview

The National E-Voting Portal is a client-side web application prototype designed to demonstrate how a digital voting interface can be built using modern web technologies.

This project focuses on:

Secure user flow simulation

Local data persistence

UI structure inspired by Indian government portals

Vote casting and result visualization

⚠️ Important:
This is not a real voting system. It is a front-end prototype only, built for academic and demonstration purposes.

Features
1. Voter Authentication (Simulated)

User enters a Voter ID (EPIC number).

ID is hashed using SHA-256 in the browser.

No raw ID is stored.

2. One-Vote Enforcement

Each hashed ID can vote only once per browser environment.

Repeat login redirects directly to results.

3. Digital Ballot Interface

Party-wise candidate listing.

Confirmation modal before vote submission.

Vote is locked after confirmation.

4. Local Data Persistence

LocalStorage for fast access.

IndexedDB for redundancy and integrity.

No server, no API, no external transmission.

5. Results Dashboard

Bar chart visualization using Chart.js.

Candidate-wise vote count.

Total votes displayed in real time.

6. System Integrity Check

Metadata comparison to detect local data mismatch.

Warning banner shown if inconsistency is found.

Tech Stack
Layer	Technology
Structure	HTML5
Styling	CSS3
Logic	Vanilla JavaScript
Charts	Chart.js
Storage	LocalStorage + IndexedDB
Security (Client-side)	SHA-256 Web Crypto API
Folder Structure
project-root/
│
├── index.html
├── style.css
├── script.js
│
├── assets/
│   ├── css/
│   │   └── fontawesome.css
│   ├── js/
│   │   └── chart.js
│   └── img/
│       ├── party_inc.png
│       ├── party_bjp.png
│       ├── party_aap.png
│       ├── party_ind.png
│       └── party_nota.png
│
└── README.md

How It Works (Flow)

User opens the portal.

System initializes clock, session code, and databases.

User enters EPIC number.

EPIC is hashed locally using SHA-256.

System checks if hash already exists:

If yes → show results.

If no → show ballot.

User selects a candidate.

Confirmation modal appears.

Vote is stored locally.

Results dashboard is displayed.

Security Notes (Prototype Level)

✔ Hashing prevents raw ID storage
✔ No server communication
✔ No cookies or tracking
✖ Not resistant to browser data clearing
✖ Not suitable for real elections

This project does not claim real-world security compliance.
It is intentionally limited to demonstrate client-side logic only.

Limitations

No backend or authentication server

No real voter verification

Votes reset if browser storage is cleared

Vulnerable to developer-tools tampering

Not legally or technically valid for real elections

These limitations are intentional and acceptable for an academic prototype.

Intended Use

College / school project

UI/UX demonstration

Client-side data handling example

Understanding browser storage mechanisms

Presentation or viva evaluation

Disclaimer

This application is not affiliated with the Election Commission of India.
All names, symbols, and references are used strictly for educational purposes.