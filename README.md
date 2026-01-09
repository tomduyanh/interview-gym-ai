# InterviewGym AI

InterviewGym AI is a modern web application designed to help job seekers prepare for interviews by generating personalized questions based on their resume and a specific job description. Powered by Google Gemini 2.0 Flash and Supabase.


## 🚀 Features

- **Resume Analysis**: Upload your resume (PDF) to extract key skills and experiences.
- **Job Tailoring**: Input a job description to get questions specific to the role.
- **AI-Powered Questions**: Generates a mix of technical and behavioral questions using Gemini 2.0 Flash.
- **Interactive Mock Interview**: Answer questions in a sleek, focused UI.
- **Detailed Evaluation**: Get instant feedback on clarity, relevance, and STAR structure for each answer.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: Tailwind CSS, Shadcn UI
- **AI Engine**: Google Gemini 2.0 Flash
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel

## ⚙️ Getting Started

### Prerequisites

- Node.js 20+
- A Google AI SDK API Key ([Get it here](https://aistudio.google.com/app/apikey))
- A Supabase Project ([Create one here](https://supabase.com/))

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/tomduyanh/interview-gym-ai.git
   cd interview-gym-ai
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Setup environment variables:
   Copy `.env.local.example` to `.env.local` and fill in your credentials.
   ```bash
   cp .env.local.example .env.local
   ```

4. Database Setup:
   Apply the SQL migration found in `supabase/migrations/interview_sessions_schema.sql` in your Supabase SQL Editor.

5. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

