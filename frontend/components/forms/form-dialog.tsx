"use client";

import type { ReactNode } from "react";
import { Dialog } from "@/components/feedback/dialog";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  children,
}: FormDialogProps) {
  return (
    <Dialog open={open} onClose={() => onOpenChange(false)} title={title} description={description}>
      {children}
    </Dialog>
  );
}
