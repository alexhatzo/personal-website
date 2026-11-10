// Plain <a href> navigation between experiences: a full page load is the cheapest clean WebGL teardown.
export const ROUTES = {
  hub: { path: "/", label: "All versions" },
  game: { path: "/game", label: "Island" },
  cursor: { path: "/cursor", label: "Field" },
  scroll: { path: "/scroll", label: "Journey" },
  plain: { path: "/plain", label: "Plain résumé" },
} as const;

export type RouteId = keyof typeof ROUTES;

export function currentRoute(): RouteId {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const hit = (Object.keys(ROUTES) as RouteId[]).find((id) => ROUTES[id].path === path);
  return hit ?? "hub";
}
