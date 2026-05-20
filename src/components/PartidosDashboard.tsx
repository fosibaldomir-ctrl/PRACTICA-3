import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Users, Shield, Award, Plus, Edit2, Trash2, Play, Pause, RotateCcw, 
  Youtube, FileText, Layout, Timer, Save, Loader2, AlertCircle, Sparkles, Check, ChevronRight, RefreshCw, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import type { Equipo, Partido, MatchEvent, Player } from '../types';
import { cn, getYouTubeEmbedUrl, getGoogleSlidesEmbedUrl } from '../lib/utils';
import ImageUpload from './ImageUpload';

const FORMATIONS_MAPPING: Record<string, { key: string; label: string; top: number; left: number }[]> = {
  '4-3-3': [
    { key: 'pos1', label: 'POR', top: 86, left: 50 },
    { key: 'pos2', label: 'LD', top: 70, left: 15 },
    { key: 'pos3', label: 'DFC D', top: 74, left: 38 },
    { key: 'pos4', label: 'DFC I', top: 74, left: 62 },
    { key: 'pos5', label: 'LI', top: 70, left: 85 },
    { key: 'pos6', label: 'MCD', top: 56, left: 50 },
    { key: 'pos7', label: 'MC D', top: 43, left: 33 },
    { key: 'pos8', label: 'MC I', top: 43, left: 67 },
    { key: 'pos9', label: 'ED', top: 22, left: 16 },
    { key: 'pos10', label: 'EI', top: 22, left: 84 },
    { key: 'pos11', label: 'DC', top: 16, left: 50 }
  ],
  '4-4-2': [
    { key: 'pos1', label: 'POR', top: 86, left: 50 },
    { key: 'pos2', label: 'LD', top: 70, left: 15 },
    { key: 'pos3', label: 'DFC D', top: 74, left: 38 },
    { key: 'pos4', label: 'DFC I', top: 74, left: 62 },
    { key: 'pos5', label: 'LI', top: 70, left: 85 },
    { key: 'pos6', label: 'MC D', top: 48, left: 35 },
    { key: 'pos7', label: 'MC I', top: 48, left: 65 },
    { key: 'pos8', label: 'MD', top: 46, left: 15 },
    { key: 'pos9', label: 'MI', top: 46, left: 85 },
    { key: 'pos10', label: 'DC D', top: 20, left: 35 },
    { key: 'pos11', label: 'DC I', top: 20, left: 65 }
  ],
  '3-5-2': [
    { key: 'pos1', label: 'POR', top: 86, left: 50 },
    { key: 'pos2', label: 'DFC D', top: 74, left: 24 },
    { key: 'pos3', label: 'DFC C', top: 76, left: 50 },
    { key: 'pos4', label: 'DFC I', top: 74, left: 76 },
    { key: 'pos5', label: 'CAD', top: 52, left: 12 },
    { key: 'pos6', label: 'MCD D', top: 55, left: 35 },
    { key: 'pos7', label: 'MCD I', top: 55, left: 65 },
    { key: 'pos8', label: 'MCO', top: 38, left: 50 },
    { key: 'pos9', label: 'CAI', top: 52, left: 88 },
    { key: 'pos10', label: 'DC D', top: 18, left: 35 },
    { key: 'pos11', label: 'DC I', top: 18, left: 65 }
  ],
  '4-2-3-1': [
    { key: 'pos1', label: 'POR', top: 86, left: 50 },
    { key: 'pos2', label: 'LD', top: 70, left: 15 },
    { key: 'pos3', label: 'DFC D', top: 74, left: 38 },
    { key: 'pos4', label: 'DFC I', top: 74, left: 62 },
    { key: 'pos5', label: 'LI', top: 70, left: 85 },
    { key: 'pos6', label: 'MCD D', top: 56, left: 35 },
    { key: 'pos7', label: 'MCD I', top: 56, left: 65 },
    { key: 'pos8', label: 'MCO', top: 38, left: 50 },
    { key: 'pos9', label: 'ED', top: 26, left: 16 },
    { key: 'pos10', label: 'EI', top: 26, left: 84 },
    { key: 'pos11', label: 'DC', top: 16, left: 50 }
  ]
};

export default function PartidosDashboard() {
  const [activeTab, setActiveTab] = useState<'equipos' | 'rival' | 'alineacion' | 'plan' | 'eventos'>('rival');
  const [equipos, setEquipos] = useState<Equipo[]>([]);
  const [partidos, setPartidos] = useState<Partido[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  const [selectedPartidoId, setSelectedPartidoId] = useState<string>('');
  
  // Tactical Board state helpers
  const [openSpotPopover, setOpenSpotPopover] = useState<string | null>(null);
  const [searchRoster, setSearchRoster] = useState('');
  
  // Loading & status flags
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isUsingFallback, setIsUsingFallback] = useState(false);

  // Form states for Teams
  const [isTeamModalOpen, setIsTeamModalOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Equipo | null>(null);
  const [teamFormName, setTeamFormName] = useState('');
  const [teamFormEscudo, setTeamFormEscudo] = useState('');

  // Form states for Rivals / Match Plan / Events URLs & analysis
  const [currentPartido, setCurrentPartido] = useState<Partido | null>(null);

  // Stopwatch state for Events
  const [stopwatchTime, setStopwatchTime] = useState(0); // in seconds
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const stopwatchIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initial Sample/Fallback data
  const sampleTeams: Equipo[] = [
    { id: 't1', nombre: 'Real Madrid', escudo_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?q=80&w=200&auto=format&fit=crop' },
    { id: 't2', nombre: 'FC Barcelona', escudo_url: 'https://images.unsplash.com/photo-1518063319789-7217e6706b04?q=80&w=200&auto=format&fit=crop' },
    { id: 't3', nombre: 'Atlético de Madrid', escudo_url: 'https://images.unsplash.com/photo-1540747737956-378724044453?q=80&w=200&auto=format&fit=crop' }
  ];

  const fallbackPlayers: Player[] = [
    { id: 'f1', nombre: 'Iker', apellidos: 'Casillas', dorsal: 1, demarcacion: 'Portero', lateralidad: 'Diestro', equipo: 'España', foto_jugador: null, observaciones: 'Capitán de la Selección de Oro', created_at: '' },
    { id: 'f2', nombre: 'Carles', apellidos: 'Puyol', dorsal: 5, demarcacion: 'Defensa', lateralidad: 'Diestro', equipo: 'España', foto_jugador: null, observaciones: 'Garantía defensiva y liderazgo de hierro', created_at: '' },
    { id: 'f3', nombre: 'Sergio', apellidos: 'Ramos', dorsal: 15, demarcacion: 'Defensa', lateralidad: 'Diestro', equipo: 'España', foto_jugador: null, observaciones: 'Central imperial y goleador', created_at: '' },
    { id: 'f4', nombre: 'Gerard', apellidos: 'Piqué', dorsal: 3, demarcacion: 'Defensa', lateralidad: 'Diestro', equipo: 'España', foto_jugador: null, observaciones: 'Salida de balón excelente y juego aéreo', created_at: '' },
    { id: 'f5', nombre: 'Joan', apellidos: 'Capdevila', dorsal: 11, demarcacion: 'Defensa', lateralidad: 'Zurdo', equipo: 'España', foto_jugador: null, observaciones: 'Lateral seguro y con gran recorrido', created_at: '' },
    { id: 'f6', nombre: 'Sergio', apellidos: 'Busquets', dorsal: 16, demarcacion: 'Centrocampista', lateralidad: 'Diestro', equipo: 'España', foto_jugador: null, observaciones: 'El tempo del partido en sus botas', created_at: '' },
    { id: 'f7', nombre: 'Xabi', apellidos: 'Alonso', dorsal: 14, demarcacion: 'Centrocampista', lateralidad: 'Diestro', equipo: 'España', foto_jugador: null, observaciones: 'Despliegues kilométricos y pases milimétricos', created_at: '' },
    { id: 'f8', nombre: 'Xavi', apellidos: 'Hernández', dorsal: 8, demarcacion: 'Centrocampista', lateralidad: 'Diestro', equipo: 'España', foto_jugador: null, observaciones: 'La enciclopedia viviente del tiki-taka', created_at: '' },
    { id: 'f9', nombre: 'Andrés', apellidos: 'Iniesta', dorsal: 6, demarcacion: 'Centrocampista', lateralidad: 'Diestro', equipo: 'España', foto_jugador: null, observaciones: 'Calidad sublime y autor del gol eterno', created_at: '' },
    { id: 'f10', nombre: 'David', apellidos: 'Silva', dorsal: 21, demarcacion: 'Centrocampista', lateralidad: 'Zurdo', equipo: 'España', foto_jugador: null, observaciones: 'Espacios reducidos resueltos mágicamente', created_at: '' },
    { id: 'f11', nombre: 'Fernando', apellidos: 'Torres', dorsal: 9, demarcacion: 'Delantero', lateralidad: 'Diestro', equipo: 'España', foto_jugador: null, observaciones: 'El Niño, velocidad punta letal de ruptura', created_at: '' },
    { id: 'f12', nombre: 'David', apellidos: 'Villa', dorsal: 7, demarcacion: 'Delantero', lateralidad: 'Diestro', equipo: 'España', foto_jugador: null, observaciones: 'El Guaje, puntería magistral e histórica', created_at: '' },
    { id: 'f13', nombre: 'Cesc', apellidos: 'Fábregas', dorsal: 10, demarcacion: 'Centrocampista', lateralidad: 'Diestro', equipo: 'España', foto_jugador: null, observaciones: 'Inteligencia táctica y pegada de segunda línea', created_at: '' }
  ];

  const samplePartido: Partido = {
    id: 'p1',
    equipo_rival_id: 't2',
    nombre_rival: 'FC Barcelona',
    fecha: new Date().toISOString().split('T')[0],
    analisis_ofensivo: 'Buscan atraer la presión con pases cortos del portero para luego lanzar en diagonal con laterales altos. Peligro constante en juego de posición por dentro con desmarques continuos en ruptura.',
    analisis_defensivo: 'Línea defensiva muy adelantada que sufre a la espalda de los centrales. Presionan tras pérdida intensamente durante los primeros 4 segundos. Oportunidad en transiciones veloces.',
    analisis_transiciones: 'Transiciones rápidas comandadas por extremos pegados a la cal. Tras recuperación, pase de seguridad o pase vertical inmediato para batir la primera línea defensiva.',
    video_rival_url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    slides_url: 'https://docs.google.com/presentation/d/1vCisNfTz2jWfM0vKkG9uXN0Xshm0GleB4ePhAAn_ZzQ/pub',
    video_plan_url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    video_eventos_url: 'https://www.youtube.com/watch?v=ScMzIvxBSi4',
    eventos: [
      { id: 'ev1', timestamp: 'Minuto 04:30', tipo: 'ocasion_contra', descripcion: 'Minuto 04:30: Ocasión en contra - Contragolpe rival finalizado con tiro al palo.', time_seconds: 270 },
      { id: 'ev2', timestamp: 'Minuto 18:15', tipo: 'gol_favor', descripcion: 'Minuto 18:15: Gol a favor - Remate de cabeza tras tiro de esquina.', time_seconds: 1095 }
    ]
  };

  // Start data sync
  useEffect(() => {
    loadAllData();
  }, []);

  // Update current selected partido when the dropdown option changes
  useEffect(() => {
    if (selectedPartidoId) {
      const selected = partidos.find(p => p.id === selectedPartidoId);
      if (selected) {
        setCurrentPartido({ ...selected });
      }
    } else if (partidos.length > 0) {
      setCurrentPartido({ ...partidos[0] });
      setSelectedPartidoId(partidos[0].id);
    } else {
      setCurrentPartido(null);
    }
  }, [selectedPartidoId, partidos]);

  // Handle Stopwatch ticker
  useEffect(() => {
    if (isStopwatchRunning) {
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchTime(prev => prev + 1);
      }, 1000);
    } else {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    }
    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    };
  }, [isStopwatchRunning]);

  const loadAllData = async () => {
    try {
      setLoading(true);
      
      // Let's test Supabase connectivity first
      const { data: testData, error: testError } = await supabase
        .from('equipos')
        .select('*')
        .limit(1);

      if (testError) {
        throw testError;
      }

      // Supabase is OK & tables exist!
      setIsUsingFallback(false);
      await fetchTeamsOnline();
      await fetchPartidosOnline();
      await fetchPlayersOnline();
    } catch (e: any) {
      console.warn("No Supabase connection or table doesn't exist. Activating offline fallback:", e.message);
      setIsUsingFallback(true);
      loadLocalFallbackData();
    } finally {
      setLoading(false);
    }
  };

  // FETCH ONLINE
  const fetchTeamsOnline = async () => {
    const { data: dbTeams, error } = await supabase
      .from('equipos')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) throw error;
    setEquipos(dbTeams || []);
  };

  const fetchPlayersOnline = async () => {
    const { data: dbPlayers, error } = await supabase
      .from('jugadores')
      .select('*')
      .order('nombre', { ascending: true });

    if (error) {
      // Graceful fallback to local if players table is not queryable
      console.warn("Could not query jugadores table, loading fallback squad");
      const localP = localStorage.getItem('scout_players');
      setPlayers(localP ? JSON.parse(localP) : fallbackPlayers);
    } else {
      setPlayers(dbPlayers && dbPlayers.length > 0 ? dbPlayers : fallbackPlayers);
    }
  };

  const fetchPartidosOnline = async () => {
    const { data: dbPartidos, error } = await supabase
      .from('partidos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (dbPartidos && dbPartidos.length > 0) {
      // Supabase returns eventos as json array representing MatchEvent[]
      const formatted = dbPartidos.map(p => ({
        ...p,
        eventos: Array.isArray(p.eventos) ? p.eventos : [],
        alineacion: p.alineacion || {}
      }));
      setPartidos(formatted);
    } else {
      // Create a default first match online if none exists
      const newMatchObj = {
        analisis_ofensivo: samplePartido.analisis_ofensivo,
        analisis_defensivo: samplePartido.analisis_defensivo,
        analisis_transiciones: samplePartido.analisis_transiciones,
        video_rival_url: samplePartido.video_rival_url,
        slides_url: samplePartido.slides_url,
        video_plan_url: samplePartido.video_plan_url,
        video_eventos_url: samplePartido.video_eventos_url,
        eventos: samplePartido.eventos,
        formacion: '4-3-3',
        alineacion: {},
        fecha: samplePartido.fecha,
        nombre_rival: 'FC Barcelona'
      };
      
      const { data: inserted, error: insertError } = await supabase
        .from('partidos')
        .insert([newMatchObj])
        .select();

      if (!insertError && inserted && inserted.length > 0) {
        setPartidos([inserted[0]]);
      } else {
        setPartidos([ { ...samplePartido, id: 'online_default_p' } ]);
      }
    }
  };

  // LOCAL RECOVERY
  const loadLocalFallbackData = () => {
    const savedTeams = localStorage.getItem('scout_teams');
    const savedPartidos = localStorage.getItem('scout_partidos');
    const savedPlayers = localStorage.getItem('scout_players');

    if (savedTeams) {
      setEquipos(JSON.parse(savedTeams));
    } else {
      setEquipos(sampleTeams);
      localStorage.setItem('scout_teams', JSON.stringify(sampleTeams));
    }

    if (savedPlayers) {
      setPlayers(JSON.parse(savedPlayers));
    } else {
      setPlayers(fallbackPlayers);
      localStorage.setItem('scout_players', JSON.stringify(fallbackPlayers));
    }

    if (savedPartidos) {
      setPartidos(JSON.parse(savedPartidos));
    } else {
      const initialMatches = [{ ...samplePartido, equipo_rival_id: 't2', formacion: '4-3-3', alineacion: {} }];
      setPartidos(initialMatches);
      localStorage.setItem('scout_partidos', JSON.stringify(initialMatches));
    }
  };

  // SAVE CURRENT WORKSPACE DATA
  const handleSavePartido = async () => {
    if (!currentPartido) return;
    try {
      setSaving(true);
      
      const rivalName = equipos.find(e => e.id === currentPartido.equipo_rival_id)?.nombre || currentPartido.nombre_rival || 'Rival';
      const updatedMatch = {
        ...currentPartido,
        nombre_rival: rivalName,
        formacion: currentPartido.formacion || '4-3-3',
        alineacion: currentPartido.alineacion || {}
      };

      if (isUsingFallback) {
        // Save in LocalStorage
        const updatedPartidos = partidos.map(p => p.id === currentPartido.id ? updatedMatch : p);
        setPartidos(updatedPartidos);
        localStorage.setItem('scout_partidos', JSON.stringify(updatedPartidos));
        alert('💾 Plan de partido guardado correctamente en almacenamiento local.');
      } else {
        // Save in Supabase
        const { error } = await supabase
          .from('partidos')
          .update({
            equipo_rival_id: currentPartido.equipo_rival_id,
            nombre_rival: rivalName,
            analisis_ofensivo: currentPartido.analisis_ofensivo,
            analisis_defensivo: currentPartido.analisis_defensivo,
            analisis_transiciones: currentPartido.analisis_transiciones,
            video_rival_url: currentPartido.video_rival_url,
            slides_url: currentPartido.slides_url,
            video_plan_url: currentPartido.video_plan_url,
            video_eventos_url: currentPartido.video_eventos_url,
            eventos: currentPartido.eventos,
            formacion: currentPartido.formacion || '4-3-3',
            alineacion: currentPartido.alineacion || {},
            fecha: currentPartido.fecha
          })
          .eq('id', currentPartido.id);

        if (error) throw error;

        setPartidos(prev => prev.map(p => p.id === currentPartido.id ? updatedMatch : p));
        alert('⚡ Plan de partido sincronizado y guardado con éxito en Supabase.');
      }
    } catch (e: any) {
      console.error("Error saving match plan details:", e);
      alert(`Error al guardar: ${e.message}`);
    } finally {
      setSaving(false);
    }
  };

  // LINEUP MANAGEMENT ACTIONS
  const handleAssignPlayer = (positionKey: string, playerId: string) => {
    if (!currentPartido) return;
    const currentAlineacion = { ...(currentPartido.alineacion || {}) };

    // Prevent duplicates in the starting 11 by unassigning player from any other spots
    Object.keys(currentAlineacion).forEach(key => {
      if (currentAlineacion[key] === playerId) {
        delete currentAlineacion[key];
      }
    });

    currentAlineacion[positionKey] = playerId;
    setCurrentPartido({
      ...currentPartido,
      alineacion: currentAlineacion
    });
  };

  const handleUnassignPosition = (positionKey: string) => {
    if (!currentPartido) return;
    const currentAlineacion = { ...(currentPartido.alineacion || {}) };
    delete currentAlineacion[positionKey];
    setCurrentPartido({
      ...currentPartido,
      alineacion: currentAlineacion
    });
  };

  const handleFormationChange = (newFormation: string) => {
    if (!currentPartido) return;
    setCurrentPartido({
      ...currentPartido,
      formacion: newFormation
    });
  };

  // ADD MATCH
  const handleCreatePartido = async () => {
    try {
      setLoading(true);
      const newId = 'p_' + Date.now();
      const firstTeam = equipos[0]?.id || null;
      const firstTeamName = equipos[0]?.nombre || 'Nuevo Rival';

      const newMatch: Partido = {
        id: newId,
        equipo_rival_id: firstTeam,
        nombre_rival: firstTeamName,
        fecha: new Date().toISOString().split('T')[0],
        analisis_ofensivo: '',
        analisis_defensivo: '',
        analisis_transiciones: '',
        video_rival_url: '',
        slides_url: '',
        video_plan_url: '',
        video_eventos_url: '',
        eventos: [],
        formacion: '4-3-3',
        alineacion: {}
      };

      if (isUsingFallback) {
        const list = [newMatch, ...partidos];
        setPartidos(list);
        localStorage.setItem('scout_partidos', JSON.stringify(list));
        setSelectedPartidoId(newId);
      } else {
        const { data, error } = await supabase
          .from('partidos')
          .insert([{
            equipo_rival_id: newMatch.equipo_rival_id,
            nombre_rival: newMatch.nombre_rival,
            fecha: newMatch.fecha,
            analisis_ofensivo: '',
            analisis_defensivo: '',
            analisis_transiciones: '',
            video_rival_url: '',
            slides_url: '',
            video_plan_url: '',
            video_eventos_url: '',
            eventos: [],
            formacion: '4-3-3',
            alineacion: {}
          }])
          .select();

        if (error) throw error;
        if (data && data.length > 0) {
          const inserted = { ...data[0], eventos: [] };
          setPartidos([inserted, ...partidos]);
          setSelectedPartidoId(inserted.id);
        }
      }
    } catch (e: any) {
      alert(`Error al crear partido: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // DELETE MATCH/PARTIDO
  const handleDeletePartido = async () => {
    if (!currentPartido) return;
    if (!confirm('¿Seguro que deseas eliminar esta planificación de partido?')) return;

    try {
      setLoading(true);
      if (isUsingFallback) {
        const list = partidos.filter(p => p.id !== currentPartido.id);
        setPartidos(list);
        localStorage.setItem('scout_partidos', JSON.stringify(list));
        setSelectedPartidoId(list[0]?.id || '');
      } else {
        const { error } = await supabase
          .from('partidos')
          .delete()
          .eq('id', currentPartido.id);

        if (error) throw error;
        const list = partidos.filter(p => p.id !== currentPartido.id);
        setPartidos(list);
        setSelectedPartidoId(list[0]?.id || '');
      }
      alert('Planificación eliminada exitosamente.');
    } catch (e: any) {
      alert(`Error al borrar: ${e.message}`);
    } finally {
      setLoading(false);
    }
  };

  // TEAM MANAGING CRUD ACTIONS
  const handleTeamFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamFormName.trim()) {
      alert('Por favor introduce el nombre del equipo');
      return;
    }

    try {
      setSaving(true);
      if (editingTeam) {
        // Edit Action
        const updatedTeam = { ...editingTeam, nombre: teamFormName, escudo_url: teamFormEscudo };
        if (isUsingFallback) {
          const updated = equipos.map(eq => eq.id === editingTeam.id ? updatedTeam : eq);
          setEquipos(updated);
          localStorage.setItem('scout_teams', JSON.stringify(updated));
        } else {
          const { error } = await supabase
            .from('equipos')
            .update({ nombre: teamFormName, escudo_url: teamFormEscudo })
            .eq('id', editingTeam.id);

          if (error) throw error;
          setEquipos(prev => prev.map(eq => eq.id === editingTeam.id ? updatedTeam : eq));
        }
      } else {
        // Add Action
        const newTeamId = 'team_' + Date.now();
        const newTeam: Equipo = {
          id: newTeamId,
          nombre: teamFormName,
          escudo_url: teamFormEscudo || null
        };

        if (isUsingFallback) {
          const list = [...equipos, newTeam];
          setEquipos(list);
          localStorage.setItem('scout_teams', JSON.stringify(list));
        } else {
          const { data, error } = await supabase
            .from('equipos')
            .insert([{ nombre: teamFormName, escudo_url: teamFormEscudo || null }])
            .select();

          if (error) throw error;
          if (data && data.length > 0) {
            setEquipos(prev => [...prev, data[0]]);
          }
        }
      }

      // Close modal
      setIsTeamModalOpen(false);
      setEditingTeam(null);
      setTeamFormName('');
      setTeamFormEscudo('');
    } catch (error: any) {
      alert(`Error al guardar equipo: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const handleEditTeam = (team: Equipo) => {
    setEditingTeam(team);
    setTeamFormName(team.nombre);
    setTeamFormEscudo(team.escudo_url || '');
    setIsTeamModalOpen(true);
  };

  const handleDeleteTeam = async (id: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este equipo? Todo análisis vinculado se reasociará.')) return;
    try {
      if (isUsingFallback) {
        const list = equipos.filter(eq => eq.id !== id);
        setEquipos(list);
        localStorage.setItem('scout_teams', JSON.stringify(list));
      } else {
        const { error } = await supabase
          .from('equipos')
          .delete()
          .eq('id', id);

        if (error) throw error;
        setEquipos(prev => prev.filter(eq => eq.id !== id));
      }
    } catch (e: any) {
      alert(`Error al eliminar: ${e.message}`);
    }
  };

  // EVENTS RECORDING ACTIONS
  const formatStopwatchTime = (secs: number) => {
    const mm = Math.floor(secs / 60).toString().padStart(2, '0');
    const ss = (secs % 60).toString().padStart(2, '0');
    return `${mm}:${ss}`;
  };

  const recordEvent = (type: 'gol_favor' | 'ocasion_contra') => {
    if (!currentPartido) return;
    
    const timeLabel = `Minuto ${formatStopwatchTime(stopwatchTime)}`;
    const textLabel = type === 'gol_favor' 
      ? `${timeLabel} - ⚽ Gol a favor` 
      : `${timeLabel} - ⚠️ Ocasión en contra`;

    const newEvent: MatchEvent = {
      id: 'event_' + Date.now(),
      timestamp: timeLabel,
      tipo: type,
      descripcion: textLabel,
      time_seconds: stopwatchTime
    };

    const updatedEvents = [...(currentPartido.eventos || []), newEvent].sort((a, b) => a.time_seconds - b.time_seconds);
    
    setCurrentPartido({
      ...currentPartido,
      eventos: updatedEvents
    });

    // Provide immediate auditory/visual subtle feedback
    if (navigator.vibrate) {
      navigator.vibrate(100);
    }
  };

  const deleteEvent = (eventId: string) => {
    if (!currentPartido) return;
    const updated = (currentPartido.eventos || []).filter(e => e.id !== eventId);
    setCurrentPartido({
      ...currentPartido,
      eventos: updated
    });
  };

  // YT / Google slides Embed components
  const parsedVideoRival = getYouTubeEmbedUrl(currentPartido?.video_rival_url);
  const parsedVideoPlan = getYouTubeEmbedUrl(currentPartido?.video_plan_url);
  const parsedVideoEventos = getYouTubeEmbedUrl(currentPartido?.video_eventos_url);
  const parsedSlidesUrl = getGoogleSlidesEmbedUrl(currentPartido?.slides_url);

  return (
    <div className="space-y-8">
      {/* Fallback Banner Warnings */}
      {isUsingFallback && (
        <div className="bg-amber-500/10 border border-amber-500/20 text-amber-400 p-4 rounded-3xl flex items-center justify-between text-xs font-bold gap-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <AlertCircle className="shrink-0" size={18} />
            <span>
              Base de Datos local temporal activa. Para habilitar sincronización definitiva global, pulse "Reparar Permisos SQL" en el encabezado.
            </span>
          </div>
          <button 
            onClick={loadAllData} 
            className="flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 px-3.5 py-2.5 rounded-xl border border-amber-500/20 text-xs transition-colors whitespace-nowrap"
          >
            <RefreshCw size={12} className="animate-spin-slow" />
            <span>Probar Conexión</span>
          </button>
        </div>
      )}

      {/* MATCH SELECTION ROW (Unified controls at top of analysis pages) */}
      {activeTab !== 'equipos' && (
        <div className="glass-card p-6 flex flex-col md:flex-row gap-4 items-center justify-between border border-white/5">
          <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
            <div className="bg-emerald-500/10 text-emerald-400 p-3 rounded-2xl">
              <Layers size={22} className="text-emerald-400" />
            </div>
            <div className="flex-1 min-w-[200px]">
              <label className="text-[10px] uppercase tracking-widest font-black text-slate-500 block mb-1">Partido de Scouting</label>
              <select
                className="bg-slate-900 border border-white/10 px-4 py-2 text-sm text-white font-bold rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer min-w-[240px] appearance-none"
                value={selectedPartidoId}
                onChange={(e) => setSelectedPartidoId(e.target.value)}
              >
                {partidos.map((p, idx) => (
                  <option key={p.id} value={p.id}>
                    🗓️ {p.fecha} - vs {p.nombre_rival || `Rival ${idx + 1}`}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2.5 w-full md:w-auto self-end md:self-auto justify-end">
            <button
              onClick={handleCreatePartido}
              disabled={loading}
              className="flex items-center gap-2 bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/35 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
            >
              <Plus size={16} />
              <span>Nuevo Partido</span>
            </button>
            <button
              onClick={handleSavePartido}
              disabled={saving || !currentPartido}
              className="flex items-center gap-2 bg-emerald-500 text-white hover:bg-emerald-400 shadow-xl shadow-emerald-900/30 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-wider transition-all cursor-pointer active:scale-95 disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Sincronizando...</span>
                </>
              ) : (
                <>
                  <Save size={16} />
                  <span>Guardar Plan</span>
                </>
              )}
            </button>
            <button
              onClick={handleDeletePartido}
              disabled={loading || partidos.length <= 1}
              className="p-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-2xl transition-all cursor-pointer disabled:opacity-30 disabled:pointer-events-none"
              title="Borrar Plan"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      )}

      {/* COHESIVE TAB ROW */}
      <div className="flex bg-white/5 p-1 px-1.5 rounded-2xl border border-white/10 self-start justify-start flex-wrap gap-1 md:inline-flex">
        {[
          { id: 'rival', label: '🔍 Informe del Rival', icon: Shield },
          { id: 'alineacion', label: '🏃 Alineación', icon: Users },
          { id: 'plan', label: '📐 Plan de Partido', icon: FileText },
          { id: 'eventos', label: '⏱️ Eventos', icon: Timer },
          { id: 'equipos', label: '🛡️ Rivales / Equipos', icon: Layers }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={cn(
              "flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs uppercase tracking-wider transition-all select-none cursor-pointer",
              activeTab === tab.id 
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-500/20" 
                : "text-slate-400 hover:text-white"
            )}
          >
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 gap-6 glass-card border-dashed">
          <Loader2 className="animate-spin text-emerald-400" size={64} />
          <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Cargando módulos interactivos...</p>
        </div>
      ) : (
        <section className="min-h-[400px]">
          {/* TAB 1: LISTADO DE EQUIPOS */}
          {activeTab === 'equipos' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Directorio de Rivales</h3>
                  <p className="text-slate-400 text-xs">Añade y configura escudos e imágenes de los equipos opuestos</p>
                </div>
                <button
                  onClick={() => { setEditingTeam(null); setTeamFormName(''); setTeamFormEscudo(''); setIsTeamModalOpen(true); }}
                  className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 px-5 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider text-white shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
                >
                  <Plus size={16} />
                  <span>Añadir Equipo</span>
                </button>
              </div>

              {equipos.length === 0 ? (
                <div className="text-center py-20 bg-white/[0.02] border-2 border-dashed border-white/10 rounded-[2rem]">
                  <Shield size={64} className="mx-auto text-slate-700 mb-4" />
                  <h4 className="text-lg font-bold text-white mb-1">Sin equipos registrados</h4>
                  <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">Comienza añadiendo los rivales del campeonato para rellenar sus informes técnicos.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {equipos.map((team) => (
                    <motion.div
                      key={team.id}
                      layout
                      className="glass-card group overflow-hidden border border-white/5 hover:border-white/10 transition-colors p-5 flex flex-col items-center text-center relative"
                    >
                      <div className="absolute top-4 right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => handleEditTeam(team)}
                          className="p-2 bg-slate-900/80 hover:bg-slate-800 border border-white/10 text-white rounded-lg transition-colors cursor-pointer"
                          title="Editar"
                        >
                          <Edit2 size={12} />
                        </button>
                        <button
                          onClick={() => handleDeleteTeam(team.id)}
                          className="p-2 bg-slate-900/80 hover:bg-red-900/80 border border-white/10 text-red-400 rounded-lg transition-colors cursor-pointer"
                          title="Borrar"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>

                      <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-900/40 border border-white/10 flex items-center justify-center mb-4 shrink-0 transition-all group-hover:scale-105">
                        {team.escudo_url ? (
                          <img src={team.escudo_url} alt={team.nombre} className="w-full h-full object-cover" />
                        ) : (
                          <Shield size={44} className="text-slate-600" />
                        )}
                      </div>

                      <h4 className="text-lg font-black text-white px-2 truncate w-full">{team.nombre}</h4>
                      <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1 font-bold">Rival de Scouting</p>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: INFORME DEL RIVAL */}
          {activeTab === 'rival' && currentPartido && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Analysis Fields */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Análisis Técnico del Oponente</h3>
                  <p className="text-slate-400 text-xs">Modifica el análisis táctico para que tus jugadores conozcan al rival</p>
                </div>

                {/* Team Selection drop for this current Partido */}
                <div className="space-y-1.5 bg-white/5 p-4 rounded-3xl border border-white/5">
                  <label className="text-[10px] uppercase font-black text-slate-400 flex items-center gap-1.5 tracking-wider">
                    <Shield size={12} className="text-emerald-400" /> Vincular a Equipo Rival
                  </label>
                  <select
                    className="w-full bg-slate-900 border border-white/10 px-4 py-3 rounded-xl text-xs text-white font-bold outline-none"
                    value={currentPartido.equipo_rival_id || ''}
                    onChange={(e) => {
                      const id = e.target.value;
                      const name = equipos.find(eq => eq.id === id)?.nombre || 'Rival';
                      setCurrentPartido({ ...currentPartido, equipo_rival_id: id, nombre_rival: name });
                    }}
                  >
                    <option value="">-- Introducir nombre manualmente --</option>
                    {equipos.map(eq => (
                      <option key={eq.id} value={eq.id}>{eq.nombre}</option>
                    ))}
                  </select>
                  {!currentPartido.equipo_rival_id && (
                    <input
                      type="text"
                      placeholder="Nombre del rival alternativo..."
                      className="w-full mt-2 bg-white/5 border border-white/10 px-4 py-3 rounded-xl text-xs text-white"
                      value={currentPartido.nombre_rival || ''}
                      onChange={(e) => setCurrentPartido({ ...currentPartido, nombre_rival: e.target.value })}
                    />
                  )}
                </div>

                <div className="space-y-4">
                  {/* Ofensivo */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-widest text-emerald-400">🔥 Comportamiento Ofensivo (Ataque)</label>
                    <textarea
                      rows={4}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-xs text-slate-200 resize-none font-medium h-32"
                      placeholder="Identifica cómo atacan, su juego asociativo, laterales profundos, balones al espacio..."
                      value={currentPartido.analisis_ofensivo || ''}
                      onChange={(e) => setCurrentPartido({ ...currentPartido, analisis_ofensivo: e.target.value })}
                    />
                  </div>

                  {/* Defensivo */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-widest text-emerald-400">🛡️ Bloque Defensivo (Defensa)</label>
                    <textarea
                      rows={4}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-xs text-slate-200 resize-none font-medium h-32"
                      placeholder="Describe su comportamiento defensivo, presión alta, repliegue bajo, debilidades defensivas..."
                      value={currentPartido.analisis_defensivo || ''}
                      onChange={(e) => setCurrentPartido({ ...currentPartido, analisis_defensivo: e.target.value })}
                    />
                  </div>

                  {/* Transiciones */}
                  <div className="space-y-1.5">
                    <label className="text-[10px] uppercase font-black tracking-widest text-emerald-400">⚡ Transiciones (Ataque-Defensa / Defensa-Ataque)</label>
                    <textarea
                      rows={4}
                      className="w-full p-4 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none transition-all text-xs text-slate-200 resize-none font-medium h-32"
                      placeholder="Transiciones ofensivas rápidas, repliegues defensivos, pérdidas en salida..."
                      value={currentPartido.analisis_transiciones || ''}
                      onChange={(e) => setCurrentPartido({ ...currentPartido, analisis_transiciones: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              {/* YouTube Video Resource */}
              <div className="lg:col-span-5 space-y-6">
                <div className="glass-card p-6 border border-white/5 space-y-4 flex flex-col h-full justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-rose-500">
                      <Youtube size={20} />
                      <h4 className="text-xs uppercase font-black tracking-widest text-white">Video de Análisis (YouTube)</h4>
                    </div>

                    <p className="text-slate-400 text-xs">
                      Enlaza un video sobre el rival para que se proyecte en este panel.
                    </p>

                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs text-white"
                      placeholder="Pegar URL de YouTube (ej. https://youtube.com/watch?v=...)"
                      value={currentPartido.video_rival_url || ''}
                      onChange={(e) => setCurrentPartido({ ...currentPartido, video_rival_url: e.target.value })}
                    />

                    {parsedVideoRival ? (
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
                        <iframe
                          src={parsedVideoRival}
                          title="Análisis del Rival"
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center aspect-video rounded-2xl border border-dashed border-white/5 bg-white/[0.01] text-slate-600">
                        <Youtube size={36} className="mb-2 opacity-50" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Sin Video Incrustado</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <button
                      onClick={handleSavePartido}
                      disabled={saving}
                      className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
                    >
                      {saving ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Save size={16} />
                      )}
                      <span>Guardar Informe Táctico</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2.5: ALINEACIÓN INTERACTIVA */}
          {activeTab === 'alineacion' && currentPartido && (() => {
            const currentFormacion = currentPartido.formacion || '4-3-3';
            const currentAlineacion = currentPartido.alineacion || {};
            const formationPositions = FORMATIONS_MAPPING[currentFormacion] || FORMATIONS_MAPPING['4-3-3'];
            const assignedPlayerIds = Object.values(currentAlineacion);

            return (
              <div className="space-y-6">
                {/* Tactical Header and Config Banner */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/60 p-6 rounded-3xl border border-white/5 backdrop-blur-md">
                  <div>
                    <h3 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
                      <Users className="text-emerald-400" size={24} />
                      Alineación Titular
                    </h3>
                    <p className="text-slate-400 text-xs mt-1">
                      Elige un esquema táctico y gestiona la alineación inicial arrastrando jugadores o haciendo click en las posiciones.
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-3">
                    {/* Esquema selector buttons */}
                    <div className="flex items-center bg-white/5 border border-white/10 p-1 rounded-2xl">
                      {Object.keys(FORMATIONS_MAPPING).map((form) => (
                        <button
                          key={form}
                          onClick={() => handleFormationChange(form)}
                          className={cn(
                            "px-4 py-2 rounded-xl text-xs font-black tracking-tight cursor-pointer transition-all",
                            currentFormacion === form
                              ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                              : "text-slate-400 hover:text-white"
                          )}
                        >
                          {form}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={() => {
                        if (confirm('¿Seguro que deseas vaciar completamente la alineación actual?')) {
                          setCurrentPartido({ ...currentPartido, alineacion: {} });
                        }
                      }}
                      className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 rounded-2xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer"
                    >
                      Limpiar Campo
                    </button>

                    <button
                      onClick={handleSavePartido}
                      disabled={saving}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider shadow-lg shadow-emerald-950/40 transition-all cursor-pointer disabled:opacity-50"
                    >
                      {saving ? (
                        <Loader2 className="animate-spin" size={14} />
                      ) : (
                        <Save size={14} />
                      )}
                      <span>Guardar Partido</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* SOCCER FIELD VISUAL PANEL */}
                  <div className="lg:col-span-7 flex flex-col items-center">
                    {/* Visual Green Pitch Frame */}
                    <div className="relative aspect-[3/4] w-full max-w-[480px] rounded-[32px] bg-gradient-to-b from-emerald-800 via-emerald-700 to-emerald-950 border-4 border-white/20 overflow-hidden shadow-2xl shadow-black/80 select-none">
                      
                      {/* Alternating pitch stripe lines */}
                      <div className="absolute inset-0 flex flex-col pointer-events-none opacity-10">
                        {Array.from({ length: 12 }).map((_, i) => (
                          <div
                            key={i}
                            className={cn(
                              "flex-1 w-full",
                              i % 2 === 0 ? "bg-black" : "bg-transparent"
                            )}
                          />
                        ))}
                      </div>

                      {/* Decals & markings lines */}
                      <div className="absolute inset-4 border border-white/15 pointer-events-none rounded-[1.5rem]">
                        {/* Center half line */}
                        <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-white/15" />
                        {/* Center circle */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border border-white/15" />
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-white/20" />
                        
                        {/* Goals Top */}
                        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-20 border-b border-x border-white/15">
                          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-6 border-b border-x border-white/10" />
                          <div className="absolute bottom-3 left-1/2 w-1.5 h-1.5 rounded-full bg-white/25 -translate-x-1/2" />
                        </div>

                        {/* Goals Bottom */}
                        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-48 h-20 border-t border-x border-white/15">
                          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-20 h-6 border-t border-x border-white/10" />
                          <div className="absolute top-3 left-1/2 w-1.5 h-1.5 rounded-full bg-white/25 -translate-x-1/2" />
                        </div>
                      </div>

                      {/* Display the tactical coordinate-mapped spots */}
                      {formationPositions.map((pos) => {
                        const assignedPlayerId = currentAlineacion[pos.key];
                        const playerObj = assignedPlayerId ? players.find(p => p.id === assignedPlayerId) : null;
                        const isPopoverOpen = openSpotPopover === pos.key;

                        return (
                          <div
                            key={pos.key}
                            className="absolute -translate-x-1/2 -translate-y-1/2 transition-all duration-700 z-20"
                            style={{ top: `${pos.top}%`, left: `${pos.left}%` }}
                            onDragOver={(e) => e.preventDefault()}
                            onDrop={(e) => {
                              e.preventDefault();
                              const pid = e.dataTransfer.getData('text/plain');
                              if (pid) handleAssignPlayer(pos.key, pid);
                            }}
                          >
                            <div className="flex flex-col items-center">
                              {/* Absolute Spot button */}
                              <button
                                onClick={() => setOpenSpotPopover(isPopoverOpen ? null : pos.key)}
                                className={cn(
                                  "w-12 h-12 rounded-full flex items-center justify-center transition-all relative border shadow-lg shadow-black/50 cursor-pointer active:scale-95 group",
                                  playerObj 
                                    ? "bg-slate-900 border-emerald-400 hover:border-emerald-300" 
                                    : "bg-emerald-950/65 hover:bg-emerald-900/80 border-dashed border-white/30 hover:border-white/50"
                                )}
                              >
                                {playerObj ? (
                                  playerObj.foto_jugador ? (
                                    <img
                                      src={playerObj.foto_jugador}
                                      alt={playerObj.nombre}
                                      className="w-full h-full rounded-full object-cover"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <span className="text-white text-[11px] font-black">
                                      {playerObj.dorsal || playerObj.nombre[0]}
                                    </span>
                                  )
                                ) : (
                                  <Plus size={14} className="text-emerald-300" />
                                )}

                                {/* Small role position shorthand label tag */}
                                <span className={cn(
                                  "absolute -top-2 px-1.5 py-0.5 rounded text-[8px] font-black tracking-wider uppercase border",
                                  playerObj 
                                    ? "bg-emerald-500 text-white border-emerald-400 animate-fade-in" 
                                    : "bg-slate-900/90 text-slate-400 border-white/5"
                                )}>
                                  {pos.label}
                                </span>
                              </button>

                              {/* Label with player name */}
                              <div className="mt-1 flex flex-col items-center max-w-[90px]">
                                {playerObj ? (
                                  <>
                                    <span className="bg-slate-950/95 text-white font-black text-[9px] px-2 py-0.5 rounded-full border border-white/10 shadow-sm truncate max-w-[80px]">
                                      {playerObj.nombre}
                                    </span>
                                    <button
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleUnassignPosition(pos.key);
                                      }}
                                      className="text-[8px] text-red-400 hover:text-red-300 font-bold mt-0.5 underline cursor-pointer"
                                    >
                                      Quitar
                                    </button>
                                  </>
                                ) : (
                                  <span className="text-[9px] font-extrabold text-white/40 bg-black/45 px-1.5 py-0.5 rounded-full">
                                    Vacío
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Dropdown popup picker for this specific spot */}
                            <AnimatePresence>
                              {isPopoverOpen && (
                                <motion.div
                                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                  animate={{ opacity: 1, scale: 1, y: 0 }}
                                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                  className="absolute left-1/2 -translate-x-1/2 bottom-16 bg-slate-950/95 border border-white/10 rounded-2xl p-3 shadow-2xl z-50 w-64 max-h-60 overflow-y-auto backdrop-blur-xl"
                                >
                                  <div className="flex items-center justify-between mb-2">
                                    <span className="text-[10px] font-black uppercase text-emerald-400">Asignar {pos.label}</span>
                                    <button 
                                      onClick={() => setOpenSpotPopover(null)}
                                      className="text-slate-400 hover:text-white text-[10px] font-bold cursor-pointer"
                                    >
                                      Cerrar
                                    </button>
                                  </div>

                                  <input
                                    type="text"
                                    placeholder="Heurística de búsqueda..."
                                    value={searchRoster}
                                    onChange={(e) => setSearchRoster(e.target.value)}
                                    className="w-full bg-slate-900 border border-white/10 text-xs text-white px-2.5 py-1.5 rounded-xl mb-2 focus:outline-none focus:border-emerald-500 font-bold"
                                  />

                                  <div className="space-y-1">
                                    <button
                                      onClick={() => {
                                        handleUnassignPosition(pos.key);
                                        setOpenSpotPopover(null);
                                      }}
                                      className="w-full text-left text-[11px] text-red-400 hover:bg-white/5 px-2 py-1.5 rounded-lg flex items-center justify-between font-bold"
                                    >
                                      <span>Ninguno (Vaciar posición)</span>
                                    </button>

                                    {players
                                      .filter(p => {
                                        const query = searchRoster.toLowerCase();
                                        return (p.nombre + " " + p.apellidos).toLowerCase().includes(query) ||
                                          (p.demarcacion || '').toLowerCase().includes(query);
                                      })
                                      .map((player) => {
                                        const isAssignedToThisSpot = currentAlineacion[pos.key] === player.id;
                                        const isAssignedElsewhereKey = Object.keys(currentAlineacion).find(k => k !== pos.key && currentAlineacion[k] === player.id);

                                        return (
                                          <button
                                            key={player.id}
                                            onClick={() => {
                                              handleAssignPlayer(pos.key, player.id);
                                              setOpenSpotPopover(null);
                                              setSearchRoster('');
                                            }}
                                            className={cn(
                                              "w-full text-left text-[11px] px-2.5 py-1.5 rounded-lg flex items-center justify-between transition-colors cursor-pointer",
                                              isAssignedToThisSpot 
                                                ? "bg-emerald-500/20 text-emerald-300 font-bold" 
                                                : "text-slate-300 hover:bg-white/5"
                                            )}
                                          >
                                            <div className="flex items-center gap-1.5 truncate">
                                              <span className="w-4 text-[9px] font-black text-slate-500">#{player.dorsal || '-'}</span>
                                              <span className="truncate">{player.nombre} {player.apellidos}</span>
                                            </div>
                                            
                                            {isAssignedElsewhereKey ? (
                                              <span className="text-[8px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1 py-0.5 rounded font-black truncate max-w-[60px]">
                                                {FORMATIONS_MAPPING[currentFormacion].find(fm => fm.key === isAssignedElsewhereKey)?.label || 'Aline'}
                                              </span>
                                            ) : isAssignedToThisSpot ? (
                                              <Check size={10} className="text-emerald-400" />
                                            ) : (
                                              <span className="text-[8px] text-slate-500 font-black">
                                                {player.demarcacion?.slice(0, 3) || 'JUG'}
                                              </span>
                                            )}
                                          </button>
                                        );
                                      })}
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* SQUAD LIST PANEL */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="glass-card p-6 border border-white/5 space-y-4">
                      <div>
                        <h4 className="text-sm font-black text-white uppercase tracking-wider">Plantilla del Club</h4>
                        <p className="text-slate-400 text-xs mt-0.5">Asigna titulares arrastrando o buscando en el campo de juego</p>
                      </div>

                      {/* Search and counting metrics */}
                      <div className="flex items-center gap-3">
                        <input
                          type="text"
                          placeholder="Filtro de nombres o posición..."
                          value={searchRoster}
                          onChange={(e) => setSearchRoster(e.target.value)}
                          className="flex-1 bg-slate-900 border border-white/10 text-xs text-white px-4 py-3 rounded-2xl focus:outline-none focus:border-emerald-500 font-bold shadow-inner"
                        />
                        
                        <div className="px-4 py-3 bg-white/5 border border-white/5 rounded-2xl flex flex-col items-center">
                          <span className="text-[14px] font-black text-emerald-400">{assignedPlayerIds.length}/11</span>
                          <span className="text-[8px] uppercase tracking-widest text-slate-500 font-bold">Colocados</span>
                        </div>
                      </div>

                      {/* Drop Instructions Banner */}
                      <div className="bg-emerald-500/10 border border-emerald-500/15 rounded-2.5xl p-3 text-[11px] text-emerald-300 font-bold flex items-center gap-2">
                        <Sparkles size={14} className="flex-shrink-0" />
                        <span>¡Arrastra y suelta un jugador de la lista sobre cualquier posición del campo para alinearlo!</span>
                      </div>

                      {/* Scrollable roster cards container */}
                      <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                        {players
                          .filter(player => {
                            const term = searchRoster.toLowerCase();
                            return (player.nombre + " " + player.apellidos).toLowerCase().includes(term) ||
                              (player.demarcacion || '').toLowerCase().includes(term);
                          })
                          .map(player => {
                            // Find current tactical spotassigned
                            const assignedSpotKey = Object.keys(currentAlineacion).find(k => currentAlineacion[k] === player.id);
                            const assignedSpot = assignedSpotKey ? formationPositions.find(p => p.key === assignedSpotKey) : null;

                            return (
                              <div
                                key={player.id}
                                draggable={!assignedSpot}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', player.id);
                                }}
                                className={cn(
                                  "p-3 rounded-2xl border transition-all duration-150 flex items-center justify-between select-none active:scale-[0.99]",
                                  assignedSpot
                                    ? "bg-slate-900/40 border-emerald-500/10 text-slate-400"
                                    : "bg-white/[0.02] border-white/5 text-slate-200 hover:border-white/10 hover:bg-white/[0.04] cursor-grab"
                                )}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  {player.foto_jugador ? (
                                    <img
                                      src={player.foto_jugador}
                                      alt={player.nombre}
                                      className="w-10 h-10 rounded-full object-cover border border-white/10"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-white/5 flex items-center justify-center font-bold text-slate-400 text-xs uppercase">
                                      #{player.dorsal || player.nombre[0]}
                                    </div>
                                  )}

                                  <div className="min-w-0">
                                    <p className="font-bold text-xs truncate text-white">
                                      {player.nombre} {player.apellidos}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                      <span className="text-[9px] uppercase font-black text-slate-500 tracking-wider">
                                        {player.demarcacion || 'Jugador'}
                                      </span>
                                      <span className="text-[9px] text-slate-600 font-medium">
                                        • {player.lateralidad || 'Diestro'}
                                      </span>
                                    </div>
                                  </div>
                                </div>

                                {assignedSpot ? (
                                  <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 px-3 py-1.5 rounded-full text-[9px] font-black uppercase">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span>Titular ({assignedSpot.label})</span>
                                  </div>
                                ) : (
                                  <span className="text-[10px] bg-slate-800 text-slate-400 px-2 py-1 rounded-lg font-bold">
                                    Disponible
                                  </span>
                                )}
                              </div>
                            );
                          })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* TAB 3: PLAN DE PARTIDO */}
          {activeTab === 'plan' && currentPartido && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Google Slides Presentation embed */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Planificación Estratégica (Slides)</h3>
                  <p className="text-slate-400 text-xs">Inserta una presentación corporativa de Google Slides para repasar pizarra táctica</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-1.5 bg-white/5 p-4 rounded-3xl border border-white/5">
                    <label className="text-[10px] uppercase font-black text-slate-400 flex items-center gap-1.5 tracking-wider">
                      <FileText size={12} className="text-emerald-400" /> URL de Publicación de Google Slides
                    </label>
                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs text-white"
                      placeholder="Dirección pública (https://docs.google.com/presentation/d/.../pub o edit)"
                      value={currentPartido.slides_url || ''}
                      onChange={(e) => setCurrentPartido({ ...currentPartido, slides_url: e.target.value })}
                    />
                    <p className="text-[9px] text-slate-500 font-bold leading-normal uppercase">
                      * Nota: Archivo &gt; Compartir &gt; Publicar en la Web en Google Slides proporciona el enlace ideal para proyectar la pizarra.
                    </p>
                  </div>

                  {parsedSlidesUrl ? (
                    <div className="relative w-full rounded-[2rem] overflow-hidden border border-white/10 bg-slate-950 aspect-video shadow-2xl">
                      <iframe
                        src={parsedSlidesUrl}
                        className="absolute inset-0 w-full h-full border-0"
                        allowFullScreen
                      ></iframe>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center aspect-video rounded-[2rem] border-2 border-dashed border-white/5 bg-white/[0.01] text-slate-600">
                      <Layout size={44} className="mb-2 opacity-50" />
                      <span className="text-xs font-bold uppercase tracking-widest text-slate-500">Pizarra de Google Slides Vacía</span>
                      <p className="text-[10px] text-slate-600 text-center max-w-xs mt-1">Coloca un URL de presentación y visualiza dinámicamente diapositivas en vivo.</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Complementary YouTube Video URL */}
              <div className="lg:col-span-5 space-y-6">
                <div className="glass-card p-6 border border-white/5 space-y-4 flex flex-col h-full justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-rose-500">
                      <Youtube size={20} />
                      <h4 className="text-xs uppercase font-black tracking-widest text-white">Video Complementario</h4>
                    </div>

                    <p className="text-slate-400 text-xs">
                      Enlaza videos complementarios de jugadas preestablecidas de balón parado o motivación.
                    </p>

                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs text-white"
                      placeholder="Pegar URL de YouTube"
                      value={currentPartido.video_plan_url || ''}
                      onChange={(e) => setCurrentPartido({ ...currentPartido, video_plan_url: e.target.value })}
                    />

                    {parsedVideoPlan ? (
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
                        <iframe
                          src={parsedVideoPlan}
                          title="Plan de Partido"
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center aspect-video rounded-2xl border border-dashed border-white/5 bg-white/[0.01] text-slate-600">
                        <Youtube size={36} className="mb-2 opacity-50" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Sin Video Complementario</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <button
                      onClick={handleSavePartido}
                      disabled={saving}
                      className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
                    >
                      {saving ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Save size={16} />
                      )}
                      <span>Guardar Plan de Estrategia</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: EVENTOS DE PARTIDO */}
          {activeTab === 'eventos' && currentPartido && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
              {/* Event logging interactive area with live timer */}
              <div className="lg:col-span-7 space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-white tracking-tight">Registro de Eventos en Tiempo Real</h3>
                  <p className="text-slate-400 text-xs">Utiliza el cronómetro interactivo para etiquetar goles y ocasiones de peligro</p>
                </div>

                <div className="glass-card p-6 border border-white/5 bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border-emerald-500/10 space-y-6">
                  {/* Cronometro visualizer */}
                  <div className="text-center p-6 bg-black/40 rounded-3xl border border-white/5 relative overflow-hidden group">
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 text-slate-500 text-[9px] uppercase font-black tracking-widest">
                      <span className={cn("w-2 h-2 rounded-full", isStopwatchRunning ? "bg-red-500 animate-pulse" : "bg-slate-600")}></span>
                      <span>Cronómetro del Partido</span>
                    </div>

                    <div className="text-6xl font-black tracking-tight text-white py-4 font-mono select-none">
                      {formatStopwatchTime(stopwatchTime)}
                    </div>

                    <div className="flex items-center justify-center gap-3">
                      <button
                        onClick={() => setIsStopwatchRunning(!isStopwatchRunning)}
                        className={cn(
                          "flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition-all cursor-pointer",
                          isStopwatchRunning 
                            ? "bg-amber-500/20 text-amber-400 border border-amber-500/30 hover:bg-amber-500/30" 
                            : "bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-950/40"
                        )}
                      >
                        {isStopwatchRunning ? (
                          <>
                            <Pause size={14} />
                            <span>Pausar</span>
                          </>
                        ) : (
                          <>
                            <Play size={14} />
                            <span>Empezar</span>
                          </>
                        )}
                      </button>
                      <button
                        onClick={() => { setIsStopwatchRunning(false); setStopwatchTime(0); }}
                        className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-slate-300 border border-white/5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all cursor-pointer"
                      >
                        <RotateCcw size={14} />
                        <span>Reiniciar</span>
                      </button>
                    </div>
                  </div>

                  {/* Hot Logger Buttons */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button
                      onClick={() => recordEvent('gol_favor')}
                      className="p-6 bg-emerald-600/15 hover:bg-emerald-600/25 border-2 border-emerald-500/30 text-emerald-400 rounded-3xl font-black text-sm uppercase tracking-wider flex flex-col items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <span className="text-4xl">⚽</span>
                      <span>Gol a Favor</span>
                    </button>
                    <button
                      onClick={() => recordEvent('ocasion_contra')}
                      className="p-6 bg-rose-600/15 hover:bg-rose-600/25 border-2 border-rose-500/30 text-rose-400 rounded-3xl font-black text-sm uppercase tracking-wider flex flex-col items-center justify-center gap-2.5 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer"
                    >
                      <span className="text-4xl">⚠️</span>
                      <span>Ocasión en Contra</span>
                    </button>
                  </div>
                </div>

                {/* Event timeline */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs uppercase font-black tracking-widest text-slate-400">Cronología de Eventos Recibidos</h4>
                    <span className="text-[10px] bg-slate-800 text-slate-500 px-2 py-0.5 rounded-full uppercase font-bold tracking-widest">
                      {(currentPartido.eventos || []).length} Eventos
                    </span>
                  </div>

                  {(currentPartido.eventos || []).length === 0 ? (
                    <div className="text-center py-10 bg-white/[0.01] border border-dashed border-white/5 rounded-3xl text-slate-600">
                      <span className="text-sm font-semibold">Sin eventos registrados todavia</span>
                      <p className="text-[10px] text-slate-600 mt-0.5">Activa el cronómetro y registra goles u ocasiones en directo!</p>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                      {currentPartido.eventos.map((evItem) => (
                        <div
                          key={evItem.id}
                          className={cn(
                            "flex items-center justify-between px-4 py-3 rounded-xl border transition-all text-xs font-bold",
                            evItem.tipo === 'gol_favor' 
                              ? "bg-emerald-950/15 border-emerald-500/20 text-emerald-300" 
                              : "bg-rose-950/15 border-rose-500/20 text-rose-300"
                          )}
                        >
                          <div className="flex items-center gap-3">
                            <span className="text-base">{evItem.tipo === 'gol_favor' ? '⚽' : '⚠️'}</span>
                            <span>{evItem.descripcion}</span>
                          </div>
                          <button
                            onClick={() => deleteEvent(evItem.id)}
                            className="p-1.5 hover:bg-white/10 text-slate-500 hover:text-white rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Match live feed video block */}
              <div className="lg:col-span-5 space-y-6">
                <div className="glass-card p-6 border border-white/5 space-y-4 flex flex-col h-full justify-between">
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-rose-500">
                      <Youtube size={20} />
                      <h4 className="text-xs uppercase font-black tracking-widest text-white">Video del Encuentro</h4>
                    </div>

                    <p className="text-slate-400 text-xs">
                      Inserta el video del partido grabado o en directo para clasificar los eventos mientras se reproduce en la app.
                    </p>

                    <input
                      type="text"
                      className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none text-xs text-white"
                      placeholder="Pegar URL del partido (ej. YouTube, streaming...)"
                      value={currentPartido.video_eventos_url || ''}
                      onChange={(e) => setCurrentPartido({ ...currentPartido, video_eventos_url: e.target.value })}
                    />

                    {parsedVideoEventos ? (
                      <div className="relative w-full aspect-video rounded-2xl overflow-hidden border border-white/10 bg-black">
                        <iframe
                          src={parsedVideoEventos}
                          title="Video del Partido en Curso"
                          className="absolute inset-0 w-full h-full"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        ></iframe>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center aspect-video rounded-2xl border border-dashed border-white/5 bg-white/[0.01] text-slate-600">
                        <Youtube size={36} className="mb-2 opacity-50" />
                        <span className="text-[10px] uppercase font-bold tracking-wider">Sin Video del Partido</span>
                      </div>
                    )}
                  </div>

                  <div className="pt-4 border-t border-white/5">
                    <button
                      onClick={handleSavePartido}
                      disabled={saving}
                      className="w-full py-4.5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
                    >
                      {saving ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <Save size={16} />
                      )}
                      <span>Sincronizar Eventos de Partido</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* TEAM CREATE/EDIT POPUP MODAL */}
      <AnimatePresence>
        {isTeamModalOpen && (
          <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass max-w-md w-full rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative"
            >
              <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-2">
                {editingTeam ? 'Editar Rival' : 'Añadir Rival'}
              </h3>
              <p className="text-slate-400 text-xs mb-6">Completa la información visual para el nuevo equipo opositor.</p>

              <form onSubmit={handleTeamFormSubmit} className="space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase font-black text-slate-500 tracking-widest ml-1">Nombre del Equipo</label>
                  <input
                    type="text"
                    required
                    className="w-full px-5 py-3.5 bg-white/5 border border-white/10 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none text-white font-bold"
                    placeholder="ej. FC Barcelona, CD Móstoles, etc."
                    value={teamFormName}
                    onChange={(e) => setTeamFormName(e.target.value)}
                  />
                </div>

                {/* Team Shield Upload block */}
                <div className="space-y-1.5 flex flex-col items-center">
                  <label className="text-[10px] text-slate-500 font-bold uppercase tracking-widest self-start ml-1">Cargar Escudo del Club</label>
                  <ImageUpload
                    currentImageUrl={teamFormEscudo}
                    onUpload={(url) => setTeamFormEscudo(url)}
                    className="w-full"
                  />
                </div>

                <div className="pt-4 flex justify-end gap-3 border-t border-white/5">
                  <button
                    type="button"
                    onClick={() => setIsTeamModalOpen(false)}
                    className="px-6 py-3.5 bg-white/5 text-slate-400 border border-white/5 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-8 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-black uppercase tracking-widest flex items-center gap-2 cursor-pointer shadow-lg active:scale-95"
                  >
                    {saving && <Loader2 size={12} className="animate-spin" />}
                    <span>{editingTeam ? 'Actualizar' : 'Crear'}</span>
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
