import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const methodSchema = z.enum(["WAVE", "ORANGE_MONEY", "CARD", "CASH_ON_DELIVERY"]);

export const placeCashOrderFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        productId: z.string().uuid(),
        method: methodSchema,
        address: z.string().min(5).max(300),
        phone: z.string().min(6).max(30),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { placeCashOrder } = await import("@/lib/checkout.server");
    return placeCashOrder({ ...data, userId: context.userId });
  });

export const openFlexAccountFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        productId: z.string().uuid(),
        address: z.string().min(5).max(300),
        phone: z.string().min(6).max(30),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { openFlexAccount } = await import("@/lib/checkout.server");
    return openFlexAccount({ ...data, userId: context.userId });
  });

export const depositToFlexFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        flexAccountId: z.string().uuid(),
        amount: z.number().positive(),
        method: methodSchema,
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { depositToFlex } = await import("@/lib/checkout.server");
    return depositToFlex({ ...data, userId: context.userId });
  });

export const requestFlexCancellationFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z
      .object({
        flexAccountId: z.string().uuid(),
        reason: z.string().max(500).optional(),
        keepAsCredit: z.boolean().default(false),
      })
      .parse(data),
  )
  .handler(async ({ data, context }) => {
    const { requestFlexCancellation } = await import("@/lib/checkout.server");
    return requestFlexCancellation({ ...data, userId: context.userId });
  });

export const flexSettingsFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getFlexSettings } = await import("@/lib/checkout.server");
  return getFlexSettings();
});

export const joinTontineFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) => z.object({ tontineId: z.string().uuid() }).parse(data))
  .handler(async ({ data, context }) => {
    const { joinTontineRequest } = await import("@/lib/checkout.server");
    return joinTontineRequest({ tontineId: data.tontineId, userId: context.userId });
  });

export const payContributionFn = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: unknown) =>
    z.object({ memberId: z.string().uuid(), method: methodSchema }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { payContribution } = await import("@/lib/checkout.server");
    return payContribution({ ...data, userId: context.userId });
  });
