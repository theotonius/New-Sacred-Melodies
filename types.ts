
export interface Song {
  id: string;
  title: string;
  reference: string;
  lyrics: string[];
  category: 'Worship' | 'Praise' | 'Hymn' | 'Kids';
  image: string;
}

export interface UserProfile {
  name: string;
  email: string;
  photo: string;
}

export interface SavedStudy {
  id: string;
  reference: string;
  content: string;
  timestamp: number;
}

export interface Reflection {
  text: string;
  verse: string;
}

export enum Theme {
  Light = 'light',
  Dark = 'dark',
  Sepia = 'sepia'
}

export enum AppTab {
  Library = 'library',
  Reader = 'reader',
  Reflections = 'reflections',
  Study = 'study',
  Profile = 'profile',
  Developer = 'developer'
}
