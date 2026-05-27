import { describe, expect, it } from "vitest";
import { highlightSegments, highlightToHtml } from "../../src/genesis";

describe("highlightSegments", () => {
  it("returns an empty array for empty input", () => {
    expect(highlightSegments("")).toEqual([]);
  });

  it("returns a single plain segment when no aliases match", () => {
    const out = highlightSegments("just some plain prose");
    expect(out).toHaveLength(1);
    expect(out[0]?.shortcode).toBeUndefined();
    expect(out[0]?.text).toBe("just some plain prose");
  });

  it("matches a single alias and tags it with the resolved shortcode", () => {
    const out = highlightSegments("Hello Shinji.");
    const codes = out.map((s) => s.shortcode);
    expect(codes).toContain("shinji");
    const joined = out.map((s) => s.text).join("");
    expect(joined).toBe("Hello Shinji.");
  });

  it("tags the full 'Shinji Ikari' phrase as a single shinji shortcode (longest-match wins)", () => {
    const out = highlightSegments("Shinji Ikari is a pilot.");
    const tagged = out.filter((s) => s.shortcode);
    expect(tagged).toHaveLength(1);
    expect(tagged[0]?.shortcode).toBe("shinji");
    expect(tagged[0]?.text).toBe("Shinji Ikari");
  });

  it("still tags a standalone 'Ikari' as the family shortcode (so body copy reads in family color)", () => {
    const out = highlightSegments("The Ikari family is fractured.");
    const tagged = out.filter((s) => s.shortcode);
    const codes = tagged.map((s) => s.shortcode);
    expect(codes).toContain("ikari");
    expect(codes).not.toContain("shinji");
  });

  it("preserves the original text byte-for-byte under reassembly", () => {
    const input =
      "Misato Katsuragi briefs Shinji Ikari before the AT Field collapse.";
    const out = highlightSegments(input);
    expect(out.map((s) => s.text).join("")).toBe(input);
  });

  it("is case-insensitive on alias match but preserves source casing in segment text", () => {
    const out = highlightSegments("ASUKA storms in.");
    const tagged = out.filter((s) => s.shortcode === "asuka");
    expect(tagged).toHaveLength(1);
    expect(tagged[0]?.text).toBe("ASUKA");
  });

  it("does not match an alias mid-word (boundary check)", () => {
    // 'Sachiel' should NOT match inside 'Sachielish' (no such word in canon
    // but the boundary discipline matters for arbitrary copy).
    const out = highlightSegments("Sachielish prose");
    const tagged = out.filter((s) => s.shortcode);
    expect(tagged).toHaveLength(0);
  });

  it("matches multi-word aliases like 'AT Field'", () => {
    const out = highlightSegments("The AT Field collapsed.");
    const tagged = out.filter((s) => s.shortcode === "atField");
    expect(tagged).toHaveLength(1);
    expect(tagged[0]?.text).toBe("AT Field");
  });

  it("matches 'Third Child' to shinji (descriptor alias)", () => {
    const out = highlightSegments("Third Child reports for duty.");
    const tagged = out.filter((s) => s.shortcode === "shinji");
    expect(tagged).toHaveLength(1);
    expect(tagged[0]?.text).toBe("Third Child");
  });
});

describe("highlightToHtml", () => {
  it("escapes plain text without matches", () => {
    expect(highlightToHtml("a < b & c > d")).toBe("a &lt; b &amp; c &gt; d");
  });

  it("wraps matched aliases in g-shortcode spans referencing the genesis CSS var", () => {
    const html = highlightToHtml("Shinji is on Unit-01.");
    expect(html).toContain('<span class="g-shortcode" data-shortcode="shinji"');
    expect(html).toContain("--genesis-shinji-primary");
    expect(html).toContain('<span class="g-shortcode" data-shortcode="unit01"');
    expect(html).toContain("--genesis-unit01-primary");
  });

  it("emits the kebab-cased CSS slug for camelCase shortcodes", () => {
    const html = highlightToHtml("Behold the AT Field.");
    expect(html).toContain('data-shortcode="atField"');
    expect(html).toContain("--genesis-at-field-primary");
  });

  it("escapes inside matched text too (defense-in-depth)", () => {
    // Not a real alias, but if the text passing through accidentally has
    // angle brackets, it should never be raw.
    const html = highlightToHtml("Shinji <script>");
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
  });
});
