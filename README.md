<div align="center">
  <h1>🚀 Orbit Chat</h1>
  <p><strong>A Premium, Real-time Messaging Application with AI Integration</strong></p>
  
  [![React](https://img.shields.io/badge/React-19.0+-blue.svg?style=for-the-badge&logo=react)](https://reactjs.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg?style=for-the-badge&logo=node.js)](https://nodejs.org/)
  [![Socket.io](https://img.shields.io/badge/Socket.io-4.0+-black.svg?style=for-the-badge&logo=socket.io)](https://socket.io/)
  [![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248.svg?style=for-the-badge&logo=mongodb)](https://www.mongodb.com/)
</div>

<br />

Orbit Chat is a state-of-the-art chat application built with a modern tech stack (React, Vite, Node.js, Express, Socket.io) that provides seamless, instant communication. It features a premium glassmorphism UI, robust authentication, and integrated intelligent features powered by AI.

## ✨ Features

### Real-Time Communication
- **Instant Messaging**: Powered by Socket.io for low-latency, bidirectional communication.
- **Multiple Rooms**: Create and join specific chat rooms dynamically.
- **Typing Indicators**: See when others are typing in real-time.
- **Message Reactions**: React to messages using emojis.
- **Private Messaging**: Send direct messages to specific users.
- **Auto-Scroll**: Messages smoothly scroll to the bottom upon arrival.

### Security & Persistence
- **JWT Authentication**: Secure user login and registration process.
- **Data Persistence**: MongoDB Atlas integration for reliable message and user history.

### Smart AI Integration 🧠
- **Orbit Bot (@bot)**: An interactive AI chatbot integrated directly into the chat.
*(Powered by Google's Gemini API natively via fetch, no external SDKs)*

### UI / UX
- **Premium Design**: Modern, responsive layout utilizing smooth glassmorphism effects.
- **Mobile-Friendly**: Fully responsive interface for seamless cross-device usage.

---

## 🛠️ Technology Stack

### Frontend
- **React 19** & **Vite**: Blazing fast rendering and development experience.
- **Socket.io-client**: Real-time event handling.
- **Vanilla CSS**: Curated, flexible styling with custom animations and variables.
- **react-scroll-to-bottom**: Enhanced chat scrolling behavior.

### Backend
- **Node.js** & **Express 5**: Fast and minimalist web framework.
- **Socket.io**: WebSockets for real-time magic.
- **MongoDB** & **Mongoose**: NoSQL database for schema-based data modeling.
- **JWT & bcryptjs**: End-to-end user authentication and password hashing.

---

## 🚀 Getting Started

Follow these steps to get a local copy up and running.

### Prerequisites
- Node.js (v18 or higher)
- MongoDB Atlas cluster (or local MongoDB instance)
- Gemini API Key (for the `@bot` feature)

### 1. Clone the Repository
```bash
git clone https://github.com/shubhamsigh01/chat-app.git
cd chat-app
```

### 2. Backend Setup
```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory and add the following variables:
```env
PORT=3001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
Gemini_API_KEY=your_gemini_api_key
```

Start the backend server:
```bash
npm start # or node index.js
# The server will run on http://localhost:3001
```

### 3. Frontend Setup
Open a new terminal window:
```bash
cd client
npm install
```

Start the Vite development server:
```bash
npm run dev
# The client will run on http://localhost:5173
```

---

## 📁 Project Structure

```text
chat-app/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── App.jsx         # Main application container
│   │   └── App.css         # Styling and design system
│   └── package.json
└── server/                 # Node.js backend
    ├── index.js            # Entry point & socket handling
    ├── models/             # Mongoose schemas
    ├── routes/             # Express API routes
    ├── utils/              # Utilities (e.g. AI Bot helpers)
    └── package.json
```

---

## 🤝 Contributing

Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

## 📝 License

This project is licensed under the ISC License.
