"use client";

import { useState, useEffect } from "react";
import { codeToHtml } from "shiki";

export default function SourceCodeViewer({ sourceCode, fileName }) {
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [highlightedCode, setHighlightedCode] = useState("");
  const [isHighlighting, setIsHighlighting] = useState(true);
  const [foldedSections, setFoldedSections] = useState(new Set());

  useEffect(() => {
    if (!sourceCode) return;

    const highlightCode = async () => {
      setIsHighlighting(true);
      try {
        const html = await codeToHtml(sourceCode, {
          lang: "solidity",
          themes: {
            light: "github-light",
            dark: "github-dark",
          },
          defaultColor: false,
        });
        setHighlightedCode(html);
      } catch (error) {
        console.error("Failed to highlight code:", error);
        // Fallback to plain text with escaping
        const escaped = sourceCode
          .replace(/&/g, "&amp;")
          .replace(/</g, "&lt;")
          .replace(/>/g, "&gt;");
        setHighlightedCode(`<pre><code>${escaped}</code></pre>`);
      } finally {
        setIsHighlighting(false);
      }
    };

    highlightCode();
  }, [sourceCode]);

  if (!sourceCode) {
    return null;
  }

  const lines = sourceCode.split("\n");

  // Detect foldable sections (contract, function, etc.)
  const getFoldableRanges = () => {
    const ranges = [];
    const stack = [];

    lines.forEach((line, index) => {
      const trimmed = line.trim();

      // Detect opening braces for contracts, functions, modifiers, etc.
      if (
        (trimmed.match(
          /\b(contract|interface|library|function|modifier|struct|enum)\s+\w+/,
        ) &&
          trimmed.includes("{")) ||
        (trimmed.match(/\b(constructor|fallback|receive)\s*\(/) &&
          trimmed.includes("{"))
      ) {
        stack.push({ start: index, type: "block" });
      } else if (trimmed === "{" && stack.length === 0) {
        stack.push({ start: index, type: "brace" });
      } else if (trimmed.startsWith("}")) {
        if (stack.length > 0) {
          const { start } = stack.pop();
          if (index - start > 2) {
            // Only allow folding if more than 2 lines
            ranges.push({ start, end: index });
          }
        }
      }
    });

    return ranges;
  };

  const foldableRanges = getFoldableRanges();

  const toggleFold = (start, end) => {
    const key = `${start}-${end}`;
    setFoldedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(key)) {
        newSet.delete(key);
      } else {
        newSet.add(key);
      }
      return newSet;
    });
  };

  const isLineFolded = (lineIndex) => {
    for (const range of foldableRanges) {
      const key = `${range.start}-${range.end}`;
      if (
        foldedSections.has(key) &&
        lineIndex > range.start &&
        lineIndex <= range.end
      ) {
        return true;
      }
    }
    return false;
  };

  const isFoldStart = (lineIndex) => {
    return foldableRanges.find((range) => range.start === lineIndex);
  };

  return (
    <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-800/50">
        <div className="flex items-center gap-3">
          <span className="text-2xl">📄</span>
          <div>
            <div className="font-semibold text-zinc-900 dark:text-zinc-100">
              {fileName || "Source Code"}
            </div>
            <div className="text-xs text-zinc-500">{lines.length} lines</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowLineNumbers(!showLineNumbers)}
            className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors font-semibold"
          >
            {showLineNumbers ? "🔢 Hide" : "🔢 Show"} Line Numbers
          </button>
          {foldedSections.size > 0 && (
            <button
              onClick={() => setFoldedSections(new Set())}
              className="px-3 py-1.5 text-xs bg-white dark:bg-zinc-700 border border-zinc-300 dark:border-zinc-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-600 transition-colors font-semibold"
            >
              🔓 Unfold All
            </button>
          )}
        </div>
      </div>

      {/* Code Content */}
      {isHighlighting ? (
        <div className="flex items-center justify-center p-8">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Highlighting code...
            </p>
          </div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <div className="relative">
            {showLineNumbers ? (
              <div className="font-mono text-sm">
                {lines.map((line, index) => {
                  if (isLineFolded(index)) {
                    return null;
                  }

                  const foldRange = isFoldStart(index);
                  const isFoldable = !!foldRange;
                  const isFolded = foldRange
                    ? foldedSections.has(`${foldRange.start}-${foldRange.end}`)
                    : false;

                  return (
                    <div
                      key={index}
                      className="flex hover:bg-zinc-100 dark:hover:bg-zinc-800/50 group"
                    >
                      <div className="flex items-center flex-shrink-0 w-20 px-2 text-right text-zinc-400 dark:text-zinc-600 bg-zinc-50 dark:bg-zinc-900/50 border-r border-zinc-200 dark:border-zinc-800 select-none">
                        {isFoldable && (
                          <button
                            onClick={() =>
                              toggleFold(foldRange.start, foldRange.end)
                            }
                            className="w-4 h-4 flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity hover:text-zinc-600 dark:hover:text-zinc-400"
                            title={isFolded ? "Unfold" : "Fold"}
                          >
                            {isFolded ? "▶" : "▼"}
                          </button>
                        )}
                        <span className="ml-auto text-xs">{index + 1}</span>
                      </div>
                      <div className="flex-1 px-4 py-0.5 overflow-x-auto min-h-[1.5rem]">
                        {isFolded ? (
                          <span className="text-zinc-400 dark:text-zinc-600 italic text-xs">
                            ... {foldRange.end - foldRange.start} lines folded
                            ...
                          </span>
                        ) : (
                          <span className="text-zinc-900 dark:text-zinc-100">
                            {line || " "}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className="shiki-container"
                dangerouslySetInnerHTML={{ __html: highlightedCode }}
              />
            )}
          </div>
        </div>
      )}

      <style jsx>{`
        .shiki-container :global(pre) {
          margin: 0;
          padding: 1rem;
          background: transparent !important;
          overflow-x: auto;
        }
        .shiki-container :global(code) {
          font-family:
            ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
            "Liberation Mono", "Courier New", monospace;
          font-size: 0.875rem;
          line-height: 1.5rem;
        }
        .shiki-container :global(.line) {
          display: block;
          min-height: 1.5rem;
        }
      `}</style>
    </div>
  );
}
