
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { ViewState, UnctionStyle, PreacherImage, DesignMode, DesignProject, StructuredInspiration } from './types';
import { generateDesign, getInspiration, refinePoster } from './services/geminiService';
import { Icons, COLORS } from './constants';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';

const BRAND_YELLOW = '#FFDB00';

const PALETTES = [
  { name: 'DOURADO', colors: 'linear-gradient(to right, #BF953F, #FCF6BA, #B38728)' },
  { name: 'PRATA', colors: 'linear-gradient(to right, #757F9A, #D7DDE8)' },
  { name: 'BRONZE', colors: 'linear-gradient(to right, #804A00, #D1913C)' },
  { name: 'ESMERALDA', colors: 'linear-gradient(to right, #004d40, #00251a)' },
  { name: 'ROXO', colors: 'linear-gradient(to right, #4b1248, #701c6e)' },
  { name: 'AZUL NOITE', colors: 'linear-gradient(to right, #020617, #1e293b)' },
  { name: 'VINHO', colors: 'linear-gradient(to right, #4c0519, #881337)' },
  { name: 'ROSA', colors: 'linear-gradient(to right, #831843, #be185d)' },
  { name: 'OURO VERDE', colors: 'linear-gradient(to right, #166534, #14532d)' },
  { name: 'OURO VELHO', colors: 'linear-gradient(to right, #713f12, #a16207)' },
  { name: 'CIANO', colors: 'linear-gradient(to right, #083344, #155e75)' },
  { name: 'TERRA', colors: 'linear-gradient(to right, #422006, #78350f)' },
];

const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClear: () => void }> = ({ message, type, onClear }) => {
  useEffect(() => {
    const timer = setTimeout(onClear, 4000);
    return () => clearTimeout(timer);
  }, [onClear]);

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-[200] animate-in slide-in-from-bottom duration-300">
      <div className={`px-6 py-3 rounded-full border shadow-2xl backdrop-blur-md flex items-center gap-3 ${
        type === 'success' ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-red-500/10 border-red-500/50 text-red-400'
      }`}>
        <div className={`w-2 h-2 rounded-full animate-pulse ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}></div>
        <span className="text-xs font-bold uppercase tracking-widest">{message}</span>
      </div>
    </div>
  );
};

const QuotaAlert: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
  <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md p-6">
    <div className="max-w-md w-full bg-[#0f172a] border border-[#BF953F]/40 rounded-[2rem] p-10 text-center space-y-6 shadow-[0_0_50px_rgba(191,149,63,0.2)]">
      <div className="text-4xl">💎</div>
      <h3 className="text-2xl font-serif text-white uppercase tracking-tight">Limite de Glória Atingido</h3>
      <p className="text-slate-400 text-sm leading-relaxed">
        A cota gratuita do Divino Designer foi temporariamente esgotada. Para continuar manifestando sua visão agora, selecione uma chave de API de um projeto com faturamento ativo.
      </p>
      <div className="space-y-4">
        <button 
          onClick={async () => {
            await window.aistudio.openSelectKey();
            onRetry();
          }}
          className="w-full gold-button py-4 rounded-xl text-black font-bold uppercase tracking-widest text-xs"
        >
          Selecionar Minha Chave
        </button>
        <a 
          href="https://ai.google.dev/gemini-api/docs/billing" 
          target="_blank" 
          rel="noopener noreferrer"
          className="block text-[10px] text-slate-500 uppercase tracking-widest hover:text-[#BF953F] transition-colors"
        >
          Saiba mais sobre faturamento (billing)
        </a>
      </div>
    </div>
  </div>
);

const Home: React.FC<{ onStart: () => void, onInspire: () => void }> = ({ onStart, onInspire }) => (
  <div className="flex flex-col items-center justify-center min-h-[70vh] text-center px-4 space-y-8 animate-in fade-in duration-1000">
    <div className="space-y-4">
      <h2 className="text-[#BF953F] uppercase tracking-[0.3em] text-sm font-semibold opacity-80">Design para o Reino</h2>
      <h1 className="text-4xl md:text-7xl font-serif text-white max-w-4xl leading-tight">
        Expresse a <span className="gold-text italic">Glória de Deus</span> através da arte.
      </h1>
      <p className="text-slate-400 max-w-2xl mx-auto text-lg leading-relaxed">
        Crie artes cristãs modernas, edite imagens com propósito e tenha conversas inspiradoras. Uma ferramenta premium para igrejas, ministérios e criativos do Reino.
      </p>
    </div>
    
    <div className="flex flex-col sm:flex-row gap-4 pt-4">
      <button 
        onClick={onStart}
        className="gold-button px-10 py-4 rounded-full text-black font-bold uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(191,149,63,0.3)]"
      >
        CRIAR NOVA ARTE
      </button>
      <button 
        onClick={onInspire}
        className="px-10 py-4 rounded-full border border-[#BF953F] text-[#BF953F] font-bold uppercase tracking-widest text-sm hover:bg-[#BF953F]/10 transition-all"
      >
        CONVERSAR AGORA
      </button>
    </div>
  </div>
);

const CreateView: React.FC<{ onResults: (urls: {url: string, ratio: string}[]) => void, onQuotaExhausted: () => void, addToast: (msg: string, type: 'success' | 'error') => void }> = ({ onResults, onQuotaExhausted, addToast }) => {
  const [loading, setLoading] = useState(false);
  const [generatingSlogan, setGeneratingSlogan] = useState(false);
  const [mode, setMode] = useState<DesignMode>('SINGLE');
  const [visualAtmosphere, setVisualAtmosphere] = useState('');
  const [selectedStyle, setSelectedStyle] = useState<UnctionStyle>(UnctionStyle.CINEMATOGRAPHIC);
  const [selectedPalette, setSelectedPalette] = useState('DOURADO');
  const [preachers, setPreachers] = useState<PreacherImage[]>([]);
  const [logo, setLogo] = useState<string | null>(null);

  const [institution, setInstitution] = useState('');
  const [eventTheme, setEventTheme] = useState('');
  const [info, setInfo] = useState('');
  const [local, setLocal] = useState('');
  const [biblicalSlogan, setBiblicalSlogan] = useState('');

  const generateBiblicalSlogan = async () => {
    if (!eventTheme) {
      addToast("Informe o Tema para gerar um slogan.", "error");
      return;
    }
    setGeneratingSlogan(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Gere uma frase de efeito ou versículo bíblico curto e poderoso para um cartaz de igreja com o tema: "${eventTheme}". Responda apenas com a frase ou versículo, de forma impactante.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });
      setBiblicalSlogan(response.text || '');
      addToast("Inspiração celestial recebida!", "success");
    } catch (err) {
      addToast("Falha ao buscar inspiração.", "error");
    } finally {
      setGeneratingSlogan(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setLogo(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach((file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const newPreacher: PreacherImage = {
            id: Math.random().toString(36).slice(2, 11),
            url: reader.result as string,
            isPrincipal: preachers.length === 0,
            name: '',
          };
          setPreachers(prev => [...prev, newPreacher].slice(0, 6));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const updatePreacherName = (id: string, name: string) => {
    setPreachers(prev => prev.map(p => p.id === id ? { ...p, name } : p));
  };

  const removePreacher = (id: string) => {
    setPreachers(prev => prev.filter(p => p.id !== id));
  };

  const handleGenerate = async () => {
    if (!eventTheme) {
      addToast("Informe o TEMA do evento.", "error");
      return;
    }
    setLoading(true);
    try {
      const designInstructions = `
        DADOS DO CARTAZ:
        - INSTITUIÇÃO: "${institution}"
        - TÍTULO/TEMA: "${eventTheme}"
        - NOMES DOS PREGADORES: ${preachers.map(p => p.name || 'Convidado').join(', ')}
        - SLOGAN: "${biblicalSlogan}"
        - DATA/HORA: "${info}"
        - LOCAL: "${local}"
        - ATMOSFERA: ${visualAtmosphere}
        - PALETA: ${selectedPalette}
      `;
      
      const ratios: ("1:1" | "9:16" | "3:4")[] = ["1:1", "9:16", "3:4"];
      
      const promises = ratios.map(async (ratio) => {
        const url = await generateDesign(
          designInstructions, 
          selectedStyle, 
          ratio,
          preachers,
          logo || undefined
        );
        return { url, ratio };
      });

      const results = await Promise.all(promises);
      onResults(results);
    } catch (err: any) {
      if (err.message === "QUOTA_EXHAUSTED") {
        onQuotaExhausted();
      } else {
        addToast("Erro na manifestação da arte.", "error");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom duration-700">
      <div className="text-center space-y-4">
        <div className="flex justify-center mb-6">
          <div className="bg-white/5 border border-white/10 rounded-full p-1 flex">
            <button 
              onClick={() => setMode('SINGLE')}
              className={`px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${mode === 'SINGLE' ? 'bg-[#BF953F] text-black' : 'text-slate-400'}`}
            >
              ARTE INDIVIDUAL
            </button>
            <button 
              onClick={() => setMode('MULTI_COMPOSITION')}
              className={`px-6 py-2 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${mode === 'MULTI_COMPOSITION' ? 'bg-[#BF953F] text-black' : 'text-slate-400'}`}
            >
              COMPOSIÇÃO DE ELENCO
            </button>
          </div>
        </div>
        <h2 className="text-4xl md:text-5xl font-serif text-white uppercase italic tracking-tighter">
          Compor <span className="gold-text">Arte Profética</span>
        </h2>
        <div className="w-12 h-1 bg-[#BF953F]/60 mx-auto rounded-full mt-2"></div>
      </div>

      <div className="bg-[#111827]/60 border border-white/5 rounded-3xl overflow-hidden celestial-glow p-8 space-y-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-[#BF953F] uppercase tracking-widest">INSTITUIÇÃO</label>
            <input
              type="text"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-[#BF953F]/30 transition-all placeholder:text-slate-700 shadow-inner"
              placeholder="Ex: Templo Batista da Glória"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-[#BF953F] uppercase tracking-widest">TEMA</label>
            <input
              type="text"
              value={eventTheme}
              onChange={(e) => setEventTheme(e.target.value)}
              className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-[#BF953F]/30 transition-all placeholder:text-slate-700 shadow-inner"
              placeholder="Ex: Noite de Milagres"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-[#BF953F] uppercase tracking-widest">INFO</label>
            <input
              type="text"
              value={info}
              onChange={(e) => setInfo(e.target.value)}
              className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-[#BF953F]/30 transition-all placeholder:text-slate-700 shadow-inner"
              placeholder="Ex: 20 de Janeiro, às 19h"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-bold text-[#BF953F] uppercase tracking-widest">LOCAL</label>
            <input
              type="text"
              value={local}
              onChange={(e) => setLocal(e.target.value)}
              className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-[#BF953F]/30 transition-all placeholder:text-slate-700 shadow-inner"
              placeholder="Ex: Rua da Paz, 123"
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center mb-1">
            <label className="block text-[10px] font-bold text-[#BF953F] uppercase tracking-widest">SLOGAN BÍBLICO</label>
            <button 
              onClick={generateBiblicalSlogan}
              disabled={generatingSlogan}
              className="text-[9px] uppercase tracking-widest text-[#BF953F] hover:text-white transition-colors font-bold flex items-center gap-1 group"
            >
              <span className="group-hover:scale-125 transition-transform"><Icons.Inspire /></span>
              {generatingSlogan ? 'Gerando...' : 'Gerar Inspiração'}
            </button>
          </div>
          <input
            type="text"
            value={biblicalSlogan}
            onChange={(e) => setBiblicalSlogan(e.target.value)}
            className="w-full bg-black border border-white/5 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-[#BF953F]/30 transition-all placeholder:text-slate-700 italic shadow-inner"
            placeholder="Corações rendidos, céus abertos"
          />
        </div>

        <div className="flex flex-col md:flex-row gap-8 items-start border-t border-white/5 pt-8">
          <div className="space-y-4">
            <label className="block text-[10px] font-bold text-[#BF953F] uppercase tracking-widest">LOGO MINISTERIAL</label>
            <div className="w-32 aspect-square">
              {logo ? (
                <div className="relative w-full h-full rounded-2xl overflow-hidden border border-[#BF953F]/30 bg-white/5">
                  <img src={logo} className="w-full h-full object-contain p-2" alt="Logo" />
                  <button 
                    onClick={() => setLogo(null)}
                    className="absolute -top-1 -right-1 w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-red-700 transition-colors z-10"
                  >
                    <span className="text-lg leading-none rotate-45">+</span>
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full h-full border border-dashed border-white/10 rounded-2xl bg-black hover:border-[#BF953F]/30 cursor-pointer transition-all group">
                  <Icons.Plus />
                  <span className="text-[9px] uppercase tracking-widest text-slate-500 mt-2 font-bold group-hover:text-[#BF953F]">SUBIR LOGO</span>
                  <input type="file" className="hidden" onChange={handleLogoUpload} />
                </label>
              )}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <label className="block text-[10px] font-bold text-[#BF953F] uppercase tracking-widest">IMAGENS DE REFERÊNCIA / PREGADORES</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {preachers.map((img) => (
                <div key={img.id} className="flex flex-col space-y-2">
                  <div className="relative aspect-square bg-white rounded-2xl p-1 shadow-lg group">
                    <img src={img.url} className="w-full h-full object-cover rounded-xl" alt="Referência" />
                    <button 
                      onClick={() => removePreacher(img.id)}
                      className="absolute -top-2 -right-2 w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-white shadow-md hover:bg-red-700 transition-colors z-10"
                    >
                      <span className="text-xl leading-none rotate-45">+</span>
                    </button>
                  </div>
                  <input 
                    type="text"
                    value={img.name || ''}
                    onChange={(e) => updatePreacherName(img.id, e.target.value)}
                    placeholder="Nome"
                    className="w-full bg-black border border-white/10 rounded-lg p-2 text-[10px] text-white focus:outline-none focus:border-[#BF953F]/30 placeholder:text-slate-800"
                  />
                </div>
              ))}
              {preachers.length < 6 && (
                <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-white/10 rounded-2xl bg-black hover:border-[#BF953F]/30 cursor-pointer transition-all group">
                  <Icons.Plus />
                  <span className="text-[10px] uppercase tracking-widest text-slate-500 mt-2 font-bold group-hover:text-[#BF953F]">ADICIONAR</span>
                  <input type="file" multiple className="hidden" onChange={handleImageUpload} />
                </label>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 pt-4 border-t border-white/5 text-center">
          <label className="block text-[10px] font-bold text-[#BF953F] uppercase tracking-[0.2em]">AMBIENTE VISUAL DA GLÓRIA</label>
          <textarea
            value={visualAtmosphere}
            onChange={(e) => setVisualAtmosphere(e.target.value)}
            className="w-full bg-black border border-white/5 rounded-2xl p-6 text-white text-sm focus:outline-none focus:border-[#BF953F]/30 transition-all h-20 resize-none placeholder:text-slate-800"
            placeholder="Ex: 'Fundo escuro profundo, partículas douradas, iluminação dramática'..."
          />
        </div>

        <div className="space-y-6">
          <label className="block text-center text-[10px] font-bold text-[#BF953F] uppercase tracking-[0.2em]">ESTILOS DE UNÇÃO</label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {Object.values(UnctionStyle).map(style => {
              const isActive = selectedStyle === style;
              return (
                <button
                  key={style}
                  onClick={() => setSelectedStyle(style)}
                  className={`px-4 py-4 rounded-xl text-[10px] uppercase tracking-tighter font-bold transition-all duration-300 border ${
                    isActive 
                      ? 'bg-[#BF953F] text-black border-transparent shadow-[0_0_15px_rgba(255,219,0,0.4)]'
                      : 'bg-black text-slate-500 border-white/5 hover:border-white/20'
                  }`}
                >
                  {style}
                </button>
              );
            })}
          </div>
        </div>

        <div className="space-y-6 pt-4 border-t border-white/5">
          <label className="block text-center text-[10px] font-bold text-[#BF953F] uppercase tracking-[0.2em]">IDENTIDADE CROMÁTICA</label>
          <div className="grid grid-cols-7 gap-3">
            {PALETTES.map(p => (
              <button
                key={p.name}
                onClick={() => setSelectedPalette(p.name)}
                className={`w-full aspect-[2/1] rounded-lg transition-all ${selectedPalette === p.name ? 'ring-2 ring-white scale-110 shadow-[0_0_10px_rgba(255,255,255,0.4)]' : 'opacity-60 hover:opacity-100'}`}
                style={{ background: p.colors }}
                title={p.name}
              />
            ))}
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={loading}
          className={`w-full py-5 rounded-2xl text-black font-serif font-bold uppercase tracking-[0.2em] text-lg transition-all gold-button flex items-center justify-center ${loading ? 'opacity-70 cursor-not-allowed' : 'opacity-100 cursor-pointer'}`}
        >
          {loading ? 'GERANDO CARTAZ PROFETICO' : 'EXECUTAR CARTAZ'}
        </button>
      </div>
    </div>
  );
};

const ResultCard: React.FC<{ initialUrl: string, ratio: string, onSaveToGallery: (url: string) => void, addToast: (msg: string, type: 'success' | 'error') => void }> = ({ initialUrl, ratio, onSaveToGallery, addToast }) => {
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [refineInput, setRefineInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  const handleDownload = async () => {
    try {
      const response = await fetch(currentUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Divino-Designer-${ratio.replace(':','x')}-${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      window.open(currentUrl, '_blank');
    }
  };

  const handleApplyRefine = async () => {
    if (!refineInput) return;
    setLoading(true);
    try {
      const result = await refinePoster(currentUrl, refineInput);
      setCurrentUrl(result);
      setRefineInput('');
      setIsSaved(false);
      addToast("Ajustes proféticos aplicados!", "success");
    } catch (err) {
      addToast("Falha nos ajustes da arte.", "error");
    } finally {
      setLoading(false);
    }
  };

  const saveToGallery = () => {
    onSaveToGallery(currentUrl);
    setIsSaved(true);
    addToast("Arte preservada e guardada com sucesso!", "success");
  };

  return (
    <div className="bg-[#111827]/60 border border-white/5 rounded-[2.5rem] p-6 space-y-6 celestial-glow flex flex-col items-center h-full">
      <div className="w-full aspect-[3/4] flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl relative bg-black border border-[#BF953F]/20">
        <img 
          src={currentUrl} 
          className={`max-w-full max-h-full object-contain transition-all duration-700 ${loading ? 'opacity-30 blur-md scale-95' : 'opacity-100 blur-0 scale-100'}`} 
          alt={`Arte ${ratio}`} 
        />
        <div className="absolute top-4 right-4 text-black bg-[#FFDB00] px-3 py-1 rounded-lg font-bold text-[10px] uppercase tracking-tighter shadow-lg">
          {ratio}
        </div>
        {loading && (
          <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
            <div className="w-12 h-12 border-4 border-[#BF953F] border-t-transparent rounded-full animate-spin"></div>
            <span className="text-[#BF953F] text-[10px] uppercase tracking-widest font-bold animate-pulse">Ajustando...</span>
          </div>
        )}
      </div>
      
      <div className="w-full grid grid-cols-2 gap-3">
        <button 
          onClick={handleDownload}
          className="gold-button py-4 rounded-2xl text-black font-bold uppercase tracking-[0.2em] text-[10px] shadow-xl hover:scale-[1.02] transition-all flex items-center justify-center gap-2"
        >
          <Icons.Download /> BAIXAR
        </button>
        <button 
          onClick={saveToGallery}
          disabled={isSaved}
          className={`py-4 rounded-2xl font-bold uppercase tracking-[0.2em] text-[10px] shadow-xl transition-all border ${isSaved ? 'bg-green-600/20 border-green-500 text-green-500' : 'border-[#BF953F] text-[#BF953F] hover:bg-[#BF953F]/10'}`}
        >
          {isSaved ? 'GUARDADO NA GALERIA' : 'GUARDAR NA GALERIA'}
        </button>
      </div>

      <div className="w-full space-y-4 pt-4 border-t border-white/5">
        <label className="text-[10px] font-bold text-[#BF953F] uppercase tracking-[0.1em] block">REFINAMENTO PROFETICO</label>
        <textarea 
          value={refineInput}
          onChange={(e) => setRefineInput(e.target.value)}
          placeholder="Ex: 'Mudar fundo para azul', 'Aumentar nome do pastor'..." 
          className="w-full h-24 bg-black border border-white/5 rounded-2xl p-4 text-[11px] text-white resize-none placeholder:text-slate-800 focus:outline-none focus:border-[#BF953F]/30 transition-all shadow-inner" 
        />
        <button 
          onClick={handleApplyRefine}
          disabled={loading || !refineInput}
          className={`w-full py-3 rounded-xl text-[10px] uppercase tracking-[0.2em] font-bold transition-all ${loading ? 'bg-white/5 text-slate-600' : 'border border-[#BF953F]/40 text-[#BF953F] hover:bg-[#BF953F]/10'}`}
        >
          {loading ? 'AJUSTANDO...' : 'APLICAR REFINAMENTO'}
        </button>
      </div>
    </div>
  );
};

const EditorView: React.FC<{ results: {url: string, ratio: string}[], onBack: () => void, onSave: (project: DesignProject) => void, addToast: (msg: string, type: 'success' | 'error') => void }> = ({ results, onBack, onSave, addToast }) => {
  return (
    <div className="max-w-6xl mx-auto space-y-12 animate-in zoom-in duration-500 pb-12">
      <div className="flex flex-col md:flex-row justify-between items-center gap-6">
        <h2 className="text-4xl font-serif text-white uppercase italic tracking-tighter">RESULTADOS <span className="gold-text">PROFÉTICOS</span></h2>
        <button onClick={onBack} className="text-[10px] font-bold gold-text uppercase tracking-widest border border-[#BF953F]/30 px-6 py-3 rounded-full hover:bg-[#BF953F]/10 transition-all">NOVO PROJETO</button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {results.map((res, index) => (
          <ResultCard 
            key={index} 
            initialUrl={res.url} 
            ratio={res.ratio} 
            addToast={addToast}
            onSaveToGallery={(url) => onSave({
              id: Math.random().toString(36).substr(2, 9),
              title: 'Arte Profética',
              style: UnctionStyle.CINEMATOGRAPHIC,
              imageUrl: url,
              ratio: res.ratio,
              createdAt: Date.now()
            })}
          />
        ))}
      </div>
    </div>
  );
};

const GalleryView: React.FC<{ 
  savedArts: DesignProject[], 
  savedRevelations: StructuredInspiration[],
  onRemoveArt: (id: string) => void,
  onRemoveRevelation: (id: string) => void
}> = ({ savedArts, savedRevelations, onRemoveArt, onRemoveRevelation }) => {
  const [activeTab, setActiveTab] = useState<'ARTS' | 'REVELATIONS'>('ARTS');

  return (
    <div className="space-y-12 pb-12">
      <div className="text-center space-y-4">
        <h2 className="text-5xl font-serif text-white uppercase tracking-tighter italic">Galeria da <span className="gold-text">Glória</span></h2>
        <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em]">Suas manifestações visuais e espirituais preservadas</p>
      </div>

      <div className="flex justify-center">
        <div className="bg-white/5 border border-white/10 rounded-full p-1 flex">
          <button 
            onClick={() => setActiveTab('ARTS')}
            className={`px-8 py-3 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${activeTab === 'ARTS' ? 'bg-[#BF953F] text-black shadow-[0_0_15px_rgba(191,149,63,0.4)]' : 'text-slate-400'}`}
          >
            Artes ({savedArts.length})
          </button>
          <button 
            onClick={() => setActiveTab('REVELATIONS')}
            className={`px-8 py-3 rounded-full text-[10px] uppercase tracking-widest font-bold transition-all ${activeTab === 'REVELATIONS' ? 'bg-[#BF953F] text-black shadow-[0_0_15px_rgba(191,149,63,0.4)]' : 'text-slate-400'}`}
          >
            Revelações ({savedRevelations.length})
          </button>
        </div>
      </div>

      {activeTab === 'ARTS' ? (
        savedArts.length === 0 ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-6 opacity-40">
            <div className="text-6xl">🖼️</div>
            <p className="font-serif italic text-2xl">Sua galeria de artes está vazia.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {savedArts.map((art) => (
              <div key={art.id} className="group relative bg-[#111827]/60 border border-white/5 rounded-3xl overflow-hidden celestial-glow p-3 transition-all hover:scale-[1.02]">
                <div className="aspect-[3/4] bg-black rounded-2xl overflow-hidden mb-4 border border-white/5">
                  <img src={art.imageUrl} className="w-full h-full object-contain" alt={art.title} />
                </div>
                <div className="flex justify-between items-center px-2 pb-2">
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(art.createdAt).toLocaleDateString()}</span>
                    <div className="text-[#BF953F] font-bold text-[9px] uppercase tracking-tighter bg-[#BF953F]/10 px-2 py-0.5 rounded-md inline-block">
                      {art.ratio}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = art.imageUrl;
                        link.download = `Divino-Designer-${art.id}.png`;
                        link.click();
                      }}
                      className="w-10 h-10 rounded-xl bg-white/5 text-white flex items-center justify-center hover:bg-white/10 transition-all"
                    >
                      <Icons.Download />
                    </button>
                    <button 
                      onClick={() => onRemoveArt(art.id)}
                      className="w-10 h-10 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500/20 transition-all"
                    >
                      <Icons.Trash />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )
      ) : (
        savedRevelations.length === 0 ? (
          <div className="min-h-[40vh] flex flex-col items-center justify-center space-y-6 opacity-40">
            <div className="text-6xl">📖</div>
            <p className="font-serif italic text-2xl">Não há revelações guardadas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {savedRevelations.map((rev) => (
              <div key={rev.id} className="bg-[#111827]/60 border border-white/5 rounded-[2rem] p-8 space-y-6 celestial-glow relative group">
                <button 
                  onClick={() => onRemoveRevelation(rev.id!)}
                  className="absolute top-4 right-4 w-8 h-8 rounded-full bg-red-500/10 text-red-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center hover:bg-red-500/20"
                >
                  <Icons.Trash />
                </button>
                <div className="bg-[#f59e0b] px-4 py-1.5 rounded-full text-black text-[10px] font-black uppercase tracking-widest inline-block">
                  {rev.reference}
                </div>
                <h3 className="text-white text-xl font-serif italic">"{rev.verse}"</h3>
                <div className="space-y-4 opacity-80">
                  <p className="text-slate-300 text-xs leading-relaxed"><span className="text-[#f59e0b] font-bold">INSIGHT:</span> {rev.explanation}</p>
                  <p className="text-slate-300 text-xs leading-relaxed"><span className="text-[#3b82f6] font-bold">PRÁTICA:</span> {rev.practicalApplication}</p>
                </div>
                <div className="pt-2 text-right">
                  <span className="text-[9px] text-slate-600 uppercase tracking-widest">{new Date(rev.timestamp!).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

const InspireView: React.FC<{ onQuotaExhausted: () => void, onSaveRevelations: (rev: StructuredInspiration) => void, addToast: (msg: string, type: 'success' | 'error') => void }> = ({ onQuotaExhausted, onSaveRevelations, addToast }) => {
  const [history, setHistory] = useState<{ role: 'user' | 'model', content: StructuredInspiration | string }[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatingSmon, setGeneratingSermon] = useState(false);
  const [sermonData, setSermonData] = useState<string | null>(null);

  const handleSend = async () => {
    if (!input) return;
    setLoading(true);
    setSermonData(null);
    const userMsg = { role: 'user' as const, content: input };
    setHistory(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `
        Aja como um mentor profético cristão. Para o tema "${currentInput}", retorne EXATAMENTE este formato JSON:
        {
          "reference": "LIVRO CAPÍTULO:VERSÍCULO",
          "verse": "O texto bíblico completo aqui",
          "explanation": "Uma explicação teológica profunda de 2 frases",
          "practicalApplication": "Como aplicar isso hoje em 2 frases",
          "greeting": "Uma saudação cristã final inspiradora e mansa (ex: A Paz do Senhor, Que o Senhor te abençoe e te guarde, Graça e Paz...)"
        }
        Responda APENAS com o JSON.
      `;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
        config: { responseMimeType: "application/json" }
      });
      
      const data = JSON.parse(response.text || '{}') as StructuredInspiration;
      data.id = Math.random().toString(36).substr(2, 9);
      data.timestamp = Date.now();
      setHistory(prev => [...prev, { role: 'model', content: data }]);
    } catch (err: any) {
      if (err.message === "QUOTA_EXHAUSTED") onQuotaExhausted();
      else addToast("A unção falhou no momento.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = (data: StructuredInspiration) => {
    const text = `*${data.reference}*\n\n"${data.verse}"\n\n*EXPLICAÇÃO:*\n${data.explanation}\n\n*APLICAÇÃO PRÁTICA:*\n${data.practicalApplication}\n\n${data.greeting}`;
    navigator.clipboard.writeText(text).then(() => {
      addToast("Texto copiado para a glória!", "success");
    });
  };

  const handleGenerateSermon = async (data: StructuredInspiration) => {
    setGeneratingSermon(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `Gere um esboço de sermão impactante baseado no versículo: ${data.reference} - "${data.verse}". Estruture com Título, Introdução, 3 Tópicos Principais e Conclusão. Use um tom de autoridade e inspiração. Finalize o texto com uma saudação profética de paz.`;
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt
      });
      setSermonData(response.text || '');
      addToast("Sermão estruturado com unção!", "success");
    } catch (err) {
      addToast("Erro ao manifestar o sermão.", "error");
    } finally {
      setGeneratingSermon(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto min-h-[80vh] flex flex-col space-y-8 pb-10">
      <div className="text-center space-y-2">
        <h2 className="text-4xl font-serif text-white uppercase italic tracking-tighter">Conselheiro <span className="gold-text">Criativo</span></h2>
        <p className="text-slate-500 text-[10px] uppercase tracking-[0.3em]">Revelação e Inspiração Ministerial</p>
      </div>

      <div className="flex-1 space-y-8 overflow-y-auto scrollbar-hide px-2">
        {history.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-700 text-center space-y-6 opacity-40 py-20">
            <div className="text-5xl">📖</div>
            <p className="italic font-serif text-lg">"Lâmpada para os meus pés é tua palavra..."</p>
            <p className="text-[10px] uppercase tracking-widest max-w-xs">Peça uma palavra profética ou tema para o seu próximo culto.</p>
          </div>
        )}

        {history.map((msg, i) => {
          if (msg.role === 'user') return (
            <div key={i} className="flex justify-end">
              <div className="bg-[#BF953F]/10 border border-[#BF953F]/20 px-6 py-3 rounded-2xl text-xs text-[#BF953F] uppercase tracking-widest font-bold">
                {msg.content as string}
              </div>
            </div>
          );

          const data = msg.content as StructuredInspiration;
          return (
            <div key={i} className="space-y-6 animate-in slide-in-from-bottom duration-500">
              <div className="bg-[#0a0a0a] border border-white/5 rounded-[2.5rem] p-8 space-y-8 shadow-2xl relative overflow-hidden celestial-glow">
                <div className="flex justify-between items-start">
                  <div className="bg-[#f59e0b] px-4 py-1.5 rounded-full text-black text-[10px] font-black uppercase tracking-widest">
                    {data.reference}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleCopy(data)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all" title="Copiar">
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></svg>
                    </button>
                    <button onClick={() => { onSaveRevelations(data); addToast("Revelação guardada!", "success"); }} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-slate-400 hover:text-white transition-all" title="Guardar">
                      <Icons.Plus />
                    </button>
                  </div>
                </div>

                <h3 className="text-white text-2xl md:text-3xl font-serif italic font-bold leading-tight">
                  "{data.verse}"
                </h3>

                <div className="space-y-6">
                  <div className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-3">
                    <div className="flex items-center gap-2 text-[#f59e0b]">
                      <Icons.Inspire />
                      <span className="text-[10px] font-black uppercase tracking-widest">EXPLICAÇÃO</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{data.explanation}</p>
                  </div>

                  <div className="bg-white/5 rounded-2xl p-5 border border-white/5 space-y-3">
                    <div className="flex items-center gap-2 text-[#3b82f6]">
                      <div className="w-2.5 h-2.5 rounded-full bg-[#3b82f6] shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div>
                      <span className="text-[10px] font-black uppercase tracking-widest">APLICAÇÃO PRÁTICA</span>
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{data.practicalApplication}</p>
                  </div>

                  <div className="text-center pt-2 opacity-90">
                    <p className="font-serif italic text-[#f59e0b] text-sm">
                      {data.greeting}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button 
                    onClick={() => handleCopy(data)}
                    className="flex-1 bg-black border border-white/10 py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                  >
                    COPIAR TEXTO
                  </button>
                  <button 
                    onClick={() => handleGenerateSermon(data)}
                    className="flex-1 bg-[#f59e0b] py-4 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] text-black hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                  >
                    <Icons.Plus /> GERAR SERMÃO
                  </button>
                </div>
              </div>

              {sermonData && (
                <div className="bg-[#050505] border border-[#f59e0b]/20 rounded-[2rem] p-8 animate-in zoom-in duration-500 space-y-6 celestial-glow">
                  <div className="flex items-center gap-2 text-[#f59e0b]">
                    <Icons.Inspire />
                    <span className="text-[10px] font-black uppercase tracking-widest">ESBOÇO DO SERMÃO</span>
                  </div>
                  <div className="text-slate-300 text-sm whitespace-pre-line leading-relaxed font-serif italic">
                    {sermonData}
                  </div>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(sermonData).then(() => {
                        addToast("Sermão copiado!", "success");
                      });
                    }}
                    className="w-full border border-[#f59e0b]/30 py-3 rounded-xl text-[9px] uppercase tracking-widest text-[#f59e0b] font-bold"
                  >
                    COPIAR ESBOÇO
                  </button>
                </div>
              )}
            </div>
          );
        })}
        {loading && <div className="text-[#f59e0b] text-[10px] animate-pulse font-black tracking-[0.3em] uppercase ml-2 italic">A revelação está chegando...</div>}
        {generatingSmon && <div className="text-[#f59e0b] text-[10px] animate-pulse font-black tracking-[0.3em] uppercase ml-2 italic">Estruturando o sermão da vitória...</div>}
      </div>

      <div className="sticky bottom-0 bg-[#020617]/80 backdrop-blur-lg p-2 rounded-[2rem] border border-white/5 focus-within:border-[#f59e0b]/40 transition-all">
        <div className="flex space-x-3">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Peça um tema, versículo ou palavra..."
            className="flex-1 bg-transparent px-6 py-4 text-white focus:outline-none text-sm placeholder:text-slate-800"
          />
          <button 
            onClick={handleSend}
            disabled={loading}
            className="bg-[#f59e0b] w-14 h-14 rounded-full flex items-center justify-center text-black shadow-xl hover:scale-105 active:scale-95 transition-all"
          >
            <Icons.Edit />
          </button>
        </div>
      </div>
    </div>
  );
};

const VoiceView: React.FC = () => {
  const [isActive, setIsActive] = useState(false);
  const [status, setStatus] = useState('Clique para iniciar conversa');
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<{ input: AudioContext; output: AudioContext } | null>(null);
  const nextStartTimeRef = useRef(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  const decode = (base64: string) => {
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  };

  const encode = (bytes: Uint8Array) => {
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  };

  const decodeAudioData = async (data: Uint8Array, ctx: AudioContext, sampleRate: number, numChannels: number): Promise<AudioBuffer> => {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  };

  const startSession = async () => {
    try {
      setStatus('Conectando ao Divino...');
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = { input: inputCtx, output: outputCtx };

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-12-2025',
        callbacks: {
          onopen: () => {
            setStatus('Canal Aberto: Pode falar');
            setIsActive(true);
            const source = inputCtx.createMediaStreamSource(stream);
            const scriptProcessor = inputCtx.createScriptProcessor(4096, 1, 1);
            scriptProcessor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              const l = inputData.length;
              const int16 = new Int16Array(l);
              for (let i = 0; i < l; i++) {
                int16[i] = inputData[i] * 32768;
              }
              const pcmData = {
                data: encode(new Uint8Array(int16.buffer)),
                mimeType: 'audio/pcm;rate=16000',
              };
              sessionPromise.then((session) => {
                session.sendRealtimeInput({ media: pcmData });
              });
            };
            source.connect(scriptProcessor);
            scriptProcessor.connect(inputCtx.destination);
          },
          onmessage: async (message: LiveServerMessage) => {
            const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
            if (base64Audio) {
              const outCtx = audioContextRef.current?.output;
              if (outCtx) {
                nextStartTimeRef.current = Math.max(nextStartTimeRef.current, outCtx.currentTime);
                const audioBuffer = await decodeAudioData(decode(base64Audio), outCtx, 24000, 1);
                const source = outCtx.createBufferSource();
                source.buffer = audioBuffer;
                source.connect(outCtx.destination);
                source.addEventListener('ended', () => sourcesRef.current.delete(source));
                source.start(nextStartTimeRef.current);
                nextStartTimeRef.current += audioBuffer.duration;
                sourcesRef.current.add(source);
              }
            }
          },
          onerror: (e) => {
            setStatus('Conexão espiritual interrompida.');
            setIsActive(false);
          },
          onclose: () => {
            setStatus('Sessão encerrada.');
            setIsActive(false);
          }
        },
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Fenrir' } },
          },
          systemInstruction: 'Você é o Divino Designer, um mentor criativo para líderes cristãos. Sua voz é profunda, mansa e grave. Fale com serenidade, nem rápido nem devagar, transmitindo autoridade e calma. SEMPRE finalize cada fala sua com uma saudação cristã de paz e bênção, como "A Paz do Senhor", "Que o Senhor te abençoe e te guarde" ou similar.',
        },
      });
      sessionRef.current = await sessionPromise;
    } catch (err) {
      console.error(err);
      setStatus('Erro ao acessar ferramentas de voz.');
    }
  };

  const stopSession = () => {
    if (sessionRef.current) sessionRef.current.close();
    if (audioContextRef.current) {
      audioContextRef.current.input.close();
      audioContextRef.current.output.close();
    }
    setIsActive(false);
    setStatus('Clique para iniciar conversa');
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in zoom-in duration-700">
      <div className={`w-56 h-56 rounded-full border-2 transition-all duration-500 flex items-center justify-center relative ${isActive ? 'border-[#BF953F] shadow-[0_0_50px_rgba(191,149,63,0.3)]' : 'border-[#BF953F]/20'}`}>
        {isActive && (
          <>
            <div className="absolute inset-0 rounded-full bg-[#BF953F]/10 animate-ping opacity-20"></div>
            <div className="absolute inset-4 rounded-full bg-[#BF953F]/10 animate-pulse opacity-40"></div>
          </>
        )}
        <div className={`absolute inset-8 rounded-full border flex items-center justify-center bg-black/60 backdrop-blur-sm transition-all ${isActive ? 'border-[#BF953F]/60' : 'border-[#BF953F]/20'}`}>
          <div className={`text-[#BF953F] transition-all ${isActive ? 'scale-[2.5] drop-shadow-[0_0_15px_rgba(191,149,63,0.6)]' : 'scale-[2]'}`}>
            <Icons.Voice />
          </div>
        </div>
      </div>
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-serif text-white">Voz do Reino</h2>
        <p className={`transition-colors duration-500 ${isActive ? 'text-[#BF953F] font-bold' : 'text-slate-400'} max-w-sm mx-auto leading-relaxed uppercase tracking-widest text-xs`}>
          {status}
        </p>
      </div>
      {!isActive ? (
        <button onClick={startSession} className="gold-button px-10 py-4 rounded-full text-black font-bold uppercase tracking-[0.2em] text-xs shadow-xl">Ativar Canal de Voz</button>
      ) : (
        <button onClick={stopSession} className="px-10 py-4 rounded-full border border-red-500 text-red-500 font-bold uppercase tracking-[0.2em] text-xs hover:bg-red-500/10 transition-all">Encerrar Canal</button>
      )}
    </div>
  );
};

const LoginView: React.FC<{ onLogin: () => void }> = ({ onLogin }) => (
  <div className="flex items-center justify-center min-h-[70vh] animate-in fade-in duration-1000">
    <div className="w-full max-w-md bg-black/60 border border-[#BF953F]/20 rounded-[3rem] p-12 backdrop-blur-2xl celestial-glow space-y-10">
      <div className="text-center space-y-4">
        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#BF953F] to-[#AA771C] flex items-center justify-center mx-auto shadow-2xl">
          <span className="text-black font-bold text-4xl">D</span>
        </div>
        <h2 className="gold-text text-3xl font-serif uppercase pt-4">Divino Designer</h2>
      </div>
      <button onClick={onLogin} className="w-full gold-button py-5 rounded-2xl text-black font-bold uppercase tracking-[0.2em] text-xs shadow-xl">Entrar na Glória</button>
    </div>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<ViewState>('HOME');
  const [generatedResults, setGeneratedResults] = useState<{url: string, ratio: string}[]>([]);
  const [quotaExhausted, setQuotaExhausted] = useState(false);
  const [savedArts, setSavedArts] = useState<DesignProject[]>([]);
  const [savedRevelations, setSavedRevelations] = useState<StructuredInspiration[]>([]);
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  const addToast = (msg: string, type: 'success' | 'error') => setToast({ msg, type });

  // Carregar dados salvos
  useEffect(() => {
    try {
      const saved = localStorage.getItem('divino_saved_arts');
      if (saved) setSavedArts(JSON.parse(saved));
      const revs = localStorage.getItem('divino_saved_revs');
      if (revs) setSavedRevelations(JSON.parse(revs));
    } catch (e) {
      console.error("Erro ao carregar dados do templo:", e);
    }
  }, []);

  // Salvar dados no localStorage
  useEffect(() => {
    try {
      localStorage.setItem('divino_saved_arts', JSON.stringify(savedArts));
    } catch (e) {
      addToast("Espaço de armazenamento cheio!", "error");
    }
  }, [savedArts]);

  useEffect(() => {
    try {
      localStorage.setItem('divino_saved_revs', JSON.stringify(savedRevelations));
    } catch (e) {
      addToast("Espaço de armazenamento cheio!", "error");
    }
  }, [savedRevelations]);

  const handleDesignResults = (results: {url: string, ratio: string}[]) => {
    setGeneratedResults(results);
    setView('EDITOR');
  };

  const handleSaveArt = (project: DesignProject) => {
    setSavedArts(prev => [project, ...prev]);
  };

  const handleRemoveArt = (id: string) => {
    setSavedArts(prev => prev.filter(a => a.id !== id));
    addToast("Arte removida.", "success");
  };

  const handleSaveRevelation = (rev: StructuredInspiration) => {
    setSavedRevelations(prev => [rev, ...prev]);
  };

  const handleRemoveRevelation = (id: string) => {
    setSavedRevelations(prev => prev.filter(r => r.id !== id));
    addToast("Revelação removida.", "success");
  };

  const renderContent = () => {
    switch (view) {
      case 'HOME': return <Home onStart={() => setView('CREATE')} onInspire={() => setView('INSPIRE')} />;
      case 'CREATE': return <CreateView onResults={handleDesignResults} onQuotaExhausted={() => setQuotaExhausted(true)} addToast={addToast} />;
      case 'EDITOR': return <EditorView results={generatedResults} onBack={() => setView('CREATE')} onSave={handleSaveArt} addToast={addToast} />;
      case 'INSPIRE': return <InspireView onQuotaExhausted={() => setQuotaExhausted(true)} onSaveRevelations={handleSaveRevelation} addToast={addToast} />;
      case 'VOICE': return <VoiceView />;
      case 'GALLERY': return (
        <GalleryView 
          savedArts={savedArts} 
          savedRevelations={savedRevelations} 
          onRemoveArt={handleRemoveArt} 
          onRemoveRevelation={handleRemoveRevelation} 
        />
      );
      case 'LOGIN': return <LoginView onLogin={() => setView('HOME')} />;
      default: return <Home onStart={() => setView('CREATE')} onInspire={() => setView('INSPIRE')} />;
    }
  };

  return (
    <Layout currentView={view} setView={setView}>
      <div className="animate-in fade-in duration-700">
        {renderContent()}
      </div>
      {quotaExhausted && <QuotaAlert onRetry={() => setQuotaExhausted(false)} />}
      {toast && <Toast message={toast.msg} type={toast.type} onClear={() => setToast(null)} />}
    </Layout>
  );
};

export default App;
