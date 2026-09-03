import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const roleSchema = z.enum([
  "super_admin",
  "admin",
  "finance",
  "stock",
  "tontine_manager",
  "client",
]);

export const myAccessFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { getMyRoles } = await import("@/lib/admin.server");
    const roles = await getMyRoles(context.supabase, context.userId);
    const staffRoles = roles.filter((r) => r !== "client");
    return { roles, isStaff: staffRoles.length > 0 };
  });

export const adminOverviewFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { ensureStaff, getOverview, listAuditLogs } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    const [overview, logs] = await Promise.all([getOverview(), listAuditLogs()]);
    return { overview, logs };
  });

export const adminOrdersFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { ensureStaff, listOrders } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return listOrders();
  });

export const adminUpdateOrderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        orderId: z.string().uuid(),
        status: z.enum([
          "PENDING",
          "PAID",
          "CONFIRMED",
          "PREPARING",
          "SHIPPED",
          "DELIVERED",
          "COMPLETED",
          "CANCELLED",
        ]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { ensureStaff, updateOrderStatus } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return updateOrderStatus({ ...data, actorId: context.userId });
  });

export const adminPaymentsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { ensureStaff, listPayments } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return listPayments();
  });

export const adminDecidePaymentFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        paymentId: z.string().uuid(),
        status: z.enum(["PENDING", "SUCCESS", "FAILED", "CANCELLED", "REFUNDED"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { ensureStaff, decidePayment } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return decidePayment({ ...data, actorId: context.userId });
  });

export const adminProductsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { ensureStaff, listProductsAdmin } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return listProductsAdmin();
  });

const productSpecSchema = z.object({
  label: z.string().min(1).max(60),
  value: z.string().min(1).max(120),
});

const productPatchSchema = z.object({
  model: z.string().min(1).max(120).optional(),
  slug: z
    .string()
    .min(1)
    .max(160)
    .regex(/^[a-z0-9-]+$/, "Slug: minuscules, chiffres et tirets uniquement.")
    .optional(),
  category: z.string().min(1).max(60).optional(),
  generation: z.string().max(60).nullable().optional(),
  storage: z.string().max(60).nullable().optional(),
  color: z.string().max(60).nullable().optional(),
  connectivity: z.string().max(60).nullable().optional(),
  condition: z.string().max(60).nullable().optional(),
  description: z.string().max(2000).nullable().optional(),
  images: z.array(z.string().url()).optional(),
  specs: z.array(productSpecSchema).max(20).optional(),
  warranty_months: z.number().int().nonnegative().optional(),
  purchase_cost_usd: z.number().nonnegative().optional(),
  shipping_cost_usd: z.number().nonnegative().optional(),
  price_cash: z.number().int().nonnegative().optional(),
  price_flex: z.number().int().nonnegative().optional(),
  price_tontine: z.number().int().nonnegative().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
  low_stock_threshold: z.number().int().nonnegative().optional(),
  is_active: z.boolean().optional(),
});

export const adminCreateProductFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        product: productPatchSchema.extend({
          model: z.string().min(1).max(120),
          slug: z
            .string()
            .min(1)
            .max(160)
            .regex(/^[a-z0-9-]+$/, "Slug: minuscules, chiffres et tirets uniquement."),
          category: z.string().min(1).max(60),
        }),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { ensureStaff, createProduct } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return createProduct({ product: data.product, actorId: context.userId });
  });

export const adminUpdateProductFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        productId: z.string().uuid(),
        patch: productPatchSchema.refine((p) => Object.keys(p).length > 0, "Aucune modification."),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { ensureStaff, updateProduct } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return updateProduct({ ...data, actorId: context.userId });
  });

export const adminUsersFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { ensureStaff, listUsersAdmin } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return listUsersAdmin();
  });

export const adminSetRoleFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), role: roleSchema }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { ensureRole, setUserRole } = await import("@/lib/admin.server");
    const allowed =
      (await ensureRole(context.supabase, context.userId, "super_admin")) ||
      (await ensureRole(context.supabase, context.userId, "admin"));
    if (!allowed) throw new Error("Seuls les administrateurs peuvent modifier les rôles.");
    return setUserRole({ ...data, actorId: context.userId });
  });

export const adminSetUserStatusFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ userId: z.string().uuid(), status: z.enum(["ACTIVE", "SUSPENDED"]) }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { ensureRole, setUserStatus } = await import("@/lib/admin.server");
    const allowed =
      (await ensureRole(context.supabase, context.userId, "super_admin")) ||
      (await ensureRole(context.supabase, context.userId, "admin"));
    if (!allowed) throw new Error("Seuls les administrateurs peuvent suspendre un compte.");
    return setUserStatus({ ...data, actorId: context.userId });
  });

export const adminTontinesFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { ensureStaff, listTontinesAdmin } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return listTontinesAdmin();
  });

export const adminDecideMemberFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        memberId: z.string().uuid(),
        decision: z.enum(["APPROVED", "ACTIVE", "SUSPENDED", "REMOVED"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { ensureStaff, decideMembership } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return decideMembership({ ...data, actorId: context.userId });
  });

export const adminUpdateTontineFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        tontineId: z.string().uuid(),
        status: z.enum(["DRAFT", "OPEN", "ACTIVE", "CLOSED"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { ensureStaff, updateTontineStatus } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return updateTontineStatus({ ...data, actorId: context.userId });
  });

export const adminFlexCancellationsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ status: z.enum(["PENDING", "ALL"]).default("PENDING") }).parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    const { ensureStaff, listFlexCancellations } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return listFlexCancellations(data.status);
  });

export const adminDecideFlexCancellationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        requestId: z.string().uuid(),
        decision: z.enum(["APPROVED", "REJECTED"]),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { ensureStaff, decideFlexCancellation } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return decideFlexCancellation({ ...data, actorId: context.userId });
  });

export const adminMarkFlexCancellationRefundedFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ requestId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { ensureStaff, markFlexCancellationRefunded } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return markFlexCancellationRefunded({ ...data, actorId: context.userId });
  });

export const adminSettingsFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { ensureStaff, listSettings } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return listSettings();
  });

export const adminUpdateSettingFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        key: z.enum(["company", "flex", "stock", "delivery", "terms", "support"]),
        value: z.record(z.string(), z.unknown()),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { ensureStaff, updateSetting } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return updateSetting({ ...data, actorId: context.userId });
  });

export const adminStoriesFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { ensureStaff, listStoriesAdmin } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return listStoriesAdmin();
  });

export const adminCreateStoryFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        title: z.string().max(100).optional(),
        mediaUrl: z.string().url(),
        mediaType: z.enum(["IMAGE", "VIDEO"]),
        productId: z.string().uuid().optional(),
        durationHours: z
          .number()
          .positive()
          .max(24 * 30), // 30 jours max
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { ensureStaff, createStory } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return createStory({ ...data, actorId: context.userId });
  });

export const adminSetStoryActiveFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ storyId: z.string().uuid(), isActive: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { ensureStaff, setStoryActive } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return setStoryActive({ ...data, actorId: context.userId });
  });

export const adminDeleteStoryFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ storyId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { ensureStaff, deleteStory } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return deleteStory({ ...data, actorId: context.userId });
  });

export const adminSendMessageFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        title: z.string().min(1).max(120),
        body: z.string().min(1).max(1000),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { ensureStaff, sendClientMessage } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return sendClientMessage({ ...data, actorId: context.userId });
  });

// --- LIVREURS ---------------------------------------------------------

export const adminCouriersFn = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { ensureStaff, listCouriers } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return listCouriers();
  });

const courierInputSchema = z.object({
  fullName: z.string().min(2).max(120),
  phone: z.string().min(6).max(30),
  vehicle: z.string().max(60).optional(),
  zone: z.string().max(120).optional(),
  notes: z.string().max(500).optional(),
});

export const adminCreateCourierFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => courierInputSchema.parse(data))
  .handler(async ({ data, context }) => {
    const { ensureStaff, createCourier } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return createCourier({ ...data, actorId: context.userId });
  });

export const adminUpdateCourierFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    courierInputSchema.extend({ courierId: z.string().uuid(), isActive: z.boolean() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { ensureStaff, updateCourier } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return updateCourier({ ...data, actorId: context.userId });
  });

export const adminDeleteCourierFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ courierId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { ensureStaff, deleteCourier } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return deleteCourier({ ...data, actorId: context.userId });
  });

export const adminAssignCourierFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({ deliveryId: z.string().uuid(), courierId: z.string().uuid().nullable() })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { ensureStaff, assignCourier } = await import("@/lib/admin.server");
    await ensureStaff(context.supabase, context.userId);
    return assignCourier({ ...data, actorId: context.userId });
  });
