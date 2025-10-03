import { GoogleGenAI, Type } from '@google/genai';
import { AccessibilityPoint, PointType } from '../types';
import { defaultPoints } from '../data/defaultPoints';

// Assumimos que process.env.API_KEY está disponível no ambiente de execução.
if (!process.env.API_KEY) {
    console.error("API_KEY não está configurada nas variáveis de ambiente.");
}
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY! });

const USER_POINTS_KEY = 'user_accessibility_points';


const getResponseSchema = () => ({
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: 'Identificador único para o ponto (pode ser um hash do nome e endereço)' },
      name: { type: Type.STRING, description: 'Nome do local ou ponto de acessibilidade.' },
      address: { type: Type.STRING, description: 'Endereço completo do local.' },
      type: {
        type: Type.STRING,
        enum: Object.values(PointType),
        description: 'O tipo de ponto de acessibilidade.'
      },
      description: { type: Type.STRING, description: 'Breve descrição do ponto de acessibilidade.' },
      position: {
        type: Type.OBJECT,
        properties: {
          lat: { type: Type.NUMBER, description: 'Latitude do ponto.' },
          lng: { type: Type.NUMBER, description: 'Longitude do ponto.' }
        },
        required: ['lat', 'lng'],
      },
    },
    required: ['id', 'name', 'address', 'type', 'description', 'position'],
  },
});

const getAllUserPoints = (): Record<string, AccessibilityPoint[]> => {
  try {
    const stored = localStorage.getItem(USER_POINTS_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch (error) {
    console.error("Falha ao analisar pontos do localStorage", error);
    return {};
  }
};

const saveAllUserPoints = (points: Record<string, AccessibilityPoint[]>) => {
    localStorage.setItem(USER_POINTS_KEY, JSON.stringify(points));
};

export const getInitialPoints = async (): Promise<AccessibilityPoint[]> => {
    const allUserPoints = getAllUserPoints();

    const combinedPointsMap = new Map<string, AccessibilityPoint>();

    // 1. Adiciona pontos padrão
    defaultPoints.forEach(p => combinedPointsMap.set(p.id, p));

    // 2. Adiciona/sobrescreve com todos os pontos do usuário
    Object.values(allUserPoints).flat().forEach(p => {
        combinedPointsMap.set(p.id, p);
    });
    
    return Array.from(combinedPointsMap.values());
};

export const fetchAccessibilityPoints = async (location: string): Promise<AccessibilityPoint[]> => {
    const prompt = `Liste pontos de acessibilidade na cidade de ${location}. Inclua rampas, elevadores, banheiros acessíveis, vagas de estacionamento e entradas. Forneça nome, endereço, tipo, descrição e coordenadas geográficas (latitude e longitude) para cada ponto.`;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: getResponseSchema(),
            },
        });

        let apiPoints: AccessibilityPoint[] = [];
        const text = response.text.trim();
        if (text) {
             try {
                const parsedPoints = JSON.parse(text);
                apiPoints = parsedPoints.map((p: any) => ({
                    ...p,
                    creatorId: undefined, // Pontos da API não têm criador
                }));
             } catch (e) {
                 console.error("Falha ao analisar JSON da API Gemini:", e);
                 throw new Error("A resposta da IA não estava no formato JSON esperado.");
             }
        }
        
        const allUserPoints = getAllUserPoints();
        const locationUserPoints = allUserPoints[location] || [];

        const combinedPointsMap = new Map<string, AccessibilityPoint>();
        
        apiPoints.forEach(p => combinedPointsMap.set(p.id, p));
        locationUserPoints.forEach(p => combinedPointsMap.set(p.id, p));

        return Array.from(combinedPointsMap.values());

    } catch (error) {
        console.error("Erro ao buscar pontos de acessibilidade da API Gemini:", error);
        const allUserPoints = getAllUserPoints();
        const locationUserPoints = allUserPoints[location] || [];
        if (locationUserPoints.length > 0) return locationUserPoints;

        throw new Error("Não foi possível buscar os dados. Verifique sua conexão e a chave da API.");
    }
};

export const saveNewAccessibilityPoint = async (
    data: Omit<AccessibilityPoint, 'id' | 'position' | 'address' | 'creatorId'>,
    position: { lat: number; lng: number },
    location: string,
    creatorId: string,
): Promise<AccessibilityPoint> => {
    const newPoint: AccessibilityPoint = {
        ...data,
        id: crypto.randomUUID(),
        position,
        address: 'Adicionado pelo usuário',
        creatorId: creatorId,
    };
    
    const allUserPoints = getAllUserPoints();
    const locationUserPoints = allUserPoints[location] || [];
    locationUserPoints.push(newPoint);
    allUserPoints[location] = locationUserPoints;
    saveAllUserPoints(allUserPoints);

    return newPoint;
};

export const updateAccessibilityPoint = async (
    pointToUpdate: AccessibilityPoint, 
    location: string,
    updaterId: string
): Promise<AccessibilityPoint> => {
    const allUserPoints = getAllUserPoints();
    
    // Lógica corrigida: Preserva o criador original.
    // Atribui um criador apenas se não existir (ex: em pontos padrão/IA).
    const updatedPoint = { 
        ...pointToUpdate, 
        creatorId: pointToUpdate.creatorId ?? updaterId 
    };
    
    let pointFoundAndUpdated = false;

    for (const loc in allUserPoints) {
        const index = allUserPoints[loc].findIndex(p => p.id === updatedPoint.id);
        if (index !== -1) {
            allUserPoints[loc][index] = updatedPoint;
            pointFoundAndUpdated = true;
            break;
        }
    }

    if (!pointFoundAndUpdated) {
        const locationUserPoints = allUserPoints[location] || [];
        locationUserPoints.push(updatedPoint);
        allUserPoints[location] = locationUserPoints;
    }
    
    saveAllUserPoints(allUserPoints);
    return updatedPoint;
};

export const saveRatingForPoint = async (
    pointId: string,
    userId: string,
    ratingValue: number,
    location: string
): Promise<AccessibilityPoint> => {
    const allUserPoints = getAllUserPoints();
    
    let pointToUpdate: AccessibilityPoint | undefined;
    let foundInUserPoints = false;
    let pointLocation = location;

    // Search in existing user points
    for (const loc in allUserPoints) {
        const found = allUserPoints[loc].find(p => p.id === pointId);
        if (found) {
            pointToUpdate = { ...found };
            foundInUserPoints = true;
            pointLocation = loc; // The location where the point was actually found
            break;
        }
    }

    // If not found, check default points
    if (!pointToUpdate) {
        const defaultPoint = defaultPoints.find(p => p.id === pointId);
        if (defaultPoint) {
            pointToUpdate = { ...defaultPoint };
        }
    }

    if (!pointToUpdate) {
        throw new Error("Ponto não encontrado para avaliar.");
    }

    // Update ratings
    const ratings = pointToUpdate.ratings ? [...pointToUpdate.ratings] : [];
    const existingRatingIndex = ratings.findIndex(r => r.userId === userId);

    if (existingRatingIndex > -1) {
        ratings[existingRatingIndex].value = ratingValue;
    } else {
        ratings.push({ userId, value: ratingValue });
    }

    const updatedPoint = { ...pointToUpdate, ratings };

    // Save back to localStorage
    const pointsForLocation = allUserPoints[pointLocation] || [];
    if (foundInUserPoints) {
        const index = pointsForLocation.findIndex(p => p.id === pointId);
        pointsForLocation[index] = updatedPoint;
    } else {
        // Point was from default, so add it to the current location's user points
        pointsForLocation.push(updatedPoint);
    }
    allUserPoints[pointLocation] = pointsForLocation;
    saveAllUserPoints(allUserPoints);

    return updatedPoint;
};