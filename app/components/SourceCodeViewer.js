"use client";

import { useEffect, useState } from "react";
import { codeToHtml } from "shiki";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";

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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">📄</span>
            <div>
              <CardTitle>{fileName || "Source Code"}</CardTitle>
              <Badge variant="secondary" className="mt-1">
                {lines.length} lines
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setShowLineNumbers(!showLineNumbers)}
              variant="outline"
              size="sm"
            >
              {showLineNumbers ? "🔢 Hide" : "🔢 Show"} Line Numbers
            </Button>
            {foldedSections.size > 0 && (
              <Button
                onClick={() => setFoldedSections(new Set())}
                variant="outline"
                size="sm"
              >
                🔓 Unfold All
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {isHighlighting
          ? <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-4/6" />
              <Skeleton className="h-4 w-full" />
              <p className="text-sm text-muted-foreground mt-4">
                Highlighting code...
              </p>
            </div>
          : <div className="overflow-x-auto">
              <div className="relative">
                {showLineNumbers
                  ? <div className="font-mono text-sm border rounded-lg overflow-hidden">
                      {lines.map((line, index) => {
                        if (isLineFolded(index)) {
                          return null;
                        }

                        const foldRange = isFoldStart(index);
                        const isFoldable = !!foldRange;
                        const isFolded = foldRange
                          ? foldedSections.has(
                              `${foldRange.start}-${foldRange.end}`,
                            )
                          : false;

                        return (
                          <div
                            key={index}
                            className="flex hover:bg-muted group"
                          >
                            <div className="flex items-center flex-shrink-0 w-20 px-2 text-right text-muted-foreground bg-muted border-r select-none">
                              {isFoldable && (
                                <Button
                                  onClick={() =>
                                    toggleFold(foldRange.start, foldRange.end)
                                  }
                                  variant="ghost"
                                  size="sm"
                                  className="w-4 h-4 p-0 text-xs opacity-0 group-hover:opacity-100 transition-opacity"
                                  title={isFolded ? "Unfold" : "Fold"}
                                >
                                  {isFolded ? "▶" : "▼"}
                                </Button>
                              )}
                              <span className="ml-auto text-xs">
                                {index + 1}
                              </span>
                            </div>
                            <div className="flex-1 px-4 py-0.5 overflow-x-auto min-h-[1.5rem]">
                              {isFolded
                                ? <span className="text-muted-foreground italic text-xs">
                                    ... {foldRange.end - foldRange.start} lines
                                    folded ...
                                  </span>
                                : <span>{line || " "}</span>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  : <div
                      className="shiki-container border rounded-lg overflow-hidden"
                      dangerouslySetInnerHTML={{ __html: highlightedCode }}
                    />}
              </div>
            </div>}
      </CardContent>

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
    </Card>
  );
}
