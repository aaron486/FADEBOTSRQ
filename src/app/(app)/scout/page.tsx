import { ScoutView } from "./scout-view";

export const dynamic = "force-dynamic";

export default function ScoutPage() {
  return <ScoutView aiEnabled={!!process.env.ANTHROPIC_API_KEY} />;
}
