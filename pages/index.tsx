import Head from 'next/head'
import { Inter } from 'next/font/google'
import dynamic from "next/dynamic"
import React, { useState, useEffect } from 'react'

const inter = Inter({ subsets: ['latin'] })

// Retain the vital non-SSR wrapper for the tailvnc client engine
const VNC = dynamic(() => import('@/components/vnc').then(mod => mod.VNC), { ssr: false });

interface SavedConfig {
  id: string;
  name: string;
  ip: string;
}

export default function Home() {
  // 1. Connection & Form States
  const [name, setName] = useState('');
  const [ip, setIp] = useState('');
  const [password, setPassword] = useState('');
  const [recentConfigs, setRecentConfigs] = useState<SavedConfig[]>([]);
  const [activeConnection, setActiveConnection] = useState<any | null>(null);

  // Safe client-side hook to grab historical entries from browser memory
  useEffect(() => {
    const history = localStorage.getItem('tailvnc_history');
    if (history) setRecentConfigs(JSON.parse(history));
  }, []);

  const handleConnect = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!ip || !password) return;

    // Cache metadata keys on success (Password is strictly excluded from persistent disk storage)
    const isAlreadySaved = recentConfigs.some(c => c.ip === ip);
    if (!isAlreadySaved) {
      const updatedHistory = [...recentConfigs, { id: ip, name: name || ip, ip }].slice(-4);
      setRecentConfigs(updatedHistory);
      localStorage.setItem('tailvnc_history', JSON.stringify(updatedHistory));
    }

    setActiveConnection({ ip, password });
  };

  return (
    <>
      <Head>
        <title>tailvnc portal</title>
        <meta name="description" content="Secure Tailscale VNC Streaming Client" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* --- RUNTIME ROUTING LOGIC --- */}
      {activeConnection ? (
        // ACTIVE RUNTIME STAGE: Renders full-screen video matrix engine
        <main className={`relative w-screen h-screen bg-black overflow-hidden select-none ${inter.className}`}>
          <button 
            onClick={() => setActiveConnection(null)} 
            className="absolute top-4 left-4 z-50 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg shadow-lg border border-red-500/20 active:scale-[0.98] transition-all duration-150 text-sm"
          >
            Disconnect Session
          </button>
          
          {/* Feed your custom engine the parsed secure profile tags natively */}
          <VNC host={activeConnection.ip} password={activeConnection.password} />
        </main>
      ) : (
        // DASHBOARD LANDING PAGE STAGE: Render Forms & History
        <main className={`min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-center items-center p-6 relative antialiased ${inter.className}`}>
          
          {/* 💠 HUD PORTAL CONTROLLER CONTAINER */}
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl p-8 shadow-2xl flex flex-col gap-6 transform hover:scale-[1.005] transition-transform duration-300">
            <div className="space-y-1 text-center">
              <h1 className="text-2xl font-bold tracking-tight text-white bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
                TailVNC Portal
              </h1>
              <p className="text-sm text-slate-400">Stream secure node frames over your tailnet</p>
            </div>

            {/* SECURE CONTROL DATA FORM */}
            <form onSubmit={handleConnect} className="flex flex-col gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Node Tag</label>
                <input 
                  type="text" placeholder="Friendly Alias (e.g., Home iMac)" 
                  value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-200 transition-colors duration-150 placeholder:text-slate-600 text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Target IP Address</label>
                <input 
                  type="text" placeholder="100.x.y.z" required
                  value={ip} onChange={(e) => setIp(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-200 transition-colors duration-150 placeholder:text-slate-600 text-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Security Key</label>
                <input 
                  type="password" placeholder="VNC Security Password" required
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-800 rounded-xl focus:outline-none focus:border-indigo-500 text-slate-200 transition-colors duration-150 placeholder:text-slate-600 text-sm tracking-widest"
                />
              </div>

              <button 
                type="submit" 
                className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-medium rounded-xl shadow-lg shadow-indigo-600/20 active:scale-[0.99] transition-all duration-150 text-sm"
              >
                Establish Tunnel
              </button>
            </form>

            {/* 🕒 CHRONOLOGICAL PERSISTENT HISTORY HOOKS */}
            {recentConfigs.length > 0 && (
              <div className="border-t border-slate-800/80 pt-5 space-y-3">
                <h3 className="text-xs font-semibold text-slate-400 tracking-wider uppercase">Used Recently</h3>
                <div className="grid grid-cols-1 gap-2">
                  {recentConfigs.map((config) => (
                    <button
                      key={config.id}
                      onClick={() => { setIp(config.ip); setName(config.name); setPassword(''); }}
                      className="w-full p-3 bg-slate-950/50 hover:bg-slate-950 border border-slate-800 hover:border-slate-700 rounded-xl flex justify-between items-center text-left transition-all duration-150 group"
                    >
                      <span className="text-sm font-medium text-slate-300 group-hover:text-indigo-400 transition-colors">{config.name}</span>
                      <span className="text-xs font-mono text-slate-500 bg-slate-900 px-2 py-1 rounded-md border border-slate-800">{config.ip}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </main>
      )}
    </>
  );
}
