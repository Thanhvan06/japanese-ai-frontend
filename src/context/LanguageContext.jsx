import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState(() => {
    // Load from localStorage or default to Vietnamese
    return localStorage.getItem("language") || "vi";
  });

  useEffect(() => {
    // Save to localStorage whenever language changes
    localStorage.setItem("language", language);
  }, [language]);

  const toggleLanguage = () => {
    setLanguage((prev) => (prev === "vi" ? "en" : "vi"));
  };

  const setLanguageValue = (lang) => {
    if (lang === "vi" || lang === "en") {
      setLanguage(lang);
    }
  };

  return (
    <LanguageContext.Provider value={{ language, toggleLanguage, setLanguage: setLanguageValue }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within LanguageProvider");
  }
  return context;
};

