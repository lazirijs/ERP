export const arrayHasAny = (arr1: any[], arr2: any[]) => {
  return arr1.some(item => arr2.includes(item));
};

export default {
  arrayHasAny,
};