# 📚 ReadbookAI — EduContent Generator

> A personal learning companion powered by Google Gemini AI that generates high-quality educational content, converts it to audio, and saves everything for future reference.

## 💡 The Idea Behind This Project

As someone passionate about continuous learning, I often found myself short on time but still wanting to absorb knowledge from books, podcasts, and articles. I built **ReadbookAI** to solve my own problem:

- **Generate bite-sized educational content** on any topic I'm curious about — in just 3, 5, or 10 minutes of reading time.
- **Listen on the go** with AI-generated audio narration, so I can learn while commuting or exercising.
- **Build a personal knowledge library** where every piece of content I generate is automatically saved and accessible anytime.

This isn't just a demo — it's a tool I use daily to learn smarter, not harder.

## ✨ Key Features

| Feature | Description |
|---------|-------------|
| 🤖 **AI Content Generation** | Generates articles, podcast scripts, dialogues, and book summaries using Gemini AI |
| 🎙️ **Text-to-Speech** | Converts content to natural-sounding audio with Gemini TTS |
| 🌐 **Bilingual Support** | Vietnamese, English, and side-by-side bilingual output with vocabulary tables |
| 💾 **Auto-Save** | Content is automatically saved to Supabase database after generation |
| 🔊 **Audio Persistence** | Generated audio is uploaded to cloud storage — listen again without re-generating |
| 📱 **PWA** | Installable on mobile devices — add to home screen for app-like experience |
| 🔐 **Authentication** | Secure user accounts with Supabase Auth, persistent login sessions |
| 📖 **History Panel** | Browse, search, and replay all previously generated content |

## 🛠️ Tech Stack

- **Frontend:** React 19 + TypeScript + Vite
- **Styling:** Tailwind CSS v4
- **AI:** Google Gemini API (`gemini-3-flash-preview` for text, `gemini-2.5-flash-preview-tts` for audio)
- **Backend:** Supabase (PostgreSQL + Auth + Storage)
- **Deployment:** Vercel-ready

## 📸 Screenshots

> *Coming soon*

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A [Google AI Studio](https://aistudio.google.com/) API key
- A [Supabase](https://supabase.com/) project

### 1. Clone & Install

```bash
git clone https://github.com/baquan3q-hub/a-readbookAI.git
cd a-readbookAI
npm install
```

### 2. Set Up Supabase

Create a new Supabase project, then run this SQL in the SQL Editor:

```sql
-- Content history table
CREATE TABLE generated_contents (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  topic TEXT NOT NULL,
  format TEXT NOT NULL,
  language TEXT NOT NULL,
  time_estimate TEXT NOT NULL,
  content TEXT NOT NULL,
  audio_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE INDEX idx_contents_user_id ON generated_contents(user_id);
CREATE INDEX idx_contents_created_at ON generated_contents(created_at DESC);

-- Row Level Security
ALTER TABLE generated_contents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own contents"
  ON generated_contents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own contents"
  ON generated_contents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own contents"
  ON generated_contents FOR DELETE USING (auth.uid() = user_id);

-- Audio storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('audio-files', 'audio-files', true);

CREATE POLICY "Users can upload audio"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'audio-files' AND auth.role() = 'authenticated');
CREATE POLICY "Public can read audio"
  ON storage.objects FOR SELECT USING (bucket_id = 'audio-files');
CREATE POLICY "Users can delete own audio"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'audio-files' AND auth.uid()::text = (storage.foldername(name))[1]);
```

### 3. Configure Environment

Create a `.env.local` file:

```env
GEMINI_API_KEY="your_gemini_api_key"
VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="your_anon_key"
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── components/
│   ├── AuthForm.tsx          # Login/Signup form
│   ├── ContentGenerator.tsx  # Main content creation UI
│   └── HistoryPanel.tsx      # Content history sidebar
├── services/
│   ├── geminiService.ts      # Gemini AI integration (text + audio)
│   ├── historyService.ts     # CRUD operations for saved content
│   └── supabaseClient.ts     # Supabase client configuration
├── App.tsx                   # Root component with auth flow
└── main.tsx                  # Application entry point
```

## 🎯 Content Formats

| Format | Description |
|--------|-------------|
| **Bài đọc (Article)** | Well-structured articles with clear sections and practical insights |
| **Kịch bản Podcast** | Natural-sounding podcast scripts with emotional cues like `[Pause]`, `[Soft laugh]` |
| **Hội thoại truyện tranh** | Realistic dialogues between 2-3 characters in everyday scenarios |
| **Tinh hoa Sách (Book Extract)** | Key stories, philosophies, and lessons extracted from classic books |

## 🧠 What I Learned

Building this project strengthened my skills in:

- **AI Integration** — Working with Google Gemini's multimodal API (text generation + TTS)
- **Full-Stack Development** — React frontend + Supabase backend with real-time auth
- **Audio Engineering** — PCM-to-WAV conversion, Base64 encoding, and cloud storage
- **PWA Development** — Service workers, manifest configuration, offline-first strategies
- **Database Design** — Row Level Security policies for multi-tenant data isolation

## 📝 License

This project is for educational and portfolio purposes.

---

**Built with ❤️ by [Baquan](https://github.com/baquan3q-hub)**
