export type Player = {
  id: string;
  nombre: string;
  apellidos: string;
  dorsal: number | null;
  fecha_nacimiento: string | null;
  demarcacion: 'Portero' | 'Defensa' | 'Centrocampista' | 'Delantero' | string | null;
  lateralidad: 'Diestro' | 'Zurdo' | 'Ambidiestro' | string | null;
  equipo: string | null;
  foto_jugador: string | null;
  observaciones: string | null;
  valoracion?: 'Selección' | 'Seguir' | 'Interesante' | 'Valorar' | null;
  created_at: string;
};

export type Demarcacion = 'Portero' | 'Defensa' | 'Centrocampista' | 'Delantero';
export type Lateralidad = 'Diestro' | 'Zurdo' | 'Ambidiestro';
