-- SQL for Supabase Setup

-- 1. Create the jugadores table
CREATE TABLE IF NOT EXISTS jugadores (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    nombre TEXT NOT NULL,
    apellidos TEXT NOT NULL,
    dorsal INTEGER,
    fecha_nacimiento DATE,
    demarcacion TEXT,
    lateralidad TEXT,
    equipo TEXT,
    foto_jugador TEXT,
    observaciones TEXT,
    valoracion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Quick migration to add the column if the table already existed and lacks it
ALTER TABLE jugadores ADD COLUMN IF NOT EXISTS valoracion TEXT;

-- 2. Enable Row Level Security (RLS)
ALTER TABLE jugadores ENABLE ROW LEVEL SECURITY;

-- 3. Create policies (Allow all for authenticated users, read-only for public if desired)
-- Adjust based on security requirements
CREATE POLICY "Allow all for authenticated users" ON jugadores
FOR ALL TO authenticated
USING (true)
WITH CHECK (true);

-- 4. Storage Setup for bucket 'jugadores'
-- Create the bucket if it doesn't exist and make it public
INSERT INTO storage.buckets (id, name, public)
VALUES ('jugadores', 'jugadores', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for the 'jugadores' bucket
-- Allow public to read images
CREATE POLICY "Public Read Access"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'jugadores' );

-- Allow authenticated users to upload (Insert)
CREATE POLICY "Authenticated Insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'jugadores' );

-- Allow authenticated users to update their own uploads or all (Update)
CREATE POLICY "Authenticated Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'jugadores' );

-- Allow authenticated users to delete (Delete)
CREATE POLICY "Authenticated Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'jugadores' );

-- Initial sample data (20 players)
INSERT INTO jugadores (nombre, apellidos, dorsal, fecha_nacimiento, demarcacion, lateralidad, equipo, observaciones)
VALUES 
('Iker', 'Casillas', 1, '1981-05-20', 'Portero', 'Diestro', 'Real Madrid', 'Capitán legendario'),
('Sergio', 'Ramos', 4, '1986-03-30', 'Defensa', 'Diestro', 'Sevilla FC', 'Gran rematador de cabeza'),
('Gerard', 'Piqué', 3, '1987-02-02', 'Defensa', 'Diestro', 'FC Barcelona', 'Excelente salida de balón'),
('Jordi', 'Alba', 18, '1989-03-21', 'Defensa', 'Zurdo', 'Inter Miami', 'Lateral muy ofensivo'),
('Xavi', 'Hernández', 6, '1980-01-25', 'Centrocampista', 'Diestro', 'FC Barcelona', 'Visión de juego inigualable'),
('Andrés', 'Iniesta', 8, '1984-05-11', 'Centrocampista', 'Diestro', 'Vissel Kobe', 'Autor del gol del mundial'),
('Sergio', 'Busquets', 5, '1988-07-16', 'Centrocampista', 'Diestro', 'FC Barcelona', 'Equilibrio puro'),
('David', 'Villa', 7, '1981-12-03', 'Delantero', 'Ambidiestro', 'Valencia CF', 'Máximo goleador histórico'),
('Fernando', 'Torres', 9, '1984-03-20', 'Delantero', 'Diestro', 'Atlético de Madrid', 'El Niño'),
('Cesc', 'Fàbregas', 10, '1987-05-04', 'Centrocampista', 'Diestro', 'Arsenal FC', 'Pasador magistral'),
('Xabi', 'Alonso', 14, '1981-11-25', 'Centrocampista', 'Diestro', 'Real Madrid', 'Golpeo de balón excepcional'),
('David', 'Silva', 21, '1986-01-08', 'Centrocampista', 'Zurdo', 'Manchester City', 'Magia en tres cuartos'),
('Juan', 'Mata', 13, '1988-04-28', 'Centrocampista', 'Zurdo', 'Chelsea FC', 'Gran visión y técnica'),
('Carles', 'Puyol', 5, '1978-04-13', 'Defensa', 'Diestro', 'FC Barcelona', 'El Tiburón, corazón puro'),
('Víctor', 'Valdés', 12, '1982-01-14', 'Portero', 'Diestro', 'FC Barcelona', 'Gran juego con los pies'),
('Marcos', 'Senna', 19, '1976-07-17', 'Centrocampista', 'Diestro', 'Villarreal CF', 'Muro en la Euro 2008'),
('Raúl', 'González', 7, '1977-06-27', 'Delantero', 'Zurdo', 'Real Madrid', 'Eterno capitán'),
('Rubén', 'de la Red', 22, '1985-06-05', 'Centrocampista', 'Diestro', 'Real Madrid', 'Gran talento mermado por salud'),
('Álvaro', 'Arbeloa', 17, '1983-01-17', 'Defensa', 'Diestro', 'Real Madrid', 'Defensor polivalente'),
('Santi', 'Cazorla', 20, '1984-12-13', 'Centrocampista', 'Ambidiestro', 'Arsenal FC', 'Técnica exquisita con ambas piernas');
