import React, { useState } from "react";
import { db } from "../../lib/db";

const SignIn: React.FC = () => {
    const [sentEmail, setSentEmail] = useState("");
    const [email, setEmail] = useState("");
    const [code, setCode] = useState("");

    const handleSendCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!email) return;
        setSentEmail(email);
        await db.auth.sendMagicCode({ email });
    };

    const handleVerifyCode = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!code) return;
        await db.auth.signInWithMagicCode({ email: sentEmail, code });
    };

    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[#0a1222] text-cyan-50 font-mono space-y-8">
            <h1 className="text-5xl font-black uppercase tracking-[0.2em] text-cyan-400 drop-shadow-[0_0_25px_rgba(34,211,238,0.4)]">
                Antigravity Engine
            </h1>
            <div className="text-[10px] font-black uppercase tracking-[0.5em] text-cyan-600/60 -mt-4 mb-4">Neural Overwatch Terminal</div>

            <div className="w-full max-w-sm p-8 border border-cyan-500/20 rounded-3xl bg-[#0f172a]/80 backdrop-blur-xl shadow-2xl">
                {!sentEmail ? (
                    <div className="space-y-6">
                        {/* Google OAuth Sign-In */}
                        <button
                            onClick={() => {
                                const url = db.auth.createAuthorizationURL({
                                    clientName: "google-web",
                                    redirectURL: window.location.href,
                                });
                                window.location.href = url;
                            }}
                            className="w-full py-3 bg-white hover:bg-gray-100 text-gray-800 rounded-xl uppercase tracking-widest text-xs font-black transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                        >
                            <svg className="w-5 h-5" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Sign in with Google
                        </button>

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-cyan-500/20"></div>
                            </div>
                            <div className="relative flex justify-center text-xs">
                                <span className="bg-[#0f172a] px-4 text-slate-500 uppercase tracking-widest">Or use email</span>
                            </div>
                        </div>

                        {/* Magic Code Form */}
                        <form onSubmit={handleSendCode} className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black uppercase tracking-widest text-cyan-600 ml-1">Email Coordinates</label>
                                <input
                                    className="w-full bg-[#020617] border border-slate-700/50 focus:border-cyan-500 rounded-xl px-4 py-3 outline-none transition-colors text-sm placeholder:text-slate-600"
                                    placeholder="operative@antigravity.dev"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl uppercase tracking-widest text-xs font-black transition-all shadow-[0_0_20px_rgba(8,145,178,0.4)] hover:shadow-[0_0_30px_rgba(6,182,212,0.6)]"
                            >
                                Send Code
                            </button>
                        </form>
                    </div>
                ) : (
                    <form onSubmit={handleVerifyCode} className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-xs font-black uppercase tracking-widest text-emerald-600 ml-1">Verification Code</label>
                            <p className="text-[10px] text-slate-400 mb-2">Code sent to <span className="text-cyan-400">{sentEmail}</span></p>
                            <input
                                className="w-full bg-[#020617] border border-emerald-500/50 focus:border-emerald-400 rounded-xl px-4 py-3 outline-none transition-colors text-center text-2xl tracking-[0.5em] font-bold placeholder:text-slate-800 placeholder:tracking-normal placeholder:text-sm"
                                placeholder="123456"
                                type="text"
                                value={code}
                                onChange={(e) => setCode(e.target.value)}
                                autoFocus
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl uppercase tracking-widest text-xs font-black transition-all shadow-[0_0_20px_rgba(5,150,105,0.4)] hover:shadow-[0_0_30px_rgba(16,185,129,0.6)]"
                        >
                            Verify Identity
                        </button>
                        <button
                            type="button"
                            onClick={() => setSentEmail("")}
                            className="w-full py-2 text-[10px] uppercase tracking-widest text-slate-500 hover:text-cyan-400 transition-colors"
                        >
                            Cancel
                        </button>
                    </form>
                )}
            </div>

            <div className="text-[10px] uppercase tracking-[0.3em] text-slate-600 opacity-50">
                System v4.2 PRO Secure Access
            </div>
        </div>
    );
};

export default SignIn;
