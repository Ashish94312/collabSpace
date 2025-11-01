# <img src="frontend/public/favicon.ico" alt="" width="28" height="28" /> CollabSpace

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](http://makeapullrequest.com)
[![Open Source Love](https://badges.frapsoft.com/os/v1/open-source.svg?v=103)](https://github.com/ellerbrock/open-source-badges/)
[![Contributors Welcome](https://img.shields.io/badge/contributors-welcome-orange.svg)](CONTRIBUTING.md)

> A real-time collaborative document editor built with React, Node.js, and WebSockets. CollabSpace allows multiple users to edit documents simultaneously with features like rich text editing, image handling, page management, and real-time synchronization.

---

## 🌟 Why CollabSpace?

- 🚀 **Real-time Collaboration** — multiple users can edit documents simultaneously  
- 📝 **Rich Text Editing** — supports formatting, math expressions, and image uploads  
- 🔒 **Open Source** — fully transparent and free under the MIT license  
- 🛠️ **Developer Friendly** — modular code with clear API structure  
- 💝 **Community Driven** — contributions are always welcome  

---

## ✨ Features

- User authentication with JWT  
- Document creation, editing, and sharing  
- Real-time collaboration via WebSockets  
- Drag & drop image uploads  
- Secure password hashing using bcrypt  
- Full-text search with Elasticsearch  
- Multi-page document management  

---

## 🛠️ Tech Stack

**Frontend:** React 19, React Router, Tailwind CSS, TipTap, KaTeX  
**Backend:** Node.js, Express.js, Prisma, PostgreSQL, JWT, bcrypt, Multer  
**Real-time:** WebSocket  
**Search:** Elasticsearch  

---

## 🚀 Quick Start

### 🧩 Prerequisites
- Node.js (v16 or higher)
- PostgreSQL (local or remote)
- Git

---

### ⚙️ Installation

#### 1️⃣ Clone Repository
```bash
git clone https://github.com/yourusername/collabspace.git
cd collabspace
2️⃣ Install Backend Dependencies
cd backend
npm install

3️⃣ Install Frontend Dependencies
cd ../frontend
npm install

🧾 Environment Setup

Create a .env file inside the backend directory:

# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:YourPassword@localhost:5432/collabspace"

# Server port
PORT=3000

# JWT secret key for authentication
JWT_SECRET="yourSuperSecretKey"


💡 Replace YourPassword with your actual PostgreSQL password.
Make sure PostgreSQL service is running before continuing.

🗄️ Database Setup

Inside the backend folder:

npx prisma generate
npx prisma db push


(Optional) Open Prisma Studio:

npx prisma studio


If you see:

Error: secretOrPrivateKey must have a value


→ Make sure your .env file contains a valid JWT_SECRET.

🧠 Start Backend Server
npm start


Expected output:

🚀 Server running on http://localhost:3000
🔗 WebSocket server running on ws://localhost:3001


If you visit http://localhost:3000 and see:

Cannot GET /


that’s normal — the backend only provides APIs.

💻 Start Frontend Server
cd ../frontend
npm start


By default, the frontend runs at http://localhost:5173.

Make sure:

Backend is running on port 3000

CORS is configured correctly

🧪 Test APIs with Postman

Open Postman

Create a new request:
POST → http://localhost:3000/api/signup

In Body → raw → JSON, paste:

{
  "email": "test@example.com",
  "password": "123456"
}


Click Send
Expected response:

{
  "success": true,
  "user": { "email": "test@example.com" }
}


Then test login:
POST → http://localhost:3000/api/login

{
  "email": "test@example.com",
  "password": "123456"
}


Expected response:

{ "token": "<your_jwt_token_here>" }


Use this token under Authorization → Bearer Token to test protected endpoints.

📁 Project Structure
collabspace/
├── backend/
│   ├── prisma/
│   │   ├── migrations/
│   │   └── schema.prisma
│   ├── uploads/
│   ├── server.js
│   ├── .env
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── context/
│   │   └── hooks/
│   └── package.json
└── README.md

🔧 API Endpoints
Authentication

POST /api/signup — register user

POST /api/login — login user

Documents

GET /api/documents — fetch all documents

POST /api/documents — create a new document

PATCH /api/documents/:id — update document

DELETE /api/documents/:id — delete document

Uploads

POST /api/upload-image — upload image

🤝 Contributing

Fork the repository

Clone your fork

Create a feature branch

git checkout -b fix/readme-setup


Commit your changes

git commit -m "docs: improve README setup guide for PostgreSQL, Prisma, and Postman testing"


Push & create a Pull Request

📝 License

This project is licensed under the MIT License — see the LICENSE
 file for details.

💬 Community

Discussions: GitHub Discussions

Issues: Report Bug / Request Feature

<div align="center">

CollabSpace — Where collaboration meets creativity! 🚀
Made with ❤️ by open-source contributors

</div> 
