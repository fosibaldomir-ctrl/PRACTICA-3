import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../hooks/useAuth';
import { 
  Users, 
  Plus, 
  Search, 
  LogOut, 
  Filter, 
  Grid, 
  List as ListIcon,
  ChevronRight,
  TrendingUp,
  Award,
  Calendar,
  ShieldCheck,
  Eye,
  MoreVertical,
  Edit2,
  Trash2,
  Loader2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Player } from '../types';
import { cn, formatDate } from '../lib/utils';
import PlayerForm from '../components/PlayerForm';
import PlayerPreview from '../components/PlayerPreview';
import PartidosDashboard from '../components/PartidosDashboard';

export default function Dashboard() {
  const { user } = useAuth();
  const [currentMenu, setCurrentMenu] = useState<'partidos' | 'plantilla'>('partidos');
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | undefined>(undefined);
  const [filterDemarcacion, setFilterDemarcacion] = useState<string>('all');
  const [filterLateralidad, setFilterLateralidad] = useState<string>('all');
  const [filterEquipo, setFilterEquipo] = useState<string>('all');
  const [sortField, setSortField] = useState<keyof Player | 'nombre_completo'>('dorsal');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const handleSort = (field: keyof Player | 'nombre_completo') => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  useEffect(() => {
    fetchPlayers();
  }, []);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('jugadores')
        .select('*')
        .order('dorsal', { ascending: true });

      if (error) throw error;
      setPlayers(data || []);
    } catch (error: any) {
      console.error('Error fetching players:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este jugador?')) return;
    try {
      const { error } = await supabase
        .from('jugadores')
        .delete()
        .eq('id', id);
      if (error) throw error;
      fetchPlayers();
    } catch (error: any) {
      alert(error.message);
    }
  };

  const filteredPlayers = players
    .filter(p => {
      const matchesSearch = `${p.nombre} ${p.apellidos}`.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDemarcacion = filterDemarcacion === 'all' || p.demarcacion === filterDemarcacion;
      const matchesLateralidad = filterLateralidad === 'all' || p.lateralidad === filterLateralidad;
      const matchesEquipo = filterEquipo === 'all' || (p.equipo || 'Sin Equipo') === filterEquipo;
      return matchesSearch && matchesDemarcacion && matchesLateralidad && matchesEquipo;
    })
    .sort((a, b) => {
      let aVal: any = '';
      let bVal: any = '';

      if (sortField === 'nombre_completo') {
        aVal = `${a.nombre} ${a.apellidos}`.toLowerCase();
        bVal = `${b.nombre} ${b.apellidos}`.toLowerCase();
      } else {
        aVal = a[sortField as keyof Player];
        bVal = b[sortField as keyof Player];
      }

      if (aVal === null || aVal === undefined) aVal = '';
      if (bVal === null || bVal === undefined) bVal = '';

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const strA = String(aVal);
      const strB = String(bVal);

      return sortDirection === 'asc' 
        ? strA.localeCompare(strB, undefined, { numeric: true, sensitivity: 'base' })
        : strB.localeCompare(strA, undefined, { numeric: true, sensitivity: 'base' });
    });

  const uniqueEquipos = Array.from(new Set(players.map(p => p.equipo || 'Sin Equipo'))).filter(Boolean).sort();

  const handleLogout = () => supabase.auth.signOut();

  const averageAge = players.length > 0 
    ? (players.reduce((acc, p) => {
        if (!p.fecha_nacimiento) return acc;
        const age = new Date().getFullYear() - new Date(p.fecha_nacimiento).getFullYear();
        return acc + age;
      }, 0) / players.filter(p => p.fecha_nacimiento).length || 0).toFixed(1)
    : '0';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row frosted-bg">
      {/* Sidebar - Desktop */}
      <aside className="hidden md:flex flex-col w-64 bg-white/5 backdrop-blur-xl border-r border-white/10 h-screen sticky top-0 z-20">
        <div className="p-6 border-b border-white/5">
          <div className="flex items-center gap-3 text-emerald-400 mb-2">
            <div className="bg-emerald-500 p-2 rounded-xl text-white shadow-lg shadow-emerald-500/20">
              <Users size={24} />
            </div>
            <h1 className="font-bold text-xl text-white tracking-tight">Fut Manager</h1>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em] pl-11">Sport Edition</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setCurrentMenu('partidos')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm cursor-pointer",
              currentMenu === 'partidos' ? "bg-white/10 text-emerald-400" : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Calendar size={20} />
            <span>Partidos y Análisis</span>
          </button>
          <button 
            onClick={() => setCurrentMenu('plantilla')}
            className={cn(
              "w-full flex items-center gap-3 px-4 py-3 rounded-xl font-bold transition-all text-sm cursor-pointer",
              currentMenu === 'plantilla' ? "bg-white/10 text-emerald-400" : "text-slate-400 hover:text-white hover:bg-white/5"
            )}
          >
            <Users size={20} />
            <span>Fichas de Jugadores</span>
          </button>
        </nav>

        <div className="p-4 mt-auto border-t border-white/5">
          <div className="flex items-center gap-3 px-4 py-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-slate-800 border border-emerald-500/30 flex items-center justify-center text-white font-bold text-sm shadow-inner">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-white truncate">{user?.email?.split('@')[0]}</p>
              <p className="text-xs text-slate-500 truncate">Manager Principal</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-red-400/10 rounded-xl transition-all font-medium"
          >
            <LogOut size={20} />
            <span>Cerrar Sesión</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <header className="md:hidden flex items-center justify-between p-4 bg-white/5 backdrop-blur-xl border-b border-white/10 sticky top-0 z-40">
        <div className="flex items-center gap-2 text-emerald-400">
          <div className="bg-emerald-500 p-1.5 rounded-lg text-white">
            <Calendar size={18} />
          </div>
          <span className="font-bold text-sm tracking-tight text-white">Partidos</span>
        </div>
        
        {/* Toggle menus */}
        <div className="flex bg-white/5 p-0.5 rounded-lg border border-white/10 text-[11px]">
          <button
            onClick={() => setCurrentMenu('partidos')}
            className={cn("px-2.5 py-1.5 rounded-md font-bold transition-all cursor-pointer", currentMenu === 'partidos' ? "bg-emerald-500 text-white" : "text-slate-400")}
          >
            Partido
          </button>
          <button
            onClick={() => setCurrentMenu('plantilla')}
            className={cn("px-2.5 py-1.5 rounded-md font-bold transition-all cursor-pointer", currentMenu === 'plantilla' ? "bg-emerald-500 text-white" : "text-slate-400")}
          >
            Jugadores
          </button>
        </div>

        <button 
          onClick={handleLogout}
          className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          title="Cerrar Sesión"
        >
          <LogOut size={16} />
        </button>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-x-hidden z-10">
        {currentMenu === 'partidos' ? (
          <div>
            <PartidosDashboard />
          </div>
        ) : (
          <>
            {/* Header */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
              <div>
                <h2 className="text-4xl font-black text-white tracking-tight">Plantilla Actual</h2>
                <p className="text-slate-400 font-medium">Controla y organiza los datos de tu equipo</p>
              </div>
          <button 
            onClick={() => { setSelectedPlayer(undefined); setIsFormOpen(true); }}
            className="flex items-center justify-center gap-2 bg-emerald-600 text-white px-8 py-4 rounded-2xl font-bold shadow-xl shadow-emerald-900/40 hover:bg-emerald-500 transition-all hover:translate-y-[-2px] active:translate-y-0"
          >
            <Plus size={20} />
            <span>+ Nuevo Jugador</span>
          </button>
          <button 
            onClick={() => {
              const sql = `
-- 🛡️ CONFIGURACIÓN DE SEGURIDAD PARA STORAGE, COLUMNAS Y NUEVAS TABLAS (CÓPIALO TODO)
-- 1. Asegurar columna 'valoracion' en tabla jugadores
ALTER TABLE jugadores ADD COLUMN IF NOT EXISTS valoracion TEXT;

-- 2. Crear las nuevas tablas para la sección de Partidos
CREATE TABLE IF NOT EXISTS equipos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    escudo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE equipos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users in equipos" ON equipos;
CREATE POLICY "Allow all for authenticated users in equipos" ON equipos FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS partidos (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    equipo_rival_id UUID REFERENCES equipos(id) ON DELETE SET NULL,
    nombre_rival TEXT,
    fecha DATE DEFAULT CURRENT_DATE,
    analisis_ofensivo TEXT,
    analisis_defensivo TEXT,
    analisis_transiciones TEXT,
    video_rival_url TEXT,
    slides_url TEXT,
    video_plan_url TEXT,
    video_eventos_url TEXT,
    eventos JSONB DEFAULT '[]'::jsonb,
    formacion TEXT,
    alineacion JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

ALTER TABLE partidos ADD COLUMN IF NOT EXISTS formacion TEXT;
ALTER TABLE partidos ADD COLUMN IF NOT EXISTS alineacion JSONB DEFAULT '{}'::jsonb;

ALTER TABLE partidos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users in partidos" ON partidos;
CREATE POLICY "Allow all for authenticated users in partidos" ON partidos FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. Crear el bucket si no existe
INSERT INTO storage.buckets (id, name, public) 
VALUES ('jugadores', 'jugadores', true) 
ON CONFLICT (id) DO NOTHING;

-- 4. Eliminar políticas antiguas si existen para evitar conflictos
DROP POLICY IF EXISTS "Public Read" ON storage.objects;
DROP POLICY IF EXISTS "Auth Upload" ON storage.objects;
DROP POLICY IF EXISTS "Auth Update" ON storage.objects;
DROP POLICY IF EXISTS "Auth Delete" ON storage.objects;
DROP POLICY IF EXISTS "Anon Upload" ON storage.objects;

-- 5. Crear nuevas políticas (Permitir a todos mientras pruebas)
CREATE POLICY "Public Read" ON storage.objects FOR SELECT TO public USING ( bucket_id = 'jugadores' );
CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'jugadores' );
CREATE POLICY "Auth Update" ON storage.objects FOR UPDATE TO authenticated USING ( bucket_id = 'jugadores' );
CREATE POLICY "Auth Delete" ON storage.objects FOR DELETE TO authenticated USING ( bucket_id = 'jugadores' );
              `;
              navigator.clipboard.writeText(sql);
              alert('SQL de Storage, Migración y Tablas de Partidos copiado. Pégalo en el SQL Editor de Supabase y dale a RUN.');
            }}
            className="flex items-center justify-center gap-2 bg-slate-900 border border-emerald-500/30 text-emerald-400 px-6 py-4 rounded-2xl font-bold hover:bg-emerald-500/10 transition-all shadow-lg"
          >
            <ShieldCheck size={20} />
            <span>Reparar Permisos SQL</span>
          </button>
        </header>

        {/* Stats Grid */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Plantilla', value: players.length, icon: Users, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
            { label: 'Promedio Edad', value: averageAge, icon: Calendar, color: 'text-blue-400', bg: 'bg-blue-500/10' },
            { label: 'Porteros', value: players.filter(p => p.demarcacion === 'Portero').length, icon: ShieldCheck, color: 'text-purple-400', bg: 'bg-purple-500/10' },
            { label: 'Storage Status', value: 'Bucket OK', icon: TrendingUp, color: 'text-amber-400', bg: 'bg-amber-500/10' },
          ].map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="glass-card p-6 flex items-center gap-4 group hover:bg-white/10 transition-colors"
            >
              <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110", stat.bg)}>
                <stat.icon className={stat.color} size={24} />
              </div>
              <div>
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-0.5">{stat.label}</p>
                <p className="text-2xl font-black text-white tracking-tighter">{stat.value}</p>
              </div>
            </motion.div>
          ))}
        </section>

        {/* Filters and Controls */}
        <div className="glass-card p-6 mb-8 flex flex-col gap-5">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
              <input 
                type="text" 
                placeholder="Filtro rápido por nombre..." 
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-white placeholder:text-slate-600 font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="flex items-center gap-2">
              <div className="flex bg-white/5 p-1 rounded-2xl border border-white/10">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={cn("p-2 px-4 rounded-xl transition-all font-bold text-sm flex items-center gap-2", viewMode === 'grid' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/40" : "text-slate-500 hover:text-white")}
                  title="Vista Cuadrícula"
                >
                  <Grid size={18} />
                  <span className="hidden sm:inline">Tarjetas</span>
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={cn("p-2 px-4 rounded-xl transition-all font-bold text-sm flex items-center gap-2", viewMode === 'list' ? "bg-emerald-500 text-white shadow-lg shadow-emerald-900/40" : "text-slate-500 hover:text-white")}
                  title="Vista Tabla"
                >
                  <ListIcon size={18} />
                  <span className="hidden sm:inline">Tabla</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 pt-4 border-t border-white/5">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mr-2 flex items-center gap-1.5">
              <Filter size={12} className="text-emerald-400" /> FILTRAR:
            </span>
            
            {/* Posición Filter */}
            <select 
              className="bg-slate-900/80 border border-white/10 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-xs text-slate-300 min-w-[150px]"
              value={filterDemarcacion}
              onChange={(e) => setFilterDemarcacion(e.target.value)}
            >
              <option value="all">Posición: Todas</option>
              <option value="Portero">🛡️ Portero</option>
              <option value="Defensa">🧱 Defensa</option>
              <option value="Centrocampista">🧠 Centrocampista</option>
              <option value="Delantero">⚽ Delantero</option>
            </select>

            {/* Lateralidad Filter */}
            <select 
              className="bg-slate-900/80 border border-white/10 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-xs text-slate-300 min-w-[150px]"
              value={filterLateralidad}
              onChange={(e) => setFilterLateralidad(e.target.value)}
            >
              <option value="all">Lateralidad: Todas</option>
              <option value="Diestro">👟 Diestro</option>
              <option value="Zurdo">👟 Zurdo</option>
              <option value="Ambidiestro">👟 Ambidiestro</option>
            </select>

            {/* Club Filter */}
            <select 
              className="bg-slate-900/80 border border-white/10 px-4 py-2.5 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all font-bold text-xs text-slate-300 min-w-[150px]"
              value={filterEquipo}
              onChange={(e) => setFilterEquipo(e.target.value)}
            >
              <option value="all">Club: Todos</option>
              {uniqueEquipos.map(eq => (
                <option key={eq} value={eq}>{eq}</option>
              ))}
            </select>

            {/* Clear filters button */}
            {(filterDemarcacion !== 'all' || filterLateralidad !== 'all' || filterEquipo !== 'all' || searchTerm !== '') && (
              <button
                onClick={() => {
                  setFilterDemarcacion('all');
                  setFilterLateralidad('all');
                  setFilterEquipo('all');
                  setSearchTerm('');
                }}
                className="px-4 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-00 border border-red-500/20 rounded-xl font-bold text-xs uppercase tracking-widest transition-all text-red-400"
              >
                Restablecer Filtros
              </button>
            )}

            <div className="ml-auto text-xs text-slate-500">
              Mostrando <span className="text-emerald-400 font-bold">{filteredPlayers.length}</span> jugadores
            </div>
          </div>
        </div>

        {/* Players View */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-6 glass-card border-dashed">
            <Loader2 className="animate-spin text-emerald-400" size={64} />
            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Sincronizando plantilla...</p>
          </div>
        ) : filteredPlayers.length === 0 ? (
          <div className="text-center py-32 glass-card border-dashed bg-white/[0.02]">
            <Search className="mx-auto text-slate-700 mb-6" size={80} />
            <h3 className="text-2xl font-black text-white mb-2">Sin resultados</h3>
            <p className="text-slate-500 max-w-xs mx-auto">No hay jugadores que coincidan con los filtros aplicados actualmente.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            <AnimatePresence>
              {filteredPlayers.map((player, i) => (
                <motion.div
                  key={player.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className="glass-card group overflow-hidden hover:bg-white/10 transition-all border-white/5"
                >
                  <div className="relative h-72 bg-slate-900 flex items-center justify-center overflow-hidden">
                    {player.foto_jugador ? (
                      <img src={player.foto_jugador} alt={player.nombre} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-700">
                        <Users size={100} strokeWidth={1} />
                      </div>
                    )}
                    <div className="absolute top-4 left-4 bg-emerald-500 font-black text-white px-3 py-1 rounded-xl text-sm shadow-xl shadow-emerald-950/50">
                      {player.dorsal?.toString().padStart(2, '0') || '??'}
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-80" />
                    <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-400 mb-1">{player.demarcacion}</span>
                        <h3 className="text-xl font-black text-white leading-none tracking-tight">
                          {player.nombre}<br/>{player.apellidos}
                        </h3>
                      </div>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => { setSelectedPlayer(player); setIsPreviewOpen(true); }}
                          className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-white hover:bg-white/20 transition-all"
                          title="Vista previa"
                        >
                          <Eye size={16} />
                        </button>
                        <button 
                          onClick={() => { setSelectedPlayer(player); setIsFormOpen(true); }}
                          className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-white hover:bg-emerald-500 transition-all"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button 
                          onClick={() => handleDelete(player.id)}
                          className="p-3 bg-white/10 backdrop-blur-md rounded-2xl border border-white/10 text-white hover:bg-red-500 transition-all"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="p-5 border-t border-white/5 flex gap-4">
                    <div className="flex-1">
                      <p className="text-[9px] uppercase font-bold text-slate-500 tracking-tighter">Pierna</p>
                      <p className="text-xs font-bold text-slate-300">{player.lateralidad || 'N/A'}</p>
                    </div>
                    <div className="flex-1 border-l border-white/5 pl-4">
                      <p className="text-[9px] uppercase font-bold text-slate-500 tracking-tighter">Nacimiento</p>
                      <p className="text-xs font-bold text-slate-300">{player.fecha_nacimiento?.split('-')[0] || 'N/A'}</p>
                    </div>
                    <div className="flex-1 border-l border-white/5 pl-4">
                      <p className="text-[9px] uppercase font-bold text-slate-500 tracking-tighter">Club</p>
                      <p className="text-xs font-bold text-slate-300 truncate max-w-[60px]">{player.equipo || 'N/A'}</p>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="glass-card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10 bg-white/5 text-[11px] font-black text-slate-500 uppercase tracking-[0.2em] select-none">
                    <th 
                      onClick={() => handleSort('dorsal')} 
                      className="px-8 py-5 cursor-pointer hover:bg-white/10 group transition-colors min-w-[100px]"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>#</span>
                        <span className={cn(
                          "text-[10px] transition-colors", 
                          sortField === 'dorsal' ? "text-emerald-400 font-bold" : "text-slate-600 group-hover:text-slate-400"
                        )}>
                          {sortField === 'dorsal' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                        </span>
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('nombre_completo')} 
                      className="px-4 py-5 font-mono cursor-pointer hover:bg-white/10 group transition-colors min-w-[200px]"
                    >
                      <div className="flex items-center gap-1.5 align-middle">
                        <span>Jugador</span>
                        <span className={cn(
                          "text-[10px] transition-colors", 
                          sortField === 'nombre_completo' ? "text-emerald-400 font-bold" : "text-slate-600 group-hover:text-slate-400"
                        )}>
                          {sortField === 'nombre_completo' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                        </span>
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('demarcacion')} 
                      className="px-6 py-5 cursor-pointer hover:bg-white/10 group transition-colors min-w-[150px]"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Posición</span>
                        <span className={cn(
                          "text-[10px] transition-colors", 
                          sortField === 'demarcacion' ? "text-emerald-400 font-bold" : "text-slate-600 group-hover:text-slate-400"
                        )}>
                          {sortField === 'demarcacion' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                        </span>
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('equipo')} 
                      className="px-6 py-5 cursor-pointer hover:bg-white/10 group transition-colors min-w-[150px]"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Club</span>
                        <span className={cn(
                          "text-[10px] transition-colors", 
                          sortField === 'equipo' ? "text-emerald-400 font-bold" : "text-slate-600 group-hover:text-slate-400"
                        )}>
                          {sortField === 'equipo' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                        </span>
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('lateralidad')} 
                      className="px-6 py-5 cursor-pointer hover:bg-white/10 group transition-colors min-w-[130px]"
                    >
                      <div className="flex items-center gap-1.5">
                        <span>Lateral</span>
                        <span className={cn(
                          "text-[10px] transition-colors", 
                          sortField === 'lateralidad' ? "text-emerald-400 font-bold" : "text-slate-600 group-hover:text-slate-400"
                        )}>
                          {sortField === 'lateralidad' ? (sortDirection === 'asc' ? '▲' : '▼') : '⇅'}
                        </span>
                      </div>
                    </th>
                    <th className="px-8 py-5 text-right min-w-[150px]">Ficha</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {filteredPlayers.map((player) => (
                    <tr key={player.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                      <td className="px-8 py-4 font-mono font-bold text-slate-400">
                        {player.dorsal?.toString().padStart(2, '0') || '??'}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-900 border border-white/10 flex-shrink-0">
                            {player.foto_jugador ? (
                              <img src={player.foto_jugador} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-slate-700"><Users size={20} /></div>
                            )}
                          </div>
                          <div>
                            <p className="font-black text-white tracking-tight">{player.nombre} {player.apellidos}</p>
                            <p className="text-[10px] uppercase font-bold text-slate-500">{player.fecha_nacimiento ? formatDate(player.fecha_nacimiento) : 'F. Nac desconocida'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-black bg-white/10 px-3 py-1.5 rounded-lg text-emerald-400 uppercase tracking-widest">{player.demarcacion}</span>
                      </td>
                      <td className="px-6 py-4 font-bold text-slate-300">{player.equipo || 'N/A'}</td>
                      <td className="px-6 py-4 font-bold text-slate-300">{player.lateralidad || 'N/A'}</td>
                      <td className="px-8 py-4 text-right">
                        <div className="flex gap-2 justify-end">
                          <button 
                            onClick={() => { setSelectedPlayer(player); setIsPreviewOpen(true); }}
                            className="p-2.5 bg-white/5 rounded-xl text-slate-500 hover:text-emerald-400 hover:bg-white/10 transition-all"
                            title="Ver Ficha Técnica"
                          >
                            <Eye size={16} />
                          </button>
                          <button 
                            onClick={() => { setSelectedPlayer(player); setIsFormOpen(true); }}
                            className="p-2.5 bg-white/5 rounded-xl text-slate-500 hover:text-blue-400 hover:bg-white/10 transition-all"
                            title="Editar Datos"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button 
                            onClick={() => handleDelete(player.id)}
                            className="p-2.5 bg-white/5 rounded-xl text-slate-600 hover:text-red-500 hover:bg-white/10 transition-all"
                            title="Eliminar Jugador"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        </>
      )}
      </main>

      {/* Preview Modal */}
      {isPreviewOpen && selectedPlayer && (
        <PlayerPreview 
          player={selectedPlayer} 
          onClose={() => { setIsPreviewOpen(false); setSelectedPlayer(undefined); }}
          onRefresh={fetchPlayers}
        />
      )}

      {/* Form Modal */}
      {isFormOpen && (
        <PlayerForm 
          player={selectedPlayer} 
          onClose={() => { setIsFormOpen(false); setSelectedPlayer(undefined); }}
          onRefresh={fetchPlayers}
        />
      )}
    </div>
  );
}
