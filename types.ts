export interface OrnamentData {
  id: number;
  position: [number, number, number];
  color: string;
  type: 'ball' | 'star' | 'light';
  scale: number;
}

export interface TreeConfig {
  layers: number;
  baseRadius: number;
  height: number;
  color: string;
}

export interface WishResponse {
  title: string;
  poem: string;
  signature: string;
}

export interface AppConfig {
  color: string;
  isGestureMode: boolean;
}