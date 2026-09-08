/**
 * The shared parts every admin desk screen is built from.
 *
 * One entry point so a page imports the set rather than six paths, and so a
 * primitive can move file without every screen changing an import.
 */

export { Card } from "./Card";
export { Chip, type ChipTone } from "./Chip";
export { EmptyState } from "./EmptyState";
export { KpiTile, KpiRow } from "./KpiTile";
export { PageHead } from "./PageHead";
export { Table, TableWrap, numericCell } from "./Table";
export {
  cardChrome,
  deskButton,
  deskButtonDanger,
  deskButtonPrimary,
  deskButtonSmall,
  deskFace,
  deskField,
  deskLinkButton,
  deskRowLink,
  focusRing,
} from "./styles";
