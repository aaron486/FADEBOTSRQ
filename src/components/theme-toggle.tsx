"use client";

export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const current =
      root.dataset.theme ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = current === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    try {
      localStorage.setItem("fade-theme", next);
    } catch {}
  }

  return (
    <button className="btn btn-ghost btn-sm" onClick={toggle} title="Toggle light/dark" aria-label="Toggle theme">
      ◐
    </button>
  );
}
