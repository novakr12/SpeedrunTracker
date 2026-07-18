export interface Category {
  id: string;
  name: string;
  rules?: string;
  gameId: string;
}

export interface Game {
  id: string;
  title: string;
  platform?: string;
  releaseYear?: number;
  coverImage?: string;
  categories?: Category[];
  createdAt?: string;
}
