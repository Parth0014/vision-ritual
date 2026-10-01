import React from "react";
import { useRitual } from "../store/RitualContext";
import { lifeAreaMeta, lifeAreaLabel } from "../lib/content";
import { formatDate } from "../lib/dates";
import type { Goal } from "../store/types";
import "./wallpaper.css";

const W = 1080;
const H = 1920;

const SERIF = '"Iowan Old Style", "Palatino Linotype", Palatino, Georgia, serif';
const SANS = '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, sans-serif';

type Mode = "all" | "focus";

/* ---------- canvas helpers ---------- */

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number
): void {
  if (typeof ctx.roundRect === "function") {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    return;
  }
  const rr = Math.min(r, w / 2, h / 2);
  ctx.beginPath();
  ctx.moveTo(x + rr, y);
  ctx.arcTo(x + w, y, x + w, y + h, rr);
  ctx.arcTo(x + w, y + h, x, y + h, rr);
  ctx.arcTo(x, y + h, x, y, rr);
  ctx.arcTo(x, y, x + w, y, rr);
  ctx.closePath();
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number
): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const word of words) {
    const test = line ? line + " " + word : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [""];
}

function truncateLine(
  ctx: CanvasRenderingContext2D,
  line: string,
  maxWidth: number
): string {
  if (ctx.measureText(line).width <= maxWidth) return line;
  let t = line;
  while (t.length > 1 && ctx.measureText(t + "…").width > maxWidth) {
    t = t.slice(0, -1);
  }
  return t + "…";
}

/** Wrap text, shrinking the font through `fonts` until it fits `maxLines`. */
function fitLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines: number,
  fonts: string[]
): string[] {
  for (const font of fonts) {
    ctx.font = font;
    const lines = wrapText(ctx, text, maxWidth);
    if (lines.length <= maxLines) return lines;
  }
  const last = fonts[fonts.length - 1];
  ctx.font = last;
  const lines = wrapText(ctx, text, maxWidth).slice(0, maxLines);
  lines[lines.length - 1] = truncateLine(
    ctx,
    lines[lines.length - 1],
    maxWidth
  );
  return lines;
}

function spacedText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  spacing: number,
  align: "left" | "center"
): void {
  const chars = [...text];
  const widths = chars.map((c) => ctx.measureText(c).width);
  const total =
    widths.reduce((a, b) => a + b, 0) + spacing * (chars.length - 1);
  let cx = align === "center" ? x - total / 2 : x;
  const prev = ctx.textAlign;
  ctx.textAlign = "left";
  chars.forEach((c, i) => {
    ctx.fillText(c, cx, y);
    cx += widths[i] + spacing;
  });
  ctx.textAlign = prev;
}

function drawRing(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  r: number,
  lw: number,
  frac: number,
  trackColor: string,
  barColor: string
): void {
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.strokeStyle = trackColor;
  ctx.lineWidth = lw;
  ctx.stroke();
  if (frac > 0) {
    ctx.beginPath();
    ctx.arc(
      cx,
      cy,
      r,
      -Math.PI / 2,
      -Math.PI / 2 + Math.PI * 2 * Math.min(1, Math.max(0, frac))
    );
    ctx.strokeStyle = barColor;
    ctx.lineCap = "round";
    ctx.stroke();
  }
}

function streakText(days: number): string {
  if (days <= 0) return "A new beginning";
  return days === 1 ? "1-day streak" : `${days}-day streak`;
}

function drawCheckbox(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  size: number,
  done: boolean
): void {
  if (done) {
    ctx.fillStyle = "#b4552d";
    roundRect(ctx, x, y, size, size, 9);
    ctx.fill();
    ctx.strokeStyle = "#fffdf9";
    ctx.lineWidth = 6;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(x + size * 0.26, y + size * 0.53);
    ctx.lineTo(x + size * 0.46, y + size * 0.72);
    ctx.lineTo(x + size * 0.76, y + size * 0.32);
    ctx.stroke();
  } else {
    ctx.strokeStyle = "rgba(255,255,255,0.65)";
    ctx.lineWidth = 3;
    roundRect(ctx, x, y, size, size, 9);
    ctx.stroke();
  }
}

/* ---------- card painters ---------- */

function paintGoalCard(
  ctx: CanvasRenderingContext2D,
  goal: Goal,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const meta = lifeAreaMeta(goal.lifeArea);
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, meta.color);
  grad.addColorStop(1, meta.colorDeep);
  roundRect(ctx, x, y, w, h, 24);
  ctx.fillStyle = grad;
  ctx.fill();

  const pad = 42;
  const contentW = w - pad * 2;

  // life-area eyebrow (left) / ACHIEVED (right)
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.65)";
  ctx.font = `600 22px ${SANS}`;
  spacedText(ctx, lifeAreaLabel(goal.lifeArea).toUpperCase(), x + pad, y + 62, 6, "left");
  if (goal.achieved) {
    ctx.fillStyle = "#e9c96a";
    ctx.font = `700 22px ${SANS}`;
    const prev = ctx.textAlign;
    ctx.textAlign = "right";
    const chars = [..."ACHIEVED"];
    const widths = chars.map((c) => ctx.measureText(c).width);
    const total = widths.reduce((a, b) => a + b, 0) + 6 * (chars.length - 1);
    let cx = x + w - pad - total;
    ctx.textAlign = "left";
    chars.forEach((c, i) => {
      ctx.fillText(c, cx, y + 62);
      cx += widths[i] + 6;
    });
    ctx.textAlign = prev;
  }

  // title, shrinking to fit 3 lines
  const titleLines = fitLines(ctx, goal.title, contentW, 3, [
    `700 44px ${SANS}`,
    `700 38px ${SANS}`,
  ]);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "left";
  let ty = y + 128;
  titleLines.forEach((ln, i) => {
    ctx.fillText(ln, x + pad, ty + i * 58);
  });

  // affirmation, 1–2 lines
  let bottom = ty + titleLines.length * 58;
  if (goal.affirmation.trim()) {
    ctx.fillStyle = "rgba(255,255,255,0.78)";
    const affLines = fitLines(ctx, goal.affirmation, contentW, 2, [
      `400 28px ${SANS}`,
    ]);
    affLines.forEach((ln, i) => {
      ctx.fillText(ln, x + pad, bottom + 16 + i * 40);
    });
    bottom += affLines.length * 40 + 16;
  }

  // progress ring + streak, anchored to the card bottom
  const ringCY = y + h - 112;
  const ringCX = x + pad + 54;
  drawRing(
    ctx,
    ringCX,
    ringCY,
    50,
    14,
    goal.progress / 100,
    "rgba(255,255,255,0.35)",
    "#ffffff"
  );
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 28px ${SANS}`;
  ctx.textAlign = "center";
  ctx.fillText(`${Math.round(goal.progress)}%`, ringCX, ringCY + 10);
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.9)";
  ctx.font = `600 30px ${SANS}`;
  ctx.fillText(streakText(goal.streakDays), ringCX + 84, ringCY + 12);
}

function paintHeroCard(
  ctx: CanvasRenderingContext2D,
  goal: Goal,
  x: number,
  y: number,
  w: number,
  h: number
): void {
  const meta = lifeAreaMeta(goal.lifeArea);
  const grad = ctx.createLinearGradient(0, y, 0, y + h);
  grad.addColorStop(0, meta.color);
  grad.addColorStop(1, meta.colorDeep);
  roundRect(ctx, x, y, w, h, 40);
  ctx.fillStyle = grad;
  ctx.fill();

  const pad = 70;
  const cx0 = x + pad;
  const contentW = w - pad * 2;

  // eyebrow
  ctx.textAlign = "left";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = `600 26px ${SANS}`;
  spacedText(ctx, lifeAreaLabel(goal.lifeArea).toUpperCase(), cx0, y + 84, 8, "left");
  if (goal.achieved) {
    ctx.fillStyle = "#e9c96a";
    ctx.font = `700 26px ${SANS}`;
    const prev = ctx.textAlign;
    ctx.textAlign = "right";
    ctx.fillText("ACHIEVED", x + w - pad, y + 84);
    ctx.textAlign = prev;
  }

  // title (serif, up to 2 lines)
  const titleLines = fitLines(ctx, goal.title, contentW, 2, [
    `600 70px ${SERIF}`,
    `600 60px ${SERIF}`,
  ]);
  ctx.fillStyle = "#ffffff";
  let cy = y + 190;
  titleLines.forEach((ln, i) => {
    ctx.fillText(ln, cx0, cy + i * 88);
  });
  cy += titleLines.length * 88;

  // affirmation
  if (goal.affirmation.trim()) {
    const affLines = fitLines(ctx, goal.affirmation, contentW, 2, [
      `400 33px ${SANS}`,
    ]);
    ctx.fillStyle = "rgba(255,255,255,0.82)";
    affLines.forEach((ln, i) => {
      ctx.fillText(ln, cx0, cy + 24 + i * 50);
    });
    cy += affLines.length * 50 + 24;
  }

  // large progress ring + streak
  const ringCY = cy + 150;
  const ringCX = cx0 + 95;
  drawRing(
    ctx,
    ringCX,
    ringCY,
    95,
    26,
    goal.progress / 100,
    "rgba(255,255,255,0.35)",
    "#ffffff"
  );
  ctx.fillStyle = "#ffffff";
  ctx.font = `700 56px ${SANS}`;
  ctx.textAlign = "center";
  ctx.fillText(`${Math.round(goal.progress)}%`, ringCX, ringCY + 20);
  ctx.textAlign = "left";
  ctx.font = `600 84px ${SERIF}`;
  ctx.fillText(`${goal.streakDays}`, ringCX + 170, ringCY + 12);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = `600 32px ${SANS}`;
  ctx.fillText("day streak", ringCX + 170, ringCY + 66);
  cy = ringCY + 130;

  // milestones
  const milestones = goal.milestones.slice(0, 5);
  if (milestones.length > 0) {
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.font = `700 24px ${SANS}`;
    spacedText(ctx, "MILESTONES", cx0, cy + 20, 7, "left");
    cy += 58;
    milestones.forEach((m) => {
      drawCheckbox(ctx, cx0, cy + 4, 36, m.done);
      ctx.font = `500 32px ${SANS}`;
      ctx.fillStyle = m.done
        ? "rgba(255,255,255,0.72)"
        : "rgba(255,255,255,0.95)";
      const label = truncateLine(ctx, m.label, contentW - 70);
      const tx = cx0 + 58;
      const midY = cy + 30;
      ctx.fillText(label, tx, midY + 11);
      if (m.done) {
        const tw = ctx.measureText(label).width;
        ctx.strokeStyle = "rgba(255,255,255,0.6)";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.moveTo(tx, midY);
        ctx.lineTo(tx + tw, midY);
        ctx.stroke();
      }
      cy += 64;
    });
  }

  // if-then plan
  const plan = goal.ifThenPlan.trim() || "One small step each day.";
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = `700 24px ${SANS}`;
  spacedText(ctx, "MY PLAN", cx0, cy + 26, 7, "left");
  const planLines = fitLines(ctx, plan, contentW, 3, [`italic 400 34px ${SERIF}`]);
  ctx.fillStyle = "rgba(255,255,255,0.94)";
  planLines.forEach((ln, i) => {
    ctx.fillText(ln, cx0, cy + 84 + i * 52);
  });
}

/* ---------- main draw ---------- */

interface DrawArgs {
  mode: Mode;
  focusId: string | null;
  goals: Goal[];
  date: string;
}

function drawWallpaper(ctx: CanvasRenderingContext2D, args: DrawArgs): void {
  const { mode, focusId, goals, date } = args;

  // background
  ctx.fillStyle = "#faf6ef";
  ctx.fillRect(0, 0, W, H);

  // header
  ctx.textAlign = "center";
  ctx.fillStyle = "#8d8471";
  ctx.font = `600 34px ${SANS}`;
  spacedText(ctx, "VISION RITUAL", W / 2, 96, 14, "center");
  ctx.fillStyle = "#221d15";
  ctx.font = `600 56px ${SERIF}`;
  ctx.fillText(date, W / 2, 168);

  // thin accent line under header
  ctx.fillStyle = "#b4552d";
  roundRect(ctx, W / 2 - 60, 200, 120, 5, 2.5);
  ctx.fill();

  if (mode === "all") {
    const shown = goals.slice(0, 6);
    const extra = goals.length - shown.length;
    const topY = 250;
    const botY = extra > 0 ? 1640 : 1700;
    const margin = 60;
    const gap = 36;
    const rows = Math.max(1, Math.ceil(shown.length / 2));
    const single = shown.length === 1;
    const cardW = single
      ? W - margin * 2
      : (W - margin * 2 - gap) / 2;
    const cardH = Math.min(600, (botY - topY - gap * (rows - 1)) / rows);

    shown.forEach((goal, i) => {
      const col = single ? 0 : i % 2;
      const row = single ? 0 : Math.floor(i / 2);
      const x = single
        ? margin
        : margin + col * (cardW + gap);
      const y = topY + row * (cardH + gap);
      paintGoalCard(ctx, goal, x, y, cardW, cardH);
    });

    if (extra > 0) {
      ctx.fillStyle = "#8d8471";
      ctx.font = `500 30px ${SANS}`;
      ctx.textAlign = "center";
      ctx.fillText(`…and ${extra} more on your board`, W / 2, 1696);
    }
  } else {
    const goal = goals.find((g) => g.id === focusId) ?? goals[0];
    if (goal) {
      paintHeroCard(ctx, goal, 60, 245, 960, 1420);
    }
  }

  // footer
  ctx.textAlign = "center";
  ctx.fillStyle = "#8d8471";
  ctx.font = `500 32px ${SANS}`;
  ctx.fillText("Small steps, daily.", W / 2, 1812);
  ctx.font = `600 24px ${SANS}`;
  spacedText(ctx, "vision ritual", W / 2, 1868, 8, "center");
}

/* ---------- component ---------- */

export const WallpaperModal: React.FC<{
  goalId: string | null;
  onClose: () => void;
}> = ({ goalId, onClose }) => {
  const { state } = useRitual();
  const goals = state.goals;

  const [mode, setMode] = React.useState<Mode>(goalId ? "focus" : "all");
  const [focusId, setFocusId] = React.useState<string | null>(
    goalId ?? goals[0]?.id ?? null
  );
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const [dataUrl, setDataUrl] = React.useState<string>("");

  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = W;
    canvas.height = H;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    drawWallpaper(ctx, {
      mode,
      focusId,
      goals,
      date: formatDate(new Date().toISOString()),
    });
    setDataUrl(canvas.toDataURL("image/png"));
  }, [mode, focusId, goals]);

  const switchToFocus = () => {
    if (!focusId && goals.length > 0) {
      setFocusId(goals[0].id);
    }
    setMode("focus");
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = "vision-ritual-wallpaper.png";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    }, "image/png");
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal wall"
        role="dialog"
        aria-modal="true"
        aria-label="Export wallpaper"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal__grab" />
        <h2 className="display wall__title">Lock-screen wallpaper</h2>
        <p className="sub wall__sub">
          A calm lock-screen reminder of what you are working toward.
        </p>

        {goals.length === 0 ? (
          <div className="wall__empty">
            <p>
              No goals yet — your wallpaper will appear here once you set
              goals.
            </p>
            <button className="btn btn-ghost" onClick={onClose} type="button">
              Close
            </button>
          </div>
        ) : (
          <>
            <div className="wall__seg" role="tablist" aria-label="Wallpaper mode">
              <button
                type="button"
                role="tab"
                aria-selected={mode === "all"}
                className={mode === "all" ? "is-active" : ""}
                onClick={() => setMode("all")}
              >
                All goals
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={mode === "focus"}
                className={mode === "focus" ? "is-active" : ""}
                onClick={switchToFocus}
              >
                Focus
              </button>
            </div>

            {mode === "focus" && (
              <div className="wall__chips" aria-label="Choose a goal to feature">
                {goals.map((g) => (
                  <button
                    key={g.id}
                    type="button"
                    aria-pressed={focusId === g.id}
                    className={focusId === g.id ? "is-active" : ""}
                    onClick={() => setFocusId(g.id)}
                  >
                    {g.title}
                  </button>
                ))}
              </div>
            )}

            <canvas
              ref={canvasRef}
              className="wall__canvas"
              aria-hidden="true"
            />
            {dataUrl && (
              <img
                className="wall__preview"
                src={dataUrl}
                alt="Lock-screen wallpaper preview"
              />
            )}

            <div className="wall__actions">
              <button
                type="button"
                className="btn btn-primary"
                onClick={handleDownload}
                disabled={!dataUrl}
              >
                Download PNG
              </button>
              <button
                type="button"
                className="btn btn-ghost"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
