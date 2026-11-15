const API_URL = "http://localhost:8080/api/astronauts";

export interface Astronaut {
  id: number;
  name: string;
  age: number;
  missionName: string;
}

export async function getAstronauts(): Promise<Astronaut[]> {
  const response = await fetch(API_URL);

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}
