"use client";

import React, { useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Trophy, Printer, X, Award, Star, ShieldCheck } from "lucide-react";

interface CertificateModalProps {
  userName: string;
  rank: number;
  xp: number;
  onClose: () => void;
}

export default function CertificateModal({ userName, rank, xp, onClose }: CertificateModalProps) {
  const certificateRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const printContent = certificateRef.current;
    const windowUrl = 'about:blank';
    const uniqueName = new Date();
    const windowName = 'Print' + uniqueName.getTime();
    const printWindow = window.open(windowUrl, windowName, 'left=50000,top=50000,width=0,height=0');

    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>ClassCrib Achievement Certificate</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap" rel="stylesheet">
            <style>
              body { font-family: 'Inter', sans-serif; }
              @media print {
                .no-print { display: none; }
                body { margin: 0; padding: 0; }
              }
            </style>
          </head>
          <body class="bg-white p-0">
            ${printContent?.innerHTML}
            <script>
              window.onload = () => {
                window.print();
                window.close();
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-card border border-card-border rounded-[2.5rem] shadow-2xl w-full max-w-4xl overflow-hidden"
      >
        <div className="p-6 border-b border-card-border flex justify-between items-center bg-primary/5">
          <h3 className="font-black text-primary uppercase tracking-widest text-xs flex items-center gap-2">
            <Award className="w-4 h-4" /> Achievement Certificate
          </h3>
          <div className="flex gap-3">
            <button 
              onClick={handlePrint}
              className="px-6 py-2 bg-primary text-white rounded-xl font-black uppercase tracking-widest text-[10px] flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-primary/20"
            >
              <Printer className="w-4 h-4" /> Print Certificate
            </button>
            <button 
              onClick={onClose}
              className="w-10 h-10 rounded-xl bg-card-hover text-text-secondary flex items-center justify-center hover:bg-red-500/10 hover:text-red-500 transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-12 bg-white" ref={certificateRef}>
          <div className="border-[12px] border-double border-primary/20 p-8 rounded-[2rem] relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-secondary/5 rounded-full blur-3xl" />

            <div className="relative z-10 text-center space-y-10 py-10">
              <div className="flex justify-center">
                 <div className="w-24 h-24 bg-primary/10 rounded-3xl flex items-center justify-center border border-primary/20">
                    <Trophy className="w-12 h-12 text-primary" />
                 </div>
              </div>

              <div className="space-y-4">
                <h1 className="text-5xl font-black text-academy-navy tracking-tighter uppercase">Certificate of Excellence</h1>
                <p className="text-xl font-bold text-text-secondary italic">This honor is proudly presented to</p>
              </div>

              <div className="py-6 border-b-4 border-primary/10 max-w-lg mx-auto">
                <h2 className="text-6xl font-black text-primary tracking-tighter uppercase">{userName}</h2>
              </div>

              <div className="space-y-6">
                <p className="text-lg font-bold text-text-secondary max-w-xl mx-auto leading-relaxed">
                  For outstanding academic performance and exceptional dedication to personal growth 
                  within the ClassCrib ecosystem. Achieving a global rank of <span className="text-primary font-black">#{rank}</span> 
                  with a total of <span className="text-primary font-black">${xp.toLocaleString()} XP</span>.
                </p>
              </div>

              <div className="flex justify-between items-end pt-12 px-12">
                <div className="text-left space-y-2">
                  <div className="w-40 border-b-2 border-academy-navy/20 h-10" />
                  <p className="text-[10px] font-black text-academy-navy uppercase tracking-widest">Academy Director</p>
                </div>
                
                <div className="flex flex-col items-center gap-2">
                   <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center border-4 border-white shadow-xl">
                      <ShieldCheck className="w-8 h-8 text-primary" />
                   </div>
                   <p className="text-[10px] font-black text-primary uppercase tracking-widest">Verified Digital Award</p>
                </div>

                <div className="text-right space-y-2">
                  <p className="text-lg font-black text-academy-navy">{new Date().toLocaleDateString()}</p>
                  <p className="text-[10px] font-black text-academy-navy uppercase tracking-widest">Date Issued</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
