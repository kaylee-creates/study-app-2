"use client";

interface TreeNode {
  id: string;
  label: string;
  level: number;
  children: TreeNode[];
}

const styles = {
  branchRoot: "flex flex-col items-center px-2",
  childConnector:
    "pointer-events-none absolute -top-4 left-1/2 h-4 w-px -translate-x-1/2 bg-theme-accent/40",
  childWrapper: "relative",
  childrenRow: "relative flex items-start justify-center gap-4 pt-4",
  connectorVertical: "h-5 w-px bg-theme-accent/50",
  horizontalRule:
    "pointer-events-none absolute left-6 right-6 top-0 h-px bg-theme-accent/40",
  nodeCardBase:
    "rounded-xl border px-4 py-2 text-center text-sm font-semibold text-slate-900 shadow-sm",
  nodeTone0: "bg-violet-300/80 border-violet-400/70",
  nodeTone1: "bg-rose-300/80 border-rose-400/70",
  nodeTone2: "bg-amber-300/80 border-amber-400/70",
  nodeTone3: "bg-teal-300/80 border-teal-400/70",
  nodeToneDefault: "bg-sky-300/80 border-sky-400/70",
  treeInner: "min-w-max",
  treeRoot: "overflow-x-auto pb-2",
};

function nodeTone(level: number): string {
  switch (level) {
    case 0:
      return styles.nodeTone0;
    case 1:
      return styles.nodeTone1;
    case 2:
      return styles.nodeTone2;
    case 3:
      return styles.nodeTone3;
    default:
      return styles.nodeToneDefault;
  }
}

function createNode(label: string, level: number, id: string): TreeNode {
  return {
    id,
    label,
    level,
    children: [],
  };
}

export function parseMarkdownTree(content: string): TreeNode {
  let counter = 0;
  const nextId = (level: number) => `node-${level}-${counter++}`;

  const root = createNode("Study Guide", 0, nextId(0));
  const lines = content.split("\n").map((line) => line.trim()).filter(Boolean);
  const stack: Array<TreeNode | null> = [root, null, null, null, null];

  for (const line of lines) {
    if (line.startsWith("# ")) {
      const node = createNode(line.slice(2).trim(), 1, nextId(1));
      root.children.push(node);
      stack[1] = node;
      stack[2] = null;
      stack[3] = null;
      stack[4] = null;
      continue;
    }

    if (line.startsWith("## ")) {
      const parent = stack[1] ?? root;
      const node = createNode(line.slice(3).trim(), 2, nextId(2));
      parent.children.push(node);
      stack[2] = node;
      stack[3] = null;
      stack[4] = null;
      continue;
    }

    if (line.startsWith("### ")) {
      const parent = stack[2] ?? stack[1] ?? root;
      const node = createNode(line.slice(4).trim(), 3, nextId(3));
      parent.children.push(node);
      stack[3] = node;
      stack[4] = null;
      continue;
    }

    if (line.startsWith("- ") || line.startsWith("* ")) {
      const parent = stack[3] ?? stack[2] ?? stack[1] ?? root;
      const node = createNode(
        line.slice(2).trim(),
        Math.min(parent.level + 1, 4),
        nextId(Math.min(parent.level + 1, 4))
      );
      parent.children.push(node);
      stack[4] = node;
      continue;
    }

    const parent = stack[3] ?? stack[2] ?? stack[1] ?? root;
    const node = createNode(
      line,
      Math.min(parent.level + 1, 4),
      nextId(Math.min(parent.level + 1, 4))
    );
    parent.children.push(node);
    stack[4] = node;
  }

  if (root.children.length === 1) {
    return root.children[0];
  }

  return root;
}

function TreeBranch({ node }: { node: TreeNode }) {
  const hasChildren = node.children.length > 0;
  const showHorizontal = node.children.length > 1;

  return (
    <div className={styles.branchRoot}>
      <div className={`${styles.nodeCardBase} ${nodeTone(node.level)}`}>{node.label}</div>

      {hasChildren && (
        <>
          <div className={styles.connectorVertical} />
          <div className={styles.childrenRow}>
            {showHorizontal && <div className={styles.horizontalRule} />}
            {node.children.map((child) => (
              <div key={child.id} className={styles.childWrapper}>
                <div className={styles.childConnector} />
                <TreeBranch node={child} />
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export function TreeRenderer({ content }: { content: string }) {
  const tree = parseMarkdownTree(content);
  return (
    <div className={styles.treeRoot}>
      <div className={styles.treeInner}>
        <TreeBranch node={tree} />
      </div>
    </div>
  );
}
