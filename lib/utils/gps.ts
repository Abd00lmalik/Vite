export interface GPSCoords {
  lat: number;
  lng: number;
  accuracy: number;
}

const FALLBACK_COORDS: GPSCoords = { lat: 6.5244, lng: 3.3792, accuracy: 999 };

export function captureGPS(): Promise<GPSCoords> {
  return new Promise((resolve) => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      resolve(FALLBACK_COORDS);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
        });
      },
      () => {
        resolve(FALLBACK_COORDS);
      },
      {
        timeout: 5000,
        enableHighAccuracy: true,
      }
    );
  });
}

