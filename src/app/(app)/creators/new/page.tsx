import { NewCreatorForm } from "./new-creator-form";

export default function NewCreatorPage() {
  return (
    <div className="max-w-xl mx-auto">
      <h1 className="text-xl font-bold mb-4">Add creator</h1>
      <div className="card p-5">
        <NewCreatorForm aiEnabled={!!process.env.ANTHROPIC_API_KEY} />
      </div>
    </div>
  );
}
