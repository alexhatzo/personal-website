import { lazy, Suspense, useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { PortfolioProvider, usePortfolio } from "./context/PortfolioContext";
import Switcher from "./shared/Switcher";
import { ROUTES, currentRoute } from "./shared/routes";

const VIEWS = {
  hub: lazy(() => import("./hub/Hub")),
  game: lazy(() => import("./experiences/game")),
  cursor: lazy(() => import("./experiences/cursor")),
  scroll: lazy(() => import("./experiences/scroll")),
  plain: lazy(() => import("./components/StaticPortfolio")),
};

function AppContent() {
  const { data, isLoading, error } = usePortfolio();
  const route = currentRoute();

  useEffect(() => {
    document.documentElement.dataset.xp = route;
    document.title = route === "hub" ? "Alex Hatzo" : `Alex Hatzo · ${ROUTES[route].label}`;
  }, [route]);

  if (isLoading) return null;
  if (error || !data) {
    return (
      <p role="alert" style={{ color: "#f87171", padding: "2rem", fontFamily: "system-ui" }}>
        Failed to load portfolio data: {error ?? "not available"}
      </p>
    );
  }

  const View = VIEWS[route];
  return (
    <Suspense fallback={null}>
      <View data={data} />
      {route !== "hub" && <Switcher current={route} />}
    </Suspense>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <PortfolioProvider>
        <AppContent />
      </PortfolioProvider>
    </ErrorBoundary>
  );
}
