import { redirect } from "next/navigation";

// The app starts on the creator pipeline; the brand playbook lives at /playbook.
export default function Home() {
  redirect("/creators");
}
