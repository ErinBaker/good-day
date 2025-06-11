"use client";

export default function DateCell({ value }: { value: string }) {
  if (!value) return "";
  const date = new Date(value);
  if (isNaN(date.getTime())) return "Invalid Date";
  return date.toLocaleString();
} 