
import { AccessibilityPoint, PointType } from '../types';

export const defaultPoints: AccessibilityPoint[] = [
  {
    id: 'default-1',
    name: 'Banheiro Acessível - Lagoa do Taquaral',
    address: 'Av. Dr. Heitor Penteado, s/n - Taquaral, Campinas - SP',
    type: PointType.RESTROOM,
    description: 'Banheiro público acessível próximo ao portão principal do Parque Portugal.',
    position: { lat: -22.8797, lng: -47.0505 },
  },
  {
    id: 'default-2',
    name: 'Rampa de Acesso - Mercado Municipal',
    address: 'Av. Benjamin Constant, s/n - Centro, Campinas - SP',
    type: PointType.RAMP,
    description: 'Rampa de acesso principal na entrada da Avenida Benjamin Constant, facilitando o acesso ao mercado.',
    position: { lat: -22.9054, lng: -47.0634 },
  },
  {
    id: 'default-3',
    name: 'Elevador Central - Iguatemi Campinas',
    address: 'Av. Iguatemi, 777 - Vila Brandina, Campinas - SP',
    type: PointType.ELEVATOR,
    description: 'Elevador panorâmico com acesso a todos os pisos, localizado na praça de alimentação principal do shopping.',
    position: { lat: -22.8953, lng: -47.0232 },
  },
  {
    id: 'default-4',
    name: 'Vaga para Deficientes - Prefeitura de Campinas',
    address: 'Av. Anchieta, 200 - Centro, Campinas - SP',
    type: PointType.PARKING,
    description: 'Vagas de estacionamento reservadas para pessoas com deficiência em frente ao Paço Municipal.',
    position: { lat: -22.9032, lng: -47.0583 },
  },
  {
    id: 'default-5',
    name: 'Entrada Acessível - Teatro Castro Mendes',
    address: 'Rua Conselheiro Gomide, 62 - Vila Industrial, Campinas - SP',
    type: PointType.ENTRANCE,
    description: 'Entrada principal sem degraus e com portas largas para acesso facilitado a cadeiras de rodas.',
    position: { lat: -22.9110, lng: -47.0760 },
  },
];
