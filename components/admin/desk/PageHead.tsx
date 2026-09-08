import type { ReactNode } from "react";

/**
 * The title block every desk screen opens with.
 *
 * A component rather than a documented div, because thirty screens each
 * hand-writing the same flex row is how the old panel ended up with six
 * different title sizes. The `pagehead` class carries the measurements; see
 * the admin desk block in globals.css.
 *
 * `sub` is strongly encouraged: a CRUD screen titled "Areas" tells a new
 * broker nothing, and one line under it is the cheapest documentation there is.
 */
export function PageHead({
  title,
  sub,
  actions,
}: {
  title: string;
  sub?: string;
  /** Buttons and links. The screen gets one filled action, at most. */
  actions?: ReactNode;
}) {
  return (
    <div className="pagehead">
      <div className="min-w-0">
        <h1>{title}</h1>
        {sub ? <p className="sub">{sub}</p> : null}
      </div>
      {actions ? <div className="actions">{actions}</div> : null}
    </div>
  );
}
