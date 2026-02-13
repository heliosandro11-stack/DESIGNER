
// Always use import {GoogleGenAI} from "@google/genai";
import { GoogleGenAI, Type, HarmCategory, HarmBlockThreshold } from "@google/genai";
import { UnctionStyle, PreacherImage } from "../types";

const safetySettings = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

export const generateDesign = async (
  instructions: string, 
  style: UnctionStyle,
  aspectRatio: "1:1" | "9:16" | "3:4" | "4:3" | "16:9" = "3:4",
  images?: PreacherImage[],
  logoUrl?: string
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  const stylePrompts = {
    [UnctionStyle.PROFESSIONAL_STUDIO]: "professional studio photography lighting, clean solid background, sharp focus, high-end editorial look",
    [UnctionStyle.CINEMATOGRAPHIC]: "cinematic lighting, high contrast, dramatic shadows, professional church poster style, epic atmosphere, deep shadows, golden glow",
    [UnctionStyle.MINIMALIST]: "clean minimalist design, lots of whitespace, elegant typography, simple sacred geometry, subtle textures",
    [UnctionStyle.REVIVAL]: "fiery embers, powerful spiritual energy, bright holy light, revival meeting atmosphere, vibrant gold and red accents",
    [UnctionStyle.AUTHORITY]: "strong bold typography, heavy metal textures, high contrast, powerful presence, architectural elements",
    [UnctionStyle.YOUTH_MODE]: "modern neon accents, dynamic movement, fresh street-style church aesthetic, vibrant energy, glowing gradients",
    [UnctionStyle.CHRISTMAS]: "sacred christmas aesthetic, warm glowing lights, star of bethlehem, deep reds and forest greens, festive but holy",
    [UnctionStyle.NEW_YEAR]: "celebratory golden light, fireworks bokeh, prophetic transition theme, bright future aesthetic, sparkling gold",
    [UnctionStyle.PROPHETIC]: "ethereal clouds, celestial lighting, eagles, mountain peaks, soft glowing light, spiritual revelation aesthetic",
    [UnctionStyle.WOMEN_GLORY_GOLD]: "elegant feminine aesthetic, roses, floral patterns, soft pink and metallic gold details, premium luxury for women's ministry",
    [UnctionStyle.WOMEN_GLORY_SILVER]: "elegant feminine aesthetic, soft pink and metallic silver, crystal accents, pearls, graceful and holy design",
    [UnctionStyle.DEEP_BLUE]: "midnight blue background, golden particles, stardust, spiritual authority, profound and deep atmosphere"
  };

  const brandingRule = `
    REGRA ABSOLUTA DE FIDELIDADE (NÃO NEGOCIÁVEL):
    • LOGOTIPO: Se uma imagem de logo for fornecida, use-a EXATAMENTE como está. É proibido mudar cores, remover fundos (a menos que seja transparente), adicionar efeitos, sombras ou alterar a proporção. A logo deve ser preservada em sua integridade total.
    • SE NÃO houver logo enviada, NÃO gere NADA no lugar. O topo deve ficar limpo. Proibido inventar marcas.
    • FOTOS DE PESSOAS: Use as fotos enviadas. É terminantemente proibido reinterpretar rostos ou gerar versões de IA dos mesmos. Mantenha a identidade visual real das pessoas.
    
    POSIÇÃO DA LOGO:
    • Sempre no TOPO, centralizada horizontalmente.
  `;

  const textOrthographyRule = `
    REGRA DE EXCELÊNCIA ORTOGRÁFICA:
    • PALAVRAS SAGRADAS (PRIORIDADE DE CORREÇÃO): As palavras "Igreja", "Templo", "Batista", "Assembleia", "Ministério", "Comunidade", "Evangélica", "Pentecostal", "Adoração", "Louvor" e "Missão" DEVEM ser escritas com perfeição gramatical absoluta (respeitando acentos e grafia correta em Português). Use sempre a primeira letra Maiúscula para estas instituições (ex: Igreja Batista, Templo da Glória).
    
    REGRA OBRIGATÓRIA – FORMATAÇÃO DE NOMES DE PREGADORES:
    • Exibir o nome do pregador no formato: Primeira letra de cada nome em MAIÚSCULA e todas as demais letras em minúsculas (Capitalização de Título / Title Case).
    • Exemplo Correto: "Pr Ivan Saraiva", "Miss Vitória Souza".
    • É TERMINANTEMENTE PROIBIDO usar caixa alta (ALL CAPS) ou tudo minúsculo para os nomes.
    
    FIDELIDADE DE TEXTO: Para os demais campos, garanta que letras não sejam trocadas ou omitidas.
  `;

  const finalPrompt = `
    MASTER DESIGNER CRISTÃO: Crie um flyer premium de altíssima qualidade.
    ${brandingRule}
    ${textOrthographyRule}
    
    DETALHES DA ARTE:
    - RODAPÉ: Infos de Data/Hora e Local centralizadas. Ícones em DOURADO (#FFD700).
    - PESSOAS: Corte cintura para cima (waist-up), agrupados no centro. SEM molduras redondas.
    
    INSTRUÇÕES DO USUÁRIO:
    ${instructions}
    
    ESTILO:
    - ${stylePrompts[style] || stylePrompts[UnctionStyle.CINEMATOGRAPHIC]}
    - 8k, Octane Render, iluminação divina, partículas de ouro, realismo cinematográfico.
  `;

  try {
    const parts: any[] = [];
    
    if (logoUrl) {
      const base64Logo = logoUrl.includes(',') ? logoUrl.split(',')[1] : logoUrl;
      parts.push({ inlineData: { data: base64Logo, mimeType: 'image/jpeg' } });
      parts.push({ text: "LOGOTIPO ORIGINAL: Preserve esta imagem exatamente como está no topo da arte." });
    }

    if (images && images.length > 0) {
      images.forEach((img, idx) => {
        const base64Data = img.url.includes(',') ? img.url.split(',')[1] : img.url;
        parts.push({ inlineData: { data: base64Data, mimeType: 'image/jpeg' } });
        parts.push({ text: `PESSOA ${idx + 1} (${img.name || 'Convidado'}): Use este rosto real.` });
      });
    }

    parts.push({ text: finalPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: {
        safetySettings,
        imageConfig: { aspectRatio },
        seed: Math.floor(Math.random() * 10000)
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Falha na manifestação.");
  } catch (error: any) {
    if (error?.message?.includes('429')) throw new Error("QUOTA_EXHAUSTED");
    throw error;
  }
};

export const refinePoster = async (base64Image: string, instruction: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const base64Data = base64Image.includes(',') ? base64Image.split(',')[1] : base64Image;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          { text: `
            EDITOR PROFISSIONAL: Aplique esta alteração: "${instruction}".
            MANUTENÇÃO DE ATIVOS E EXCELÊNCIA:
            1. NÃO mude a logo que já está na imagem.
            2. NÃO mude os rostos que já estão na imagem.
            3. CORREÇÃO ORTOGRÁFICA: Garanta que palavras como "Igreja", "Templo", "Batista", "Assembleia" estejam escritas corretamente e com a primeira letra maiúscula.
            4. FORMATAÇÃO DE NOMES: Aplique Title Case (Pr Ivan Saraiva) para nomes de pregadores. Proibido ALL CAPS.
            5. Ícones de localização permanecem DOURADOS.
          ` },
          { inlineData: { data: base64Data, mimeType: 'image/png' } }
        ],
      },
      config: { safetySettings },
    });

    if (response.candidates?.[0]?.content?.parts) {
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("Erro no refinamento.");
  } catch (error: any) {
    throw error;
  }
};

export const getInspiration = async (message: string, history: { role: 'user' | 'model', text: string }[]) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  try {
    const contents = history.map(h => ({ role: h.role, parts: [{ text: h.text }] }));
    contents.push({ role: 'user', parts: [{ text: message }] });
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: contents,
      config: {
        systemInstruction: 'Você é o consultor criativo do Divino Designer. Inspire com excelência bíblica e visão profética.'
      }
    });
    return response.text;
  } catch (error: any) {
    if (error?.message?.includes('429')) throw new Error("QUOTA_EXHAUSTED");
    throw error;
  }
};
