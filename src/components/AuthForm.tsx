import React, { useState } from 'react';
import { supabase } from '../services/supabaseClient';
import { Loader2, LogIn, UserPlus, Mail, Lock, BookOpen } from 'lucide-react';

interface AuthFormProps {
    onAuthSuccess: () => void;
}

export default function AuthForm({ onAuthSuccess }: AuthFormProps) {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            if (isLogin) {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;
                onAuthSuccess();
            } else {
                const { error } = await supabase.auth.signUp({ email, password });
                if (error) throw error;
                setSuccess('Đăng ký thành công! Bạn có thể đăng nhập ngay.');
                setIsLogin(true);
            }
        } catch (err: any) {
            setError(err.message || 'Đã xảy ra lỗi.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-2xl shadow-lg shadow-indigo-200 mb-4">
                        <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">EduContent Generator</h1>
                    <p className="text-sm text-slate-500 mt-1">Powered by Gemini AI</p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 p-8">
                    <h2 className="text-xl font-semibold text-slate-900 mb-6 text-center">
                        {isLogin ? 'Đăng Nhập' : 'Đăng Ký Tài Khoản'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Email */}
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="block text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                <Mail className="w-4 h-4 text-slate-400" />
                                Email
                            </label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="email@example.com"
                                required
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm"
                            />
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="block text-sm font-medium text-slate-700 flex items-center gap-1.5">
                                <Lock className="w-4 h-4 text-slate-400" />
                                Mật khẩu
                            </label>
                            <input
                                type="password"
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Tối thiểu 6 ký tự"
                                required
                                minLength={6}
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors text-sm"
                            />
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 text-red-700 rounded-xl text-sm border border-red-100">
                                {error}
                            </div>
                        )}

                        {success && (
                            <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm border border-emerald-100">
                                {success}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl shadow-sm shadow-indigo-200 transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
                        >
                            {loading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : isLogin ? (
                                <>
                                    <LogIn className="w-5 h-5" />
                                    Đăng Nhập
                                </>
                            ) : (
                                <>
                                    <UserPlus className="w-5 h-5" />
                                    Đăng Ký
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                setIsLogin(!isLogin);
                                setError(null);
                                setSuccess(null);
                            }}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium transition-colors"
                        >
                            {isLogin ? 'Chưa có tài khoản? Đăng ký ngay' : 'Đã có tài khoản? Đăng nhập'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
