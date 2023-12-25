import { useEffect, useState } from "react";

export function useDebounce(value: any, wait = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => {
      setDebounced(value);
    }, wait);

    return () => {
      window.clearTimeout(id);
    };
  }, [value, wait]);

  return debounced;
}
