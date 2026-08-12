// FADE wordmark — the brand's actual vector paths (from
// fade-logo-icon-black-on-white-01.svg), recolored via currentColor so it
// renders white in dark mode and ink in light mode.

export function FadeWordmark({ className, title = "FADE" }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="98 421 804 158"
      // Intrinsic size so `height + width:auto` resolves the same in every
      // browser (Safari needs this) — CSS still controls the rendered size.
      width={804}
      height={158}
      className={className}
      role="img"
      aria-label={title}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <polygon points="231.7,573.7 370,426.3 430.5,426.3 468.8,573.7 348.9,573.7 348.9,541.4 403.7,541.4 390,488.4 304,573.7" />
      <path d="M684,426.3H517l-48.2,147.4H634l22.9-14.7l36.9-113.3L684,426.3z M596.5,541.8H547l26.9-82.6h49.5L596.5,541.8z" />
      <polygon points="775.7,459.1 766.2,488.2 848.3,488.2 840.5,511.8 758.5,511.8 748.7,541.8 858.7,541.8 848.3,573.7 674.4,573.7 722.4,426.3 896.3,426.3 885.6,459.1" />
      <polygon points="207,458.6 197.7,487.8 275.6,488.4 254.3,511 190.1,511 169.9,573.7 103.7,573.7 151.8,426.3 333.8,426.3 303.2,458.9" />
    </svg>
  );
}
