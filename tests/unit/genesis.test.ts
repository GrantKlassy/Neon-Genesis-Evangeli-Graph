import { describe, expect, it } from "vitest";
import {
  GENESIS_KINDS,
  assertGenesisValid,
  colorOf,
  entry,
  genesis,
  genesisAsCssVars,
  isShortcode,
  isValidHex,
  kindOf,
  resolveAlias,
  shortcodeToSlug,
  shortcodes,
  shortcodesByKind,
  validateGenesis,
} from "../../src/genesis";

describe("genesis registry invariants", () => {
  it("validates without errors", () => {
    const result = validateGenesis();
    expect(result.errors, result.errors.join("\n")).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("assertGenesisValid does not throw on the canon registry", () => {
    expect(() => assertGenesisValid()).not.toThrow();
  });

  it("every entry's shortcode matches its registry key", () => {
    for (const code of shortcodes()) {
      expect(genesis[code].shortcode).toBe(code);
    }
  });

  it("every entry has a valid #rrggbb primary", () => {
    for (const code of shortcodes()) {
      expect(
        isValidHex(genesis[code].primary),
        `${code} primary ${genesis[code].primary} not #rrggbb`,
      ).toBe(true);
    }
  });

  it("every entry's secondary is an array of valid hexes", () => {
    for (const code of shortcodes()) {
      const ent = genesis[code];
      expect(Array.isArray(ent.secondary)).toBe(true);
      for (const c of ent.secondary) {
        expect(isValidHex(c), `${code} secondary "${c}"`).toBe(true);
      }
    }
  });

  it("every entry has at least one alias", () => {
    for (const code of shortcodes()) {
      expect(genesis[code].aliases.length).toBeGreaterThan(0);
    }
  });

  it("every entry has non-empty displayName and notes", () => {
    for (const code of shortcodes()) {
      expect(genesis[code].displayName.length).toBeGreaterThan(0);
      expect(genesis[code].notes.length).toBeGreaterThan(0);
    }
  });

  it("displayNames are unique", () => {
    const names = shortcodes().map((c) => genesis[c].displayName.toLowerCase());
    expect(new Set(names).size).toBe(names.length);
  });

  it("kinds are all from the GENESIS_KINDS set", () => {
    for (const code of shortcodes()) {
      expect(GENESIS_KINDS).toContain(genesis[code].kind);
    }
  });

  it("every kind has at least one entry", () => {
    for (const kind of GENESIS_KINDS) {
      expect(
        shortcodesByKind(kind).length,
        `kind ${kind} has no entries`,
      ).toBeGreaterThan(0);
    }
  });

  it("aliases do not collide across entries (case-insensitive)", () => {
    const seen = new Map<string, string>();
    for (const code of shortcodes()) {
      const allTerms = [code, ...genesis[code].aliases];
      for (const alias of allTerms) {
        const key = alias.toLowerCase();
        const prev = seen.get(key);
        if (prev && prev !== code) {
          throw new Error(
            `alias "${alias}" claimed by both ${prev} and ${code}`,
          );
        }
        seen.set(key, code);
      }
    }
  });

  it("requires the canonical core characters by shortcode", () => {
    for (const code of [
      "shinji",
      "asuka",
      "rei",
      "misato",
      "kaworu",
      "gendo",
      "ritsuko",
      "mari",
    ]) {
      expect(isShortcode(code), `missing CHARACTERS shortcode: ${code}`).toBe(
        true,
      );
      expect(genesis[code as keyof typeof genesis].kind).toBe("CHARACTERS");
    }
  });

  it("requires the canonical family-name shortcodes (the user's spec)", () => {
    // The user explicitly called out: "Shinji Ikari IS CONNECTED to `shinji`
    // and `ikari`. They are CHARACTERS." Encode that as a hard invariant so
    // a future cleanup doesn't accidentally drop the family-name layer.
    for (const code of ["ikari", "ayanami", "katsuragi", "akagi"]) {
      expect(isShortcode(code)).toBe(true);
      expect(genesis[code as keyof typeof genesis].kind).toBe("CHARACTERS");
    }
  });

  it("requires every canonical angel to have its own shortcode", () => {
    for (const code of [
      "adam",
      "lilith",
      "sachiel",
      "shamshel",
      "ramiel",
      "gaghiel",
      "israfel",
      "sandalphon",
      "matarael",
      "sahaquiel",
      "iruel",
      "leliel",
      "bardiel",
      "zeruel",
      "arael",
      "armisael",
      "tabris",
      "lilim",
    ]) {
      expect(isShortcode(code), `missing ANGELS shortcode: ${code}`).toBe(true);
      expect(genesis[code as keyof typeof genesis].kind).toBe("ANGELS");
    }
  });

  it("requires the three Magi shortcodes", () => {
    for (const code of ["casper", "melchior", "balthasar"]) {
      expect(genesis[code as keyof typeof genesis].kind).toBe("MAGI");
    }
  });
});

describe("genesis helpers", () => {
  it("colorOf returns the primary for a known shortcode", () => {
    expect(colorOf("asuka")).toBe(genesis.asuka.primary);
  });

  it("colorOf returns the fallback gray for an unknown shortcode", () => {
    expect(colorOf("not-a-thing")).toBe("#cccccc");
  });

  it("kindOf returns the kind for a known shortcode", () => {
    expect(kindOf("ikari")).toBe("CHARACTERS");
    expect(kindOf("ramiel")).toBe("ANGELS");
    expect(kindOf("casper")).toBe("MAGI");
    expect(kindOf("unit01")).toBe("EVA");
    expect(kindOf("nerv")).toBe("ORGANIZATIONS");
    expect(kindOf("atField")).toBe("CONCEPTS");
  });

  it("kindOf returns null for an unknown shortcode", () => {
    expect(kindOf("zzz")).toBeNull();
  });

  it("resolveAlias maps text to a shortcode (case-insensitive)", () => {
    expect(resolveAlias("Shinji")).toBe("shinji");
    expect(resolveAlias("shinji")).toBe("shinji");
    expect(resolveAlias("Ikari")).toBe("ikari");
    expect(resolveAlias("Third Child")).toBe("shinji");
    expect(resolveAlias("AT Field")).toBe("atField");
    expect(resolveAlias("AT-Field")).toBe("atField");
  });

  it("resolveAlias returns null for unknown text", () => {
    expect(resolveAlias("Pen Pen")).toBeNull();
    expect(resolveAlias("")).toBeNull();
  });

  it("entry returns the entry or undefined", () => {
    expect(entry("shinji")?.displayName).toBe("Shinji Ikari");
    expect(entry("nope")).toBeUndefined();
  });
});

describe("shortcodeToSlug", () => {
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
    expect(shortcodeToSlug(input)).toBe(expected);
  });
});

describe("genesisAsCssVars", () => {
  const css = genesisAsCssVars();

  it("opens with :root selector", () => {
    expect(css.startsWith(":root {")).toBe(true);
  });

  it("emits genesis-prefixed primary and secondary variables for every entry", () => {
    for (const code of shortcodes()) {
      const ent = genesis[code];
      const slug = shortcodeToSlug(code);
      expect(css).toContain(`--genesis-${slug}-primary: ${ent.primary};`);
      ent.secondary.forEach((color, i) => {
        expect(css).toContain(
          `--genesis-${slug}-secondary-${i + 1}: ${color};`,
        );
      });
    }
  });

  it("emits palette-prefixed mirrors for backwards compatibility", () => {
    for (const code of shortcodes()) {
      const ent = genesis[code];
      const slug = shortcodeToSlug(code);
      expect(css).toContain(`--palette-${slug}-primary: ${ent.primary};`);
    }
  });

  it("contains the iconic Asuka, Unit-01, NERV, and Ikari variables specifically", () => {
    expect(css).toMatch(/--genesis-asuka-primary: #[0-9a-f]{6};/i);
    expect(css).toMatch(/--genesis-unit01-primary: #[0-9a-f]{6};/i);
    expect(css).toMatch(/--genesis-nerv-primary: #[0-9a-f]{6};/i);
    expect(css).toMatch(/--genesis-ikari-primary: #[0-9a-f]{6};/i);
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

describe("validateGenesis catches bad registries", () => {
  it("rejects an empty registry", () => {
    const result = validateGenesis({});
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /empty/i.test(e))).toBe(true);
  });

  it("rejects a registry with key/shortcode mismatch", () => {
    const result = validateGenesis({
      foo: {
        shortcode: "bar",
        kind: "CHARACTERS",
        displayName: "Foo Bar",
        aliases: ["Foo"],
        primary: "#000000",
        secondary: [],
        notes: "ok",
      },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /key\/shortcode mismatch/.test(e))).toBe(
      true,
    );
  });

  it("rejects a registry with bad hex", () => {
    const result = validateGenesis({
      foo: {
        shortcode: "foo",
        kind: "CHARACTERS",
        displayName: "Foo",
        aliases: ["Foo"],
        primary: "not-a-color",
        secondary: [],
        notes: "ok",
      },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /invalid primary/.test(e))).toBe(true);
  });

  it("rejects two entries that share an alias", () => {
    const result = validateGenesis({
      foo: {
        shortcode: "foo",
        kind: "CHARACTERS",
        displayName: "Foo",
        aliases: ["Twin"],
        primary: "#111111",
        secondary: [],
        notes: "ok",
      },
      bar: {
        shortcode: "bar",
        kind: "CHARACTERS",
        displayName: "Bar",
        aliases: ["Twin"],
        primary: "#222222",
        secondary: [],
        notes: "ok",
      },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /alias collision/.test(e))).toBe(true);
  });

  it("rejects an entry with no aliases", () => {
    const result = validateGenesis({
      foo: {
        shortcode: "foo",
        kind: "CHARACTERS",
        displayName: "Foo",
        aliases: [],
        primary: "#111111",
        secondary: [],
        notes: "ok",
      },
    });
    expect(result.ok).toBe(false);
    expect(result.errors.some((e) => /at least one alias/.test(e))).toBe(true);
  });
});
