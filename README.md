# DocuChat 📄✨

> An intelligent PDF chat application powered by AI. Upload any PDF document and have natural conversations about its content using advanced AI capabilities.

## 📋 Table of Contents
- [Overview](#overview)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Running the Application](#running-the-application)
- [Usage](#usage)
- [API Endpoints](#api-endpoints)
- [Troubleshooting](#troubleshooting)

## 🎯 Overview

DocuChat is a full-stack web application that allows users to upload PDF documents and chat with an AI assistant to extract information, ask questions, and have intelligent discussions about the document content. The application combines a modern React frontend with a robust Node.js backend powered by the Groq API.

## ✨ Features

- 📤 **Drag & Drop PDF Upload** - Easily upload PDF files with an intuitive drag-and-drop interface
- 🤖 **AI-Powered Responses** - Get intelligent answers using the Groq API
- 💬 **Multi-turn Conversations** - Maintain conversation context across multiple exchanges
- 🔄 **Document Context Preservation** - The AI remembers the uploaded PDF content throughout the conversation
- 📱 **Responsive Design** - Works seamlessly on desktop and mobile devices
- ⚡ **Real-time Processing** - Instant responses to user queries

## 🛠️ Tech Stack

### Frontend
- **React** - UI library
- **Vite** - Build tool and dev server
- **React Dropzone** - PDF upload handling
- **Axios** - HTTP client for API communication

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web framework
- **Groq SDK** - AI API integration
- **Multer** - File upload middleware
- **pdf-parse** - PDF text extraction
- **Dotenv** - Environment variable management

## 📋 Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js** (v14 or higher)
- **npm** (comes with Node.js)
- A Groq API key (free tier available)

## 📁 Project Structure

```
docuchat/
├── backend/
│   ├── index.js              # Main Express server
│   ├── package.json          # Backend dependencies
│   └── .env                  # Environment variables (create this)
│
├── frontend/
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ChatInterface.jsx    # Chat UI and logic
│   │   │   ├── Sidebar.jsx          # Sidebar navigation
│   │   │   └── UploadZone.jsx       # PDF upload component
│   │   ├── hooks/
│   │   │   └── Usechathistory.jsx   # Custom hook for chat history
│   │   ├── App.jsx           # Main app component
│   │   ├── api.js            # API utility functions
│   │   ├── main.jsx          # React entry point
│   │   └── index.css         # Global styles
│   ├── index.html            # HTML template
│   ├── package.json          # Frontend dependencies
│   └── vite.config.js        # Vite configuration
│
├── README.md                 # This file
└── .gitignore               # Git ignore rules
```

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/Vaish-251105/docuchat.git
cd docuchat
```

### 2. Get Your Groq API Key

Visit [Groq's website](https://console.groq.com) to obtain a free API key.

### 3. Backend Setup

```bash
cd backend
npm install
```

### 4. Frontend Setup

```bash
cd frontend
npm install
```

## ⚙️ Configuration

### Backend Environment Variables

Create a `.env` file in the `backend` directory:

```bash
cd backend
touch .env
```

Add the following variables to `.env`:

```
GROQ_API_KEY=your_groq_api_key_here
PORT=5000
```

Replace `your_groq_api_key_here` with your actual Groq API key.

## 🏃 Running the Application

You'll need two terminal windows - one for the backend and one for the frontend.

### Start the Backend

```bash
cd backend
npm run dev
```

The backend will start on **http://localhost:5000**

### Start the Frontend

```bash
cd frontend
npm run dev
```

The frontend will start on **http://localhost:5173**

Open your browser and navigate to **http://localhost:5173** to access the application.

## 📖 Usage

1. **Upload a PDF**: Drag and drop a PDF file into the upload zone or click to select a file
2. **Ask Questions**: Type your questions about the PDF content in the chat input
3. **Get Answers**: Receive AI-powered responses based on the PDF content
4. **Continue Conversation**: Ask follow-up questions, and the AI will maintain context

## 🔌 API Endpoints

### POST `/api/chat`

Send a message and receive an AI response based on uploaded PDF content.

**Request:**
```json
{
  "message": "Your question here",
  "pdfContent": "extracted text from PDF"
}
```

**Response:**
```json
{
  "response": "AI generated answer"
}
```

### POST `/api/upload`

Upload a PDF file for processing.

**Request:**
- Form data with file field containing PDF

**Response:**
```json
{
  "success": true,
  "filename": "uploaded_file.pdf",
  "text": "extracted text from PDF"
}
```

## 🐛 Troubleshooting

### Port Already in Use
If port 5000 or 5173 is already in use, you can change them:
- Backend: Edit the `PORT` variable in `.env`
- Frontend: Edit `vite.config.js` to change the dev server port

### PDF Upload Fails
- Ensure the PDF file is valid and not corrupted
- Check that the file size is reasonable (typically < 10MB)
- Verify the backend is running and accessible

### API Key Issues
- Double-check that your Groq API key is correct
- Ensure the `.env` file is in the backend directory
- Verify you haven't exceeded API rate limits

### Dependencies Missing
If you encounter module not found errors:
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
```

## 📄 License

This project is open source and available for personal and commercial use.

## 👨‍💻 Author

Created by VAISHNAVI SINGH.

---

**Happy chatting with your PDFs! 🎉**
