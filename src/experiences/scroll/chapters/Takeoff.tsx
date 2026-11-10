import type { PortfolioData } from "../../../types/portfolio";
import { Kicker } from "../bits";
import { ATH, LAX, MAP_H, MAP_W, dotPath, project, routePoints } from "../map";
import { LEG_SHARE, ROUTE_KM } from "../state";

const DOTS = dotPath();
const ROUTE = "M" + routePoints().map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L");
const [ax, ay] = project(ATH);
const [lx, ly] = project(LAX);

export default function Takeoff({ data }: { data: PortfolioData }) {
  return (
    <section className="ch ch-takeoff" data-ch="3" aria-labelledby="h-takeoff">
      <div className="to-stage">
        <header className="to-head">
          <Kicker n={3}>ATH → LAX</Kicker>
          <h2 id="h-takeoff" className="to-title">
            Takeoff
          </h2>
        </header>

        <div className="to-mapwrap">
          <svg className="to-map" viewBox={`0 0 ${MAP_W} ${MAP_H}`} aria-hidden="true">
            <path className="to-dots" d={DOTS} />
            <path className="to-plan" d={ROUTE} />
            <path className="to-flown" d={ROUTE} />
            <g className="to-city to-city--ath" transform={`translate(${ax} ${ay})`}>
              <circle className="to-ring" r="6" />
              <circle r="5" />
              <text x="-12" y="28" textAnchor="end">ATH</text>
            </g>
            <g className="to-city to-city--lax" transform={`translate(${lx} ${ly})`}>
              <circle className="to-ring" r="6" />
              <circle r="5" />
              <text x="12" y="28">LAX</text>
            </g>
            <g className="to-plane">
              <path
                transform="translate(-16 -16) scale(1.33)"
                d="M22 12c0-.7-.6-1.2-1.3-1.2h-5.2L10.4 3H8.3l2.6 7.8H6.1L4.3 8.4H2.6l1 3.6-1 3.6h1.7l1.8-2.4h4.8L8.3 21h2.1l5.1-7.8h5.2c.7 0 1.3-.5 1.3-1.2z"
              />
            </g>
          </svg>
        </div>

        <div className="to-readout">
          <p className="to-km" aria-hidden="true">
            <span className="to-km-num">{Math.round(ROUTE_KM * LEG_SHARE.takeoff).toLocaleString("en-US")}</span>
            <span className="to-km-unit">km</span>
          </p>
          <p className="to-meta">Great circle · {ROUTE_KM.toLocaleString("en-US")} km · over Greenland</p>
        </div>

        <div className="to-dest">
          <p className="to-dest-label">Destination</p>
          <p className="to-dest-value">{data.about.quickFacts.education}</p>
          <p className="to-dest-sub">{data.about.quickFacts.location}</p>
        </div>
      </div>
    </section>
  );
}
