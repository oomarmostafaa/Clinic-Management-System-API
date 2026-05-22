# 🏥 Clinic Management System API

A robust and scalable RESTful API for a Clinic Management System built with **Node.js**, **Express**, and **MongoDB**. The system supports multi-role authentication (Admin, Doctor, Patient), appointment booking, and a fully integrated payment gateway using **Stripe**.

## 🌐 Live Demo
- **API Base URL:** [https://clinic-management-system-api-alpha.vercel.app/]
- **Database:** Hosted on MongoDB Atlas.
- **Deployment:** Vercel.

## 🚀 Features

*   **Multi-Role Auth:** Secure JWT-based RBAC for `Admin`, `Doctor`, and `Patient`.
*   **Doctor Management:** Specialized profiles, schedule management, and advanced search/filter (by specialty).
*   **Booking System:** Appointment scheduling with status tracking (Pending, Confirmed, Cancelled).
*   **Stripe Integration:** Full checkout flow with **Webhooks** for real-time payment synchronization.
*   **Advanced Search:** Efficient querying for users, doctors, and payments using Regex.
*   **Dashboard:** Analytical stats for admins, including revenue and top-performing doctors.

## 🛠 Technical Stack

*   **Backend:** Node.js, Express.js
*   **Database:** MongoDB (Mongoose ODM)
*   **Payment:** Stripe API
*   **Security:** JWT, bcryptjs, CORS, Joi Validation
*   **Architecture:** Clean MVC (Model-View-Controller)

---
## 📂 Project Structure

```text
├── Databases/          # DB Connection & Mongoose Models
├── src/
│   ├── middleware/     # Auth, Validation, Global Error Handling
│   ├── modules/        # Business Logic (Controllers, Routes)
│   ├── Auth/           # Registration and Login
│   ├── doctor/         # Doctor specialized logic
│   ├── users/          # User & Patient management
│   ├── payment/        # Stripe integration & Webhooks
│   └── dashboard/      # Admin statistics
│   ├── utils/          # AppError class & Helpers
└── index.js            # App entry point
```

## 📑 Detailed API Endpoints Documentation

### 👥 User Management (Profile & Admin)
| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/users/profile` | Auth | Get profile of the logged-in user. |
| **PATCH** | `/api/v1/users/profile` | Auth | Update personal profile (Excludes password). |
| **DELETE** | `/api/v1/users/profile` | Auth | Permanently delete current user profile. |
| **GET** | `/api/v1/users` | Admin | Fetch all registered users in the system. |
| **GET** | `/api/v1/users/:id` | Admin | Get full details of a specific user. |
| **PATCH** | `/api/v1/users/:id` | Admin | Admin update of any user (Excludes password). |
| **DELETE** | `/api/v1/users/:id` | Admin | Force delete any user account. |
| **GET** | `/api/v1/users/search` | Admin | Advanced search by Name or Email. |

### 🧑‍⚕️ Patient Management
| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/patients` | Auth | Create a patient profile for the current user. |
| **GET** | `/api/v1/patients/profile` | Auth | Get the current user's patient profile. |
| **PATCH** | `/api/v1/patients/profile` | Auth | Update the current user's patient profile. |
| **GET** | `/api/v1/patients` | Admin | Fetch all patient profiles. |
| **GET** | `/api/v1/patients/:id` | Admin | Get details of a specific patient profile. |
| **PATCH** | `/api/v1/patients/:id` | Admin | Update any patient profile. |
| **DELETE** | `/api/v1/patients/:id` | Admin | Delete a patient profile. |

### 📅 Booking Management
| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/bookings` | Patient | Create a new appointment booking. |
| **GET** | `/api/v1/bookings` | Admin | Get all bookings in the system. |
| **GET** | `/api/v1/bookings/my-bookings` | Patient | Get all bookings for the current patient. |
| **GET** | `/api/v1/bookings/doctor/:doctorId` | Doctor/Admin | Get all bookings for a specific doctor. |
| **DELETE** | `/api/v1/bookings/:id` | Patient/Doctor/Admin | Delete a specific booking. |
| **PUT** | `/api/v1/bookings/:id/confirm` | Doctor/Admin | Confirm a pending booking. |
| **PUT** | `/api/v1/bookings/:id/complete` | Doctor/Admin | Mark a confirmed booking as completed. |
| **GET** | `/api/v1/bookings/search` | Admin | Search bookings by status or payment status. |

### 👨‍⚕️ Doctor Management
| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/doctors` | Admin | Create a doctor profile and update User role. |
| **GET** | `/api/v1/doctors` | Public | List all doctors with their basic info. |
| **GET** | `/api/v1/doctors/:id` | Public | Detailed doctor profile. |
| **PATCH** | `/api/v1/doctors/:id` | Admin/Owner| Update price, specialization, or schedule. |
| **DELETE** | `/api/v1/doctors/:id` | Admin | Delete a doctor's professional profile. |
| **GET** | `/api/v1/doctors/:id/schedule`| Public | View specific doctor's availability. |
| **GET** | `/api/v1/doctors/specialty/:s` | Public | Filter by: `heart`, `skin`, `bone`, `children`. |
| **GET** | `/api/v1/doctors/search` | Public | Search by Name, Email, or Specialization. |

### 💳 Payment & Stripe Integration
| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/v1/payments/create-checkout`| Patient | Generate Stripe Checkout link for a booking. |
| **POST** | `/api/v1/payments/webhook` | Stripe | Real-time listener for payment events. |
| **GET** | `/api/v1/payments` | Admin | Full list of all system transactions. |
| **GET** | `/api/v1/payments/:id` | Admin | Get details of a single transaction. |
| **GET** | `/api/v1/payments/booking/:bid` | Admin | Fetch payment record linked to a booking ID. |
| **GET** | `/api/v1/payments/search` | Admin | Search by `transactionId` or `status`. |
| **GET** | `/api/v1/payments/success` | Public | Redirect page after successful payment. |
| **GET** | `/api/v1/payments/cancel` | Public | Redirect page after cancelled payment. |

### 📊 Admin Dashboard & Statistics
| Method | Endpoint | Role | Description |
| :--- | :--- | :--- | :--- |
| **GET** | `/api/v1/dashboard/stats` | Admin | Total count of users, doctors, revenue, etc. |
| **GET** | `/api/v1/dashboard/top-doctors` | Admin | Rank doctors based on number of bookings. |

---

## 🛡️ Key Technical Implementations

### 1. Atomic Transactions (Mongoose Sessions)
To ensure data consistency, creating a doctor involves two steps:
1. Creating the doctor entry.
2. Updating the user role to "doctor".
Both must succeed, or neither will, preventing "ghost" profiles.

### 2. Stripe Webhook Security
Our `/webhook` route uses `express.raw()` to receive the raw request body, allowing us to verify the `stripe-signature` header. This prevents unauthorized status updates.

### 3. Secure Search Mechanism
We implemented a two-stage search for doctors:
1. Find matching `User` IDs based on Name/Email keyword.
2. Query `Doctors` that match those IDs OR match the specialization keyword.

### 4. Data Privacy
Sensitive fields like `password` are globally excluded from responses (`select: -password`) or manually undefined in controllers before sending JSON.

---

## 💳 Stripe Workflow

1.  **Session Creation**: User calls `create-checkout`. The system checks if the booking exists, belongs to the user, and is "confirmed".
2.  **Pending State**: A payment record is created in the database with status `pending`.
3.  **User Redirect**: The user is sent to Stripe's secure checkout page.
4.  **Webhook Sync**: Upon successful payment, Stripe notifies our `/webhook` endpoint.
5.  **Finalization**: The system verifies the Stripe signature, updates `PaymentModel` to `completed`, and marks the booking as `paid`.

## 🛡️ Security & Validations
*   **Passwords**: Never returned in API responses (`select: -password`).
*   **Transactions**: Uses Mongoose `startSession` to ensure that if a doctor creation fails, the user role update is rolled back.
*   **Inputs**: Regex cleaning for search keywords to prevent injection and handle quotes.
*   **Role Protection**: Strict middlewares to ensure only authorized users access sensitive data.

---

## 👨‍💻 Author
**Omar**
