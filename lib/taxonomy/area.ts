/**
 * Area units and conversion. Tricity buyers think in marla and kanal,
 * developers quote in sq.ft, and agricultural land trades in bigha/biswa —
 * so every area is stored with its own unit and ALSO normalised to sq.ft
 * (see `toSqft`) purely so filtering and sorting can compare across units.
 */

export const AREA_UNITS = [
  { value: "sqft", label: "Sq Ft" },
  { value: "sqyd", label: "Sq Yd" },
  { value: "marla", label: "Marla" },
  { value: "kanal", label: "Kanal" },
  { value: "acre", label: "Acre" },
  { value: "biswa", label: "Biswa" },
  { value: "bigha", label: "Bigha" },
] as const;

export type AreaUnit = (typeof AREA_UNITS)[number]["value"];

/**
 * Square feet per unit. The first five are exact and standard across
 * Punjab/Haryana: 1 sq.yd = 9 sq.ft, 1 marla = 30.25 sq.yd, 1 kanal =
 * 20 marla, 1 acre = 8 kanal (8 x 5445 = 43,560, the definition).
 *
 * ponytail: bigha/biswa genuinely vary by region — a "pucca" bigha is not
 * a "kachha" bigha, and HP, UP and Rajasthan all differ. These use the
 * North-India pucca convention, which stays internally consistent with the
 * kanal/marla ladder above (1 bigha = 5 kanal = 100 marla, 1 biswa =
 * 1/20 bigha = 5 marla). CONFIRM the client's local convention before any
 * bigha-denominated land goes live; changing these two numbers is the only
 * edit needed.
 */
const SQFT_PER_UNIT: Record<AreaUnit, number> = {
  sqft: 1,
  sqyd: 9,
  marla: 272.25,
  kanal: 5445,
  acre: 43560,
  biswa: 1361.25,
  bigha: 27225,
};

export function isAreaUnit(value: string): value is AreaUnit {
  return value in SQFT_PER_UNIT;
}

function areaUnitLabel(unit: string): string {
  return AREA_UNITS.find((u) => u.value === unit)?.label ?? unit;
}

/** Indian digit grouping — 12,00,000 not 1,200,000. */
export function formatArea(value: number, unit: string): string {
  return `${value.toLocaleString("en-IN")} ${areaUnitLabel(unit)}`;
}

/**
 * Normalised sq.ft for cross-unit filtering and sorting. Rounded to a whole
 * foot — the stored value is the one shown to users, this is only ever a
 * sort/filter key, so sub-foot precision would be false accuracy.
 */
export function toSqft(value: number, unit: string): number | null {
  if (!isAreaUnit(unit)) return null;
  return Math.round(value * SQFT_PER_UNIT[unit]);
}

/**
 * Convert an area value between any two units, round-tripping through
 * sq.ft. Unlike `toSqft` this keeps fractional precision — it's for
 * display (the inline unit-converter widget, R-40), not a sort key.
 */
export function convertArea(value: number, fromUnit: string, toUnit: string): number | null {
  if (!isAreaUnit(fromUnit) || !isAreaUnit(toUnit)) return null;
  return (value * SQFT_PER_UNIT[fromUnit]) / SQFT_PER_UNIT[toUnit];
}

/** The four CFF area measures, in the order the admin form asks for them. */
export const AREA_MEASURES = [
  { key: "plotArea", label: "Plot Size" },
  { key: "builtUpArea", label: "Built-up Area" },
  { key: "superArea", label: "Super Area" },
  { key: "carpetArea", label: "Carpet Area" },
] as const;

export type AreaMeasureKey = (typeof AREA_MEASURES)[number]["key"];
