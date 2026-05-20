/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import { Loader2, AlertCircle } from 'lucide-react';
import { isSupabaseConfigured } from './lib/supabase';

export default function App() {
  const { user, loading } = useAuth();

  if (!isSupabaseConfigured) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-950 p-6 text-center frosted-bg">
        <div className="max-w-md glass p-10 rounded-[2.5rem] border-emerald-500/20 shadow-2xl">
          <div className="w-16 h-16 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-400 mx-auto mb-6">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-2xl font-black text-white mb-4 tracking-tight">Configuración Necesaria</h2>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Para que la aplicación funcione, debes conectar tu proyecto de Supabase. Añade las siguientes variables en el panel de <b>Secretos</b>:
          </p>
          <div className="space-y-3 mb-8">
            <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
              <code className="text-xs text-emerald-400">VITE_SUPABASE_URL</code>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Requerido</span>
            </div>
            <div className="flex items-center justify-between bg-white/5 p-3 rounded-xl border border-white/5">
              <code className="text-xs text-emerald-400">VITE_SUPABASE_ANON_KEY</code>
              <span className="text-[10px] text-slate-500 font-bold uppercase">Requerido</span>
            </div>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Consulta el archivo README.md para más detalles</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#f8f9fa]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="animate-spin text-blue-600" size={48} />
          <p className="text-gray-500 font-medium">Cargando aplicación...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route 
          path="/login" 
          element={!user ? <Auth /> : <Navigate to="/" replace />} 
        />
        <Route 
          path="/" 
          element={user ? <Dashboard /> : <Navigate to="/login" replace />} 
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

