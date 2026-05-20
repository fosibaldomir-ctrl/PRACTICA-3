# Fútbol Team Manager

Aplicación profesional para la gestión de plantillas de fútbol.

## Características
- Autenticación con Supabase Auth.
- Base de datos en tiempo real con Supabase Firestore (PostgreSQL).
- Almacenamiento de imágenes en Supabase Storage.
- Interfaz moderna y responsive diseñada para tablets y ordenadores.

## Configuración
1. Crea un proyecto en [Supabase](https://supabase.com/).
2. Ejecuta el contenido de `supabase_setup.sql` en el Editor SQL de Supabase.
3. Crea un bucket llamado `jugadores` en Supabase Storage y hazlo público (o ajusta las políticas).
4. Configura las variables de entorno en un archivo `.env` basadas en `.env.example`.

## Desarrollo
```bash
npm install
npm run dev
```

## Producción
```bash
npm run build
npm start
```
