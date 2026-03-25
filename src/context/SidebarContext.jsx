import { createContext, useContext, useEffect, useState } from "react";

const SidebarContext = createContext();

export const SidebarProvider = ({ children }) => {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return !window.matchMedia("(max-width: 768px)").matches;
  });

  // On small screens, default to closed sidebar to preserve content width.
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");

    // Apply immediately on mount.
    setIsOpen(!mq.matches);

    const onChange = (e) => setIsOpen(!e.matches);
    // Safari fallback: older versions may not support addEventListener on MediaQueryList.
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", onChange);
      return () => mq.removeEventListener("change", onChange);
    }

    mq.addListener(onChange);
    return () => mq.removeListener(onChange);
  }, []);

  const toggleSidebar = () => {
    // On mobile, keep sidebar in "closed" icon-only mode.
    if (typeof window !== "undefined") {
      const isMobile = window.matchMedia("(max-width: 768px)").matches;
      if (isMobile) {
        setIsOpen(false);
        return;
      }
    }

    setIsOpen((prev) => !prev);
  };

  return (
    <SidebarContext.Provider value={{ isOpen, toggleSidebar }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = () => useContext(SidebarContext);
