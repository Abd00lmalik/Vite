export const UNSPLASH_IMAGES = {
  landing: {
    hero: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&w=1600&q=80',
    vaccination: 'https://images.unsplash.com/photo-1584515933487-779824d29309?auto=format&fit=crop&w=1400&q=80',
    healthWorker: 'https://images.unsplash.com/photo-1666214280557-f1b5022eb634?auto=format&fit=crop&w=1400&q=80',
    system: 'https://images.unsplash.com/photo-1538108149393-fbbd81895907?auto=format&fit=crop&w=1400&q=80',
  },
  auth: {
    signin: 'https://images.unsplash.com/photo-1624727828489-a1e03b79bba8?auto=format&fit=crop&w=1400&q=80',
    signup: 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1400&q=80',
  },
  dashboard: {
    donor: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=1200&q=80',
    healthWorker: 'https://images.unsplash.com/photo-1579684385127-1ef15d508118?auto=format&fit=crop&w=1200&q=80',
    patient: 'https://images.unsplash.com/photo-1585435557343-3b092031a831?auto=format&fit=crop&w=1200&q=80',
  },
} as const;

export const UNSPLASH_IMAGE_QUERIES = [
  'healthcare',
  'doctor patient',
  'child vaccination',
  'hospital clinic',
  'medical records',
] as const;
