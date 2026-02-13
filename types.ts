
export enum UnctionStyle {
  PROFESSIONAL_STUDIO = 'Estúdio Profissional',
  CINEMATOGRAPHIC = 'Cinematográfico',
  MINIMALIST = 'Minimalista',
  REVIVAL = 'Avivamento',
  AUTHORITY = 'Autoridade',
  YOUTH_MODE = 'Modo Jovem',
  CHRISTMAS = 'Natal',
  NEW_YEAR = 'Ano Novo',
  PROPHETIC = 'Profético',
  WOMEN_GLORY_GOLD = 'Mulheres de Glória (Ouro)',
  WOMEN_GLORY_SILVER = 'Mulheres de Glória (Prata)',
  DEEP_BLUE = 'Azul Profundo'
}

export type DesignMode = 'SINGLE' | 'MULTI_COMPOSITION';

export interface PreacherImage {
  id: string;
  url: string;
  isPrincipal: boolean;
  name?: string;
}

export interface DesignProject {
  id: string;
  title: string;
  style: UnctionStyle;
  imageUrl: string;
  ratio: string;
  createdAt: number;
}

export type ViewState = 'HOME' | 'LOGIN' | 'CREATE' | 'EDITOR' | 'INSPIRE' | 'VOICE' | 'GALLERY';

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export interface StructuredInspiration {
  reference: string;
  verse: string;
  explanation: string;
  practicalApplication: string;
  greeting: string;
  id?: string;
  timestamp?: number;
}
