import { useState, useEffect } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getHistory, getContentById, deleteContent, HistoryListItem, HistoryItem } from '../services/historyService';
import { Loader2, History, Trash2, BookOpen, Clock, ChevronLeft, Volume2 } from 'lucide-react';

interface HistoryPanelProps {
    userId: string;
    refreshTrigger: number;
    onLoadContent: (content: string, audioUrl: string | null, contentId: string) => void;
}

export default function HistoryPanel({ userId, refreshTrigger, onLoadContent }: HistoryPanelProps) {
    const [items, setItems] = useState<HistoryListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedItem, setSelectedItem] = useState<HistoryItem | null>(null);
    const [loadingDetail, setLoadingDetail] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (userId) {
            loadHistory();
        }
    }, [userId, refreshTrigger]);

    const loadHistory = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getHistory();
            setItems(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectItem = async (item: HistoryListItem) => {
        setLoadingDetail(true);
        setError(null);
        try {
            const detail = await getContentById(item.id);
            if (detail) {
                setSelectedItem(detail);
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoadingDetail(false);
        }
    };

    const handleDelete = async (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Bạn có chắc muốn xóa nội dung này?')) return;

        try {
            await deleteContent(id);
            setItems(prev => prev.filter(item => item.id !== id));
            if (selectedItem?.id === id) {
                setSelectedItem(null);
            }
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleLoadToMain = () => {
        if (selectedItem) {
            onLoadContent(selectedItem.content, selectedItem.audio_url, selectedItem.id);
            setSelectedItem(null);
        }
    };

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const formatBadgeColor = (format: string) => {
        switch (format) {
            case 'Bài đọc': return 'bg-blue-100 text-blue-700';
            case 'Kịch bản Podcast': return 'bg-purple-100 text-purple-700';
            case 'Hội thoại truyện tranh': return 'bg-orange-100 text-orange-700';
            case 'Tinh hoa Sách': return 'bg-emerald-100 text-emerald-700';
            default: return 'bg-slate-100 text-slate-700';
        }
    };

    // Detail View
    if (selectedItem) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
                <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl flex items-center gap-3">
                    <button
                        onClick={() => setSelectedItem(null)}
                        className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 text-slate-600" />
                    </button>
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-slate-800 truncate">{selectedItem.topic}</h3>
                        <p className="text-xs text-slate-500">{formatDate(selectedItem.created_at)}</p>
                    </div>
                    <button
                        onClick={handleLoadToMain}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-medium rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Mở ở Panel chính
                    </button>
                </div>

                {selectedItem.audio_url && (
                    <div className="px-4 pt-3 flex items-center gap-2">
                        <Volume2 className="w-4 h-4 text-indigo-500" />
                        <audio controls src={selectedItem.audio_url} className="h-8 flex-1" />
                    </div>
                )}

                <div className="p-4 flex-1 overflow-auto">
                    <div className="prose prose-slate prose-sm prose-indigo max-w-none">
                        <Markdown remarkPlugins={[remarkGfm]}>{selectedItem.content}</Markdown>
                    </div>
                </div>
            </div>
        );
    }

    // List View
    return (
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 bg-slate-50/50 rounded-t-2xl">
                <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                    <History className="w-5 h-5 text-indigo-600" />
                    Lịch Sử ({items.length})
                </h2>
            </div>

            <div className="flex-1 overflow-auto p-2">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <Loader2 className="w-6 h-6 animate-spin text-indigo-500" />
                    </div>
                ) : error ? (
                    <div className="p-3 m-2 bg-red-50 text-red-600 rounded-xl text-sm">{error}</div>
                ) : items.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                        <BookOpen className="w-10 h-10 text-slate-300 mb-3" />
                        <p className="text-sm">Chưa có nội dung nào.</p>
                        <p className="text-xs mt-1">Hãy tạo nội dung đầu tiên!</p>
                    </div>
                ) : (
                    <div className="space-y-1">
                        {items.map((item) => (
                            <div
                                key={item.id}
                                onClick={() => handleSelectItem(item)}
                                className="w-full text-left p-3 rounded-xl hover:bg-slate-50 transition-colors group cursor-pointer"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <p className="font-medium text-sm text-slate-800 truncate">{item.topic}</p>
                                        <div className="flex items-center gap-2 mt-1.5">
                                            <span className={`inline-flex px-2 py-0.5 rounded-md text-[10px] font-medium ${formatBadgeColor(item.format)}`}>
                                                {item.format}
                                            </span>
                                            <span className="text-[10px] text-slate-400">{item.language}</span>
                                            {item.audio_url && (
                                                <Volume2 className="w-3 h-3 text-indigo-400" />
                                            )}
                                        </div>
                                        <div className="flex items-center gap-1 mt-1.5">
                                            <Clock className="w-3 h-3 text-slate-300" />
                                            <span className="text-[10px] text-slate-400">{formatDate(item.created_at)}</span>
                                        </div>
                                    </div>
                                    <button
                                        onClick={(e) => handleDelete(item.id, e)}
                                        className="p-1.5 opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500 rounded-lg transition-all text-slate-400"
                                        title="Xóa"
                                    >
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {loadingDetail && (
                    <div className="fixed inset-0 bg-black/20 flex items-center justify-center z-50 rounded-2xl">
                        <div className="bg-white p-4 rounded-xl shadow-lg flex items-center gap-3">
                            <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                            <span className="text-sm text-slate-700">Đang tải nội dung...</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
