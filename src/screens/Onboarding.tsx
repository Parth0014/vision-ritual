import { useState, type FC, type KeyboardEvent } from "react";
import { useRitual } from "../store/RitualContext";
import type { GoalDraft, LifeArea } from "../store/types";
import { LIFE_AREAS, AFFIRMATIONS, GOAL_PLACEHOLDERS, suggestLifeArea } from "../lib/content";
import "./onboarding.css";

interface ShapedGoal {
  title: string;
  lifeArea: LifeArea;
  affirmation: string;
}

const STEPS = ["Goals", "Shape", "Build"] as const;
const GENERATE_MS = 650;

export const Onboarding: FC<{ onDone: () => void }> = ({ onDone }) => {
  const { addGoals } = useRitual();
  const [step, setStep] = useState(0);
  const [inputs, setInputs] = useState<string[]>(["", ""]);
  const [shaped, setShaped] = useState<ShapedGoal[]>([]);
  const [building, setBuilding] = useState(false);

  const canContinue = inputs.some((t) => t.trim().length > 0);

  const setInput = (i: number, value: string) =>
    setInputs((prev) => prev.map((t, idx) => (idx === i ? value : t)));

  const addInput = () => setInputs((prev) => [...prev, ""]);

  const removeInput = (i: number) =>
    setInputs((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));

  const toShapes = (list: string[]): ShapedGoal[] =>
    list
      .map((t) => t.trim())
      .filter((t) => t.length > 0)
      .map((title) => {
        const lifeArea = suggestLifeArea(title);
        return {
          title,
          lifeArea,
          affirmation: AFFIRMATIONS[lifeArea][0],
        };
      });

  const goToShape = () => {
    setShaped(toShapes(inputs));
    setStep(1);
  };

  const onEnterContinue = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && canContinue) goToShape();
  };

  const changeArea = (i: number, area: LifeArea) =>
    setShaped((prev) =>
      prev.map((g, idx) => {
        if (idx !== i) return g;
        const prevSuggestion = AFFIRMATIONS[g.lifeArea][0];
        const untouched = g.affirmation.trim().length === 0 || g.affirmation === prevSuggestion;
        return {
          ...g,
          lifeArea: area,
          affirmation: untouched ? AFFIRMATIONS[area][0] : g.affirmation,
        };
      })
    );

  const patchShaped = (i: number, patch: Partial<ShapedGoal>) =>
    setShaped((prev) => prev.map((g, idx) => (idx === i ? { ...g, ...patch } : g)));

  const generate = () => {
    setBuilding(true);
    const drafts: GoalDraft[] = shaped.map((g) => ({
      title: g.title.trim(),
      lifeArea: g.lifeArea,
      affirmation: g.affirmation.trim(),
    }));
    window.setTimeout(() => {
      addGoals(drafts);
      onDone();
    }, GENERATE_MS);
  };

  return (
    <div className="onb" role="dialog" aria-label="Goal setup">
      <ol className="onb__steps" aria-label="Setup progress">
        {STEPS.map((label, i) => (
          <li
            key={label}
            className={`onb__step${i < step ? " onb__step--done" : ""}${i === step ? " onb__step--now" : ""}`}
            aria-current={i === step ? "step" : undefined}
          >
            <span className="onb__dot" aria-hidden="true" />
            <span className="onb__label">{label}</span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <section className="onb__pane" aria-labelledby="onb-title-0">
          <p className="eyebrow">A tiny ritual to begin</p>
          <h1 className="display onb__title" id="onb-title-0">
            Where do you want to be in 12 months?
          </h1>
          <p className="sub">Write a few goals as plain sentences — your board plans itself around them.</p>

          <div className="onb__inputs">
            {inputs.map((value, i) => (
              <div className="onb__row" key={i}>
                <input
                  className="input"
                  value={value}
                  onChange={(e) => setInput(i, e.target.value)}
                  onKeyDown={onEnterContinue}
                  placeholder={GOAL_PLACEHOLDERS[i % GOAL_PLACEHOLDERS.length]}
                  aria-label={`Goal ${i + 1}`}
                />
                {inputs.length > 1 && (
                  <button
                    type="button"
                    className="onb__remove"
                    onClick={() => removeInput(i)}
                    aria-label={`Remove goal ${i + 1}`}
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="btn btn-ghost onb__add" onClick={addInput}>
              + Add another goal
            </button>
          </div>

          <div className="onb__foot">
            <button
              type="button"
              className="btn btn-primary onb__cta"
              onClick={goToShape}
              disabled={!canContinue}
            >
              Continue
            </button>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="onb__pane" aria-labelledby="onb-title-1">
          <h1 className="display onb__title" id="onb-title-1">
            Shape each goal
          </h1>
          <p className="sub">Give every goal a corner of your life — and a line to read on hard days.</p>

          <div className="onb__cards">
            {shaped.map((g, i) => (
              <article className="card onb__card" key={i}>
                <label className="field-label" htmlFor={`shape-title-${i}`}>
                  Goal {i + 1}
                </label>
                <input
                  id={`shape-title-${i}`}
                  className="input"
                  value={g.title}
                  onChange={(e) => patchShaped(i, { title: e.target.value })}
                  aria-label={`Goal ${i + 1} title`}
                />

                <div className="onb__chips" role="group" aria-label={`Life area for goal ${i + 1}`}>
                  {LIFE_AREAS.map((area) => (
                    <button
                      key={area.id}
                      type="button"
                      className={`onb__chip${area.id === g.lifeArea ? " onb__chip--on" : ""}`}
                      title={area.hint}
                      aria-pressed={area.id === g.lifeArea}
                      onClick={() => changeArea(i, area.id)}
                    >
                      {area.label}
                    </button>
                  ))}
                </div>

                <label className="field-label" htmlFor={`shape-aff-${i}`}>
                  Affirmation
                </label>
                <textarea
                  id={`shape-aff-${i}`}
                  className="textarea"
                  value={g.affirmation}
                  onChange={(e) => patchShaped(i, { affirmation: e.target.value })}
                  rows={3}
                  aria-label={`Affirmation for goal ${i + 1}`}
                />
              </article>
            ))}
          </div>

          <div className="onb__foot onb__foot--split">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(0)}>
              Back
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setStep(2)}>
              Review
            </button>
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="onb__pane" aria-labelledby="onb-title-2">
          <h1 className="display onb__title" id="onb-title-2">
            Ready to build your board?
          </h1>
          <p className="sub">One last look — then your board lays itself out around these goals.</p>

          <ul className="onb__review">
            {shaped.map((g, i) => (
              <li className="card onb__review-item" key={i}>
                <span className="onb__review-title">{g.title}</span>
                <span className="onb__review-area">
                  {LIFE_AREAS.find((a) => a.id === g.lifeArea)?.label}
                </span>
                {g.affirmation.trim().length > 0 && (
                  <span className="onb__review-aff">“{g.affirmation.trim()}”</span>
                )}
              </li>
            ))}
          </ul>

          <div className="onb__foot onb__foot--split">
            <button type="button" className="btn btn-ghost" onClick={() => setStep(1)} disabled={building}>
              Back
            </button>
            <button
              type="button"
              className="btn btn-primary onb__cta"
              onClick={generate}
              disabled={building}
            >
              {building ? "Building your board…" : "Generate my board"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
};
