import { FareCalculation, PassengerType } from '../types';

const BASE_FARE = 13;
const BASE_DISTANCE = 4;
const ADDITIONAL_FARE_PER_KM = 1.8;

export const calculateFare = (distance: number, passengerType: PassengerType): FareCalculation => {
  const baseFare = BASE_FARE;
  const additionalDistance = Math.max(0, distance - BASE_DISTANCE);
  const additionalFare = Math.ceil(additionalDistance) * ADDITIONAL_FARE_PER_KM;
  let totalFare = baseFare + additionalFare;

  // Apply discounts
  let discountedFare: number | undefined = undefined;
  if (passengerType === 'student') {
    discountedFare = totalFare * 0.8;
  } else if (passengerType === 'senior' || passengerType === 'pwd') {
    discountedFare = totalFare * 0.5;
  }

  // Round to nearest 0.25
  totalFare = Math.round(totalFare * 4) / 4;
  if (discountedFare !== undefined) {
    discountedFare = Math.round(discountedFare * 4) / 4;
  }

  return {
    distance,
    baseFare,
    additionalFare,
    totalFare,
    discountedFare,
  };
}; 