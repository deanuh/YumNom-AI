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

