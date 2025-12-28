"use client";

import { useEffect, useState } from "react";
import {
  getAddressLabel,
  saveAddressLabel,
  deleteAddressLabel,
  LABEL_COLORS,
  getLabelColorClass,
} from "@/lib/labels";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { toast } from "sonner";

export default function AddressLabel({ address }) {
  const [label, setLabel] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState("");
  const [editNote, setEditNote] = useState("");
  const [editColor, setEditColor] = useState("blue");

  useEffect(() => {
    loadLabel();

    // Listen for label updates from other components
    const handleUpdate = () => loadLabel();
    window.addEventListener("labelsUpdated", handleUpdate);
    return () => window.removeEventListener("labelsUpdated", handleUpdate);
  }, [address]);

  function loadLabel() {
    const labelData = getAddressLabel(address);
    setLabel(labelData);
  }

  function handleEdit() {
    if (label) {
      setEditLabel(label.label);
      setEditNote(label.note || "");
      setEditColor(label.color || "blue");
    } else {
      setEditLabel("");
      setEditNote("");
      setEditColor("blue");
    }
    setIsEditing(true);
  }

  function handleSave() {
    if (editLabel.trim()) {
      saveAddressLabel(address, editLabel, editColor, editNote);
      setIsEditing(false);
      loadLabel();
      toast.success("Label saved");
    }
  }

  function handleCancel() {
    setIsEditing(false);
  }

  function handleDelete() {
    deleteAddressLabel(address);
    setIsEditing(false);
    loadLabel();
    toast.success("Label deleted");
  }

  if (isEditing) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{label ? "Edit Label" : "Add Label"}</CardTitle>
          <CardDescription>
            Add a custom label to identify this address
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Label Input */}
          <div className="space-y-2">
            <Label htmlFor="label-name">Label Name *</Label>
            <Input
              id="label-name"
              type="text"
              value={editLabel}
              onChange={(e) => setEditLabel(e.target.value)}
              placeholder="e.g., My Test Wallet, Main Contract, etc."
              maxLength={50}
            />
            <p className="text-xs text-muted-foreground">
              {editLabel.length}/50 characters
            </p>
          </div>

          {/* Color Picker */}
          <div className="space-y-2">
            <Label>Color</Label>
            <div className="flex flex-wrap gap-2">
              {LABEL_COLORS.map((color) => (
                <button
                  key={color.id}
                  type="button"
                  onClick={() => setEditColor(color.id)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${getLabelColorClass(
                    color.id,
                  )} ${
                    editColor === color.id
                      ? "ring-2 ring-offset-2 ring-primary ring-offset-background scale-105"
                      : "opacity-60 hover:opacity-100"
                  }`}
                >
                  {color.name}
                </button>
              ))}
            </div>
          </div>

          {/* Note Input */}
          <div className="space-y-2">
            <Label htmlFor="label-note">Note (Optional)</Label>
            <textarea
              id="label-note"
              value={editNote}
              onChange={(e) => setEditNote(e.target.value)}
              placeholder="Add any additional notes about this address..."
              rows={3}
              className="w-full px-3 py-2 border border-input rounded-md bg-background text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              maxLength={500}
            />
            <p className="text-xs text-muted-foreground">
              {editNote.length}/500 characters
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={!editLabel.trim()}>
              Save Label
            </Button>
            <Button onClick={handleCancel} variant="outline">
              Cancel
            </Button>
            {label && (
              <Button
                onClick={handleDelete}
                variant="destructive"
                className="ml-auto"
              >
                Delete Label
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (label) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm text-muted-foreground">Label:</span>
                <Badge
                  variant="secondary"
                  className={getLabelColorClass(label.color)}
                >
                  {label.label}
                </Badge>
              </div>
              {label.note && (
                <div className="text-sm text-muted-foreground mt-2">
                  <span className="font-medium">Note:</span> {label.note}
                </div>
              )}
              <div className="text-xs text-muted-foreground mt-2">
                Added {new Date(label.timestamp).toLocaleDateString()}
              </div>
            </div>
            <Button onClick={handleEdit} variant="ghost" size="sm">
              Edit
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between">
          <div className="text-sm text-muted-foreground">
            No label for this address
          </div>
          <Button onClick={handleEdit} size="sm">
            + Add Label
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
