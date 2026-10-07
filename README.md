# 🎟️ Nostalgeste '26 - MERN Party Ticketing & QR Gate Scanner System

> **"Rewinding the Time. Reliving the Memories."**  
> Official ticketing, bank payment verification, and gate check-in system for **Mahamaya Balika Vidyalaya, Kadawatha** (2026 A/L & 23/24 O/L Batches).

---

## 🌟 Key Features

### 1. 🎓 Student Portal (`/`)
- **Student ID Status Lookup**: Students enter their ID to check payment verification status.
- **Bank Transfer Instructions**: Prominent bank account details banner with 1-click **Copy Account Number** and reminder to include Student ID in the reference.
- **Installment / Half Payment Support**:
  - Choice between **Full Payment** (Rs. 3,000) and **1st Half Payment** (Rs. 1,500).
  - Slip upload with live image preview.
  - Students with **`HALF_APPROVED`** status can upload their second slip before the **October 14th deadline**.
- **Golden Digital VIP Ticket Pass**:
  - Rendered when status is `FULL_APPROVED`.
  - Luxury royal purple and gold watercolor design matching the formal party invitation.
  - Embedded gate entrance QR code, student details, and event itinerary.
  - One-click **Print Pass** and **Download QR Code** buttons with celebration confetti.

### 2. 🛡️ Admin Verification Portal (`/admin`)
- **Protected by PIN / Password** (Default: `nostalgeste2026`).
- **Overview Metrics**: Real-time counter of total registrations, full passes, half payments, pending reviews, gate check-ins, and verified revenue.
- **Interactive Verification Table**:
  - Filter by Payment Status (`PENDING_FIRST_HALF`, `HALF_APPROVED`, `PENDING_SECOND_HALF`, `FULL_APPROVED`, `REJECTED`).
  - Filter by Batch (`2026 A/L`, `23/24 O/L`).
  - Search by Name, Student ID, Phone, Email.
  - **Receipt Zoom & Pan Modal**: Inspect high-res slips, zoom in/out, rotate 90°, and compare 1st vs 2nd slips.
  - **One-Click Actions**:
    - *Approve 1st Half* -> Updates status to `HALF_APPROVED`.
    - *Approve Full* -> Updates status to `FULL_APPROVED` and automatically dispatches the branded HTML ticket with QR code via email.
    - *Reject / Request Re-upload* -> Enter custom committee note displayed directly to the student.
    - *Resend Ticket Email*.
- **Export to CSV**: Download complete attendee list for gate security.

### 3. 📱 Mobile Gate Check-In Scanner (`/scanner`)
- **In-Browser Camera Scanner**: Powered by `html5-qrcode` with camera switching.
- **Web Audio Sound Effects**: Instant audio feedback (double chime for success, buzzer for duplicate/invalid).
- **Wristband Number Manager**: Real-time wristband number assignment and auto-increment.
- **Live Verification States**:
  - 🟢 **VALID ENTRY**: Green glow, Student Name, Batch, Student ID, assigned wristband number.
  - 🔴 **ALREADY USED**: Red alert displaying prior check-in timestamp and previous wristband number.
  - 🟡 **PAYMENT INCOMPLETE**: Directs half-paid students to the cashier desk.
  - 🔴 **INVALID TICKET**: Unrecognized token alert.
- **Manual Token / ID Backup**: Fallback input in case camera scanning is difficult.
- **Live Gate Scan Feed**: Displays recent check-ins in the session.

---

## 🚀 Getting Started

### 1. Install Dependencies
```bash
# Install server dependencies
cd server
npm install

# Install client dependencies
cd ../client
npm install
```

### 2. Environment Configuration
Check `server/.env`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/nostalgeste26

# Admin PIN
ADMIN_PASSWORD=nostalgeste2026
JWT_SECRET=nostalgeste_secret_jwt_key_2026_super_secure

# Cloudinary (Optional - will automatically fallback to local storage if empty)
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=

# Email (Optional - will log test preview links in console if empty)
EMAIL_USER=
EMAIL_PASS=
```

### 3. Start Backend & Frontend
In terminal 1:
```bash
cd server
npm run dev
```

In terminal 2:
```bash
cd client
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🎨 Theme & Styling
- **Royal Purple**: `#2E1A47` / `#4A2E6D`
- **Gold Accents**: `#D4AF37` / `#F3E5AB`
- **Lavender Background**: `#F7F4FA`
- **Typography**: Playfair Display (Serif Headings) & Outfit (Modern Sans Body)
