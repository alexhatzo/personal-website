import { useLayoutEffect, useMemo, useRef } from "react";
import type { PortfolioData } from "../../types/portfolio";
import Hud from "./Hud";
import { startJourney } from "./journey";
import { chapterMeta } from "./state";
import Boarding from "./chapters/Boarding";
import Athens from "./chapters/Athens";
import FirstGigs from "./chapters/FirstGigs";
import Takeoff from "./chapters/Takeoff";
import P1 from "./chapters/P1";
import OneOff from "./chapters/OneOff";
import SideQuests from "./chapters/SideQuests";
import Toolkit from "./chapters/Toolkit";
import OffHours from "./chapters/OffHours";
import Arrivals from "./chapters/Arrivals";
import "lenis/dist/lenis.css";
import "./scroll.css";

/*
 * Journey: the résumé as a flight from Athens to Los Angeles.
 * Debug params (headless screenshots, e2e):
 *   ?at=0..1                     jump to that fraction of total scroll, scrubbed timelines settled
 *   ?chapter=n[&offset=0..1]     jump to the start of chapter n (0-9), optionally part-way through it
 *   ?nosmooth=1                  native scrolling, no Lenis
 */
export default function ScrollExperience({ data }: { data: PortfolioData }) {
  const root = useRef<HTMLDivElement>(null);
  const chapters = useMemo(() => chapterMeta(data), [data]);

  useLayoutEffect(() => startJourney(root.current!, chapters), [chapters]);

  return (
    <div className="sx" ref={root}>
      <Hud chapters={chapters} />
      <main>
        <Boarding data={data} />
        <Athens data={data} />
        <FirstGigs data={data} />
        <Takeoff data={data} />
        <P1 data={data} />
        <OneOff data={data} />
        <SideQuests data={data} />
        <Toolkit data={data} />
        <OffHours data={data} />
        <Arrivals data={data} />
      </main>
    </div>
  );
}
