import React, { useState, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { Upload, X, Loader2, Camera } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface ImageUploadProps {
  currentImageUrl?: string | null;
  onUpload: (url: string) => void;
  className?: string;
}

export default function ImageUpload({ currentImageUrl, onUpload, className }: ImageUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) {
        return;
      }

      const file = event.target.files[0];
      
      // PREVIA LOCAL CON BASE64 (Más compatible con iFrames)
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);

      setUploading(true);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random()}_${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`; // Subimos a la raíz del bucket jugadores

      // Subida a Supabase
      const { error: uploadError } = await supabase.storage
        .from('jugadores')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        if (uploadError.message.includes('row-level security')) {
          throw new Error('Sin permisos para subir: ejecuta el SQL de políticas que te he dado en Supabase.');
        }
        if (uploadError.message.includes('bucket not found')) {
          throw new Error('El bucket "jugadores" no existe. Créalo en Storage > New Bucket en Supabase.');
        }
        throw uploadError;
      }

      // Obtener URL Pública
      const { data: { publicUrl } } = supabase.storage
        .from('jugadores')
        .getPublicUrl(filePath);

      onUpload(publicUrl);
    } catch (error: any) {
      console.error('Error detallado:', error);
      alert(`Error en la carga: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const removeImage = () => {
    setPreview(null);
    onUpload('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div 
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={cn(
          "relative group cursor-pointer w-40 h-40 rounded-[2rem] overflow-hidden border-2 border-dashed transition-all bg-white/5 flex items-center justify-center",
          preview ? "border-transparent shadow-2xl" : "border-white/10 hover:border-emerald-500 hover:bg-emerald-500/5 group"
        )}
      >
        {preview ? (
          <>
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity backdrop-blur-sm">
              <Camera className="text-white" size={36} />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-slate-500 transition-colors group-hover:text-emerald-400">
            {uploading ? (
              <Loader2 className="animate-spin text-emerald-400" size={32} />
            ) : (
              <>
                <Upload size={36} strokeWidth={1.5} />
                <span className="text-[10px] font-black uppercase tracking-widest px-4 text-center">Firma Visual</span>
              </>
            )}
          </div>
        )}
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleUpload}
        accept="image/*"
        className="hidden"
        disabled={uploading}
      />

      {preview && !uploading && (
        <button
          onClick={removeImage}
          className="text-[10px] font-black uppercase tracking-widest text-red-400/60 hover:text-red-400 flex items-center gap-2 transition-colors"
        >
          <X size={14} />
          <span>Remover Archivo</span>
        </button>
      )}
    </div>
  );
}
