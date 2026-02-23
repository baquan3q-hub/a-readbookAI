import React, { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { generateContent, generateAudio, GenerationParams } from '../services/geminiService';
import { saveContent, uploadAudio, updateAudioUrl } from '../services/historyService';
import HistoryPanel from './HistoryPanel';
import { Loader2, Sparkles, BookOpen, Clock, Globe, Volume2, Download, CheckCircle } from 'lucide-react';

interface ContentGeneratorProps {
  userId: string;
}

export default function ContentGenerator({ userId }: ContentGeneratorProps) {
  const [history, setHistory] = useState<string[]>([]);
  const [params, setParams] = useState<GenerationParams>({
    topic: '',
    format: 'Bài đọc',
    language: 'Tiếng Việt',
    time: '5 phút',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [savedContentId, setSavedContentId] = useState<string | null>(null);
  const [refreshHistory, setRefreshHistory] = useState(0);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setParams((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.topic.trim()) {
      setError('Vui lòng nhập chủ đề.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setResult(null);
    setAudioUrl(null);
    setSavedContentId(null);

    try {
      const generatedText = await generateContent({ ...params, history });
      setResult(generatedText);
      setHistory(prev => [...prev, `${params.topic} (${params.format})`].slice(-5));

      // Auto-save to Supabase
      try {
        console.log('📝 Auto-saving content to Supabase...');
        const saved = await saveContent({
          userId,
          topic: params.topic,
          format: params.format,
          language: params.language,
          timeEstimate: params.time,
          content: generatedText,
          audioUrl: null,
        });
        console.log('✅ Content saved! ID:', saved.id);
        setSavedContentId(saved.id);
        setRefreshHistory(prev => prev + 1);
      } catch (saveErr) {
        console.error('❌ Auto-save failed:', saveErr);
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi không xác định.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!result) return;

    setIsGeneratingAudio(true);
    setError(null);
    try {
      const audio = await generateAudio(result);
      setAudioUrl(audio);
      console.log('🎵 Audio generated, savedContentId:', savedContentId);

      // Upload audio lên Supabase Storage và lưu URL vào DB
      if (savedContentId) {
        try {
          console.log('📤 Uploading audio to Supabase Storage...');
          const publicUrl = await uploadAudio(userId, audio);
          console.log('✅ Audio uploaded! URL:', publicUrl);
          await updateAudioUrl(savedContentId, publicUrl);
          console.log('✅ Audio URL saved to DB!');
          // Chuyển sang dùng URL từ Storage thay vì base64 tạm thời
          setAudioUrl(publicUrl);
          setRefreshHistory(prev => prev + 1);
        } catch (uploadErr) {
          console.error('❌ Audio upload failed:', uploadErr);
          // Vẫn giữ base64 audio để user nghe được
        }
      } else {
        console.warn('⚠️ No savedContentId - audio not saved to DB');
      }
    } catch (err: any) {
      setError(err.message || 'Lỗi khi tạo âm thanh.');
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleDownloadAudio = () => {
    if (!audioUrl) return;
    const a = document.createElement('a');
    a.href = audioUrl;
    a.download = `audio-${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handleLoadFromHistory = (content: string, historyAudioUrl: string | null, contentId: string) => {
    setResult(content);
    setAudioUrl(historyAudioUrl);
    setSavedContentId(contentId);
  };

  return (
    <div className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Left: Form + History */}
      <div className="lg:col-span-3 space-y-6">
        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-5">
          <h2 className="text-lg font-semibold text-slate-900 mb-5 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Tạo Nội Dung Mới
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Topic */}
            <div className="space-y-1.5">
              <label htmlFor="topic" className="block text-sm font-medium text-slate-700">
                Chủ đề
              </label>
              <input
                type="text"
                id="topic"
                name="topic"
                value={params.topic}
                onChange={handleInputChange}
                placeholder="VD: Tài chính cá nhân..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm"
              />
              <div className="flex flex-wrap gap-1.5 pt-1">
                {['Self-Help', 'Critical Thinking', 'Technology', 'Finance', 'Business - Economy', 'Communicate Skill', 'Marketing'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setParams(prev => ({ ...prev, topic: t }))}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-medium transition-colors ${params.topic === t
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {/* Format */}
            <div className="space-y-1.5">
              <label htmlFor="format" className="block text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                Thể loại
              </label>
              <select
                id="format"
                name="format"
                value={params.format}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm appearance-none"
              >
                <option value="Bài đọc">Bài đọc (Article)</option>
                <option value="Kịch bản Podcast">Kịch bản Podcast</option>
                <option value="Hội thoại truyện tranh">Hội thoại truyện tranh</option>
                <option value="Tinh hoa Sách">Tinh hoa Sách (Book Summary & Extract)</option>
              </select>
            </div>

            {/* Language */}
            <div className="space-y-1.5">
              <label htmlFor="language" className="block text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400" />
                Ngôn ngữ
              </label>
              <select
                id="language"
                name="language"
                value={params.language}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm appearance-none"
              >
                <option value="Tiếng Việt">Tiếng Việt</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Song ngữ Anh - Việt">Song ngữ Anh - Việt</option>
              </select>
            </div>

            {/* Time */}
            <div className="space-y-1.5">
              <label htmlFor="time" className="block text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                Thời gian
              </label>
              <select
                id="time"
                name="time"
                value={params.time}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm appearance-none"
              >
                <option value="3 phút (khoảng 400 từ)">3 phút (~400 từ)</option>
                <option value="5 phút (khoảng 600-750 từ)">5 phút (~600-750 từ)</option>
                <option value="10 phút (khoảng 1200-1500 từ)">10 phút (~1200-1500 từ)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2 text-sm"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Đang tạo...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Tạo Nội Dung
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-3 p-3 bg-red-50 text-red-700 rounded-xl text-xs border border-red-100">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Center: Result */}
      <div className="lg:col-span-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[600px] flex flex-col">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
            <h2 className="text-lg font-semibold text-slate-800">Kết Quả</h2>
            <div className="flex items-center gap-2">
              {result && !audioUrl && (
                <button
                  onClick={handleGenerateAudio}
                  disabled={isGeneratingAudio}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  {isGeneratingAudio ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Volume2 className="w-3.5 h-3.5" />
                  )}
                  {isGeneratingAudio ? 'Tạo Audio...' : 'Nghe Audio'}
                </button>
              )}
              {result && savedContentId && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-600">
                  <CheckCircle className="w-3 h-3" />
                  Đã tự động lưu
                </span>
              )}
            </div>
          </div>

          {audioUrl && (
            <div className="px-5 pt-3 flex items-center gap-2">
              <audio controls src={audioUrl} className="h-8 flex-1" />
              <button
                onClick={handleDownloadAudio}
                className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                title="Tải âm thanh"
              >
                <Download className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="p-5 flex-1 overflow-auto">
            {isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                <p className="text-sm font-medium animate-pulse">AI đang chắt lọc tinh hoa kiến thức...</p>
              </div>
            ) : result ? (
              <div className="prose prose-slate prose-indigo max-w-none prose-headings:font-semibold prose-a:text-indigo-600 hover:prose-a:text-indigo-500 prose-strong:text-slate-900 prose-p:leading-relaxed">
                <Markdown remarkPlugins={[remarkGfm]}>{result}</Markdown>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mb-2">
                  <BookOpen className="w-8 h-8 text-slate-300" />
                </div>
                <p className="text-sm">Nội dung của bạn sẽ xuất hiện ở đây.</p>
                <p className="text-xs text-slate-400 max-w-sm text-center">
                  Hãy điền các thông số bên trái và nhấn "Tạo Nội Dung" để bắt đầu.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right: History */}
      <div className="lg:col-span-3">
        <div className="sticky top-24" style={{ maxHeight: 'calc(100vh - 8rem)' }}>
          <HistoryPanel
            userId={userId}
            refreshTrigger={refreshHistory}
            onLoadContent={handleLoadFromHistory}
          />
        </div>
      </div>
    </div>
  );
}
