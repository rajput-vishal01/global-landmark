"use client";

import Link from "next/link";
import { useOptimistic, useState, useTransition } from "react";
import { DealStageQuickForm } from "@/components/admin/DealStageQuickForm";
import { Card, deskRowLink } from "@/components/admin/desk";
import { formatIndianShort } from "@/lib/attributes";
import { DEAL_STAGES } from "@/lib/taxonomy/brokerage";
import { updateDealStage } from "@/app/admin/(panel)/crm/deal-actions";
import type { Row } from "@/app/admin/(panel)/crm/deals/_views";

/**
 * The pipeline board, with native HTML5 drag-and-drop between stage columns.
 *
 * Client because a drag is a client interaction; the rows still come from the
 * server component that loaded them, as plain serialisable props. A dropped
 * card goes through `updateDealStage` — the same server action the Select +
 * Move control on each card posts to. One action, two ways to reach it.
 *
 * Drag-and-drop is NOT keyboard accessible and will not become so. The Select
 * on every card is the accessible path and stays; it is not clutter to tidy
 * away once the board drags.
 */

/** "Imperial Residency · GL-ZKP-26-0003", or a plain note when nothing is linked. */
// ponytail: a three-line copy of the same helper in _views.tsx. Importing it
// would drag that whole server module (ListView, ListFilters) across the
// client boundary to save three lines, which is the worse trade.
function propertyLabel(property: Row["deal"]["property"]): string {
  if (!property) return "No property linked";
  return property.refCode ? `${property.title} · ${property.refCode}` : property.title;
}

export function DealBoard({ rows }: { rows: Row[] }) {
  // The card sits in its new column the moment it is dropped. React throws
  // this away as soon as the transition ends: on success the action has
  // revalidated /admin/crm/deals so the fresh `rows` prop already agrees, and
  // on failure the prop never changed, so the card lands back where it began.
  const [board, moveOptimistic] = useOptimistic(
    rows,
    (state: Row[], move: { id: number; stage: string }) =>
      state.map((r) =>
        r.deal.id === move.id ? { ...r, deal: { ...r.deal, stage: move.stage } } : r
      )
  );

  const [, startTransition] = useTransition();
  const [dragId, setDragId] = useState<number | null>(null);
  const [overStage, setOverStage] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const dragStage = dragId == null ? null : rows.find((r) => r.deal.id === dragId)?.deal.stage;

  function move(id: number, stage: string) {
    const row = rows.find((r) => r.deal.id === id);
    if (!row || row.deal.stage === stage) return;

    const who = row.deal.client?.name ?? `Deal ${id}`;
    const from = row.deal.stage;
    setError(null);

    startTransition(async () => {
      moveOptimistic({ id, stage });
      setNote(`Moving ${who} to ${stage}.`);

      const formData = new FormData();
      formData.set("id", String(id));
      formData.set("stage", stage);

      // A silent revert is worse than no drag at all: whatever happens, the
      // card snapping back has a sentence next to it saying why.
      //
      // try/catch as well as the returned error because the action does not
      // only return one — requireAdmin() throws outright on an expired
      // session, and an uncaught rejection here would revert the card with
      // nothing said. Next masks the real message in production, so this
      // reports the outcome rather than the cause.
      let failure: string | null = null;
      try {
        failure = (await updateDealStage({}, formData)).error ?? null;
      } catch {
        failure = "The change did not save. Reload and check you are still signed in.";
      }

      if (failure) {
        setNote("");
        setError(`${who} is still in ${from} — ${failure}`);
      } else {
        setNote(`${who} moved to ${stage}.`);
      }
    });
  }

  const columns = DEAL_STAGES.map((stage) => ({
    stage,
    deals: board.filter((r) => r.deal.stage === stage),
  }));

  return (
    <div className="flex flex-col gap-3">
      <p className="text-[12px] text-muted">
        Drag a card onto another stage to move it, or use the stage control on the card.
      </p>

      {/* The drag itself is silent to a screen reader, so the outcome is not. */}
      <p role="status" aria-live="polite" className="sr-only">
        {note}
      </p>
      {error && (
        <p role="alert" className="text-[13px] text-error">
          {error}
        </p>
      )}

      {/* One row of stage columns from md up, each at least 200px wide: the
          board scrolls sideways inside itself when the eight columns don't
          fit, instead of squeezing cards or spilling into the next column.
          Phones stack the stages. */}
      <div className="grid grid-cols-1 gap-4 overflow-x-auto pb-2 md:auto-cols-[minmax(200px,1fr)] md:grid-flow-col md:grid-cols-none">
        {columns.map(({ stage, deals }) => {
          // No point lighting up the column the card already sits in — that
          // drop is a no-op and the highlight would promise otherwise.
          const isTarget = overStage === stage && dragStage !== stage;

          return (
            <div
              key={stage}
              aria-dropeffect={dragId != null && dragStage !== stage ? "move" : "none"}
              onDragOver={(e) => {
                // Without preventDefault the browser refuses the drop outright.
                e.preventDefault();
                e.dataTransfer.dropEffect = "move";
                if (overStage !== stage) setOverStage(stage);
              }}
              onDragLeave={(e) => {
                // dragleave also fires on crossing into a child, which would
                // flicker the highlight off over every card in the column.
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) {
                  setOverStage(null);
                }
              }}
              onDrop={(e) => {
                e.preventDefault();
                setOverStage(null);
                // Read the id off the drag, not off state: a drag begun in
                // another window has no state here to read.
                const dropped = Number(e.dataTransfer.getData("text/plain"));
                setDragId(null);
                if (Number.isInteger(dropped) && dropped > 0) move(dropped, stage);
              }}
              // An outline, not a fill: gold marks edges and never grounds.
              // Held at outline-2 in both states so nothing shifts on hover.
              className={`flex min-w-0 flex-col gap-3 rounded-[10px] p-2 outline-2 transition-colors ${
                isTarget ? "bg-raise outline-gold" : "outline-transparent"
              }`}
            >
              <h2 className="desk-eyebrow">
                {stage} <span className="tabular-nums">({deals.length})</span>
              </h2>
              <div className="flex min-h-14 flex-col gap-3">
                {deals.length === 0 ? (
                  <p className="text-[13px] text-muted">No deals.</p>
                ) : (
                  deals.map(({ deal, amount, pending }) => (
                    <div
                      key={deal.id}
                      draggable
                      aria-grabbed={dragId === deal.id}
                      onDragStart={(e) => {
                        // Firefox will not start a drag with no payload set.
                        e.dataTransfer.setData("text/plain", String(deal.id));
                        e.dataTransfer.effectAllowed = "move";
                        // Deferred one frame: the browser snapshots the drag
                        // image at the end of this handler, and dimming the
                        // card before then dims the image it drags too.
                        requestAnimationFrame(() => setDragId(deal.id));
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOverStage(null);
                      }}
                      className={
                        dragId === deal.id ? "cursor-grabbing opacity-50" : "cursor-grab"
                      }
                    >
                      {/* pad, not className: Card carries its own p-4, and two
                          paddings of equal specificity are settled by Tailwind
                          emission order, which p-4 wins. */}
                      <Card className="flex flex-col gap-2" pad="p-3">
                        <Link
                          href={`/admin/crm/deals/${deal.id}`}
                          // An <a> is draggable in its own right, so without
                          // this, grabbing the client name drags the URL
                          // rather than the card.
                          draggable={false}
                          className={deskRowLink}
                        >
                          {deal.client?.name ?? "Unknown client"}
                        </Link>
                        <p className="text-[12px] text-muted">{propertyLabel(deal.property)}</p>
                        <div className="flex items-center justify-between gap-3 text-[12px]">
                          <span className="text-muted">
                            Value{" "}
                            {deal.dealValue != null ? formatIndianShort(deal.dealValue) : "—"}
                          </span>
                          <span className="text-gold-deep">
                            Pending {pending != null ? formatIndianShort(pending) : "—"}
                          </span>
                        </div>
                        {amount != null && (
                          <p className="text-[12px] text-muted">
                            Brokerage {formatIndianShort(amount)}
                          </p>
                        )}
                        {deal.assignedTo && (
                          <p className="text-[12px] text-muted">{deal.assignedTo}</p>
                        )}
                        <DealStageQuickForm id={deal.id} stage={deal.stage} />
                      </Card>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
