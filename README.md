# 🏡 Property Rental Management System (PRMS)

<img width="1510" height="859" alt="image" src="https://github.com/user-attachments/assets/4c0213c8-9687-418a-975a-cbaf4cb0d936" />


**Live Demo: https://property-rental-xi.vercel.app**

The Property Rental Management System (PRMS) is a comprehensive, fully responsive full-stack web application designed to streamline the end-to-end rental process. It connects tenants, property owners, and system administrators in a centralized ecosystem, handling everything from property search and lease generation to real-time communication and maintenance tracking.

---

## ✨ Key Features

* **🔐 Role-Based Access Control:** Distinct dashboards and permissions for Tenants, Property Owners, and Platform Administrators.
* **📍 Dynamic Property Search:** Filter listings by city, price range, bedroom count, and property type, complete with an interactive map UI.
* **💬 Real-Time Messaging:** Integrated Socket.io chat allows prospective tenants and property owners to communicate instantly.
* **📄 Lease & Financial Management:** Track the complete rental lifecycle, including digital lease document URLs, rental statuses, and payment installment ledgers.
* **🛠️ Maintenance Requests:** Tenants can seamlessly report property issues, allowing owners and admins to track repair statuses.
* **🛡️ Robust Security & Moderation:** Includes JWT-based authentication, password hashing, automated data sanitization, and an Admin control center for flagging abusive messages and restricting users.

---

## 🛠️ Technology Stack

**Frontend:**
* React.js (Vite)
* React Router DOM
* SCSS (Responsive UI)
* Zustand / Context API (State Management)

**Backend:**
* Node.js & Express.js
* Socket.io (Real-time WebSockets)
* MongoDB
* Prisma ORM (Strict schema mapping and type-safety)
* JSON Web Tokens (JWT) & Bcrypt (Authentication)

**Testing & Infrastructure:**
* Vitest (114+ automated unit and integration tests)
* Cloudinary (Image hosting)
* Deployed on **Vercel** (Frontend) and **Render** (Backend & Socket)

---
