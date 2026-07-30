# 📸 OurSnaps

### AI-powered Photo Sharing Platform with Face Search

OurSnaps is a full-stack photo sharing platform that allows users to create shared albums, upload photos collaboratively, and instantly retrieve their own photos using AI-powered facial recognition.

Instead of manually scrolling through hundreds of images after an event or trip, users can register their face once and search for every photo containing them in seconds.

<p align="center">

🌐 **Live Demo:** https://oursnaps.vercel.app

</p>

---

## ✨ How OurSnaps Works

### 1. Create a Shared Album
Any registered user can create a shared event album and automatically becomes its **Owner**.

While creating an album, the owner can:
- Choose whether the album is **Public** or **Private**
- Set the album name, description, location, and cover image
- Configure who is allowed to upload photos
- Generate invite codes for members to join

> **Note:** Once an album is created, its access type (Public/Private) cannot be changed.

---

### 2. Invite & Manage Members

Albums are designed for collaborative photo sharing.

The owner can invite new members using secure invite codes. Every new member joins the album as a **Viewer** by default.

There are three roles within every album:

#### Owner
The owner has complete control over the album and can:
- Edit album details (name, location, cover image)
- Configure upload permissions
- Invite or remove any member
- Promote or demote members between Admin and Viewer
- Delete any photo within the album

#### Admin
Admins help manage the album and can:
- Invite new members
- Remove Viewer members
- Delete any photo in the album

#### Viewer
Viewers can participate according to the upload permissions configured by the owner.

---

### 3. Flexible Upload Permissions

The owner decides who can upload photos to the album.

Upload access can be configured for:
- Only the Owner
- Owner & Admins
- All Members
- Only selected members

Photos can be uploaded:
- From the local device
- As an entire folder (bulk upload)
- Directly from Google Drive

Users can upload up to **100 photos simultaneously**, with real-time upload progress.

---

### 4. Automatic Cloud Storage & Face Indexing

Once photos are uploaded:
1. Images are securely stored on **Cloudinary**.
2. Background face processing begins automatically.
3. Every detected face is converted into a vector embedding.
4. Embeddings are stored in **PostgreSQL using pgvector** for efficient similarity search.

Face indexing runs asynchronously, allowing users to continue using the application while processing happens in the background.

---

### 5. Register Your Face Once

To use AI-powered photo search, users register their face a single time.

During face registration, the application provides real-time guidance by:
- Asking the user to position their face correctly within the camera frame
- Detecting poor lighting conditions
- Ensuring a clear, high-quality face scan before registration

This helps improve search accuracy.

---

### 6. Intelligent Face Search

Once face registration is complete, users can instantly find photos containing themselves.

The search process is incremental:

- When new photos are uploaded, only those newly added photos are indexed and searched.
- Previously indexed photos are skipped to avoid unnecessary processing.
- If a user updates or rescans their face profile, the system automatically re-searches the entire album to ensure accurate results.

Users can also view their previous face searches through search history.

---

### 7. Public vs Private Albums

#### Public Albums
Every member can browse and view all photos uploaded to the album.

#### Private Albums
Each member can view only:
- Photos they personally uploaded
- Photos in which they have been detected by the AI face recognition system

This ensures privacy while still allowing members to easily find their own memories.

---

### 8. Real-Time Collaboration

OurSnaps keeps every album synchronized in real time using **Socket.IO**.

Members instantly receive updates when:
- Photos are uploaded
- Face indexing completes
- Members join or leave
- Album information changes
- Roles or permissions are updated

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

## 🏛️ System Architecture

OurSnaps follows a service-oriented architecture designed for scalable, real-time collaborative photo sharing with AI-powered face search.

The platform consists of a **React** frontend that communicates with a **Node.js + Express** backend through REST APIs and **Socket.IO**. The backend manages authentication, album and member management, role-based access control, photo uploads, and face search requests.

Uploaded images are securely stored in **Cloudinary**, while application data such as users, albums, photos, memberships, and AI face embeddings are stored in **PostgreSQL** using the **pgvector** extension for efficient vector similarity search.

To ensure a responsive user experience, face indexing is processed asynchronously. After a photo is uploaded, the backend pushes a job to a **BullMQ** queue backed by **Redis**. A background worker forwards the image to a dedicated **Python Flask Face Recognition Service**, which detects faces using **InsightFace**, generates face embeddings, and stores them back in PostgreSQL. Throughout the indexing process, **Socket.IO** delivers real-time updates so connected users can instantly see upload progress and indexing status.

<p align="center">
  <img width="1630" height="870" alt="diagram-export-7-30-2026-3_07_53-PM" src="https://github.com/user-attachments/assets/8f1ee8ad-8b8d-4495-a4f8-26c4a24cde03" />
</p>

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


# Future Improvements

- Face clustering
- Duplicate photo detection
- Face recognition confidence tuning
- Album activity feed
- Mobile responsive UI
- Cloud deployment
- Multi-worker parallel indexing

---

