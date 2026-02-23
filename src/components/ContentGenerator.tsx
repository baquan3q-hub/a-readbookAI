import React, { useState } from 'react';
import Markdown from 'react-markdown';
import { generateContent, generateAudio, GenerationParams } from '../services/geminiService';
import { Loader2, Sparkles, BookOpen, Mic, MessageSquare, Clock, Globe, Volume2, Download } from 'lucide-react';

export default function ContentGenerator() {
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

    try {
      const generatedText = await generateContent({ ...params, history });
      setResult(generatedText);
      setHistory(prev => [...prev, `${params.topic} (${params.format})`].slice(-5));
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

  return (
    <div className="max-w-5xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Form Section */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-6 flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-600" />
            Tạo Nội Dung Mới
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Topic */}
            <div className="space-y-2">
              <label htmlFor="topic" className="block text-sm font-medium text-slate-700">
                Chủ đề
              </label>
              <input
                type="text"
                id="topic"
                name="topic"
                value={params.topic}
                onChange={handleInputChange}
                placeholder="VD: Tài chính cá nhân, Giao tiếp..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                {['Self-Help', 'Critical Thinking', 'Technology', 'Finance', 'Business - Economy', 'Communicate Skill', 'Marketing'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setParams(prev => ({ ...prev, topic: t }))}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      params.topic === t 
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
            <div className="space-y-2">
              <label htmlFor="format" className="block text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-slate-400" />
                Thể loại
              </label>
              <select
                id="format"
                name="format"
                value={params.format}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm appearance-none"
              >
                <option value="Bài đọc">Bài đọc (Article)</option>
                <option value="Kịch bản Podcast">Kịch bản Podcast</option>
                <option value="Hội thoại truyện tranh">Hội thoại truyện tranh</option>
                <option value="Tinh hoa Sách">Tinh hoa Sách (Book Summary & Extract)</option>
              </select>
            </div>

            {/* Language */}
            <div className="space-y-2">
              <label htmlFor="language" className="block text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-slate-400" />
                Ngôn ngữ
              </label>
              <select
                id="language"
                name="language"
                value={params.language}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm appearance-none"
              >
                <option value="Tiếng Việt">Tiếng Việt</option>
                <option value="Tiếng Anh">Tiếng Anh</option>
                <option value="Song ngữ Anh - Việt">Song ngữ Anh - Việt</option>
              </select>
            </div>

            {/* Time */}
            <div className="space-y-2">
              <label htmlFor="time" className="block text-sm font-medium text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-slate-400" />
                Thời gian tiêu thụ
              </label>
              <select
                id="time"
                name="time"
                value={params.time}
                onChange={handleInputChange}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm appearance-none"
              >
                <option value="3 phút (khoảng 400 từ)">3 phút (khoảng 400 từ)</option>
                <option value="5 phút (khoảng 600-750 từ)">5 phút (khoảng 600-750 từ)</option>
                <option value="10 phút (khoảng 1200-1500 từ)">10 phút (khoảng 1200-1500 từ)</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={isGenerating}
              className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-4"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Đang tạo nội dung...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Tạo Nội Dung
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Result Section */}
      <div className="lg:col-span-8">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 min-h-[600px] flex flex-col">
          <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 rounded-t-2xl">
            <h2 className="text-lg font-semibold text-slate-800">Kết Quả</h2>
            <div className="flex items-center gap-3">
              {result && !audioUrl && (
                <button
                  onClick={handleGenerateAudio}
                  disabled={isGeneratingAudio}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors disabled:opacity-50"
                >
                  {isGeneratingAudio ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                  {isGeneratingAudio ? 'Đang tạo Audio...' : 'Nghe Audio'}
                </button>
              )}
              {audioUrl && (
                <div className="flex items-center gap-2">
                  <audio controls src={audioUrl} className="h-8 w-48 lg:w-64" />
                  <button
                    onClick={handleDownloadAudio}
                    className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                    title="Tải âm thanh"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              )}
              {result && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                  Hoàn thành
                </span>
              )}
            </div>
          </div>
          
          <div className="p-6 flex-1 overflow-auto">
            {isGenerating ? (
              <div className="h-full flex flex-col items-center justify-center text-slate-400 space-y-4">
                <Loader2 className="w-10 h-10 animate-spin text-indigo-500" />
                <p className="text-sm font-medium animate-pulse">AI đang chắt lọc tinh hoa kiến thức...</p>
              </div>
            ) : result ? (
              <div className="prose prose-slate prose-indigo max-w-none prose-headings:font-semibold prose-a:text-indigo-600 hover:prose-a:text-indigo-500 prose-strong:text-slate-900 prose-p:leading-relaxed">
                <Markdown>{result}</Markdown>
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
    </div>
  );
}
