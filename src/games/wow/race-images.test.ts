import { describe, it, expect } from 'vitest';
import { getRaceFilterImage, getRaceImage } from './race-images.ts';

describe('getRaceImage', () => {
  it('picks the art for the character’s gender', () => {
    expect(getRaceImage('Troll', 'Male')).toContain('troll_male');
    expect(getRaceImage('Troll', 'Female')).toContain('troll_female');
  });

  it('reads a race of two words', () => {
    expect(getRaceImage('Night Elf', 'Male')).toContain('nightelf_male');
    expect(getRaceImage('Windshaper Skyborne', 'Female')).toContain('windshaperskyborne_female');
  });

  it('falls back to the race’s icon for a gender without art', () => {
    expect(getRaceImage('Orc', 'Unknown')).toBe(getRaceFilterImage('Orc'));
  });

  it('has nothing for a race without art', () => {
    expect(getRaceImage('Pandaren', 'Male')).toBeUndefined();
  });
});

describe('getRaceFilterImage', () => {
  const races = [
    'Dwarf',
    'Gnome',
    'Human',
    'Night Elf',
    'Orc',
    'Tauren',
    'Troll',
    'Undead',
    'Windshaper Skyborne',
  ];

  it('gives every race an icon, mixing female and male art across them', () => {
    const icons = races.map(getRaceFilterImage);

    expect(icons.every(Boolean)).toBe(true);
    expect(icons.some((icon) => icon!.includes('_female'))).toBe(true);
    expect(icons.some((icon) => icon!.includes('_male'))).toBe(true);
  });

  it('gives each race the same icon every time', () => {
    expect(getRaceFilterImage('Troll')).toBe(getRaceFilterImage('troll'));
  });
});
