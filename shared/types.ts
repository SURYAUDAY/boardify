export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
}

export interface Point {
  x: number;
  y: number;
}

export type Tool =
  | 'select'
  | 'pen'
  | 'eraser'
  | 'line'
  | 'arrow'
  | 'rect'
  | 'circle'
  | 'text'
  | 'sticky'
  | 'pan';

export interface Stroke {
  id: string;
  tool: Tool;
  points: Point[];
  color: string;
  strokeWidth: number;
  userId: string;
  timestamp: number;
  text?: string;
  generationId?: string;
  shapeVariant?: 'diamond';
}

export interface StickyNote {
  id: string;
  text: string;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
  userId: string;
  timestamp: number;
}

export interface Board {
  id: string;
  title: string;
  description?: string;
  owner: string;
  collaborators: Array<{ user: string; role: 'editor' | 'viewer' }>;
  thumbnail?: string;
  isPublic: boolean;
  shareToken: string;
  shareMode: 'none' | 'view' | 'edit';
  strokes: Stroke[];
  stickyNotes: StickyNote[];
  createdAt: string;
  updatedAt: string;
}
