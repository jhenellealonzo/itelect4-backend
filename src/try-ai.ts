import "dotenv/config";

import { reviewItemReport } from "./ai/gemini";

async function main(): Promise<void> {
  const review = await reviewItemReport(
    "Black wallet lost near the library yesterday afternoon. It has a small silver zipper and a visible scratch on the lower-right corner.",
  );

  console.log(JSON.stringify(review, null, 2));
}

main().catch((error: unknown) => {
  console.error(
    "AI item report review failed:",
    error instanceof Error ? error.message : error,
  );
  process.exit(1);
});
