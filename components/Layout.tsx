
import React from 'react';
import { Icons } from '../constants';
import { ViewState } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  currentView: ViewState;
  setView: (view: ViewState) => void;
}

const NavItem: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  active: boolean; 
  onClick: () => void 
}> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`flex flex-col items-center justify-center space-y-1 transition-all duration-300 ${
      active ? 'text-[#BF953F] scale-110' : 'text-slate-400 hover:text-white'
    }`}
  >
    <div className={`${active ? 'drop-shadow-[0_0_8px_rgba(191,149,63,0.8)]' : ''}`}>
      {icon}
    </div>
    <span className="text-[10px] uppercase tracking-widest font-medium">{label}</span>
  </button>
);

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView }) => {
  return (
    <div className="min-h-screen bg-night text-slate-100 flex flex-col">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/40 backdrop-blur-md border-b border-[#BF953F]/20 px-6 py-4 flex justify-between items-center">
        <div 
          className="flex items-center space-x-2 cursor-pointer" 
          onClick={() => setView('HOME')}
        >
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#BF953F] to-[#AA771C] flex items-center justify-center shadow-[0_0_15px_rgba(191,149,63,0.4)]">
            <span className="text-black font-bold text-xl">D</span>
          </div>
          <span className="gold-text text-xl tracking-tighter font-serif uppercase">Divino Designer</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-8">
          <button onClick={() => setView('HOME')} className={`text-sm uppercase tracking-widest hover:text-[#BF953F] transition-colors ${currentView === 'HOME' ? 'text-[#BF953F]' : ''}`}>Início</button>
          <button onClick={() => setView('CREATE')} className={`text-sm uppercase tracking-widest hover:text-[#BF953F] transition-colors ${currentView === 'CREATE' ? 'text-[#BF953F]' : ''}`}>Criar</button>
          <button onClick={() => setView('INSPIRE')} className={`text-sm uppercase tracking-widest hover:text-[#BF953F] transition-colors ${currentView === 'INSPIRE' ? 'text-[#BF953F]' : ''}`}>Inspirar</button>
          <button onClick={() => setView('VOICE')} className={`text-sm uppercase tracking-widest hover:text-[#BF953F] transition-colors ${currentView === 'VOICE' ? 'text-[#BF953F]' : ''}`}>Voz</button>
          <button onClick={() => setView('GALLERY')} className={`text-sm uppercase tracking-widest hover:text-[#BF953F] transition-colors ${currentView === 'GALLERY' ? 'text-[#BF953F]' : ''}`}>Galeria</button>
        </nav>

        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setView('LOGIN')}
            className="px-4 py-1.5 rounded-full border border-[#BF953F] text-[#BF953F] text-xs uppercase tracking-widest hover:bg-[#BF953F] hover:text-black transition-all"
          >
            Acessar
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pt-24 pb-24 md:pb-12 px-4 md:px-8">
        <div className="max-w-6xl mx-auto">
          {children}
        </div>
      </main>

      {/* Mobile Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-xl border-t border-[#BF953F]/20 h-20 flex items-center justify-around px-2">
        <NavItem icon={<Icons.Home />} label="Início" active={currentView === 'HOME'} onClick={() => setView('HOME')} />
        <NavItem icon={<Icons.Create />} label="Criar" active={currentView === 'CREATE'} onClick={() => setView('CREATE')} />
        <NavItem icon={<Icons.Inspire />} label="Inspirar" active={currentView === 'INSPIRE'} onClick={() => setView('INSPIRE')} />
        <NavItem icon={<Icons.Voice />} label="Voz" active={currentView === 'VOICE'} onClick={() => setView('VOICE')} />
        <NavItem icon={<Icons.Gallery />} label="Galeria" active={currentView === 'GALLERY'} onClick={() => setView('GALLERY')} />
      </nav>
    </div>
  );
};
