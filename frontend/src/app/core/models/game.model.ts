export interface Category {
  id: string;
  name: string;
  rules?: string;
  gameId: string;
}

export interface Game {
  id: string;
  title: string;
  platforms?: string[];
  tags?: string[];
  releaseYear?: number;
  coverImage?: string;
  categories?: Category[];
  createdAt?: string;
}

export interface CreateGameDto {
  title: string;
  platforms?: string[];
  tags?: string[];
  releaseYear?: number;
  coverImage?: string;
}

export type UpdateGameDto = Partial<CreateGameDto>;

export interface CreateCategoryDto {
  name: string;
  gameId: string;
}

export type UpdateCategoryDto = Partial<CreateCategoryDto>;
