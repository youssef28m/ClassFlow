"use client";

import { PlaceholderPage } from "@/components/layout/placeholder-page";

export default function TeachersPage() {
  return (
    <PlaceholderPage
      title="Teachers"
      description="Manage the teaching staff and their groups."
      resource="teachersAndSalaries"
      action="readTeachers"
    />
  );
}
