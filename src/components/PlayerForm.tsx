import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { X, Save, Loader2, User, Hash, MapPin, Calendar, Activity, Info, Award } from 'lucide-react';
import { motion } from 'motion/react';
import type { Player } from '../types';
import ImageUpload from './ImageUpload';
import { cn } from '../lib/utils';

interface PlayerFormProps {
  player?: Player;
  onClose: () => void;
  onRefresh: () => void;
}

export default function PlayerForm({ player, onClose, onRefresh }: PlayerFormProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Partial<Player>>(
    player || {
      nombre: '',
      apellidos: '',
      dorsal: null,
      fecha_nacimiento: '',
      demarcacion: 'Portero',
      lateralidad: 'Diestro',
      equipo: '',
      foto_jugador: '',
      observaciones: '',
      valoracion: 'Valorar'
    }
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (player?.id) {
        const { error } = await supabase
          .from('jugadores')
          .update(formData)
          .eq('id', player.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('jugadores')
          .insert([formData]);
        if (error) throw error;
      }
      onRefresh();
      onClose();
    } catch (error: any) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  return (
    <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-white/10"
      >
        <header className="p-8 pb-4 flex justify-between items-start border-b border-white/5 bg-white/5">
          <div>
            <h3 className="text-3xl font-black text-white tracking-tight">
              {player ? 'Editar Ficha' : 'Nueva Ficha'}
            </h3>
            <p className="text-slate-400 font-medium text-sm">Información técnica del integrante</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-500 hover:text-white">
            <X size={28} />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-8 pt-6 space-y-8 scrollbar-hide bg-slate-900/40">
          {/* Photo Section */}
          <div className="flex flex-col items-center justify-center py-6 bg-white/5 rounded-3xl border border-white/10 border-dashed group hover:bg-white/10 transition-colors">
            <ImageUpload 
              currentImageUrl={formData.foto_jugador} 
              onUpload={(url) => setFormData(prev => ({ ...prev, foto_jugador: url }))} 
            />
            <p className="text-[10px] uppercase font-black text-slate-500 tracking-[0.3em] mt-4">Retrato Oficial de Plantilla</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <User size={12} className="text-emerald-400" /> Nombre
              </label>
              <input
                name="nombre"
                required
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-white font-medium"
                value={formData.nombre}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <User size={12} className="text-emerald-400" /> Apellidos
              </label>
              <input
                name="apellidos"
                required
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-white font-medium"
                value={formData.apellidos}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Hash size={12} className="text-emerald-400" /> Dorsal
              </label>
              <input
                name="dorsal"
                type="number"
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-mono font-black text-2xl text-emerald-400"
                value={formData.dorsal || ''}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Calendar size={12} className="text-emerald-400" /> Fecha Nacimiento
              </label>
              <input
                name="fecha_nacimiento"
                type="date"
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-sm font-bold text-slate-300"
                value={formData.fecha_nacimiento || ''}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Activity size={12} className="text-emerald-400" /> Demarcación
              </label>
              <select
                name="demarcacion"
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-slate-300 appearance-none bg-slate-900"
                value={formData.demarcacion || ''}
                onChange={handleChange}
              >
                <option value="Portero">Portero</option>
                <option value="Defensa">Defensa</option>
                <option value="Centrocampista">Centrocampista</option>
                <option value="Delantero">Delantero</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Activity size={12} className="text-emerald-400" /> Lateralidad
              </label>
              <select
                name="lateralidad"
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-slate-300 appearance-none bg-slate-900"
                value={formData.lateralidad || ''}
                onChange={handleChange}
              >
                <option value="Diestro">Diestro</option>
                <option value="Zurdo">Zurdo</option>
                <option value="Ambidiestro">Ambidiestro</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <MapPin size={12} className="text-emerald-400" /> Equipo / Club Procedencia
              </label>
              <input
                name="equipo"
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-white font-medium"
                value={formData.equipo || ''}
                onChange={handleChange}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Award size={12} className="text-emerald-400" /> Valoración Scouting
              </label>
              <select
                name="valoracion"
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-slate-300 appearance-none bg-slate-900"
                value={formData.valoracion || 'Valorar'}
                onChange={handleChange}
              >
                <option value="Valorar">📋 Valorar</option>
                <option value="Selección">⭐ Selección</option>
                <option value="Seguir">🔍 Seguir</option>
                <option value="Interesante">💡 Interesante</option>
              </select>
            </div>
            <div className="md:col-span-2 space-y-1.5">
              <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                <Info size={12} className="text-emerald-400" /> Observaciones Técnicas
              </label>
              <textarea
                name="observaciones"
                rows={4}
                className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all resize-none text-white font-medium"
                value={formData.observaciones || ''}
                onChange={handleChange}
                placeholder="Historial, skills destacadas o notas adicionales..."
              />
            </div>
          </div>

          <div className="flex gap-4 pt-6 pb-10">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-4 border border-white/10 rounded-2xl font-black text-slate-500 hover:text-white hover:bg-white/5 transition-all active:scale-95 text-xs uppercase tracking-widest"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] py-4 bg-emerald-600 text-white rounded-2xl font-black shadow-xl shadow-emerald-900/40 hover:bg-emerald-500 flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-70 text-xs uppercase tracking-widest"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Save size={20} />
                  <span>Sincronizar Datos</span>
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
