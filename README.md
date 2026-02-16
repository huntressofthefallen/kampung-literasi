# Kampung Literasi Pancoran

![Next.js](https://img.shields.io/badge/Next.js-16.1.6-black?style=for-the-badge&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9.3-blue?style=for-the-badge&logo=typescript)
![MongoDB](https://img.shields.io/badge/MongoDB-9.2.1-green?style=for-the-badge&logo=mongodb)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-4.1.18-38B2AC?style=for-the-badge&logo=tailwind-css)

A modern web-based registration system for the **Kampung Literasi Pancoran** program - a free English learning initiative for elementary school students (grades 1-6) conducted by Sampoerna University students.

## 📋 Table of Contents

- [Features](#features)
- [Screenshots](#screenshots)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Environment Variables](#environment-variables)
- [Usage](#usage)
- [API Documentation](#api-documentation)
- [Project Structure](#project-structure)
- [Development](#development)
- [License](#license)

## ✨ Features

### User Registration Portal

- 📝 Multi-student registration (register multiple students at once)
- 📱 Phone number-based registration
- 🎓 Grade selection (SD 1-6)
- 📅 Session selection with real-time availability
- ⚡ Real-time session updates using Server-Sent Events (SSE)
- 🌓 Dark/Light mode theme toggle
- ✅ Form validation and error handling
- 📊 Session capacity indicators

### Admin Dashboard

- 🔐 Secure password authentication with bcrypt
- 📊 Session management (Create, Read, Update, Delete)
- 👥 Registration overview and monitoring
- 📈 Real-time statistics and updates
- 📥 Export registrations to Excel (.xlsx) and CSV formats
- 🔍 Filter registrations by session
- 🗑️ Delete individual registrations
- 🌓 Dark/Light mode theme toggle
- 📱 Responsive design for all devices

### Real-time Updates

- ⚡ Server-Sent Events (SSE) for live data synchronization
- 🔄 Automatic refresh of session availability
- 📊 Instant registration count updates
- 🚀 Zero polling - efficient real-time communication

## 📸 Screenshots

### Main Registration Page

![Main Page](screenshots/main-page.png)
_User-friendly registration form with session selection and real-time availability_

### Admin Dashboard - Login

![Admin Login](screenshots/admin-login.png)
_Secure admin authentication page_

### Admin Dashboard - Session Management

![Admin Sessions](screenshots/admin-sessions.png)
_Manage learning sessions with real-time capacity tracking_

### Admin Dashboard - Registration List

![Admin Registrations](screenshots/admin-registrations.png)
_View and export all registrations with filtering options_

### Dark Mode

![Dark Mode](screenshots/dark-mode.png)
_Beautiful dark mode support across all pages_

> **Note:** To add screenshots, capture images of each page and save them in the `screenshots/` directory with the filenames mentioned above.

## 🛠️ Tech Stack

### Frontend

- **Next.js 16.1.6** - React framework with App Router
- **React 19.2.4** - UI library
- **TypeScript 5.9.3** - Type safety
- **Tailwind CSS 4.1.18** - Utility-first CSS framework

### Backend

- **Next.js API Routes** - Serverless API endpoints
- **MongoDB** - NoSQL database via Mongoose 9.2.1
- **Server-Sent Events (SSE)** - Real-time updates

### Additional Libraries

- **bcryptjs** - Password hashing
- **ExcelJS** - Excel file generation
- **PapaParse** - CSV parsing and generation

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager
- **MongoDB** (local installation or MongoDB Atlas account)

## 🚀 Installation

1. **Clone the repository**

   ```bash
   git clone https://github.com/huntressofthefallen/kampung-literasi.git
   cd kampung-literasi
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up environment variables**

   Create a `.env.local` file in the root directory:

   ```env
   MONGODB_URI=your_mongodb_connection_string
   ADMIN_PASSWORD=your_secure_admin_password
   ```

4. **Run the development server**

   ```bash
   npm run dev
   ```

5. **Open your browser**

   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔐 Environment Variables

Create a `.env.local` file with the following variables:

| Variable         | Description                                       | Example                                                                                                                |
| ---------------- | ------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `MONGODB_URI`    | MongoDB connection string                         | `mongodb://localhost:27017/kampung-literasi` or `mongodb+srv://username:password@cluster.mongodb.net/kampung-literasi` |
| `ADMIN_PASSWORD` | Admin panel password (will be hashed with bcrypt) | `your_secure_password_here`                                                                                            |

## 📖 Usage

### For Users (Parents/Guardians)

1. **Visit the registration page** at `http://localhost:3000`
2. **Enter student information:**
   - Full name
   - Grade (SD 1-6)
   - Click "Tambah Siswa" to register multiple students
3. **Enter contact phone number**
4. **Select an available session** from the dropdown
5. **Click "Daftar"** to submit the registration
6. **Receive confirmation** with registration details

### For Administrators

1. **Access the admin panel** at `http://localhost:3000/admin`
2. **Log in** with your admin password
3. **Manage Sessions:**
   - Create new sessions with date, time, and participant limit
   - Edit existing sessions
   - Delete sessions (if no registrations exist)
4. **View Registrations:**
   - See all registered students
   - Filter by session
   - Delete individual registrations
5. **Export Data:**
   - Select session filter (all or specific session)
   - Click "Ekspor Excel" or "Ekspor CSV"
   - Download the generated file

## 🔌 API Documentation

### Sessions

#### GET `/api/sessions`

Get all sessions with current registration counts.

**Response:**

```json
{
	"success": true,
	"sessions": [
		{
			"_id": "session_id",
			"name": "Sesi Pagi - Senin",
			"date": "2026-02-20T00:00:00.000Z",
			"time": "09:00 - 11:00",
			"limit": 20,
			"currentRegistrations": 15
		}
	]
}
```

#### POST `/api/sessions`

Create a new session.

**Request Body:**

```json
{
	"name": "Sesi Pagi - Senin",
	"date": "2026-02-20",
	"time": "09:00 - 11:00",
	"limit": 20
}
```

#### PUT `/api/sessions/[id]`

Update an existing session.

#### DELETE `/api/sessions/[id]`

Delete a session (only if no registrations exist).

### Registrations

#### GET `/api/registrations`

Get all registrations with session details.

**Response:**

```json
{
	"success": true,
	"registrations": [
		{
			"_id": "registration_id",
			"fullName": "Ahmad Rizki",
			"phoneNumber": "08123456789",
			"grade": "SD 3",
			"sessionName": "Sesi Pagi - Senin",
			"sessionDate": "2026-02-20",
			"sessionTime": "09:00 - 11:00",
			"createdAt": "2026-02-16T10:30:00.000Z"
		}
	]
}
```

#### POST `/api/registrations`

Create new registration(s).

**Request Body:**

```json
{
	"students": [
		{
			"fullName": "Ahmad Rizki",
			"grade": "SD 3"
		}
	],
	"phoneNumber": "08123456789",
	"sessionId": "session_id"
}
```

#### DELETE `/api/registrations/[id]`

Delete a registration.

### Admin

#### POST `/api/admin/login`

Authenticate admin user.

**Request Body:**

```json
{
	"password": "admin_password"
}
```

#### GET `/api/admin/export?session=session_id&format=xlsx|csv`

Export registrations to Excel or CSV format.

**Query Parameters:**

- `session`: Session ID or "all" for all registrations
- `format`: "xlsx" or "csv"

### Real-time Updates

#### GET `/api/sse`

Server-Sent Events endpoint for real-time updates.

**Event Types:**

- `sessions` - Session data changed
- `registrations` - Registration data changed
- `all` - Both sessions and registrations changed

## 📁 Project Structure

```
kampung-literasi/
├── app/
│   ├── admin/
│   │   └── page.tsx              # Admin dashboard
│   ├── api/
│   │   ├── admin/
│   │   │   ├── export/
│   │   │   │   └── route.ts      # Export endpoint
│   │   │   └── login/
│   │   │       └── route.ts      # Admin login
│   │   ├── registrations/
│   │   │   ├── route.ts          # Registrations CRUD
│   │   │   └── [id]/
│   │   │       └── route.ts      # Single registration
│   │   ├── sessions/
│   │   │   ├── route.ts          # Sessions CRUD
│   │   │   └── [id]/
│   │   │       └── route.ts      # Single session
│   │   └── sse/
│   │       └── route.ts          # Server-Sent Events
│   ├── components/
│   │   ├── ThemeProvider.tsx     # Theme context provider
│   │   └── ThemeToggle.tsx       # Dark/Light mode toggle
│   ├── globals.css               # Global styles
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Main registration page
├── lib/
│   ├── mongodb.ts                # MongoDB connection
│   └── sse.ts                    # SSE utilities
├── models/
│   ├── Registration.ts           # Registration schema
│   └── Session.ts                # Session schema
├── screenshots/                  # Application screenshots
├── .env.local                    # Environment variables
├── next.config.js                # Next.js configuration
├── package.json                  # Dependencies
├── tailwind.config.ts            # Tailwind configuration
└── tsconfig.json                 # TypeScript configuration
```

## 💻 Development

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Lint code with ESLint

### Database Models

#### Session Model

```typescript
{
	name: string; // Session name
	date: Date; // Session date
	time: string; // Session time
	limit: number; // Maximum participants
	currentRegistrations: number; // Current count
}
```

#### Registration Model

```typescript
{
	fullName: string; // Student's full name
	phoneNumber: string; // Contact number
	grade: string; // Grade (SD 1-6)
	sessionId: ObjectId; // Reference to session
}
```

### Key Features Implementation

#### Real-time Updates (SSE)

The application uses Server-Sent Events for real-time synchronization:

- Connection established at `/api/sse`
- Clients automatically receive updates when data changes
- No polling required - efficient and scalable
- Automatic reconnection on connection loss

#### Multi-student Registration

- Users can register multiple students in a single submission
- Each student can be in different grades
- All students share the same contact number and session
- Validation ensures all required fields are filled

#### Export Functionality

- Export to Excel (.xlsx) with formatted headers
- Export to CSV for compatibility
- Filter exports by session or export all
- Files include timestamp in filename

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License - see the [LICENSE](LICENSE) file for details.

## 👥 Authors

- **huntressofthefallen** - [GitHub Profile](https://github.com/huntressofthefallen)

## 🙏 Acknowledgments

- Sampoerna University students for conducting the literacy program
- The Pancoran community for supporting this initiative
- All contributors who help improve this project

---

**Made with ❤️ for Kampung Literasi Pancoran**

For issues and questions, please visit the [Issues](https://github.com/huntressofthefallen/kampung-literasi/issues) page.
