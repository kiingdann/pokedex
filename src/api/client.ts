const BASE_URL = 'https://pokeapi.co/api/v2';

export class ApiError extends Error {
  status?: number;

  constructor(message: string, status?: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export async function apiGet(path: string): Promise<unknown> {
  const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new ApiError(`pokeapi responded ${response.status} for ${url}`, response.status);
  }

  return response.json();
}
