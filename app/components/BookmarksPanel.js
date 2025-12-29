"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import { Card, CardContent } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/app/components/ui/sheet";
import {
  clearAllBookmarks,
  exportBookmarks,
  getBookmarks,
  removeBookmark,
  searchBookmarks,
  updateBookmark,
} from "@/lib/bookmarks";
import { shortenAddress } from "@/lib/viem";

export default function BookmarksPanel({ isOpen, onClose }) {
  const [bookmarks, setBookmarks] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editNotes, setEditNotes] = useState("");

  const loadBookmarks = useCallback(() => {
    if (searchQuery) {
      setBookmarks(searchBookmarks(searchQuery));
    } else {
      setBookmarks(getBookmarks());
    }
  }, [searchQuery]);

  useEffect(() => {
    if (isOpen) {
      loadBookmarks();
    }
  }, [isOpen, loadBookmarks]);

  const handleRemove = (id) => {
    removeBookmark(id);
    loadBookmarks();
    toast.success("Bookmark removed");
  };

  const handleEdit = (bookmark) => {
    setEditingId(bookmark.id);
    setEditLabel(bookmark.label);
    setEditNotes(bookmark.notes || "");
  };

  const handleSaveEdit = (id) => {
    try {
      updateBookmark(id, {
        label: editLabel.trim(),
        notes: editNotes.trim(),
      });
      setEditingId(null);
      loadBookmarks();
      toast.success("Bookmark updated");
    } catch (error) {
      toast.error(`Failed to update bookmark: ${error.message}`);
    }
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditLabel("");
    setEditNotes("");
  };

  const handleExport = () => {
    const json = exportBookmarks();
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `furnacescout-bookmarks-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Bookmarks exported");
  };

  const handleClearAll = () => {
    clearAllBookmarks();
    loadBookmarks();
    toast.success("All bookmarks cleared");
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <span className="text-2xl">📌</span>
            <span>Bookmarks</span>
          </SheetTitle>
          <SheetDescription>
            {bookmarks.length} saved transaction
            {bookmarks.length !== 1 ? "s" : ""}
          </SheetDescription>
        </SheetHeader>

        {/* Search & Actions */}
        <div className="space-y-3 mt-6">
          <Input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setTimeout(loadBookmarks, 100);
            }}
            placeholder="Search bookmarks..."
          />

          {bookmarks.length > 0 && (
            <div className="flex gap-2">
              <Button onClick={handleExport} variant="secondary" size="sm">
                📥 Export
              </Button>
              <Button onClick={handleClearAll} variant="destructive" size="sm">
                🗑️ Clear All
              </Button>
            </div>
          )}
        </div>

        {/* Bookmarks List */}
        <div className="mt-6">
          {bookmarks.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <div className="text-6xl mb-4">📌</div>
                <p className="text-muted-foreground mb-2">
                  {searchQuery ? "No bookmarks found" : "No bookmarks yet"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {searchQuery
                    ? "Try a different search query"
                    : "Bookmark transactions to save them for later"}
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {bookmarks.map((bookmark) => (
                <Card
                  key={bookmark.id}
                  className="hover:border-primary transition-colors"
                >
                  <CardContent className="pt-4">
                    {editingId === bookmark.id ? (
                      // Edit Mode
                      <div className="space-y-3">
                        <Input
                          type="text"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                          className="font-semibold"
                        />
                        <textarea
                          value={editNotes}
                          onChange={(e) => setEditNotes(e.target.value)}
                          rows={2}
                          className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                          placeholder="Notes..."
                        />
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleSaveEdit(bookmark.id)}
                            size="sm"
                          >
                            Save
                          </Button>
                          <Button
                            onClick={handleCancelEdit}
                            variant="outline"
                            size="sm"
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <>
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <Link
                              href={`/tx/${bookmark.hash}`}
                              onClick={onClose}
                              className="font-semibold hover:text-primary transition-colors block"
                            >
                              {bookmark.label}
                            </Link>
                            <div className="text-xs text-muted-foreground font-mono mt-1">
                              {shortenAddress(bookmark.hash, 8)}
                            </div>
                          </div>
                          <div className="flex gap-1 ml-2">
                            <Button
                              onClick={() => handleEdit(bookmark)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              title="Edit"
                            >
                              ✏️
                            </Button>
                            <Button
                              onClick={() => handleRemove(bookmark.id)}
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                              title="Remove"
                            >
                              🗑️
                            </Button>
                          </div>
                        </div>

                        {bookmark.notes && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {bookmark.notes}
                          </p>
                        )}

                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {new Date(bookmark.createdAt).toLocaleDateString()}
                          </Badge>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
