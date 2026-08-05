// FADE wordmark, recreated as vector paths from the brand logo so it scales
// crisply and follows the current text color (white in dark mode, ink in light).

export function FadeWordmark({ className, title = "FADE" }: { className?: string; title?: string }) {
  return (
    <svg
      viewBox="-5 -4 330 108"
      // Intrinsic size so `height + width:auto` resolves the same in every
      // browser (Safari needs this) — CSS still controls the rendered size.
      width={330}
      height={108}
      className={className}
      role="img"
      aria-label={title}
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <g transform="translate(21.3 0) skewX(-12)">
        {/* F */}
        <path d="M0,0 H60 V22 H24 V40 H56 V62 H24 V100 H0 Z" />
        {/* A — flat apex, long hypotenuse to a sharp bottom-left point,
            triangular counter, thin speed-slit in the bottom edge */}
        <path
          fillRule="evenodd"
          d="M112,0 L130,0 L138,100 L115,100 L127.5,70 L121.5,70 L109,100 L70,100 Z M116,30 L116,60 L97,60 Z"
        />
        {/* D — chamfered right corners */}
        <path fillRule="evenodd" d="M155,0 H210 L225,14 V86 L211,100 H155 Z M179,22 H202 V78 H179 Z" />
        {/* E — angled cut on the top arm's right end */}
        <path d="M237,0 H298 L289,22 H261 V40 H291 V62 H261 V78 H296 V100 H237 Z" />
      </g>
    </svg>
  );
}
