# Student Records System - IT3119 - Dequiso

Live System: https://it3119-student-records-dequiso.vercel.app

## Local Setup
1. `npm install`
2. Create `.env.local` with:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
3. `npm run dev`
4. Open http://localhost:5173/

## Features
- Operator sign in (approved operators only)
- Add / Edit / Delete student
- Search by name or student number
- Course report - count students per course