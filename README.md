# 🦎📚  Komodo Hub-team-project


<p align="center">
  <img src="https://github.com/user-attachments/assets/cd03c2bc-68bb-44cb-a2d6-0f340fadf9df" width="500"/>
</p>

**Komodo Hub** is a collaborative web platform designed to spread awareness about wildlife conservation while supporting structured educational features for schools and communities. Users can share information, participate in discussions, explore a wildlife encyclopedia, and interact through role-based dashboards.

---

## 📚 Project Background

This repository contains a personal copy of a collaborative university team project originally developed during my studies at Coventry University. The original code was part of a team effort and is hosted on the university's internal GitHub platform.

This version is maintained for portfolio, learning, and personal use.

## 📚 Table of Contents

- [Tech Stack](#tech-stack)
- [Live Site](#live-site)
- [Local Setup Instructions](#local-setup-instructions)
  - [Step 1: Download the Project](#step-1-download-the-project)
  - [Step 2: Install Dependencies](#step-2-install-dependencies)
  - [Step 3: Start the Development Server](#step-3-start-the-development-server)
- [Project Structure](#project-structure)
- [Dependencies Used](#dependencies-used)
- [Notes](#notes)


##  Tech Stack

| Layer      | Technology   |
|------------|--------------|
| Frontend   | **React.js** + **Vite** |
| Backend    | **Firebase** (Authentication, Firestore DB, Storage, Functions) |

---

##  Live Site

Access the live deployment here:  
🔗 [**Live Demo**](https://komodo-hub-4ce8c.web.app/)  
_

---

##  Local Setup Instructions

Follow these steps to run the project locally:

### Step 1: Download the Project

- Click the green **Code** button (top right)
- Select **Download ZIP**
- Extract the folder to your desired location

###  Step 2: Install Dependencies

Open your terminal (Command Prompt, PowerShell, VS Code terminal, etc.), navigate to the extracted folder, and run:

```bash
npm install
```

### Step 3: Start the Development Server

```bash
npm run dev
```
## Project Structure

```plaintext
├── public/              # Static assets
├── src/                 # React components, routes, styles
├── firebaseconfig.js    # Firebase setup
├── package.json         # Project metadata & dependencies
├── vite.config.js       # Vite configuration
└── README.md            # Project instructions
```
##  Dependencies Used

The following dependencies are required to run this project:

- **Core Frameworks**  
  - `react`  
  - `react-dom`  
  - `vite`

- **Backend & Database (via Firebase)**  
  - `firebase` (Firestore, Authentication, Storage)

- **UI Components & Styling**  
  - `react-bootstrap`  
  - `@fortawesome/fontawesome-free`

- **Charts & Visualization**  
  - `chart.js`  
  - `react-chartjs-2`

- **Calendars & Scheduling**  
  - `react-big-calendar`  
  - `react-calendar`

- **Utilities**  
  - `md5` (for generating hashed data, e.g., avatars)

---
##  Usage Guide

Once the project is running locally or accessed via the live website, users can interact with the platform based on their roles:

#### 🔐 1. User Registration & Login

- Click **Sign Up** to create an account using email or Google (for general users)
- Log in to access your role-specific dashboard (Student, Teacher, Admin, etc.)

---

####  2. School or Community Access

- **Students & Teachers**: Must provide a valid `School Code` and `Class Code`
- **Community Members**: Can enter a `Community Code` if available
- **General Enthusiasts**: May access most features without a code

---

#### 🗂️ 3. Key Features by Role

##### 👨‍🎓 Students
- View assigned programs, submit assignments (max 3 times)
- Take quizzes and view progress via charts
- Access batch-specific timetable and messages

##### 👩‍🏫 Teachers
- Create/view assignments and track submissions
- Provide grades and feedback
- Communicate with batches

##### 👨‍💼 Admins
- Manage users, subscriptions, and announcements
- Analyze stats via interactive charts
- Create platform-wide programs

---

####  4. Wildlife Encyclopedia

- Accessible to all roles
- Search for animal species using keywords
- Powered by two external APIs

---

####  5. Posts & Discussions

- All users can share conservation posts (`.docx`, `.pdf`, or rich text)
- Engage in discussion threads with image/video support

---

#### 💡 Tips

- Make sure to allow pop-ups for Google sign-in
- If anything breaks, hard-refresh (`Ctrl + Shift + R`) or clear cache

---

##  Notes

- `node_modules/` is **not included** in the repository or ZIP  
  👉 Run `npm install` after downloading to generate it

- Ensure you have **Node.js v16+** and **npm** installed on your system

- Use a **modern browser** (Chrome, Firefox, Edge) for best compatibility

- All dependencies are listed in the `package.json` file for automatic installation

