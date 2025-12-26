.

📝 GDlite – Real-Time Collaborative Editor

GDlite is a real-time collaborative text editor built with a modern full-stack architecture.
It supports user authentication, document management, and is designed to scale using WebSockets and PostgreSQL.

🚀 Features

🔐 User Authentication (JWT-based)

📄 Create & manage documents

🤝 Real-time collaboration (planned via WebSockets)

🗄️ PostgreSQL for persistent storage

⚡ Fast development setup with Vite + React

🧩 Modular backend architecture

🏗️ Tech Stack
Backend

Node.js

Express.js

PostgreSQL

pg (node-postgres)

dotenv

JWT Authentication

Frontend

React

Vite

React Router DOM

📂 Project Structure
collab-editor/
│
├── server/
│   ├── src/
│   │   ├── index.js          # Server entry point
│   │   ├── db.js             # PostgreSQL connection
│   │   ├── routes/
│   │   │   └── documents.js  # Document routes
│   │   └── controllers/
│   │       └── documentsController.js
│   ├── package.json
│   └── .env
│
└── client/
    └── Editor/               # React frontend (Vite)

⚙️ Backend Setup
1️⃣ Install Dependencies
cd server
npm install

2️⃣ PostgreSQL Setup

Create the database and tables:

CREATE DATABASE GDlite;

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL
);

3️⃣ Environment Variables

Create a .env file inside server/:

DATABASE_URL=postgresql://postgres:<your_password>@localhost:5432/GDlite
PORT=5000


⚠️ Replace <your_password> with your actual PostgreSQL password.

4️⃣ Start Backend Server
npm run dev


You should see:

Connected to postgres
Server running on port 5000

🎨 Frontend Setup
1️⃣ Install Dependencies
cd client/Editor
npm install

2️⃣ Run Development Server
npm run dev


Open:

http://localhost:5173

🧠 Architecture Overview

Controllers handle business logic

Routes define API endpoints

Database pool manages PostgreSQL connections

JWT tokens secure API requests

React Router manages client-side navigation

🔮 Planned Improvements

🔄 WebSocket-based real-time editing

👥 Multi-user cursors & presence

📜 Document versioning

🛡️ Role-based access control

🚀 Production deployment (Docker + Nginx)

🧪 Common Issues

Blank page in frontend → Check App.jsx, routes, and exports

Postgres connection errors → Verify password & .env loading

Vite import errors → Ensure dependencies are installed

📜 License

This project is licensed under the MIT License.

👨‍💻 Author

Prajjwal Dwivedi
📌 Full-Stack Developer | Systems & Backend Enthusiast