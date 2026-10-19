import { ScoutView } from "./scout-view";

export const dynamic = "force-dynamic";

// Apify's sync scrape can take a while on busy hashtags.
export const maxDuration = 120;

export default function ScoutPage() {
  return (
    <ScoutView
      aiEnabled={!!process.env.ANTHROPIC_API_KEY}
      apifyEnabled={!!process.env.APIFY_TOKEN}
    />
  );
}
