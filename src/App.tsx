import React from "react";
import { RitualProvider } from "./store/RitualProvider";
import { useRitual } from "./store/RitualContext";
import { TabBar, type TabId } from "./components/TabBar";
import { Onboarding } from "./screens/Onboarding";
import { Today } from "./screens/Today";
import { Board } from "./screens/Board";
import { Goals } from "./screens/Goals";
import { Review } from "./screens/Review";
import { WallpaperModal } from "./components/WallpaperModal";

const Shell: React.FC = () => {
  const { state } = useRitual();
  const [tab, setTab] = React.useState<TabId>("today");
  const [wallpaper, setWallpaper] = React.useState<{ goalId?: string } | null>(null);
  const [wide, setWide] = React.useState(false);

  React.useEffect(() => {
    setWide(tab === "board");
  }, [tab ]);

  if (!state.onboarded) {
    return (
      <div className="app">
        <Onboarding onDone={() => setTab("today")} />
      </div>
    );
  }

  return (
    <div className={`app${wide ? " app--wide" : ""}`}>
      {tab === "today" && <Today onOpenGoals={() => setTab("goals")} />}
      {tab === "board" && (
        <Board onOpenWallpaper={(goalId) => setWallpaper({ goalId })} />
      )}
      {tab === "goals" && (
        <Goals onOpenWallpaper={(goalId) => setWallpaper({ goalId })} />
      )}
      {tab === "review" && <Review />}
      <TabBar active={tab} onChange={setTab} />
      {wallpaper && (
        <WallpaperModal
          goalId={wallpaper.goalId ?? null}
          onClose={() => setWallpaper(null)}
        />
      )}
    </div>
  );
};

const App: React.FC = () => (
  <RitualProvider>
    <Shell />
  </RitualProvider>
);

export default App;
