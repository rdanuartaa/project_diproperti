"use client";

import React from "react";
import { formatViewCount } from "@/lib/property";

export default function ArticleViewMeta({
  views = 0,
  compact = false,
  primaryText = false,
  mutedText = false,
}) {
  return (
    <span
      className="article-view-meta"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: compact ? "4px" : "6px",
        color: primaryText
          ? "var(--Primary, #02469B)"
          : mutedText
            ? "var(--Text-5, #A8ABAE)"
            : "var(--Heading, #1f2937)",
        fontSize: compact ? "13px" : "14px",
        fontWeight: 500,
        lineHeight: 1,
        whiteSpace: "nowrap",
      }}
      title={`${Number(views || 0).toLocaleString("id-ID")} kunjungan`}
    >
      <svg
        width={18}
        height={18}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M2.25 12s3.75-6.75 9.75-6.75S21.75 12 21.75 12 18 18.75 12 18.75 2.25 12 2.25 12Z"
          stroke="#A8ABAE"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M12 15.25A3.25 3.25 0 1 0 12 8.75a3.25 3.25 0 0 0 0 6.5Z"
          stroke="#A8ABAE"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span>{formatViewCount(views)} kunjungan</span>
    </span>
  );
}
