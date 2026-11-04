import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { StarRating } from "../../src/components/star-rating";

const fills = (value: number) => [...renderToStaticMarkup(createElement(StarRating, { value })).matchAll(/width:(\d+)%/g)].map((match) => Number(match[1]));

describe("estrelas proporcionais à nota", () => {
  it.each([
    [5, [100, 100, 100, 100, 100]],
    [4, [100, 100, 100, 100]],
    [4.5, [100, 100, 100, 100, 50]],
    [4.3, [100, 100, 100, 100, 30]],
    [1.25, [100, 25]],
    [0, []],
  ])("nota %s", (value, expected) => { expect(fills(value)).toEqual(expected); });
  it("nunca passa de cinco estrelas", () => { expect(fills(9)).toEqual([100, 100, 100, 100, 100]); });
  it("expõe a nota a leitores de tela só quando recebe rótulo", () => {
    expect(renderToStaticMarkup(createElement(StarRating, { value: 4, label: "Nota 4 de 5" }))).toContain('role="img"');
    expect(renderToStaticMarkup(createElement(StarRating, { value: 4 }))).toContain('aria-hidden="true"');
  });
});
