// Outreach scenario library — handcrafted starting points for every phase of
// the creator pipeline. Each scenario ships multiple variants per channel so
// "reimagine" works offline (shuffle variants); the AI composer uses the same
// scenario definitions as grounding when ANTHROPIC_API_KEY is configured.
// Variables: {name} {handle} {platform} — resolved by fillTemplate().

export type ScenarioKey =
  | "first_contact"
  | "follow_up"
  | "warm_intro"
  | "negotiation"
  | "contract_next_steps"
  | "post_live"
  | "reengage";

export type Scenario = {
  key: ScenarioKey;
  label: string;
  description: string;
  dm: string[];
  email: { subject: string; body: string }[];
};

export const TONES = [
  { key: "casual", label: "Casual" },
  { key: "professional", label: "Professional" },
  { key: "hype", label: "Hype" },
  { key: "short", label: "Short & punchy" },
] as const;
export type ToneKey = (typeof TONES)[number]["key"];

export const SCENARIOS: Scenario[] = [
  {
    key: "first_contact",
    label: "First contact",
    description: "Cold intro to a creator we've never talked to",
    dm: [
      `Hey {name}! Love your content — especially the recent stuff. I'm with FADE and we're partnering with a small group of creators this month. Paid, flat rate, you keep full creative control. Interested in the details?`,
      `Yo {name} — your content keeps landing on my feed and it's exactly the energy we want around FADE. We're doing paid creator partnerships this month, simple terms, no exclusivity. Want me to send the details?`,
      `Hey {name}, quick one: I run creator partnerships at FADE. We've got a paid campaign spinning up and your page is a perfect fit. Rate agreed up front, full creative control on your side. Open to hearing more?`,
    ],
    email: [
      {
        subject: "FADE x {name} — paid creator partnership",
        body: `Hi {name},\n\nI'm reaching out from FADE. We've been following your content and think you'd be a great fit for a paid partnership we're running this month.\n\nThe short version:\n- Paid, flat rate agreed up front\n- You keep full creative control\n- Simple one-page agreement\n\nIf you're interested, reply here and I'll send over the details.\n\nBest,\nFADE Team`,
      },
      {
        subject: "Paid partnership with FADE?",
        body: `Hi {name},\n\nYour content came across our radar and it's exactly the kind of energy we want around FADE. We're bringing on a small group of creators this month for a paid campaign.\n\nNo exclusivity, no scripts — you make what your audience already loves, we pay a flat rate agreed up front.\n\nWorth a quick chat? Reply and I'll send the specifics.\n\nBest,\nFADE Team`,
      },
    ],
  },
  {
    key: "follow_up",
    label: "Follow-up (no reply)",
    description: "Bump a message that hasn't been answered yet",
    dm: [
      `Hey {name}, just floating this back to the top of your inbox — still have a couple of creator slots open this month and I'd love to get you in. Any interest?`,
      `{name}! Not trying to spam you, just know DMs get buried. Paid FADE partnership offer still stands — one word and I'll send the details.`,
      `Hey {name} — last nudge from me, promise. The creator slots for this month are almost filled and I wanted to make sure you saw the offer before they're gone. Interested?`,
    ],
    email: [
      {
        subject: "Quick follow-up — FADE partnership",
        body: `Hi {name},\n\nJust floating my last email back to the top of your inbox. We still have a couple of paid creator slots open this month and I think you'd be a great fit.\n\nIf now isn't the right time, no worries at all — just let me know either way.\n\nBest,\nFADE Team`,
      },
      {
        subject: "Re: FADE x {name} — still interested?",
        body: `Hi {name},\n\nI know inboxes get buried, so one quick bump: the paid partnership offer from FADE is still open, but this month's slots are filling up.\n\nIf you want in, a one-line reply is all it takes and I'll handle the rest.\n\nBest,\nFADE Team`,
      },
    ],
  },
  {
    key: "warm_intro",
    label: "Warm intro",
    description: "They follow us, engaged with us, or we met before",
    dm: [
      `Hey {name}! Noticed you've been showing FADE some love — appreciate it. Want to make it official? We're doing paid creator partnerships and you're exactly who we want on board.`,
      `{name}! Since you're already part of the FADE family, figured I'd reach out directly — we're paying creators this month and I'd rather pay you than someone who doesn't get the brand. Want the details?`,
    ],
    email: [
      {
        subject: "You already know FADE — let's make it official",
        body: `Hi {name},\n\nWe've noticed you engaging with FADE and honestly, that makes this easy — we're running paid creator partnerships this month, and we'd much rather work with creators who already get the brand.\n\nFlat rate agreed up front, full creative control, simple one-page agreement.\n\nWant the details?\n\nBest,\nFADE Team`,
      },
    ],
  },
  {
    key: "negotiation",
    label: "Rate discussion",
    description: "They replied — talk money and deliverables",
    dm: [
      `Love it, {name}. Here's what we're thinking: [X posts / stories] over [timeframe] at $[rate], paid [terms]. You keep full creative control — we just ask for [requirement]. How does that land?`,
      `Great to hear back, {name}! Straightforward offer: $[rate] for [deliverables], creative direction 100% yours. If the number needs adjusting, tell me what works and we'll figure it out.`,
    ],
    email: [
      {
        subject: "FADE partnership — the numbers",
        body: `Hi {name},\n\nGreat to hear you're interested. Here's the offer:\n\n- Deliverables: [X posts / stories / videos] over [timeframe]\n- Rate: $[rate], paid [net-15 / on posting]\n- Creative control stays with you — we just ask for [requirement]\n\nIf the rate or deliverables need adjusting, tell me what works on your side and we'll find the middle.\n\nBest,\nFADE Team`,
      },
    ],
  },
  {
    key: "contract_next_steps",
    label: "Confirmed → contract",
    description: "Deal agreed — send the agreement and next steps",
    dm: [
      `{name}, we're locked in 🤝 Sending the one-page agreement to your email — takes 2 minutes to sign. Once that's back, you're clear to create. Anything you need from us, I'm right here.`,
      `Amazing, {name}. Next steps: 1) one-page agreement hitting your inbox today, 2) you sign, 3) you create, 4) you get paid. That's the whole process. What email should I send it to?`,
    ],
    email: [
      {
        subject: "FADE x {name} — agreement + next steps",
        body: `Hi {name},\n\nGreat to have you on board. Here's how we wrap this up:\n\n1. Attached is the one-page agreement — [rate], [deliverables], [timeline]\n2. Sign and send it back (takes ~2 minutes)\n3. You create on your schedule within the timeline\n4. Payment goes out [terms]\n\nAny questions on the agreement, just reply — otherwise, excited to see what you make.\n\nBest,\nFADE Team`,
      },
    ],
  },
  {
    key: "post_live",
    label: "Post went live",
    description: "Thank them, boost the post, keep the door open",
    dm: [
      `{name}, the post is 🔥 — exactly what we hoped for. We're pushing it on our channels too. Once the numbers settle I'll send over the performance recap. Already thinking about the next one?`,
      `Just saw it go live, {name} — great work. Payment is [status/on its way]. If this lands the way I think it will, expect me back in your DMs about round two.`,
    ],
    email: [
      {
        subject: "It's live — nice work 🎉",
        body: `Hi {name},\n\nThe post looks great — exactly the energy we wanted. We're amplifying it from our side as well.\n\nPayment [status — e.g. "goes out this week per our agreement"].\n\nI'll send a quick performance recap once the numbers settle. And if you're up for it, I'd love to talk about what a longer-running partnership could look like.\n\nBest,\nFADE Team`,
      },
    ],
  },
  {
    key: "reengage",
    label: "Re-engage",
    description: "Worked together before — bring them back for a new campaign",
    dm: [
      `{name}! The last collab did numbers — we still talk about it. New campaign is spinning up and you were the first name on my list. Same easy process, updated rate. In?`,
      `Hey {name}, it's your favorite brand deal again 😄 New FADE campaign, bigger budget than last time, and you already know the drill. Want the details?`,
    ],
    email: [
      {
        subject: "Round two? New FADE campaign",
        body: `Hi {name},\n\nThe content from our last partnership performed great — so I'll keep this short: we've got a new campaign starting and you were the first creator on my list.\n\nSame simple process as last time, updated rate to match. Interested?\n\nBest,\nFADE Team`,
      },
    ],
  },
];

export const scenarioByKey = (key: string) => SCENARIOS.find((s) => s.key === key);
