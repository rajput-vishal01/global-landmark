# Admin desk — the UI contract

The admin panel is being rebuilt to the **g7x admin desk** (`D:\syncai\g7x`,
`app/components/admin/desk/`), which the client picked as the reference.

**What is ported: structure.** A 216px rail with grouped rows and a 3px active
edge. A 26px page title over a muted one-line sub. Cards that are a shadow and
a radius rather than a border, sitting on a cream ground. Dense tables with a
raised uppercase header. KPI tiles above the list they came out of.

**What is NOT ported: colour.** g7x is plum on warm paper. Every colour here
resolves through the Global Landmark tokens in `globals.css`. Nothing about the
brand palette changes.

This file is the contract. Two people working different screens against it
should produce screens that look like the same product.

---

## 1. Never write a raw hex, and never invent a colour

Use the tokens. They already exist:

| Role | Token | Utility |
|---|---|---|
| Page ground | `--color-paper` | `bg-paper` |
| Card / row ground | `--color-surface` | `bg-surface` |
| Table header, rail | `--color-raise` | `bg-raise` |
| Body text | `--color-ink` | `text-ink` |
| Secondary text | `--color-soft` | `text-soft` |
| Labels, notes | `--color-muted` | `text-muted` |
| Rules | `--color-line` | `border-line` |
| Hairlines inside a card | `--color-line-soft` | `border-line-soft` |
| Accent | `--color-gold` | `border-gold`, `text-gold-deep` |
| Wrong states only | `--color-error` | `text-error` |

## 2. Gold is never a fill

`BRAND_GUIDELINES.md`: gold is for dividers, hover, focus and emphasis. It is
also unusable as a fill — `#c9992e` behind white text is about 2.5:1.

So where g7x fills its primary button with its accent, we fill with **ink**.
Gold still marks that button, on the hover border. Gold marks the active nav
row, the focus ring, chip spines, and the table row hover tint. That is the
whole of its job.

## 3. One filled action per screen

`deskButtonPrimary` appears at most once on a page, in the `PageHead` actions.
Everything else is `deskButton` (outline) or `deskLinkButton` (bare word).
A delete is `deskButtonDanger`, outline, and never sits in the primary row.

## 4. Every screen opens the same way

```tsx
import { PageHead, deskButtonPrimary } from "@/components/admin/desk";

<PageHead
  title="Properties"
  sub="Every listing on the site, published or draft."
  actions={<Link href="/admin/properties/new" className={deskButtonPrimary}>New property</Link>}
/>
```

`sub` is strongly encouraged. A screen titled "Areas" tells a new broker
nothing; one line under it is the cheapest documentation there is.

## 5. Tables

```tsx
import { Table, TableWrap, numericCell, deskRowLink } from "@/components/admin/desk";

<TableWrap>
  <Table>
    <thead><tr><th>Name</th><th className={numericCell}>Value</th></tr></thead>
    <tbody>
      <tr>
        <td><Link href={...} className={deskRowLink}>{name}</Link></td>
        <td className={numericCell}>{value}</td>
      </tr>
    </tbody>
  </Table>
</TableWrap>
```

`Table` styles `thead th` and `tbody td` itself — do not add per-cell padding,
borders, or font sizes. Money and counts get `numericCell` so digits line up by
place value.

## 6. Empty states say what to do

```tsx
<EmptyState
  title="No properties yet"
  note="Add the first listing and it appears on the public site once published."
  action={<Link href="/admin/properties/new" className={deskButtonPrimary}>New property</Link>}
/>
```

Never a bare "No results." A filtered-empty and a genuinely-empty list need
different sentences — the reader cannot otherwise tell whether they broke
something.

## 7. Status is a `Chip`, not a coloured word

```tsx
<Chip tone="live">Published</Chip>
<Chip tone="neutral">Draft</Chip>
```

Tones are steps of the gold ramp plus ink: `neutral`, `quiet`, `live`,
`strong`, and `alert` for genuinely wrong states. Never a red/amber/green set —
the brand has one accent.

## 8. Numbers go in `KpiTile`, above the list

```tsx
<KpiRow>
  <KpiTile label="Published" value="12" note="of 18 listings" />
  <KpiTile label="Brokerage pending" value="₹3.71 L" highlight />
</KpiRow>
```

`KpiTile` does no arithmetic — pass it a formatted string.

## 9. Forms

Inputs, selects and textareas wear `deskField`. Group related fields in a
`Card` with a `desk-eyebrow` label above the group. Long forms keep their
existing section components; only the field chrome and the section heading
change.

## 10. What not to touch

- **Server components stay server components.** Do not add `"use client"` to
  make a style work.
- **No behaviour changes.** No renamed form fields, no changed action
  signatures, no altered queries. This is a re-skin.
- **Public site is out of scope entirely.** Everything is scoped to
  `.admin-panel`; if a change would affect a non-admin route, it is wrong.
- **No new dependencies.** No icon library, no headless UI kit.
- **`/admin/login` is in scope** but is a single centred card, not a desk
  screen — it has no rail.
