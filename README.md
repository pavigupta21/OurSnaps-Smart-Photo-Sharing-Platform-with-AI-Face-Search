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

## 🤖 Face Indexing Pipeline

1. **User Uploads Photos**
   - User selects multiple photos and uploads them from the React frontend.

2. **Authentication & Authorization**
   - The backend verifies the user's JWT token.
   - Upload permissions are checked based on the user's role and album settings.

3. **Upload to Cloudinary**
   - Each photo is uploaded to Cloudinary.
   - The returned Cloudinary URL and metadata are stored in the PostgreSQL `photos` table.

4. **Queue Face Indexing Job**
   - After each successful upload, a BullMQ job containing:
     - `image_path`
     - `album_id`
     - `photo_id`
   - is pushed into a Redis-backed queue.

5. **Background Worker Processing**
   - A BullMQ worker continuously listens to the queue.
   - Multiple photos can be processed simultaneously (`concurrency: 3`).
   - Before processing, the worker checks whether the photo still exists to handle cases where a user deletes a photo before indexing completes.

6. **Face Detection & Embedding Generation**
   - The worker calls a separate Flask-based Face Recognition Service.
   - The service downloads the image from Cloudinary.
   - InsightFace (`buffalo_l`) detects all faces in the image.
   - A 512-dimensional face embedding is generated for every detected face.

7. **Store Face Embeddings**
   - Each generated embedding is stored in the PostgreSQL `photo_faces` table along with its corresponding `photo_id` and `album_id`.

8. **Update Processing Status**
   - Once indexing finishes successfully:
     - `face_indexed` is set to `TRUE`.
     - `processing_status` is updated to `ready`.

9. **Album Index Completion**
   - The worker checks whether any photos in the album are still pending.
   - When all photos are indexed:
     - `albums.face_index_status` is updated to `ready`.

10. **Real-Time UI Updates**
    - Socket.IO notifies connected clients whenever a photo finishes indexing.
    - Indexing spinners disappear automatically.
    - Once the album is fully indexed, the **My Face Search** feature is enabled for all members.

<img width="1536" height="1024" alt="ChatGPT Image Jul 17, 2026, 06_28_22 PM" src="https://github.com/user-attachments/assets/3678ee94-5ddc-4a2a-9396-b9e459a4ea26" />

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/pavigupta21/OurSnaps.git
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

./venv/Scripts/Activate

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

