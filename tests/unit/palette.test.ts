import { describe, expect, it } from "vitest";
import {
  entitiesByCategory,
  entityKeyToSlug,
  entityKeys,
  isValidHex,
  palette,
  paletteAsCssVars,
  type EntityCategory,
  type EntityKey,
} from "../../src/theme/palette";

const CANON_KEYS_REQUIRED: EntityKey[] = [
  "shinji",
  "asuka",
  "rei",
  "misato",
  "kaworu",
  "gendo",
  "ritsuko",
  "mari",
  "unit00",
  "unit01",
  "unit02",
  "unit03",
  "unit04",
  "massProduction",
  "nerv",
  "seele",
  "wille",
  "casper",
  "melchior",
  "balthasar",
  "atField",
  "lcl",
  "thirdImpact",
];

describe("palette", () => {
  it("contains every canon entity in the required set", () => {
    for (const key of CANON_KEYS_REQUIRED) {
      expect(palette, `missing canon entity: ${key}`).toHaveProperty(key);
    }
  });

  it("every entity has a valid #rrggbb primary", () => {
    for (const key of entityKeys()) {
      const ent = palette[key];
      expect(
        isValidHex(ent.primary),
        `entity ${key} primary ${ent.primary} is not #rrggbb`,
      ).toBe(true);
    }
  });

  it("every entity has secondary as array of valid hexes", () => {
    for (const key of entityKeys()) {
      const ent = palette[key];
      expect(Array.isArray(ent.secondary), `${key}.secondary not array`).toBe(
        true,
      );
      for (let i = 0; i < ent.secondary.length; i++) {
        const c = ent.secondary[i]!;
        expect(
          isValidHex(c),
          `${key}.secondary[${i}] ${c} is not #rrggbb`,
        ).toBe(true);
      }
    }
  });

  it("every entity has a non-empty displayName and notes", () => {
    for (const key of entityKeys()) {
      const ent = palette[key];
      expect(
        ent.displayName.length,
        `${key} displayName empty`,
      ).toBeGreaterThan(0);
      expect(ent.notes.length, `${key} notes empty`).toBeGreaterThan(0);
    }
  });

  it("displayNames are unique", () => {
    const names = entityKeys().map((k) => palette[k].displayName);
    expect(new Set(names).size).toBe(names.length);
  });

  it("primary colors are unique across entities", () => {
    const primaries = entityKeys().map((k) => palette[k].primary);
    expect(new Set(primaries).size).toBe(primaries.length);
  });

  it("category is one of the allowed values", () => {
    const allowed: EntityCategory[] = [
      "character",
      "eva",
      "organization",
      "magi",
      "concept",
    ];
    for (const key of entityKeys()) {
      expect(allowed).toContain(palette[key].category);
    }
  });

  it("entitiesByCategory partitions all entities", () => {
    const cats: EntityCategory[] = [
      "character",
      "eva",
      "organization",
      "magi",
      "concept",
    ];
    let total = 0;
    for (const cat of cats) {
      total += entitiesByCategory(cat).length;
    }
    expect(total).toBe(entityKeys().length);
  });

  it("expected category sizes match the canon set", () => {
    expect(entitiesByCategory("character")).toHaveLength(8);
    expect(entitiesByCategory("eva")).toHaveLength(6);
    expect(entitiesByCategory("organization")).toHaveLength(3);
    expect(entitiesByCategory("magi")).toHaveLength(3);
    expect(entitiesByCategory("concept")).toHaveLength(3);
  });
});

describe("entityKeyToSlug", () => {
  it.each([
    ["shinji", "shinji"],
    ["asuka", "asuka"],
    ["unit00", "unit00"],
    ["unit01", "unit01"],
    ["massProduction", "mass-production"],
    ["atField", "at-field"],
    ["thirdImpact", "third-impact"],
    ["lcl", "lcl"],
  ])("converts %s -> %s", (input, expected) => {
    expect(entityKeyToSlug(input)).toBe(expected);
  });
});

describe("paletteAsCssVars", () => {
  const css = paletteAsCssVars();

  it("opens with :root selector", () => {
    expect(css.startsWith(":root {")).toBe(true);
  });

  it("emits primary and secondary variables for every entity", () => {
    for (const key of entityKeys()) {
      const ent = palette[key];
      const slug = entityKeyToSlug(key);
      expect(css).toContain(`--palette-${slug}-primary: ${ent.primary};`);
      ent.secondary.forEach((color, i) => {
        expect(css).toContain(
          `--palette-${slug}-secondary-${i + 1}: ${color};`,
        );
      });
    }
  });

  it("contains the iconic Asuka, Unit-01, and NERV variables specifically", () => {
    expect(css).toMatch(/--palette-asuka-primary: #[0-9a-f]{6};/i);
    expect(css).toMatch(/--palette-unit01-primary: #[0-9a-f]{6};/i);
    expect(css).toMatch(/--palette-nerv-primary: #[0-9a-f]{6};/i);
  });
});

describe("isValidHex", () => {
  it("accepts well-formed #rrggbb strings", () => {
    expect(isValidHex("#000000")).toBe(true);
    expect(isValidHex("#ffffff")).toBe(true);
    expect(isValidHex("#a1b2c3")).toBe(true);
    expect(isValidHex("#FF0000")).toBe(true);
  });

  it("rejects non-hex / wrong-length strings", () => {
    expect(isValidHex("ff0000")).toBe(false);
    expect(isValidHex("#fff")).toBe(false);
    expect(isValidHex("#fffffff")).toBe(false);
    expect(isValidHex("#gg0000")).toBe(false);
    expect(isValidHex("")).toBe(false);
  });
});
