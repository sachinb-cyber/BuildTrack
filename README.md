# Samarth Developers Operations Dashboard

A comprehensive, enterprise-grade operations and management dashboard built for construction and development teams. This platform acts as a centralized brain for tracking projects, managing labor and staff, handling invoices, tracking expenses, and leveraging AI for predictive forecasting.

## 🚀 Features

- **Real-Time Dashboard:** Overview of operations, budgets, active workforce, and low-stock inventory alerts.
- **Project Management:** Track active construction projects, budget allocations, and utilization metrics.
- **Labor & Staff Management:** Monitor worker attendance, staff salaries, and pending payments.
- **Inventory Tracking:** Precise tracking of materials per project with low-stock threshold warnings.
- **Finance & Expenses:** Detailed categorization of expenses, monthly trends, and visual budget reporting.
- **Invoice Management:** Track pending and paid invoices generated across operations.
- **AI-Powered Forecasting:** Utilizes Google GenAI (`@google/generative-ai`) to project cost trends, staff requirements, and timelines.
- **Secure Authentication:** Role-based access control leveraging JWT and bcrypt.

## 🎨 UI/UX Architecture

This application features a strictly modern, Vercel/Linear-inspired aesthetic engineered entirely from scratch using custom, high-performance CSS:

- **True OLED Black Monochrome Theme:** Ultra-high contrast interface devoid of blurry background glows, prioritizing deep blacks (`#000`), slate surfaces, and pure white text.
- **Precision Typography:** Powered by `Inter` for exceptional data readability. Feature tight tracking (-0.01em) typical of premium tooling.
- **Hairline Borders (.precision-border):** Replaces classic box-shadows with 1px translucent borders to carve out structure flawlessly.
- **Tactile Micro-Interactions:** Custom `cubic-bezier(0.2,0,0,1)` easing on all views, allowing elements to realistically snap to attention. Buttons compress dimensionally (`scale(0.97)`) to emulate mechanical weight instead of relying on generic hover-growth.

## 🛠 Tech Stack

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/)
- **Frontend:** React 19, Vanilla CSS (Custom Design System)
- **Backend:** Next.js Server Actions / API Routes
- **Database:** MongoDB via [Mongoose](https://mongoosejs.com/)
- **Authentication:** Custom JWT-based Auth
- **AI Integration:** Google Gemini API 

## 📦 Getting Started

### Prerequisites

Ensure you have Node.js (v18+) and npm installed. You will also need a MongoDB database instance and a Gemini API key.

### Installation

1. **Clone the repository** (if applicable):
   ```bash
   git clone <repo-url>
   cd nextjs-app
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment Setup:**
   Create a `.env.local` or `.env` file in the root directory and add the following variables:
   ```env
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   GEMINI_API_KEY=your_google_gemini_api_key
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   ```

5. **Open the App:** Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
├── app/                  # Next.js App Router (Pages, API Routes)
│   ├── dashboard/        # Dashboard view
│   ├── projects/         # Project management view
│   ├── inventory/        # Inventory and stock tracking
│   ├── workers/          # Day-labor workforce management
│   ├── staff/            # Permanent staff management
│   ├── invoices/         # Billing and invoicing view
│   ├── expenses/         # Financial trends
│   ├── forecast/         # AI-powered operations forecasting
│   ├── api/              # Backend API routes connecting to MongoDB
│   └── globals.css       # Core design system and theme variables
├── components/           # Reusable UI architecture
│   ├── Layout.js         # Core shell layout
│   ├── Sidebar.js        # Global navigation
│   └── UI.js             # Entire custom component library (Btn, Card, DataTable)
├── context/              # React Context (AuthContext)
├── lib/                  # Helpers and API utility functions
├── models/               # MongoDB Mongoose schemas
└── seed.mjs              # Data seeding script
```

## 📜 License
Private Software. All rights reserved.
