import { z } from "zod";

// Auth validations
export const loginSchema = z.object({
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
});

export const invitationAcceptSchema = z
  .object({
    displayName: z
      .string()
      .min(2, "Le nom doit contenir au moins 2 caractères")
      .max(50, "Le nom ne peut pas dépasser 50 caractères"),
    password: z
      .string()
      .min(8, "Le mot de passe doit contenir au moins 8 caractères")
      .max(100, "Le mot de passe ne peut pas dépasser 100 caractères"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

export const inviteUserSchema = z.object({
  email: z.string().email("Email invalide"),
});

// Profile validations
export const profileUpdateSchema = z.object({
  displayName: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Le mot de passe actuel est requis"),
    newPassword: z
      .string()
      .min(8, "Le nouveau mot de passe doit contenir au moins 8 caractères")
      .max(100, "Le mot de passe ne peut pas dépasser 100 caractères"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas",
    path: ["confirmPassword"],
  });

// Article validations
export const articleSchema = z.object({
  title: z
    .string()
    .min(3, "Le titre doit contenir au moins 3 caractères")
    .max(200, "Le titre ne peut pas dépasser 200 caractères"),
  slug: z
    .string()
    .min(3, "Le slug doit contenir au moins 3 caractères")
    .max(200, "Le slug ne peut pas dépasser 200 caractères")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Le slug doit être en minuscules et contenir uniquement des lettres, chiffres et tirets"),
  content: z.string().min(10, "Le contenu doit contenir au moins 10 caractères"),
  excerpt: z
    .string()
    .max(300, "L'extrait ne peut pas dépasser 300 caractères")
    .optional()
    .nullable(),
  coverImageUrl: z.string().url("URL d'image invalide").optional().nullable(),
  status: z.enum(["draft", "published"]),
  categoryIds: z.array(z.string().uuid()).optional(),
});

// Category validations
export const categorySchema = z.object({
  name: z
    .string()
    .min(2, "Le nom doit contenir au moins 2 caractères")
    .max(50, "Le nom ne peut pas dépasser 50 caractères"),
  slug: z
    .string()
    .min(2, "Le slug doit contenir au moins 2 caractères")
    .max(50, "Le slug ne peut pas dépasser 50 caractères")
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Le slug doit être en minuscules et contenir uniquement des lettres, chiffres et tirets"),
});

// Comment validations
export const commentSchema = z.object({
  content: z
    .string()
    .min(2, "Le commentaire doit contenir au moins 2 caractères")
    .max(1000, "Le commentaire ne peut pas dépasser 1000 caractères"),
  articleId: z.string().uuid(),
  parentId: z.string().uuid().optional().nullable(),
});

// Image upload validations
export const imageUploadSchema = z.object({
  file: z
    .instanceof(File)
    .refine((file) => file.size <= 5 * 1024 * 1024, "L'image ne peut pas dépasser 5 Mo")
    .refine(
      (file) => ["image/jpeg", "image/png", "image/webp", "image/gif"].includes(file.type),
      "Format d'image non supporté (JPEG, PNG, WebP, GIF uniquement)"
    ),
});
