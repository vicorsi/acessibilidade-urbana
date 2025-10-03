export enum PointType {
  RAMP = 'RAMP',
  ELEVATOR = 'ELEVATOR',
  RESTROOM = 'RESTROOM',
  PARKING = 'PARKING',
  ENTRANCE = 'ENTRANCE',
  UNKNOWN = 'UNKNOWN',
}

export interface Rating {
  userId: string;
  value: number; // 1 a 5
}

export interface AccessibilityPoint {
  id: string;
  name: string;
  address: string;
  type: PointType;
  description: string;
  position: {
    lat: number;
    lng: number;
  };
  creatorId?: string; // ID do usuário que criou ou modificou o ponto
  customIcon?: string; // Para armazenar a URL de dados base64 da imagem
  ratings?: Rating[]; // Array para armazenar as avaliações
}

export interface User {
    id: string;
    username: string;
}