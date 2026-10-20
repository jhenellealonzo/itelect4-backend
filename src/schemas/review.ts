import { z } from "zod";

export const aiRequestSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(20, "Describe the item report in at least 20 characters.")
    .max(2000, "Keep the description under 2000 characters."),
});

export const itemReportReviewSchema = z.object({
  summary: z
    .string()
    .describe(
      "One concise sentence restating the lost or found item report without inventing information.",
    ),
  keyDetails: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe(
      "One to three useful identifying facts already present in the user's report.",
    ),
  suggestions: z
    .array(z.string())
    .min(1)
    .max(3)
    .describe(
      "One to three practical clarifications or details that could improve the report or make matching easier.",
    ),
  readiness: z
    .enum(["ready", "almost", "not-yet"])
    .describe(
      "ready means enough useful identifying information to post; almost means one or two important clarifications would improve it; not-yet means the report is too vague to be useful for identification or matching.",
    ),
});

export type ItemReportReview = z.infer<typeof itemReportReviewSchema>;

export const itemReportReviewJsonSchema = z.toJSONSchema(
  itemReportReviewSchema,
);
