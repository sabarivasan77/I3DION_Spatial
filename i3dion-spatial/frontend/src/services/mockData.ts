import type { Product } from '../types';

export const products: Product[] = [
  {
    id: 'pump-x1',
    name: 'Pump X-1',
    category: 'Industrial Pump',
    status: 'Published',
    views: 1248,
    leads: 32,
    updated: '2026-06-21',
    image:
      'https://images.unsplash.com/photo-1581091215367-59ab6f5e6f34?auto=format&fit=crop&w=900&q=80',
    specs: {
      modelUrl: '',
      power: '18 kW',
      flowRate: '240 L/min',
      pressure: '16 bar',
    },
  },
  {
    id: 'valve-a7',
    name: 'Valve A7',
    category: 'Flow Control',
    status: 'Draft',
    views: 614,
    leads: 11,
    updated: '2026-06-20',
    image:
      'https://images.unsplash.com/photo-1513828646384-e4d4bbf3a7f9?auto=format&fit=crop&w=900&q=80',
    specs: {
      modelUrl: '',
      size: 'DN80',
      material: 'Stainless Steel',
      rating: 'PN25',
    },
  },
  {
    id: 'motor-m3',
    name: 'Motor M3',
    category: 'Drive Systems',
    status: 'Published',
    views: 918,
    leads: 19,
    updated: '2026-06-18',
    image:
      'https://images.unsplash.com/photo-1565043589221-1a6fd9ae45c7?auto=format&fit=crop&w=900&q=80',
    specs: {
      modelUrl: '',
      voltage: '440V',
      efficiency: 'IE3',
      torque: '28 Nm',
    },
  },
];
