// Idol rules: decides whether the home-immersion option applies.
import { config } from '../config/index.js';

export function assessOptions({ material, heightFt }) {
  const maxHeight = config.rules.homeImmersionMaxHeightFt;
  const isClay = material === 'CLAY';
  const smallEnough = heightFt <= maxHeight;
  const homeImmersionEligible = isClay && smallEnough;

  let reason;
  if (homeImmersionEligible) {
    reason = `A clay idol of ${heightFt} ft is small enough to immerse in a large container at home.`;
  } else if (!isClay) {
    reason =
      material === 'PLASTER_OF_PARIS'
        ? 'Plaster of Paris does not dissolve like clay, so a designated facility is the better option.'
        : 'The material is not confirmed as clay, so a designated facility is the safer option.';
  } else {
    reason = `Home immersion is offered for clay idols up to ${maxHeight} ft. Larger idols are better handled at a designated facility.`;
  }

  return { homeImmersionEligible, homeImmersionMaxHeightFt: maxHeight, reason };
}
