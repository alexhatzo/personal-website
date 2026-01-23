import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { PortfolioData } from "../types/portfolio";

interface PortfolioContextType {
  data: PortfolioData | null;
  isLoading: boolean;
  error: string | null;
}

const PortfolioContext = createContext<PortfolioContextType | undefined>(undefined);

interface PortfolioProviderProps {
  children: ReactNode;
}

export function PortfolioProvider({ children }: PortfolioProviderProps) {
  const [data, setData] = useState<PortfolioData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPortfolioData() {
      try {
        const response = await fetch("/data/portfolio.json");
        if (!response.ok) {
          throw new Error(`Failed to fetch portfolio data: ${response.status}`);
        }
        const portfolioData: PortfolioData = await response.json();
        setData(portfolioData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error occurred");
        if (import.meta.env.DEV) {
          console.error("Error loading portfolio data:", err);
        }
      } finally {
        setIsLoading(false);
      }
    }

    fetchPortfolioData();
  }, []);

  return (
    <PortfolioContext.Provider value={{ data, isLoading, error }}>
      {children}
    </PortfolioContext.Provider>
  );
}

export function usePortfolio(): PortfolioContextType {
  const context = useContext(PortfolioContext);
  if (context === undefined) {
    throw new Error("usePortfolio must be used within a PortfolioProvider");
  }
  return context;
}

// Helper hook that throws if data is not loaded (for components that require data)
export function usePortfolioData(): PortfolioData {
  const { data, isLoading, error } = usePortfolio();
  
  if (isLoading) {
    throw new Error("Portfolio data is still loading");
  }
  
  if (error || !data) {
    throw new Error(error || "Portfolio data not available");
  }
  
  return data;
}
