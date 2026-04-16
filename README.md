# National E-Voting Portal (Client-Side Prototype)

A client-side **Electronic Voting Machine (EVM) + VVPAT simulation** built using **HTML, CSS, and JavaScript**.  
This project demonstrates **one-vote enforcement, local vote persistence, and result visualization** for educational and demonstration purposes only.

> ⚠️ **Disclaimer**  
> This is **NOT** a real voting system and is **NOT affiliated** with the Election Commission of India.  
> No real voter data is used or collected.

---

## 🎯 Project Objective

To simulate the working of:
- Voter authentication (EPIC-style input)
- Electronic Voting Machine (EVM)
- VVPAT verification flow
- Vote storage and tallying
- Real-time result visualization

All logic runs **entirely in the browser**.

---

## 🛠 Tech Stack

- **HTML5** – Semantic structure
- **CSS3** – Government-style UI, EVM & VVPAT design
- **JavaScript (Vanilla)** – Voting logic, storage, state control
- **IndexedDB** – Persistent vote ledger
- **LocalStorage** – Session metadata
- **Chart.js** – Result visualization

No backend. No frameworks.

---

## ✨ Key Features

### Voter Authentication
- EPIC-style alphanumeric ID
- One-vote enforcement using hashed ID
- Duplicate voting blocked

### EVM Simulation
- Physical EVM-style layout
- Blue button voting
- LED indicator and beep sound
- Disabled inputs after vote

### VVPAT Flow
- Candidate slip display
- Timed visibility
- Automatic slip drop animation

### Vote Storage
- Hash-based voter identity
- Stored in:
  - `localStorage`
  - `IndexedDB`
- Persistent across page reloads

### Results Dashboard
- Party-wise vote count
- Dynamic pie chart
- Live updates per session

### Admin Access
- Hidden admin login
- Direct results access
- Session reset

---

## 📁 Project Structure

/
├── index.html 
├── style.css 
├── script.js 
├── assets/
│ └── img/
│ ├── party_bjp.png
│ ├── party_inc.png
│ ├── party_aap.png
│ ├── party_jdu.png
│ ├── party_npp.png
│ ├── party_nota.png
│ ├── election_commission.png
│ └── user.png
└── README.md

yaml
Copy code

---

## 🚀 How to Run

1. Clone or download the project
2. Open `index.html` in any modern browser
3. No server required

> Best tested on Chromium-based browsers

---

## 🔐 Voting Logic (Simplified)

1. User enters EPIC-style ID  
2. ID is hashed locally  
3. Hash checked against stored ledger  
4. If unused:
   - Ballot unlocked
   - Vote recorded
   - VVPAT shown
5. If used:
   - Voting blocked

---

## 🧠 Limitations (Intentional)

- Client-side only
- No encryption
- No real authentication
- Data tied to browser
- Easily resettable

This is **by design**.  
The goal is **learning and demonstration**, not production security.

---

## 📚 Use Cases

- College projects
- UI/UX demonstrations
- Web technology learning
- EVM/VVPAT process understanding
- Hackathon prototypes

---

## ⚖️ Legal Notice

This project:
- Does **not** represent the Election Commission of India
- Does **not** conduct real elections
- Must **not** be used in real voting scenarios

All names, symbols, and visuals are used **for educational simulation only**.

---

## 👤 Author

Built as a **front-end systems simulation project**  
Focused on realism, flow accuracy, and UI discipline.

---

## 🧩 Future Improvements (Optional)

- Backend vote validation
- Cryptographic signatures
- Multi-constituency support
- Role-based access control
- Secure audit logs

---

## ⭐ Final Note

If you present this honestly as a **client-side voting simulation**, it’s solid.  
If you try to sell it as a real voting system, it’s wrong. Don’t do that.

Build credibility by being precise.
