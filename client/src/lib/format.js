export const formatDistance = (km) => {
  if (km == null) return '';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km.toFixed(1)} km`;
};

export const formatDuration = (minutes) => {
  if (minutes == null) return '';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  return rest ? `${hours} h ${rest} min` : `${hours} h`;
};

export const formatNumber = (value) => new Intl.NumberFormat('en-IN').format(value ?? 0);
export const percent = (value) => `${Math.round((value ?? 0) * 100)}%`;
