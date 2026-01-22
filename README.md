HideShare – Secure File Sharing Platform

HideShare is a full-stack web application that enables secure file sharing using time-limited, password-protected links with strict server-side download enforcement.
The system is designed with a strong focus on security, reliability, and real-world deployment constraints.

🔗 Live Application:
👉 https://hideshare.vercel.app

📌 Problem Statement

Traditional file-sharing methods lack fine-grained control over:

Who can access a file

How long the file remains accessible

How many times the file can be downloaded

HideShare solves these problems by enforcing:

⏱ Time-based expiration

🔢 Download limits

🔐 Optional password protection

All validations are enforced strictly on the backend, not the client.

🚀 Key Features

Secure file upload (up to 50 MB)

Time-based link expiration

Download-count–based access control

Password-protected downloads (hashed & verified)

Automatic file deletion after expiry or limit exhaustion

Dark / Light theme support

QR-based sharing for easy mobile access

Fully deployed and production-ready

🧱 System Architecture
Client (React)
   |
   |  HTTPS REST API
   |
Backend (Node.js + Express)
   |
   |  Metadata
   |
MongoDB
   |
   |  Files
   |
Local File Storage (uploads/)

🛠 Tech Stack
Frontend

React (Vite)

React Router

Fetch API

CSS with theme variables

Deployment: Vercel

Backend

Node.js

Express.js

MongoDB (Mongoose ODM)

Multer (file upload handling)

bcrypt (password hashing)

Helmet (security headers)

Express Rate Limiting

Deployment: Render

🔐 Security Design
Password Security

Passwords are hashed using bcrypt

Plain-text passwords are never stored

Download Enforcement

Download count is validated and incremented server-side

Access is blocked once the limit is reached

Link Expiry

Links expire automatically based on selected duration

Expired files are deleted via a background cleanup job

Abuse Prevention

Rate limiting applied to upload and download endpoints

CORS restricted to frontend domain only

📂 File Handling Rules

Maximum file size: 50 MB

Allowed formats:

Images

Videos (MP4)

PDFs

Text files

ZIP archives

⚙️ Environment Variables

Create a .env file in the backend directory:

MONGO_URI=<MongoDB connection string>
PORT=5000

🧪 Error Handling & Edge Cases

Invalid or expired links return correct HTTP status codes

Download limit violations handled server-side

Missing or deleted files are cleaned automatically

Incorrect passwords are securely rejected

📈 Scalability Considerations

Current version uses local file storage

Architecture supports future migration to:

AWS S3

Cloudflare R2

Pre-signed URLs for large files

Stateless backend allows horizontal scaling

🧠 Key Engineering Learnings

Secure file handling in production systems

Backend-enforced access control design

Preventing duplicate downloads due to multiple requests

Handling CORS, rate limiting, and deployment issues

End-to-end deployment of a full-stack application
