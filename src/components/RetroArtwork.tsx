// Original vector artwork inspired by everyday print ephemera: tea stalls,
// matchbox labels, railway tickets and hand-painted shop signs.
export function ChaiPrint() {
  return <svg viewBox="0 0 320 300" role="img" aria-label="Two illustrated cups of chai with a marigold sun and the words good company">
    <defs><pattern id="chai-dots" width="7" height="7" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#173d30" opacity=".2" /></pattern></defs>
    <rect x="2" y="2" width="316" height="296" fill="#ffcf24" stroke="#19221e" strokeWidth="4" />
    <rect x="13" y="13" width="294" height="274" fill="none" stroke="#19221e" strokeWidth="2" />
    <path d="M20 210h280v70H20z" fill="url(#chai-dots)" />
    <g transform="translate(160 113)" fill="#ef4928" stroke="#19221e" strokeWidth="2">
      {Array.from({ length: 12 }, (_, i) => <ellipse key={i} cx="0" cy="-36" rx="14" ry="31" transform={`rotate(${i * 30})`} />)}
      <circle r="28" fill="#ff5b91" /><path d="M-12-3h3m18 0h3M-9 9q9 10 18 0" fill="none" strokeWidth="3" strokeLinecap="round" />
    </g>
    <g stroke="#19221e" strokeWidth="4" strokeLinejoin="round">
      <path d="M55 171h79l-12 72H68z" fill="#fff8e8" /><ellipse cx="95" cy="171" rx="39" ry="9" fill="#ab5c35" />
      <path d="M185 166h77l-11 76h-54z" fill="#ad8cf5" /><ellipse cx="223" cy="166" rx="38" ry="9" fill="#ab5c35" />
      <path d="M76 185l5 43M92 187v42M110 184l-4 44M205 181l4 46M223 181v46M241 180l-5 47" fill="none" strokeWidth="2" />
      <path d="M82 147q-13-13 0-25M109 149q-13-13 0-25M212 141q-13-13 0-25M239 143q-13-13 0-25" fill="none" strokeWidth="3" />
    </g>
    <path d="M37 246h246" stroke="#19221e" strokeWidth="4" />
    <text x="160" y="39" textAnchor="middle" fill="#19221e" fontFamily="sans-serif" fontWeight="900" fontSize="15" letterSpacing="3">GOOD COMPANY</text>
    <text x="160" y="273" textAnchor="middle" fill="#19221e" fontFamily="monospace" fontSize="10" letterSpacing="2">ONE PROPER SIT-DOWN, PLEASE.</text>
  </svg>;
}

export function ArchiveStack() {
  return <div className="retro-archive-stack" aria-hidden="true">
    <div className="retro-back-card"><span>PERSONAL ARCHIVE</span><div className="retro-checker" /><strong>2711</strong></div>
    <div className="retro-front-card">
      <div className="retro-card-top"><span>BAATEIN PENDING</span><span>VOL. 01</span></div>
      <ChaiPrint />
      <div className="retro-card-caption"><strong>Good company.</strong><span>KEEP FOREVER ↗</span></div>
      <div className="retro-card-bottom"><span>✳</span><span className="retro-barcode" /><span>1 / 6</span></div>
    </div>
    <span className="retro-sticker">THODA<br /><em>time,</em><br />PLEASE!</span>
  </div>;
}
