import { createContext, useContext, useState } from "react";

interface NavigationPreviewContextValue {
  previewPath: string | null;
  setPreviewPath: (path: string | null) => void;
  clearPreviewPath: () => void;
}

const NavigationPreviewContext = createContext<NavigationPreviewContextValue | null>(null);

export const NavigationPreviewProvider = ({ children }: { children: React.ReactNode }) => {
  const [previewPath, setPreviewPath] = useState<string | null>(null);

  return (
    <NavigationPreviewContext.Provider
      value={{
        previewPath,
        setPreviewPath,
        clearPreviewPath: () => setPreviewPath(null),
      }}
    >
      {children}
    </NavigationPreviewContext.Provider>
  );
};

export const useNavigationPreview = () => {
  const context = useContext(NavigationPreviewContext);

  if (!context) {
    throw new Error("useNavigationPreview must be used within NavigationPreviewProvider");
  }

  return context;
};
