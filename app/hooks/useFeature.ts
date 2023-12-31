import Cookies from "js-cookie";
import { useEffect, useState } from "react";

export function useFeature(cookieKey: string) {
  const [featureEnabled, setFeatureEnabled] = useState<boolean>(false);

  useEffect(() => {
    const { search } = window.location;
    const enableFeature = search?.includes(`${cookieKey}=true`);
    const disableFeature = search?.includes(`${cookieKey}=false`);
    const toggleOnPersisted = Cookies.get(cookieKey) === "true";

    if (disableFeature) {
      Cookies.remove(cookieKey);
      setFeatureEnabled(false);
    } else if (enableFeature || toggleOnPersisted) {
      Cookies.set(cookieKey, "true", { expires: 14 });
      setFeatureEnabled(true);
    }
  }, [cookieKey]);

  return featureEnabled;
}
