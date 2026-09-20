import { Color, Country } from '../model/person';

const colorLabels: Record<Color, string> = {
  [Color.GREEN]: 'Зелёный',
  [Color.BLACK]: 'Чёрный',
  [Color.BROWN]: 'Коричневый'
};

const countryLabels: Record<Country, string> = {
  [Country.RUSSIA]: 'Россия',
  [Country.CHINA]: 'Китай',
  [Country.VATICAN]: 'Ватикан',
  [Country.ITALY]: 'Италия',
  [Country.JAPAN]: 'Япония'
};

export function colorLabel(color: Color | null | undefined): string {
  return color == null ? 'Не указано' : colorLabels[color];
}

export function countryLabel(country: Country | null | undefined): string {
  return country == null ? 'Не указано' : countryLabels[country];
}
