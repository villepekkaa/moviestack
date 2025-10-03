export type Movie = {
  id: number;
  title: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string | null;
  vote_average?: number | null;
  vote_count?: number | null;
  overview?: string | null;
  popularity?: number | null;
  genre_ids?: number[];
  adult?: boolean;
  original_language?: string;
  original_title?: string;
  video?: boolean;
};
