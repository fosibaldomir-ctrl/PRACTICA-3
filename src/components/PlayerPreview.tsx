import React, { useState } from 'react';
import { X, User, Hash, MapPin, Calendar, Activity, Info, ShieldCheck, Download, Award } from 'lucide-react';
import { motion } from 'motion/react';
import type { Player } from '../types';
import { cn, formatDate } from '../lib/utils';
import { supabase } from '../lib/supabase';
import { jsPDF } from 'jspdf';

interface PlayerPreviewProps {
  player: Player;
  onClose: () => void;
  onRefresh?: () => void;
}

export default function PlayerPreview({ player, onClose, onRefresh }: PlayerPreviewProps) {
  const [currentValuation, setCurrentValuation] = useState<string>(player.valoracion || 'Valorar');
  const [updatingValuation, setUpdatingValuation] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);

  const getBase64ImageFromUrl = (imageUrl: string): Promise<string | null> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.setAttribute('crossOrigin', 'anonymous');
      img.onload = () => {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            const dataURL = canvas.toDataURL('image/jpeg');
            resolve(dataURL);
          } else {
            resolve(null);
          }
        } catch (e) {
          console.error("Error drawing image onto canvas for PDF:", e);
          resolve(null);
        }
      };
      img.onerror = () => {
        resolve(null);
      };
      img.src = imageUrl;
    });
  };

  const handleValuationChange = async (newValuation: 'Selección' | 'Seguir' | 'Interesante' | 'Valorar') => {
    try {
      setUpdatingValuation(true);
      setCurrentValuation(newValuation);

      const { error } = await supabase
        .from('jugadores')
        .update({ valoracion: newValuation })
        .eq('id', player.id);

      if (error) {
        throw error;
      }

      if (onRefresh) {
        onRefresh();
      }
    } catch (e: any) {
      console.error("Error updating player valuation:", e);
      alert(`Error al actualizar valoración: ${e.message}`);
    } finally {
      setUpdatingValuation(false);
    }
  };

  const handleDownloadPdf = async () => {
    try {
      setDownloadingPdf(true);
      const doc = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4'
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();

      const bgDark = [15, 23, 42]; // Slate 900
      const primaryColor = [16, 185, 129]; // Emerald

      // Background Page
      doc.setFillColor(bgDark[0], bgDark[1], bgDark[2]);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      // Borders
      doc.setDrawColor(30, 41, 59); // Slate 800
      doc.setLineWidth(1);
      doc.rect(8, 8, pageWidth - 16, pageHeight - 16, 'D');

      // Top Highlight Line
      doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
      doc.rect(8, 8, pageWidth - 16, 4, 'F');

      // Header Technical title
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      doc.text("FICHA TÉCNICA DE SCOUTING", 16, 25);

      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184); // Slate 400
      doc.setFont('Helvetica', 'normal');
      doc.text("SISTEMA DE ANÁLISIS, SELECCIÓN Y REGISTRO DE TRABAJO TÁCTICO", 16, 31);
      
      // Divider
      doc.setDrawColor(51, 65, 85); // Slate 700
      doc.setLineWidth(0.5);
      doc.line(16, 36, pageWidth - 16, 36);

      // Photo or Visual initials representation
      let imageAttached = false;
      if (player.foto_jugador) {
        const base64Img = await getBase64ImageFromUrl(player.foto_jugador);
        if (base64Img) {
          try {
            doc.setFillColor(30, 41, 59);
            doc.rect(16, 46, 52, 66, 'F');
            doc.addImage(base64Img, 'JPEG', 17, 47, 50, 64);
            imageAttached = true;
          } catch (e) {
            console.error("Failed to append image to PDF:", e);
          }
        }
      }

      if (!imageAttached) {
        doc.setFillColor(30, 41, 59);
        doc.rect(16, 46, 52, 66, 'F');
        doc.setDrawColor(16, 185, 129);
        doc.setLineWidth(1);
        doc.rect(18, 48, 48, 62, 'D');
        
        doc.circle(42, 79, 10, 'S');
        
        const initials = `${player.nombre.charAt(0)}${player.apellidos.charAt(0)}`.toUpperCase();
        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(26);
        doc.setTextColor(255, 255, 255);
        doc.text(initials, 42, 81, { align: 'center' });

        doc.setFontSize(14);
        doc.setTextColor(16, 185, 129);
        doc.text(`#${player.dorsal?.toString().padStart(2, '0') || '??'}`, 42, 92, { align: 'center' });
      }

      // Name & Identification Info
      const colX = 76;
      doc.setTextColor(255, 255, 255);
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(22);
      
      const fullName = `${player.nombre} ${player.apellidos}`.toUpperCase();
      doc.text(fullName, colX, 54);

      doc.setFontSize(11);
      doc.setFont('Helvetica', 'bold');
      doc.setTextColor(16, 185, 129);
      const dorsalText = player.dorsal ? `#${player.dorsal.toString().padStart(2, '0')} ` : '';
      doc.text(`${dorsalText}|  ${player.demarcacion || 'Sin demarcación especificada'}`, colX, 61);

      // Attributes Block
      doc.setFillColor(22, 28, 45);
      doc.rect(colX, 68, 118, 44, 'F');
      doc.setDrawColor(30, 41, 59);
      doc.rect(colX, 68, 118, 44, 'D');

      const drawLabelValue = (x: number, y: number, label: string, value: string) => {
        doc.setFont('Helvetica', 'normal');
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.text(label.toUpperCase(), x, y);

        doc.setFont('Helvetica', 'bold');
        doc.setFontSize(11);
        doc.setTextColor(255, 255, 255);
        doc.text(value, x, y + 5.5);
      };

      drawLabelValue(colX + 6, 76, "Club Actual", player.equipo || 'Sin Equipo');
      drawLabelValue(colX + 65, 76, "Lateralidad", player.lateralidad || 'N/A');
      
      const birthDate = player.fecha_nacimiento ? formatDate(player.fecha_nacimiento) : 'No disponible';
      drawLabelValue(colX + 6, 96, "Fecha Nacimiento", birthDate);

      let ageText = 'N/A';
      if (player.fecha_nacimiento) {
        const age = new Date().getFullYear() - new Date(player.fecha_nacimiento).getFullYear();
        ageText = `${age} Años`;
      }
      drawLabelValue(colX + 65, 96, "Edad Estimada", ageText);

      // Technical Evaluation State Row
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(148, 163, 184);
      doc.text("VALORACIÓN DE SCOUTING EN BASE DE DATOS", 16, 130);

      const val = currentValuation || 'Valorar';
      let badgeColor = [100, 116, 139]; // Default Gray
      if (val === 'Selección') badgeColor = [16, 185, 129];
      if (val === 'Seguir') badgeColor = [14, 165, 233];
      if (val === 'Interesante') badgeColor = [245, 158, 11];

      doc.setFillColor(badgeColor[0], badgeColor[1], badgeColor[2]);
      doc.rect(16, 134, 45, 9, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(9.5);
      doc.setFont('Helvetica', 'bold');
      doc.text(val.toUpperCase(), 38.5, 140, { align: 'center' });

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(148, 163, 184);
      doc.text("Categoría asignada para preselección de jugadores de alto rendimiento.", 68, 140);

      // Scouting notes block
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(148, 163, 184);
      doc.text("OBSERVACIONES TÉCNICAS Y REPORTE RECOPILADO", 16, 160);

      doc.setFillColor(22, 28, 45);
      doc.rect(16, 164, 178, 80, 'F');
      doc.setDrawColor(30, 41, 59);
      doc.rect(16, 164, 178, 80, 'D');

      doc.setFont('Helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(226, 232, 240);
      
      const splittedText = doc.splitTextToSize(
        player.observaciones || "No se han ingresado observaciones del jugador en el archivo de scouting todavía.", 
        166
      );
      doc.text(splittedText, 22, 174);

      // Bottom Signature
      doc.setDrawColor(30, 41, 59);
      doc.setLineWidth(0.5);
      doc.line(16, 264, pageWidth - 16, 264);

      doc.setFontSize(8);
      doc.setTextColor(100, 116, 139);
      doc.text("SISTEMA DE ANÁLISIS INTELIGENTE - AI SCOUT STUDIO", 16, 272);
      
      const currentDateString = new Date().toLocaleDateString('es-ES', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      });
      doc.text(`Generado: ${currentDateString}`, pageWidth - 16, 272, { align: 'right' });

      const docName = `Ficha_${player.nombre}_${player.apellidos}.pdf`.replace(/\s+/g, '_');
      doc.save(docName);
    } catch (error: any) {
      console.error("Error creating scouting PDF report:", error);
      alert(`Error al generar el PDF: ${error.message}`);
    } finally {
      setDownloadingPdf(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="glass w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-white/10"
      >
        <header className="p-8 pb-4 flex justify-between items-start border-b border-white/5 bg-white/5">
          <div className="flex items-center gap-4">
             <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h3 className="text-3xl font-black text-white tracking-tight uppercase">
                Ficha Técnica
              </h3>
              <p className="text-emerald-400 font-bold text-xs uppercase tracking-widest">Información de Scouting</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-500 hover:text-white">
            <X size={28} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-8 scrollbar-hide bg-slate-900/40">
          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-56 h-72 rounded-3xl overflow-hidden glass border border-white/20 shadow-2xl shrink-0">
              {player.foto_jugador ? (
                <img src={player.foto_jugador} alt={player.nombre} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-700">
                  <User size={80} strokeWidth={1} />
                </div>
              )}
            </div>
            
            <div className="flex-1 space-y-6">
              <div>
                <h4 className="text-4xl font-black text-white leading-none tracking-tighter mb-1">
                  {player.nombre} {player.apellidos}
                </h4>
                <div className="flex items-center gap-2">
                   <span className="text-2xl font-mono font-black text-emerald-400">#{player.dorsal?.toString().padStart(2, '0') || '??'}</span>
                   <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">| {player.demarcacion}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Activity size={12} className="text-emerald-400" /> Lateralidad
                  </p>
                  <p className="text-lg font-bold text-white">{player.lateralidad || 'N/A'}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <Calendar size={12} className="text-emerald-400" /> Nacimiento
                  </p>
                  <p className="text-lg font-bold text-white">{formatDate(player.fecha_nacimiento)}</p>
                </div>
                <div className="col-span-2 bg-white/5 p-4 rounded-2xl border border-white/5">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 flex items-center gap-2">
                    <MapPin size={12} className="text-emerald-400" /> Club Actual
                  </p>
                  <p className="text-lg font-bold text-white">{player.equipo || 'Sin Equipo'}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Valuation Area */}
          <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-4">
             <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-emerald-400">
                   <Award size={18} />
                   <h5 className="text-xs font-black uppercase tracking-widest">Valoración scouting técnico</h5>
                </div>
                {updatingValuation && (
                  <span className="text-[10px] uppercase font-bold text-emerald-400 animate-pulse tracking-wider">Guardando valoración online...</span>
                )}
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
                {[
                  { id: 'Selección', label: '⭐ Selección', activeStyle: 'bg-emerald-600/95 text-white border-emerald-500 shadow-lg shadow-emerald-500/20 font-black' },
                  { id: 'Seguir', label: '🔍 Seguir', activeStyle: 'bg-blue-600/95 text-white border-blue-500 shadow-lg shadow-blue-500/20 font-black' },
                  { id: 'Interesante', label: '💡 Interesante', activeStyle: 'bg-amber-600/95 text-white border-amber-500 shadow-lg shadow-amber-500/20 font-black' },
                  { id: 'Valorar', label: '📋 Valorar', activeStyle: 'bg-slate-700/95 text-white border-slate-600 shadow-lg shadow-slate-500/20 font-black' }
                ].map((item) => {
                  const isActive = currentValuation === item.id;
                  return (
                    <button
                      key={item.id}
                      disabled={updatingValuation}
                      onClick={() => handleValuationChange(item.id as any)}
                      className={cn(
                        "py-3 px-4 border text-center text-xs font-semibold rounded-xl transition-all select-none duration-150 transform active:scale-[0.98] disabled:opacity-50 cursor-pointer",
                        isActive 
                          ? item.activeStyle 
                          : "bg-white/5 hover:bg-white/10 text-slate-400 border-white/5 hover:border-white/10"
                      )}
                    >
                      {item.label}
                    </button>
                  );
                })}
             </div>
          </div>

          <div className="bg-white/5 p-6 rounded-3xl border border-white/5 space-y-3">
             <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <Info size={16} />
                <h5 className="text-xs font-black uppercase tracking-widest">Observaciones de Scouting</h5>
             </div>
             <p className="text-slate-300 leading-relaxed italic">
               {player.observaciones || "No se han registrado observaciones técnicas adicionales para este jugador."}
             </p>
          </div>

          <div className="pt-4 pb-8 flex flex-col sm:flex-row justify-center items-center gap-4">
             <button
                disabled={downloadingPdf}
                onClick={handleDownloadPdf}
                className="w-full sm:w-auto px-10 py-4 bg-emerald-600/90 hover:bg-emerald-500 active:scale-95 disabled:bg-emerald-950/70 disabled:text-emerald-600 disabled:scale-100 disabled:cursor-not-allowed border border-emerald-500/40 rounded-2xl font-black text-white text-xs uppercase tracking-[0.2em] transition-all shadow-xl shadow-emerald-950/40 flex items-center justify-center gap-2 cursor-pointer duration-150"
              >
                {downloadingPdf ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin"></span>
                    <span>Generando Reporte PDF...</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Descargar PDF</span>
                  </>
                )}
              </button>
             <button
                onClick={onClose}
                className="w-full sm:w-auto px-10 py-4 bg-white/5 hover:bg-white/10 active:scale-95 border border-white/5 rounded-2xl font-black text-slate-300 text-xs uppercase tracking-[0.2em] transition-all shadow-xl cursor-pointer duration-150"
              >
                Cerrar Perfil
              </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
