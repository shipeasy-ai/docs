import type { Root, Element, ElementContent } from "hast";

/**
 * Rehype pass that wraps `**Use case(s)**` markup in a two-column block so
 * the label sits flush-left, top-aligned with the body. Matches the visual
 * pattern used by the hand-rolled `<RenderDescription>` in `api-list.tsx`
 * and reuses its `.se-api-usecase*` classes from `theme.css`.
 *
 * Recognises two source shapes:
 * - Inline: `<p><strong>Use case:</strong> body</p>`
 * - Block:  `<p><strong>Use cases</strong></p><ul>…</ul>`
 */
export function rehypeUseCases() {
  return (tree: Root) => {
    const children = tree.children as ElementContent[];
    for (let i = 0; i < children.length; i++) {
      const node = children[i];
      if (!isElement(node) || node.tagName !== "p") continue;

      const strongIdx = node.children.findIndex(
        (c) => isElement(c) && c.tagName === "strong",
      );
      if (strongIdx === -1) continue;
      const strongEl = node.children[strongIdx] as Element;

      const label = strongText(strongEl);
      if (!label || !/^Use case[s]?:?$/.test(label)) continue;

      const rest = node.children.slice(strongIdx + 1);
      const blockOnly = rest.every((c) => c.type === "text" && c.value.trim() === "");

      if (blockOnly) {
        // Block form: paragraph is just `<strong>Use cases</strong>`. Skip
        // whitespace text nodes and pull the next sibling list into the body.
        let j = i + 1;
        while (j < children.length) {
          const c = children[j];
          if (c.type === "text" && c.value.trim() === "") {
            j++;
            continue;
          }
          break;
        }
        const next = children[j];
        if (isElement(next) && (next.tagName === "ul" || next.tagName === "ol")) {
          children.splice(i, j - i + 1, wrap(labelText(label), [next]));
          continue;
        }
      }

      // Inline form: keep strong as label, the remainder of the paragraph as body.
      if (rest.length > 0) {
        const bodyPara: Element = {
          type: "element",
          tagName: "p",
          properties: {},
          children: rest as ElementContent[],
        };
        children.splice(i, 1, wrap(labelText(label), [bodyPara]));
      }
    }
  };
}

function isElement(n: unknown): n is Element {
  return !!n && typeof n === "object" && (n as { type?: string }).type === "element";
}

function strongText(el: Element): string | null {
  const txt = el.children
    .map((c) => (c.type === "text" ? c.value : ""))
    .join("")
    .trim();
  return txt || null;
}

function labelText(raw: string): string {
  return raw.replace(/:$/, "");
}

function wrap(tag: string, body: ElementContent[]): Element {
  return {
    type: "element",
    tagName: "div",
    properties: { className: ["se-api-usecase"] },
    children: [
      {
        type: "element",
        tagName: "span",
        properties: { className: ["se-api-usecase-tag"] },
        children: [{ type: "text", value: tag }],
      },
      {
        type: "element",
        tagName: "div",
        properties: { className: ["se-api-usecase-body"] },
        children: body,
      },
    ],
  };
}
