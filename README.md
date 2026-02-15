# Kampung Literasi - Registration System

A Next.js-based registration system for Kampung Literasi sessions with MongoDB backend.

![Registration Page](https://github.com/user-attachments/assets/bd546255-1cc6-41c9-9858-a9e3d592eb48)

## Features

### 📝 Public Registration Page
- **User Registration Form** with Full Name, Email, Phone Number (+62 prefix required), and Session selection
- **Session Capacity Display** - shows available spots (e.g., "10/20")
- **Unique Registration Rule** - One person (same Full Name) can only register for **one session**
- **Capacity Limits** - Prevents registration when session is full
- **Real-time Validation** - Immediate feedback on errors
- **Responsive Design** - Works on desktop and mobile

### 🔐 Admin Dashboard (Password Protected)
- **Secure Access** - Password-protected admin panel
- **Session Management:**
  - ✅ Add new sessions with name, date, and time
  - ✅ Set person limit for each session
  - ✅ Edit existing sessions (change date/time/limit)
  - ✅ Delete sessions
- **Data Export:**
  - ✅ Export all registrations to Excel (.xlsx)
  - ✅ Export all registrations to CSV
- **Registration Overview** - View all registrations in a table format
- **Real-time Tracking** - See current registration count vs. capacity

## Screenshots

### Registration Success
![Registration Success](https://github.com/user-attachments/assets/8d335b50-d94b-41e5-a4c4-0fc8412d4919)

### Admin Dashboard
![Admin Dashboard](https://github.com/user-attachments/assets/c15483d8-c87a-4c90-8c85-fa4d28872e6a)

### Admin Login
![Admin Login](https://github.com/user-attachments/assets/9e5105d0-4ad4-453f-b165-974e4c9343f0)

## Technologies

- Next.js 16 (App Router)
- TypeScript
- MongoDB with Mongoose
- Tailwind CSS
- ExcelJS & PapaParse for data export

## Prerequisites

- Node.js 18+ 
- MongoDB instance (local or cloud)

## Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/huntressofthefallen/kampung-literasi.git
   cd kampung-literasi
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the root directory:
   ```env
   MONGODB_URI=mongodb://localhost:27017/kampung-literasi
   ADMIN_PASSWORD=your_secure_password
   ```

   Or use MongoDB Atlas for cloud database:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/kampung-literasi
   ADMIN_PASSWORD=your_secure_password
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Access the application**
   - Main Registration Page: http://localhost:3000
   - Admin Dashboard: http://localhost:3000/admin

## Usage

### For Users
1. Visit the registration page
2. Fill in your details (Full Name, Email, Phone Number)
3. Select an available session
4. Submit the form

### For Administrators
1. Navigate to `/admin`
2. Enter the admin password (default: `admin123` or as configured in `.env`)
3. Manage sessions:
   - Click "Add Session" to create a new session
   - Click "Edit" to modify session details
   - Click "Delete" to remove a session
4. Export data:
   - Click "Export as CSV" or "Export as Excel" to download registration data

## Project Structure

```
kampung-literasi/
├── app/
│   ├── admin/
│   │   └── page.tsx          # Admin dashboard
│   ├── api/
│   │   ├── admin/
│   │   │   ├── export/       # Export API endpoint
│   │   │   └── login/        # Admin login endpoint
│   │   ├── registrations/    # Registration CRUD endpoints
│   │   └── sessions/         # Session CRUD endpoints
│   ├── globals.css           # Global styles
│   ├── layout.tsx            # Root layout
│   └── page.tsx              # Main registration page
├── lib/
│   └── mongodb.ts            # MongoDB connection
├── models/
│   ├── Registration.ts       # Registration schema
│   └── Session.ts            # Session schema
├── .env.example              # Example environment variables
└── package.json
```

## API Endpoints

### Public Endpoints
- `GET /api/sessions` - List all sessions
- `POST /api/registrations` - Create new registration

### Admin Endpoints
- `POST /api/admin/login` - Admin authentication
- `GET /api/admin/export?format=csv|excel` - Export registrations
- `POST /api/sessions` - Create session
- `PUT /api/sessions/[id]` - Update session
- `DELETE /api/sessions/[id]` - Delete session

## Build for Production

```bash
npm run build
npm start
```

## License

ISC

## Support

For issues and questions, please open an issue on GitHub.
