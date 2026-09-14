export interface Person {
  id?: number;
  name: string;
  coordinates: Coordinates;
  creationDate?: string;
  eyeColor?: Color | null;
  hairColor: Color;
  location: Location;
  height: number;
  nationality?: Country | null;
}

export interface Coordinates {
  id?: number;
  x: number;
  y: number;
}

export interface Location {
  id?: number;
  x: number;
  y: number;
  z: number;
}

export enum Color {
  GREEN = 'GREEN',
  BLACK = 'BLACK',
  BROWN = 'BROWN'
}

export enum Country {
  RUSSIA = 'RUSSIA',
  CHINA = 'CHINA',
  VATICAN = 'VATICAN',
  ITALY = 'ITALY',
  JAPAN = 'JAPAN'
}