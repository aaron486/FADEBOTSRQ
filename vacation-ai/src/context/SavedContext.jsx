import { createContext, useContext, useState, useCallback } from "react";

const SavedContext = createContext();

export function SavedProvider({ children }) {
  const [savedDestinations, setSavedDestinations] = useState([]);
  const [passedDestinations, setPassedDestinations] = useState([]);

  const saveDestination = useCallback((destination) => {
    setSavedDestinations((prev) => {
      if (prev.find((d) => d.id === destination.id)) return prev;
      return [...prev, destination];
    });
  }, []);

  const passDestination = useCallback((destination) => {
    setPassedDestinations((prev) => {
      if (prev.find((d) => d.id === destination.id)) return prev;
      return [...prev, destination];
    });
  }, []);

  const removeDestination = useCallback((id) => {
    setSavedDestinations((prev) => prev.filter((d) => d.id !== id));
  }, []);

  return (
    <SavedContext.Provider
      value={{
        savedDestinations,
        passedDestinations,
        saveDestination,
        passDestination,
        removeDestination,
      }}
    >
      {children}
    </SavedContext.Provider>
  );
}

export function useSaved() {
  const context = useContext(SavedContext);
  if (!context) throw new Error("useSaved must be used within SavedProvider");
  return context;
}
