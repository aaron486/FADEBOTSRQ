// FADE wordmark, recreated as vector paths from the brand logo so it scales
// crisply and follows the current text color (white in dark mode, ink in light).

export function FadeWordmark({ className, title = "FADE" }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="0 0 318 100"
      className={className}
      role="img"
      aria-label={title}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(21.3 0) skewX(-12)">
        {/* F */}
        <path d="M0,0 H60 V22 H24 V40 H56 V62 H24 V100 H0 Z" />
        {/* A — diagonal leg, triangular counter, notched crossbar */}
        <path
          fillRule="evenodd"
          d="M142,0 L142,100 L72,100 Z M118,26 L118,58 L95.6,58 Z M118,80 L118,100 L98,100 L112,80 Z"
        />
        {/* D — chamfered right corners */}
        <path fillRule="evenodd" d="M154,0 H214 L226,12 V88 L214,100 H154 Z M178,22 H204 V78 H178 Z" />
        {/* E */}
        <path d="M238,0 H296 V22 H262 V40 H292 V62 H262 V78 H296 V100 H238 Z" />
      </g>
    </svg>
  );
}
