// Browser geolocation wrapped in a promise with friendly error codes.
export function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(Object.assign(new Error('Location is not supported on this device.'), { code: 'UNSUPPORTED' }));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracyM: position.coords.accuracy,
        }),
      (error) => {
        const messages = {
          1: ['DENIED', 'Location permission was denied. You can allow it in your browser settings, or pick your area below.'],
          2: ['UNAVAILABLE', 'Your location could not be determined. Pick your area below instead.'],
          3: ['TIMEOUT', 'Finding your location took too long. Try again or pick your area below.'],
        };
        const [code, message] = messages[error.code] ?? ['UNAVAILABLE', 'Your location could not be determined.'];
        reject(Object.assign(new Error(message), { code }));
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 60000 },
    );
  });
}
