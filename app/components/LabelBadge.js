"use client";

import { useEffect, useState } from "react";
import { getAddressLabel, getLabelColorClass } from "@/lib/labels";
import Link from "next/link";

export default function LabelBadge({ address, showLink = false }) {
  const [label, setLabel] = useState(null);

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
  }, [address]);

  function loadLabel() {
    const labelData = getAddressLabel(address);
    setLabel(labelData);
  }

  if (!label) return null;

  const badge = (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold ${getLabelColorClass(
        label.color,
      )}`}
      title={label.note || label.label}
    >
      🏷️ {label.label}
    </span>
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
