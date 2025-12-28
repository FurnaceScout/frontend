"use client";

import { useState, useEffect } from "react";
import {
  addBookmark,
  removeBookmark,
  isBookmarked,
  getBookmarkByHash,
} from "@/lib/bookmarks";
import { Button } from "@/app/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/app/components/ui/dialog";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import { Textarea } from "@/app/components/ui/textarea";
import { Alert, AlertDescription } from "@/app/components/ui/alert";
import { toast } from "sonner";

export default function BookmarkButton({ hash, defaultLabel = "" }) {
  const [bookmarked, setBookmarked] = useState(false);
  const [showDialog, setShowDialog] = useState(false);
  const [label, setLabel] = useState(defaultLabel);
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    setBookmarked(isBookmarked(hash));

    // Load existing bookmark data if present
    const existing = getBookmarkByHash(hash);
    if (existing) {
      setLabel(existing.label);
      setNotes(existing.notes || "");
    }
  }, [hash]);

  const handleAdd = () => {
    setError("");
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!label.trim()) {
      setError("Label is required");
      return;
    }

    try {
      addBookmark(hash, label.trim(), notes.trim());
      setBookmarked(true);
      setShowDialog(false);
      setError("");
      toast.success("Bookmark saved successfully");
    } catch (err) {
      setError(err.message);
      toast.error(err.message);
    }
  };

  const handleRemove = () => {
    const existing = getBookmarkByHash(hash);
    if (existing) {
      removeBookmark(existing.id);
      setBookmarked(false);
      toast.success("Bookmark removed");
    }
  };

  const handleCancel = () => {
    setShowDialog(false);
    setError("");
    // Reset form if not bookmarked
    if (!bookmarked) {
      setLabel(defaultLabel);
      setNotes("");
    }
  };

  return (
    <>
      <Button
        onClick={bookmarked ? handleRemove : handleAdd}
        variant={bookmarked ? "destructive" : "secondary"}
        title={bookmarked ? "Remove bookmark" : "Bookmark this transaction"}
      >
        {bookmarked ? "★ Bookmarked" : "☆ Bookmark"}
      </Button>

      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>📌 Bookmark Transaction</DialogTitle>
            <DialogDescription>
              Add a label and notes to bookmark this transaction for easy
              reference.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="bookmark-label">
                Label <span className="text-destructive">*</span>
              </Label>
              <Input
                id="bookmark-label"
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="e.g., Failed swap attempt"
                autoFocus
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="bookmark-notes">Notes (optional)</Label>
              <Textarea
                id="bookmark-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add any notes about this transaction..."
                rows={3}
              />
            </div>

            <div className="text-xs text-muted-foreground break-all">
              Transaction: {hash}
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button onClick={handleSave}>Save Bookmark</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
