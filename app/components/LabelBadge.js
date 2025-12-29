"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import { getAddressLabel, getLabelColorClass } from "@/lib/labels";

export default function LabelBadge({ address, showLink = false }) {
  const [label, setLabel] = useState(null);

  const loadLabel = useCallback(() => {
    const labelData = getAddressLabel(address);
    setLabel(labelData);
  }, [address]);

  useEffect(() => {
    loadLabel();

    // Listen for label updates
    const handleUpdate = (e) => {
      if (!e.detail?.address || e.detail.address === address.toLowerCase()) {
        loadLabel();
      }
    };
    window.addEventListener("labelsUpdated", handleUpdate);
    return () => window.removeEventListener("labelsUpdated", handleUpdate);
  }, [address, loadLabel]);

  if (!label) return null;

  // Map legacy color classes to shadcn badge variants
  const getVariant = (_color) => {
    // Since shadcn Badge has limited variants (default, secondary, destructive, outline),
    // we'll use className for custom colors
    return "secondary";
  };

  const badge = (
    <Badge
      variant={getVariant(label.color)}
      className={getLabelColorClass(label.color)}
      title={label.note || label.label}
    >
      🏷️ {label.label}
    </Badge>
  );

  if (showLink) {
    return (
      <Link
        href={`/address/${address}`}
        className="inline-block hover:opacity-80 transition-opacity"
      >
        {badge}
      </Link>
    );
  }

  return badge;
}
