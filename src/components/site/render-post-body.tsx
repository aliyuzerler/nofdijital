import type { ReactNode } from "react";

/**
 * Allowlist Tiptap-JSON renderer (docs/05: rich text yalnızca izinli node ile).
 * Bilinmeyen node tipleri sessizce atlanır; ham HTML asla render edilmez.
 */

interface TNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TNode[];
  text?: string;
  marks?: Array<{ type: string; attrs?: Record<string, unknown> }>;
}

function renderInline(nodes: TNode[] | undefined, keyPrefix = ""): ReactNode[] {
  if (!nodes) return [];
  return nodes.map((n, i) => {
    const key = `${keyPrefix}-${i}`;
    let text: ReactNode = n.text ?? "";
    if (n.marks) {
      for (const m of n.marks) {
        if (m.type === "bold") text = <strong key={key}>{text}</strong>;
        else if (m.type === "italic") text = <em key={key}>{text}</em>;
        else if (m.type === "link") {
          const href = String(m.attrs?.href ?? "#");
          // scheme allowlist (docs/05)
          const safe = /^(https?:|mailto:|tel:)/i.test(href);
          text = safe ? (
            <a key={key} href={href} rel="noopener noreferrer nofollow">
              {text}
            </a>
          ) : (
            <span key={key}>{text}</span>
          );
        }
      }
    }
    return <>{text}</>;
  });
}

export function RenderPostBody({ doc }: { doc: unknown }) {
  const root = doc as TNode | null;
  if (!root || root.type !== "doc" || !Array.isArray(root.content)) {
    return null;
  }
  return <>{renderBlocks(root.content)}</>;
}

function renderBlocks(nodes: TNode[]): ReactNode[] {
  return nodes.map((n, i) => {
    switch (n.type) {
      case "paragraph":
        return <p key={i}>{renderInline(n.content, String(i))}</p>;
      case "heading": {
        const level = Number(n.attrs?.level ?? 2);
        if (level === 2) return <h2 key={i}>{renderInline(n.content, String(i))}</h2>;
        if (level === 3) return <h3 key={i}>{renderInline(n.content, String(i))}</h3>;
        return <h4 key={i}>{renderInline(n.content, String(i))}</h4>;
      }
      case "blockquote":
        return <blockquote key={i}>{renderBlocks(n.content ?? [])}</blockquote>;
      case "orderedList":
        return <ol key={i}>{(n.content ?? []).map((li, j) => <li key={j}>{renderBlocks(li.content ?? [])}</li>)}</ol>;
      case "bulletList":
        return <ul key={i}>{(n.content ?? []).map((li, j) => <li key={j}>{renderBlocks(li.content ?? [])}</li>)}</ul>;
      case "listItem":
        return <>{renderBlocks(n.content ?? [])}</>;
      case "image":
        return (
          <img
            key={i}
            src={String(n.attrs?.src ?? "")}
            alt={String(n.attrs?.alt ?? "")}
            loading="lazy"
          />
        );
      case "horizontalRule":
        return <hr key={i} />;
      case "note":
        return (
          <div key={i} className="nt">
            {renderInline(n.content, String(i))}
          </div>
        );
      default:
        return null; // allowlist dışı → atla
    }
  });
}
