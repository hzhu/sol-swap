export const getProvider = () => {
  if ("phantom" in window) {
    const provider = window.phantom?.solana;

    if (provider?.isPhantom) {
      return provider;
    }
  }

  window.open("https://phantom.app/", "_blank");
};

export function lamportsToTokenUnits(lamports: number, decimals: number) {
  return lamports / Math.pow(10, decimals);
}

export function subtractFloats(a: number, b: number, precision = 9) {
  const scale = Math.pow(10, precision);
  const scaledA = a * scale;
  const scaledB = b * scale;
  const result = scaledA - scaledB;
  return result / scale;
}
