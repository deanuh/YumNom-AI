# YumNom AI

YumNom AI is a personalized food recommendation web app that helps users discover dishes based on their dietary needs and cravings. It features AI-powered suggestions, smart restaurant search, and group meal planning with real-time voting for collaborative dining decisions.

---

## Project Structure

```
YumNom-AI/
├── frontend/          # React-based frontend
│   ├── public/
│   ├── src/
│   ├── .env           # Not tracked — add manually
|   ├── .gitignore     # Not shown on github 
│   └── package.json   # Frontend dependencies
├── backend/           # Node.js backend 
│   ├── index.js
│   ├── .env
│   └── package.json
```

---

## Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- npm (comes with Node)
- Git
- Code editor: VS Code

---

## Getting Started (Local Setup)

### 1. Clone the Repo

```bash
git clone https://github.com/wowowwubzie/YumNom-AI.git
cd YumNom-AI
```

---

### 2. Set Up the Frontend

```bash
cd frontend
npm install
```

#### Install additional dependencies:

```bash
npm install react-router-dom axios dotenv
```

---

### 3. Create `.env` in `/frontend`

```bash
touch .env
```

> ⚠ Contents must be obtained from a team member. Do not push this file to GitHub!


---

### 4. Firebase Components
- In frontend file, run commands:

```bash
npm install firebase
npm install -g firebase-tools
```

---

### 5. Run the Frontend

```bash
npm start
```

Then visit: [http://localhost:3000](http://localhost:3000)


---

### Firebase Authentication Emulator

For testing sign-up, login, and other authentication features without needing a live connection:

- Run the firebase emulator in the root directory

```bash
npm install -g firebase-tools
firebase emulators:start --only auth,firestore --project yumnomai
```

---

## Git Commands to Stay Updated

To save, commit your work, push to own branch, then to main once approved:
```bash
git add .
git commit -m "message"
git push origin your-branch-name
git checkout main
git pull origin main
git merge your-branch-name
git push origin main
```

To pull the latest changes from the main into your personal branch:

```bash
git checkout your-branch-name
git pull origin main --no-rebase
```

If you want to stash local changes before pulling:

```bash
git stash
git pull origin main
git stash pop
```

---


## IMPORTANT Notes

- `.env` and `node_modules/` are ignored using `.gitignore`, this file should be created when react env is created in the front end, should contain:
```bash
# dependencies
/node_modules
/.pnp
.pnp.js

# testing
/coverage

# production
/build
dist/

# misc
.DS_Store
.env.local
.env.development.local
.env.test.local
.env.production.local

npm-debug.log*
yarn-debug.log*
yarn-error.log*

.env
```
- Always work on your own branch and open pull requests to merge into `main`

## RUN CONCURENTLY
- run in ROOT of project in terminal: npm install --save-dev concurrently
- add this to the package.json file in ROOT : "scripts": {
  "dev": "concurrently \"npm start --prefix frontend\" \"npm start --prefix backend\" \"firebase emulators:start --only auth,firestore --project yumnomai\""
}
- *** if you dont have package.json in root, run this in terminal: npm init -y
    - now add the script^

- now in root you can run all currently (frontend, backend, emulator): npm run dev


## IMPORTANT NOTES FOR FIREBASE
- you need to run firebase emulators:start --only auth,firestore --project yumnomai in the backend to actually "sign up and log in " to the account
- ** it wont show on the database but we will fix that
- for the emulator to work (i mean save any data from any creations in to the database forever such as creating a user with auth and storing them in the database) run this line (assuming you have done step
the RUN CONCureNTly STUFF) "dev": "concurrently -n frontend,backend,emulators -c blue,green,magenta \"npm start --prefix frontend\" \"npm start --prefix backend\" \"firebase emulators:start --only auth,firestore --project yumnomai --import=./emulator-data --export-on-exit\""
^^ MIGHT NOT NEED BUT JUST IN CASE


## TO BE ABLE TO RUN REPORT ISSUE
- install 'npm install nodemailer' for the report issue emails to be sent

## TO RUN CHATBOT, LOOK AT BACKEND README FILE
