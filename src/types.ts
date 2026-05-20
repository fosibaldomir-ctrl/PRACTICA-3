export type Player = {
  id: string;
  nombre: string;
  apellidos: string;
  dorsal: number | null;
  fecha_nacimiento?: string | null;
  demarcacion?: 'Portero' | 'Defensa' | 'Centrocampista' | 'Delantero' | string | null;
  lateralidad?: 'Diestro' | 'Zurdo' | 'Ambidiestro' | string | null;
  equipo?: string | null;
  foto_jugador?: string | null;
  observaciones?: string | null;
  valoracion?: 'Selección' | 'Seguir' | 'Interesante' | 'Valorar' | null;
  created_at: string;
};

export type Demarcacion = 'Portero' | 'Defensa' | 'Centrocampista' | 'Delantero';
export type Lateralidad = 'Diestro' | 'Zurdo' | 'Ambidiestro';

export type Equipo = {
  id: string;
  nombre: string;
  escudo_url: string | null;
  created_at?: string;
};

export type MatchEvent = {
  id: string;
  timestamp: string;
  tipo: 'gol_favor' | 'ocasion_contra';
  descripcion: string;
  time_seconds: number;
};

export type Partido = {
  id: string;
  equipo_rival_id: string | null;
  nombre_rival?: string | null;
  fecha: string;
  analisis_ofensivo: string | null;
  analisis_defensivo: string | null;
  analisis_transiciones: string | null;
  video_rival_url: string | null;
  slides_url: string | null;
  video_plan_url: string | null;
  video_eventos_url: string | null;
  eventos: MatchEvent[];
  formacion?: string | null;
  alineacion?: Record<string, string> | null;
  created_at?: string;
};
