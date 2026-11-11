"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { useState } from "react";
import type { CSSProperties } from "react";
import { tourHotspotCount, tourHouse, tourScenes, type TourScene } from "@/data/tour-data";

const TourViewingScene = dynamic(() => import("@/components/tour-viewing-scene"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-[#b8d8e8]" aria-hidden="true" />,
});

const TourLandlordScene = dynamic(() => import("@/components/tour-landlord-scene"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-[#d9b58f]" aria-hidden="true" />,
});

const TourSigningScene = dynamic(() => import("@/components/tour-signing-scene"), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-[#d7ad7d]" aria-hidden="true" />,
});

function SceneIllustration({ sceneId }: { sceneId: TourScene["id"] }) {
  if (sceneId === "viewing") {
    return <TourViewingScene />;
  }

  if (sceneId === "landlord") {
    return <TourLandlordScene />;
  }

  return <TourSigningScene />;
}

export function TourExperience() {
  const [sceneIndex, setSceneIndex] = useState(0);
  const [activeHotspotId, setActiveHotspotId] = useState<string | null>(null);
  const [visitedIds, setVisitedIds] = useState<string[]>([]);
  const [showSummary, setShowSummary] = useState(false);

  const scene = tourScenes[sceneIndex];
  const activeHotspot = scene.hotspots.find((hotspot) => hotspot.id === activeHotspotId) ?? null;
  const isLastScene = sceneIndex === tourScenes.length - 1;

  const openHotspot = (id: string) => {
    setActiveHotspotId(id);
    setVisitedIds((current) => (current.includes(id) ? current : [...current, id]));
  };

  const goToScene = (index: number) => {
    setSceneIndex(index);
    setActiveHotspotId(null);
    setShowSummary(false);
  };

  const restart = () => {
    setSceneIndex(0);
    setActiveHotspotId(null);
    setVisitedIds([]);
    setShowSummary(false);
  };

  return (
    <section className="panel p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <p className="eyebrow">示範房</p>
            <span className="inline-flex rounded-full border border-white/10 bg-black/30 px-2 py-1 text-xs text-[color:var(--text-muted)]">
              情境示範
            </span>
          </div>
          <h2 className="mt-3 font-serif text-3xl text-[color:var(--text-primary)]">{tourHouse.title}</h2>
          <p className="mt-2 text-sm text-[color:var(--text-secondary)]">{tourHouse.description}</p>
        </div>
        <p className="rounded-full border border-[color:var(--primary)]/30 bg-[color:var(--primary)]/8 px-4 py-2 text-sm text-[color:var(--text-primary)]">
          已檢查 {visitedIds.length} / {tourHotspotCount} 項
        </p>
      </div>

      <div className="mb-6 inline-flex flex-wrap rounded-full border border-white/10 bg-black/30 p-1 text-sm">
        {tourScenes.map((item, index) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={!showSummary && sceneIndex === index}
            onClick={() => goToScene(index)}
            className={`rounded-full px-4 py-2 transition ${
              !showSummary && sceneIndex === index
                ? "bg-[color:var(--primary)] font-semibold text-white"
                : "text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)]"
            }`}
          >
            {item.title}
          </button>
        ))}
      </div>

      {showSummary ? (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { title: "你看過的", visited: true },
              { title: "還沒看的", visited: false },
            ].map((group) => (
              <div key={group.title} className="rounded-3xl border border-white/10 bg-white/[0.03] p-5">
                <h3 className="text-lg font-semibold text-[color:var(--text-primary)]">{group.title}</h3>
                <ul className="mt-3 space-y-2 text-sm leading-7 text-[color:var(--text-secondary)]">
                  {tourScenes.flatMap((item) =>
                    item.hotspots
                      .filter((hotspot) => visitedIds.includes(hotspot.id) === group.visited)
                      .map((hotspot) => (
                        <li key={hotspot.id}>
                          {item.title}・{hotspot.label}
                        </li>
                      )),
                  )}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href={tourHouse.checkHref} className="button-primary justify-center">
              帶著這間房去查核
            </Link>
            <Link href={tourHouse.contractHref} className="button-secondary justify-center">
              檢查這份合約
            </Link>
            <button type="button" className="button-secondary justify-center" onClick={restart}>
              重新開始
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div>
            <p className="mb-3 text-sm text-[color:var(--text-secondary)]">{scene.description}</p>
            <div className="tour-3d-frame relative aspect-[4/3] w-full overflow-hidden sm:aspect-video">
              <SceneIllustration sceneId={scene.id} />
              {scene.hotspots.map((hotspot, index) => {
                const visited = visitedIds.includes(hotspot.id);
                const active = hotspot.id === activeHotspotId;

                return (
                  <button
                    key={hotspot.id}
                    type="button"
                    aria-label={hotspot.label}
                    aria-pressed={active}
                    aria-controls={active ? "tour-hotspot-dialog" : undefined}
                    onClick={() => openHotspot(hotspot.id)}
                    style={{ left: `${hotspot.x}%`, top: `${hotspot.y}%` }}
                    className={`absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition sm:text-sm ${
                      active
                        ? "border-[color:var(--primary)] bg-[color:var(--primary)] text-white"
                        : visited
                          ? "border-[color:var(--primary)]/40 bg-black/70 text-[color:var(--primary-soft)]"
                          : "border-white/20 bg-black/70 text-[color:var(--text-primary)]"
                    }`}
                  >
                    <span>{visited ? "✓" : index + 1}</span>
                    <span>{hotspot.label}</span>
                  </button>
                );
              })}

              {activeHotspot ? (
                <div
                  id="tour-hotspot-dialog"
                  role="dialog"
                  aria-modal="false"
                  aria-labelledby="tour-hotspot-title"
                  style={
                    {
                      "--hotspot-x": `${activeHotspot.x}%`,
                      "--hotspot-y": `${activeHotspot.y}%`,
                    } as CSSProperties
                  }
                  className="tour-hotspot-dialog absolute z-20 max-h-[72%] overflow-y-auto rounded-2xl border border-white/15 bg-[#121827]/95 p-4 shadow-2xl backdrop-blur-md sm:rounded-3xl sm:p-5"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="eyebrow text-xs">注意事項</p>
                      <h3 id="tour-hotspot-title" className="mt-1 text-xl font-semibold text-[color:var(--text-primary)]">
                        {activeHotspot.label}
                      </h3>
                    </div>
                    <button
                      type="button"
                      aria-label="關閉說明"
                      onClick={() => setActiveHotspotId(null)}
                      className="grid size-9 shrink-0 place-items-center rounded-full border border-white/15 bg-white/5 text-lg text-[color:var(--text-secondary)] transition hover:bg-white/10 hover:text-white"
                    >
                      ×
                    </button>
                  </div>
                  <p className="mt-3 text-sm leading-7 text-[color:var(--text-primary)]">{activeHotspot.attention}</p>
                  <div className="mt-4 rounded-2xl border border-[color:var(--primary)]/20 bg-[color:var(--primary)]/8 px-4 py-3">
                    <p className="text-xs font-semibold text-[color:var(--primary-soft)]">法規依據</p>
                    <p className="mt-1 text-xs leading-6 text-[color:var(--text-secondary)]">{activeHotspot.basis}</p>
                  </div>
                </div>
              ) : (
                <p className="absolute bottom-3 left-3 z-10 rounded-full border border-white/15 bg-black/70 px-3 py-2 text-xs text-[color:var(--text-primary)] backdrop-blur-sm sm:bottom-5 sm:left-5 sm:text-sm">
                  點選場景標記查看注意事項
                </p>
              )}
            </div>
          </div>

          <div className="flex justify-end">
            <button
              type="button"
              className="button-secondary min-w-52 justify-center"
              onClick={() => (isLastScene ? setShowSummary(true) : goToScene(sceneIndex + 1))}
            >
              {isLastScene ? "看看檢查了哪些" : `下一站：${tourScenes[sceneIndex + 1].title}`}
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
