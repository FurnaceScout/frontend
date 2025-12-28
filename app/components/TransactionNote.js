"use client";

import { useEffect, useState } from "react";
import {
  getTransactionNote,
  saveTransactionNote,
  deleteTransactionNote,
} from "@/lib/labels";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Textarea } from "@/app/components/ui/textarea";
import { Label } from "@/app/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog";
import { toast } from "sonner";

export default function TransactionNote({ txHash }) {
  const [note, setNote] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editNote, setEditNote] = useState("");

  useEffect(() => {
    loadNote();

    // Listen for note updates from other components
    const handleUpdate = () => loadNote();
    window.addEventListener("notesUpdated", handleUpdate);
    return () => window.removeEventListener("notesUpdated", handleUpdate);
  }, [txHash]);

  function loadNote() {
    const noteData = getTransactionNote(txHash);
    setNote(noteData);
  }

  function handleEdit() {
    setEditNote(note?.note || "");
    setIsEditing(true);
  }

  function handleSave() {
    if (editNote.trim()) {
      saveTransactionNote(txHash, editNote);
      setIsEditing(false);
      loadNote();
      toast.success("Note saved successfully");
    }
  }

  function handleCancel() {
    setIsEditing(false);
  }

  function handleDelete() {
    deleteTransactionNote(txHash);
    setIsEditing(false);
    loadNote();
    toast.success("Note deleted");
  }

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{note ? "Edit Note" : "Add Note"}</CardTitle>
          <CardDescription>
            Add notes about this transaction (e.g., deployment details, test
            scenario, etc.)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="transaction-note">Transaction Note</Label>
            <Textarea
              id="transaction-note"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Add notes about this transaction..."
              rows={4}
              maxLength={1000}
            />
            <div className="text-xs text-muted-foreground">
              {editNote.length}/1000 characters
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={!editNote.trim()}>
              Save Note
            </Button>
            <Button variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            {note && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive" className="ml-auto">
                    Delete Note
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete Note?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Are you sure you want to delete this note? This action
                      cannot be undone.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction onClick={handleDelete}>
                      Delete
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (note) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-base">📝 Transaction Note</CardTitle>
              <CardDescription className="mt-2 whitespace-pre-wrap">
                {note.note}
              </CardDescription>
              <div className="text-xs text-muted-foreground mt-2">
                Added {new Date(note.timestamp).toLocaleDateString()}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleEdit}>
              Edit
            </Button>
          </div>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            No note for this transaction
          </div>
          <Button onClick={handleEdit}>+ Add Note</Button>
        </div>
      </CardContent>
    </Card>
  );
}
