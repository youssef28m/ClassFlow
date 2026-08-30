"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { useState } from "react";
import {
  Controller,
  useForm,
  type Control,
  type UseFormReturn,
} from "react-hook-form";
import { Field, inputClassName } from "@/components/forms/field";
import { FormDialog } from "@/components/forms/form-dialog";
import { useToast } from "@/components/feedback/toast";
import { CenterSelect } from "@/features/centers/components/center-select";
import { useCreateUser, useUpdateUser } from "@/features/users/hooks";
import {
  CENTER_USER_ROLES,
  createUserFormSchema,
  editUserFormSchema,
  type CreateUserFormValues,
  type EditUserFormValues,
} from "@/features/users/schema";
import type { AdminUser } from "@/features/users/types";
import { ApiError } from "@/lib/api-client";
import { useI18n } from "@/lib/i18n/provider";

interface UserFormDialogProps {
  open: boolean;
  onClose: () => void;
  /** When provided, the dialog edits this user; otherwise it creates a new one. */
  user?: AdminUser | null;
}

/** Minimal shape of the react-hook-form instances used here. */
interface UserFormInstance {
  register: UseFormReturn<CreateUserFormValues>["register"];
  control: Control<CreateUserFormValues>;
  formState: {
    errors: {
      username?: { message?: string };
      password?: { message?: string };
      role?: { message?: string };
      centerId?: { message?: string };
    };
  };
}

export function UserFormDialog({
  open,
  onClose,
  user,
}: UserFormDialogProps) {
  const isEdit = Boolean(user);
  const isSavingEdit = Boolean(user);
  const toast = useToast();
  const { t } = useI18n();
  const createUser = useCreateUser();
  const updateUser = useUpdateUser();
  const [rootError, setRootError] = useState<string | null>(null);

  const createForm = useForm<CreateUserFormValues>({
    resolver: zodResolver(createUserFormSchema),
    defaultValues: { username: "", password: "", role: "RECEPTIONIST", centerId: 0 },
  });

  const editForm = useForm<EditUserFormValues>({
    resolver: zodResolver(editUserFormSchema),
    defaultValues: {
      username: user?.username ?? "",
      password: "",
      role: user && user.role !== "SUPERADMIN" ? user.role : "RECEPTIONIST",
    },
  });

  const isSaving = isSavingEdit
    ? updateUser.isPending
    : createUser.isPending;

  const onOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) onClose();
  };

  async function onCreateSubmit(values: CreateUserFormValues) {
    setRootError(null);
    try {
      await createUser.mutateAsync({
        centerId: values.centerId,
        payload: { username: values.username, password: values.password, role: values.role },
      });
      toast.success(t("users.created"));
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setRootError(error.message);
      } else {
        setRootError(t("common.somethingWentWrong"));
      }
    }
  }

  async function onEditSubmit(values: EditUserFormValues) {
    if (!user) return;
    setRootError(null);
    try {
      await updateUser.mutateAsync({
        id: user.id,
        centerId: user.centerId ?? 0,
        payload: {
          username: values.username,
          role: values.role,
          ...(values.password ? { password: values.password } : {}),
        },
      });
      toast.success(t("users.updated"));
      onClose();
    } catch (error) {
      if (error instanceof ApiError) {
        setRootError(error.message);
      } else {
        setRootError(t("common.somethingWentWrong"));
      }
    }
  }

  return (
    <FormDialog
      open={open}
      onOpenChange={onOpenChange}
      title={
        isEdit
          ? t("users.formEditTitle", { name: user?.username ?? "" })
          : t("users.formAddTitle")
      }
      description={
        isEdit
          ? t("users.formEditDescription")
          : t("users.formAddDescription")
      }
    >
      {isEdit ? (
        <form
          onSubmit={editForm.handleSubmit(onEditSubmit)}
          className="space-y-4"
          noValidate
        >
          <ErrorBanner message={rootError} />
          <UserFields form={editForm as unknown as UserFormInstance} isEdit />
          <div className="flex justify-end gap-2 pt-2">
            <DialogButtons
              isSaving={isSaving}
              onCancel={onClose}
              submitLabel={t("common.saveChanges")}
            />
          </div>
        </form>
      ) : (
        <form
          onSubmit={createForm.handleSubmit(onCreateSubmit)}
          className="space-y-4"
          noValidate
        >
          <ErrorBanner message={rootError} />
          <UserFields form={createForm as UserFormInstance} />
          <div className="flex justify-end gap-2 pt-2">
            <DialogButtons
              isSaving={isSaving}
              onCancel={onClose}
              submitLabel={t("users.add")}
            />
          </div>
        </form>
      )}
    </FormDialog>
  );
}

function ErrorBanner({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p
      role="alert"
      className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-600 dark:text-red-400"
    >
      {message}
    </p>
  );
}

function DialogButtons({
  isSaving,
  onCancel,
  submitLabel,
}: {
  isSaving: boolean;
  onCancel: () => void;
  submitLabel: string;
}) {
  const { t } = useI18n();
  return (
    <>
      <button
        type="button"
        onClick={onCancel}
        disabled={isSaving}
        className="h-10 rounded-lg border border-border px-4 text-sm font-medium text-card-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-60"
      >
        {t("common.cancel")}
      </button>
      <button
        type="submit"
        disabled={isSaving}
        className="flex h-10 items-center justify-center gap-2 rounded-lg bg-primary px-5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90 disabled:pointer-events-none disabled:opacity-60"
      >
        {isSaving ? <Loader2 className="size-4 animate-spin" aria-hidden /> : null}
        {submitLabel}
      </button>
    </>
  );
}

interface UserFieldsProps {
  form: UserFormInstance;
  isEdit?: boolean;
}

function UserFields({ form, isEdit }: UserFieldsProps) {
  const { t, tEnum } = useI18n();
  return (
    <>
      <Field label={t("users.formUsername")} htmlFor="username" error={form.formState.errors.username?.message}>
        <input
          id="username"
          type="text"
          autoComplete="off"
          placeholder={t("users.usernamePlaceholder")}
          aria-invalid={Boolean(form.formState.errors.username)}
          className={inputClassName}
          {...form.register("username")}
        />
      </Field>

      <Field
        label={t("users.formPassword")}
        htmlFor="password"
        error={form.formState.errors.password?.message}
        hint={isEdit ? t("users.passwordEditHint") : undefined}
      >
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          placeholder={isEdit ? "••••••••" : t("users.passwordPlaceholder")}
          aria-invalid={Boolean(form.formState.errors.password)}
          className={inputClassName}
          {...form.register("password")}
        />
      </Field>

      <Field label={t("users.columnRole")} htmlFor="role" error={form.formState.errors.role?.message}>
        <select
          id="role"
          aria-invalid={Boolean(form.formState.errors.role)}
          className={inputClassName}
          {...form.register("role")}
        >
          {CENTER_USER_ROLES.map((role) => (
            <option key={role} value={role}>
              {tEnum(role)}
            </option>
          ))}
        </select>
      </Field>

      {!isEdit ? (
        <Field
          label={t("users.formCenter")}
          htmlFor="centerId"
          error={form.formState.errors.centerId?.message}
        >
          <Controller
            name="centerId"
            control={form.control}
            render={({ field }) => (
              <CenterSelect
                value={field.value ? String(field.value) : ""}
                onChange={(nextValue) =>
                  field.onChange(nextValue === "" ? 0 : Number(nextValue))
                }
              />
            )}
          />
        </Field>
      ) : null}
    </>
  );
}