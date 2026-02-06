const dictionary = '0123456789abcdefghijklmnopqrstuvwxyz';

export const generateRandomHandle = () => {
  const random = Array.from({ length: 5 }, (_) => dictionary[Math.floor(Math.random() * dictionary.length)]).join('');

  console.log(`Generated random handle: ${random}`);

  return random;
};
