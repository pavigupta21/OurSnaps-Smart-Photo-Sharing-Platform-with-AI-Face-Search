# 📸 OurSnaps

### AI-powered Photo Sharing Platform with Face Search

OurSnaps is a full-stack photo sharing platform that allows users to create shared albums, upload photos collaboratively, and instantly retrieve their own photos using AI-powered facial recognition.

Instead of manually scrolling through hundreds of images after an event or trip, users can register their face once and search for every photo containing them in seconds.

---

## ✨ Features

### Authentication
- Email OTP based Registration & Login
- JWT Authentication
- Secure Protected Routes

### Album Management
- Create Public & Private Albums
- Album Cover Images
- Album Statistics
- Album Settings
- Album Invitations via Invite Codes

### Role-Based Access Control
- Owner
- Admin
- Viewer

Permissions include:
- Upload Photos
- Manage Members
- Remove Members
- Promote/Demote Members
- Album Settings

### Smart Photo Upload
- Upload up to 100 photos simultaneously
- Real-time Upload Progress
- Cloudinary Storage
- Background Face Indexing

### AI Face Search
- Register your face once
- Automatic face embedding generation
- Face embeddings stored using PostgreSQL + pgvector
- Fast vector similarity search
- Incremental face indexing
- Search history tracking

### Real-time Updates
- Live Upload Progress
- Live Album Updates
- Live Member Updates
- Live Face Index Status
- Socket.IO based communication

---

# 🛠 Tech Stack

## Frontend

- React
- React Router
- Axios
- Socket.IO Client
- CSS

## Backend

- Node.js
- Express.js
- PostgreSQL
- pgvector
- JWT Authentication
- Multer
- Cloudinary
- BullMQ
- Redis
- Socket.IO

## AI Service

- Python
- Flask
- MediaPipe Face Landmarker
- NumPy
- pgvector

---

# ⚡ Face Search Pipeline

1. User uploads photos.
2. Photos are stored on Cloudinary.
3. Upload jobs are pushed into BullMQ.
4. Redis manages the processing queue.
5. Python worker extracts facial embeddings.
6. Embeddings are stored in PostgreSQL using pgvector.
7. User registers their own face.
8. PostgreSQL performs vector similarity search.
9. Matching photos are returned instantly.

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/yourusername/OurSnaps.git
```

---

## Backend

```bash
cd backend
npm install
npm start
```

---

## Frontend

```bash
npm install
npm run dev
```

---

## Python Face Service

```bash
cd face-service

pip install -r requirements.txt

python app.py
```

---

## Redis

```bash
docker start redis-face-search
```

---

## Worker

```bash
cd backend

node faceWorker.js
```

---

# Environment Variables

Create a `.env` file inside the backend folder.

Example:

```env
DATABASE_URL=...
JWT_SECRET=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
EMAIL_API_KEY=...
```

---

# Future Improvements

- Face clustering
- Duplicate photo detection
- Face recognition confidence tuning
- Album activity feed
- Mobile responsive UI
- Cloud deployment
- Multi-worker parallel indexing

---

