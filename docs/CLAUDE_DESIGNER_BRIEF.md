# Skarbnik — Claude Designer brief

This document is the prompt we hand to **Claude Designer** to redesign the
Skarbnik experience. It's written to be copied/pasted as-is. Everything a
designer needs to understand the product — the story, the audience, the
constraints, and what success looks like — is in one place so we don't
get generic "crypto dashboard" output.

The primary ask is **the game** (quest hub + quest runtime + completion +
streak + leaderboard + AI coach). Landing and profile can follow.

---

## 0. What to paste into Claude Designer

Everything below the horizontal rule. The sections are in the order a
designer should consume them: *why it exists → who it's for → how it
behaves today → what to change → what to deliver.*

---

# Brief: Skarbnik — a gamified DeFi learning app for a Polish bank

## 1. Why this exists (the one paragraph pitch)

**Skarbnik** is a gamified learning app that teaches real people how to
use DeFi without getting scammed. We use short, on-chain-backed quests,
a live AI coach, and a character rooted in Silesian mining folklore —
*Skarbnik*, the legendary treasurer of the coal mines who rewards honest
miners and punishes the greedy. He's our mascot and the user's mentor.
Every completed quest mints an ERC-1155 achievement badge on Base so the
learning is **portable**, not trapped inside our app. We built it for
the ETH Silesia Hackathon, but our real target is **PKO Bank Polski**,
Poland's largest retail bank — we want to be the product they hand their
customers when they finally decide to talk about crypto.

Why it matters: DeFi education is currently split between influencers
shouting about 1000× gains and whitepapers no normal person will ever
read. Users either get rugged, or they stay out and miss the technology.
Skarbnik sits in the middle — legitimate enough for a compliance team,
warm enough for a 45-year-old in Katowice to finish a quest on the bus.

## 2. The character — who Skarbnik is

Skarbnik is a ghost-miner who lives deep in the Silesian coal shafts. In
the folklore he's the keeper of underground treasures. He rewards miners
who work honestly, and he disappears the ones who cheat. He's been on
Polish lunch-boxes and union banners for 150 years.

In our product he's:

- **A mentor, not a hype-man.** He doesn't promise gains. He explains
  what a wallet key does, and then he makes you prove you understood.
- **Warm but serious.** Think of a grandfather who used to work 30
  years underground — calm, a little dry, unimpressed by showmanship.
- **Visibly Polish/Silesian** without being folklorically kitsch — no
  Baba Yaga knock-offs, no painted peasant art. The silhouette is the
  hook: miner's helmet with lamp, chest/treasure box, pickaxe. That's
  the system.

Visual DNA we've already committed to:

- A **treasure-chest** icon (used in the navbar logo, the floating AI
  coach button, and the app mark). Keep this as the recurring symbol.
- A small **lamp/flame motif** for streaks and "active" states.
- A **pickaxe** motif reserved for rare moments (unlock, level-up).

**The mascot needs a proper redesign.** Right now he's an inline SVG
stick-figure walking along the quest trail. We want a real character
sheet: idle, walking, celebrating, thinking (AI coach state), sleeping
(offline state). He should look equally at home on a PKO website and in
a Farcaster frame.

## 3. Who it's for

**Primary audience** — the player:
- Polish adults, 25–50, curious about crypto, burned or scared by it.
- Has a smartphone, a bank account, no MetaMask.
- Is allergic to both: a) crypto-bro slang, b) dense finance jargon.
- Will spend 3–5 minutes at a time. Will not read a whitepaper.

**Secondary audience** — the buyer:
- A product manager, compliance officer, or marketing lead at PKO Bank.
- Needs to pitch this up to a board. Needs screenshots that look like
  they belong next to the existing IKO banking app, not inside a
  Discord server.
- Will reject anything that looks like a casino or a meme coin launch
  site on sight.

**Tertiary** — the hackathon judges and ETH Silesia crowd:
- Crypto-literate. Will notice if the badges are on-chain. Will also
  notice if the UX is lazy.

The design must simultaneously be **credible to a Polish banker** and
**interesting to a crypto-native**. That duality is the whole brief.

## 4. Current build — what's already shipped

So you're designing on top of a live product, not a greenfield. Here's
what exists:

**Stack** (non-negotiable — design what this stack can render):
- Next.js 16.2.4 App Router, React 19
- Tailwind v4 with `@theme inline` + CSS variables for theming
- Framer Motion for all animation
- lucide-react for utility iconography
- Privy v3.21.3 for auth (email / Google / wallet)
- Supabase for persistence, ERC-1155 on Base Sepolia for badges
- Polish + English (both must look intentional, not translated)

**Fonts already wired** (you can change them, but these are the ones
loaded in globals.css today):
- Display: **Cinzel** (serif, slightly archaic — works for "Skarbnik")
- Body: **Inter**
- Mono: **Space Mono** (we use mono a lot for UI labels and XP chips —
  it became part of our voice, keep some variant of that habit)

**Two themes** (both must be beautiful, not one first-class and one
afterthought):

| Token | Dark (default) | Light (PKO) |
|---|---|---|
| `--bg-primary` | `#0B0E17` (deep navy-black) | `#F0F4F8` (cool paper) |
| `--bg-card` | `#131625` | `#FFFFFF` |
| `--bg-elevated` | `#1e2235` | `#EEF0F4` |
| `--gold` (primary accent) | `#C9A84C` (burnished gold) | `#003087` (PKO navy) |
| `--cyan` (secondary accent) | `#38BDF8` | `#00A651` (Tauron green) |
| `--magenta` (tertiary) | `#D946A8` | `#E8192C` |
| `--text-primary` | `#F0F1F5` | `#0a0a14` |

The dark theme is our identity. The light theme is the compliance-safe
version we put in front of the bank — it must still feel like the same
product, not a different app.

**Existing surfaces** (each needs rework):

1. **Landing page** (`/`) — marketing, wallet-login CTA.
2. **Assessment** (`/assess`) — 3-question quiz that sets starting level.
3. **Quest Hub** (`/quest`) — the main game board. Currently a
   zig-zagging Duolingo-style vertical trail with a walking miner
   mascot. **This is the hero screen.** See §6 for detail.
4. **Quest Runtime** (`/quest/[id]`) — a short quiz (6 questions),
   each question with 4 options, an AI explainer after each answer,
   and a completion celebration.
5. **Leaderboard** (`/leaderboard`) — top players globally + the
   current user's rank.
6. **Badges** (`/badges`) — ERC-1155 collection, tx links to Basescan.
7. **Profile** (`/profile`) — stats, streak, settings.
8. **AI Coach** (floating popover, available on every app page) —
   chat with Skarbnik in Polish or English.

**What we've learned from users so far:**
- The zig-zag trail concept works — people understand it instantly.
- The streak calendar is too plain — feels like a todo checkbox, not a
  flame of commitment.
- The quiz feels text-heavy. Questions fill the screen, options feel
  like a form.
- The completion screen doesn't reward you enough — you get +80 XP
  and… that's it. People want the serotonin.
- The leaderboard is invisible — it's in a sidebar nobody looks at.
- The mascot is charming but clearly hand-drawn by a dev — needs art.
- The light theme currently looks like a government portal, not a
  bank's premium offering. Elevate it.

## 5. Visual direction — the look we want

**Mood words**: *considered, warm, earned, quiet-confident, a little
mythic.* Not corporate, not crypto-hacker, not childish.

**References (study these)**:
- **Linear** — editorial typography, restraint, how they use monospace
  sparingly for signal.
- **Arc Browser** — playful structure, considered motion, how color is
  reserved for meaningful moments.
- **Rainbow Wallet** — warm gradients, friendly without being juvenile,
  how Web3 can look inviting instead of extractive.
- **Duolingo** — the progression + celebration loop. The *mechanics*
  translate; the Saturday-morning-cartoon aesthetic does not.
- **Stripe** (dashboard + docs) — how to signal trust at a glance.
- **Cash App** — editorial single-column mobile layouts.
- **Robinhood's old onboarding** — how to explain finance to beginners
  with generous whitespace and one idea per screen.

**Anti-references (avoid)**:
- Generic "Web3 dashboard" — Solana neon, glassmorphism for its own
  sake, purple-to-pink gradients on every card.
- "Gamified finance" casino slot-machine UIs.
- Clip-art 3D finance illustrations (coins with faces, dollar-bill
  birds, etc.).
- 2012-era bank websites — stock photos of smiling couples on couches.
- Terminal/hacker-green "crypto is rebellion" aesthetic.
- Crypto Twitter PFP energy.

**Signature design choices we'd like you to push further**:
- The **mono-label habit** for UI chrome (status pills, XP chips, tab
  labels): tiny uppercase mono text with wide tracking. It gives the
  app a quiet editorial tone. Keep it but make it feel intentional,
  not copy-pasted.
- The **gold-to-cyan gradient** as the "active" signal — used on the
  active quest bubble, the AI coach button, primary CTAs. In PKO
  theme this becomes navy-to-green; the gradient structure survives
  the theme swap.
- **Cinzel for display, sparingly.** Big serifs on the quest title,
  the level banner, the completion hero. Everything else is Inter.
- **Framer Motion** is our paintbrush: the mascot walks, the pennants
  ripple, the streak flame pulses. Don't design anything you can't
  animate with spring physics.

## 6. Screens — what to redesign

For each: give us wireframe, hi-fi, both themes, all states (loading,
empty, error, success). Think about mobile (375px) and desktop
(1440px). Nothing here is a dashboard — we want editorial, one-idea-
per-screen layouts.

### 6.1 Quest Hub (the map) — HERO SCREEN

Currently: a vertical zig-zag trail with level banners ("Level 1 —
Apprentice", "Level 2 — Adept", "Level 3 — Master"), each quest a
bubble + side card that alternates left/right of a glowing spine.
A walking miner mascot stands at the current quest.

What to keep:
- The zig-zag trail metaphor (users get it immediately).
- Level banners as milestones.
- The walking mascot.
- The gold "active" bubble with pulsing ring.
- The completion pennant that plants on finished bubbles.

What to push:
- **Make the trail feel like a mine map.** Right now it's a plain
  line on a flat background. We want a hand-drawn cartographic feel —
  subtle parchment texture in light, subtle darkroom texture in dark;
  a hint that the trail goes through tunnels and caverns. Not
  skeuomorphic, just enough atmosphere to make the trail read as a
  *journey* instead of a list.
- **Differentiate the three levels visually** beyond just color. Level
  1 = shallow mine (lantern-light). Level 2 = deeper (crystal-lit
  cavern). Level 3 = the vault (gold, slight shimmer). This gives the
  user something to look forward to visually.
- **The "end of trail" flag** today is a crown chip. Make it a proper
  destination — a vault door, a treasure chamber — something that
  says "you've reached the end, more is coming."
- **The side cards** are currently cramped. Give each quest a real
  identity: a small illustration, the XP chip, the star rating, a
  one-line teaser in the user's language. Make it feel like a book
  chapter, not a form field.
- **Top bar redesign** — the user's level/XP/streak summary currently
  sits in a row of stat cards. Consolidate into a single hero strip
  that reads like a character sheet: avatar + name + level title +
  progress bar + streak flame + rank — all one composition.

Include: the Daily Challenge banner (currently above the trail), the
Top-3 leaderboard mini-preview (currently on the side — move it to a
visible but un-intrusive position — maybe under the trail, as a
"rivals" section).

### 6.2 Quest Runtime (the quiz)

Currently: a linear quiz. Header shows progress (2/6). Question at
top. Four option cards stacked. On click, the right answer highlights
green, the wrong ones red, and an AI-generated explainer appears below.
Next button at bottom.

What to rethink:
- **Treat each question like a page of a book, not a form.** One
  question, four options, lots of whitespace, big type.
- **The AI explainer moment** is the actual value. Right now it's a
  paragraph in a gray card. Elevate it: Skarbnik appears (mascot +
  speech bubble or voice-over style), and the explanation reads like
  he's talking to you. This is where we earn our name.
- **Progress indicator** — currently a thin gold bar. Make it a
  lantern-fuel gauge, or a string of mining carts, or something that
  belongs in the world. Keep it readable.
- **Failure state (new)** — if you get any answer wrong, you fail the
  quest (no partial credit). Current retry screen shows a red X and
  a "Try again" button. Make this a genuine *setback* moment — not
  punishing, but serious. Skarbnik pauses. "You almost had it.
  Again." Warm, not scolding.

### 6.3 Quest Completion / Celebration

Currently: a modal with the XP earned, a star rating, and a button to
mint the badge. The mint step is async so there's a pending state.

What to push:
- **Make the celebration cinematic.** Not confetti-spam. Think:
  Skarbnik hands you the badge. The badge reveals itself with weight.
  XP counts up. The streak flame brightens. It's a 3–4 second
  sequence that makes the user feel they *earned* something.
- **The badge itself needs real design.** Right now it's a lucide
  icon on a gradient. Each badge should be a proper emblem — like a
  medal or a coin — with the quest topic engraved into it. It's an
  ERC-1155 NFT, so it will live on Opensea/Farcaster — it has to
  look good out of context.
- **Level-up moments** (every N quests) should be bigger than a
  single-quest completion. A full-screen event: new rank title
  revealed, mascot's gear upgrades visibly, the mine opens deeper.

### 6.4 Streak Calendar

Currently: a compact strip showing 7 day-bubbles. Active days are
gold-filled; today gets a pulsing ring. Stats on the left: current
streak + best streak, with a flame icon.

What to push:
- The flame should **feel alive** — a visibly burning lantern, not an
  icon. Intensity scales with streak length.
- Consider an **expanded view** (modal or full page) that shows the
  full month as a commitment calendar, with notes on what the user
  did each day.
- **Streak-break state** deserves its own design moment — the lantern
  goes out, Skarbnik relights it on day 1. Not shame, just ritual.

### 6.5 Leaderboard

Currently: a table. Top 3 preview on the quest hub shows 3 rows with
username + XP + level badge.

What to push:
- **Top 3 as a podium**, not a list. A proper 1-2-3 composition with
  the user's avatar, level emblem, XP. Crown on #1.
- **Current user's rank** as a sticky strip at the bottom, always
  visible — "You're #42, 1,230 XP behind #41."
- **Anonymization-friendly** — usernames can be wallet addresses or
  chosen handles. Design for both (truncated 0x… with a jazzicon
  fallback, and proper handles for the ones who set one).

### 6.6 AI Coach (Skarbnik chat)

Currently: a floating popover anchored above a "coin" FAB at bottom-
right. Header, messages, three suggested questions as chips, input
form with send button. Works in Polish and English.

What to push:
- **Skarbnik has a voice** — use it. When he's thinking, a tiny
  lamp-flicker animation. When he answers, his avatar is present next
  to the message, not a generic Sparkles icon. He has a personality
  (see §2), and the UI should reinforce it.
- **Context-aware suggestion chips** — instead of the same 3 generic
  prompts every time, chips adapt to where the user is. On a quest
  page: "Explain this question simpler." On the hub: "What should I
  learn next?"
- **Quick-reply card** style for common answers (definitions, links
  to quests) — not just paragraphs of text.
- **The FAB itself** — we just landed a "coin" design (gradient rim +
  white inner face + chest silhouette + cyan gem). It works, but it
  could be pushed further. Maybe the gem pulses when Skarbnik has
  something to say. Maybe the coin flips on hover.

### 6.7 Mascot — Skarbnik himself

Full character design. Reference the folklore (old Silesian miner,
lantern, chest, pickaxe) but don't make him a cartoon.

Deliver:
- Character sheet (front / 3-quarter / side).
- Poses: idle, walking (for the trail), celebrating (completion),
  thinking (AI coach pending), sleeping (offline / streak-broken).
- Expressions: neutral, impressed, concerned, amused, proud.
- Animated rigging notes (where we can cheat with Framer Motion layer
  swaps rather than full animation — we're a web app, not a game).

Style direction: **illustrated, not 3D**. Warm, slightly woodcut,
slightly editorial. Think the illustrations in The New Yorker meets
an old mining guild poster. Must work at 32px (avatar) and 300px
(completion hero).

### 6.8 Onboarding / Assessment

Currently a 3-question quiz to place the user at a level. Keep it
short (2 minutes max). This is the user's first impression of the
character — make it a proper meeting. Skarbnik introduces himself,
asks three questions to see what the user knows, and personally
assigns them to Apprentice / Adept / Master. Warm welcome, not a
gate.

## 7. Design system deliverables

Alongside the screens, produce:

**Tokens** (as CSS custom properties, matching our existing var
names in §4 where possible):
- Color scales (both themes)
- Type scale (display / heading / body / label / mono)
- Spacing scale
- Radius scale
- Elevation (shadows × themes)
- Motion durations + easings

**Components** (to go into the Tailwind / React component library):
- Button (primary / secondary / ghost / destructive, all states)
- Card (flat / elevated / interactive)
- Input (text, pin, language toggle)
- XP chip, star rating, streak pill, level badge
- Skarbnik avatar (multiple sizes)
- Badge emblem (the achievement coin)
- Toast / inline alert
- Modal / popover / bottom sheet

**Motion spec**:
- Page transitions (hub → quest → completion)
- Streak flame animation (3 intensities)
- XP count-up on completion
- Mascot walk cycle + idle
- Badge reveal sequence
- Trail spine glow travel on completion

**Illustration guidelines**:
- How we draw quest topics (blockchain, wallet, gas, staking, etc.)
- How we draw badges
- The Skarbnik character guide

**Accessibility**:
- All combinations must hit WCAG AA (this is a bank product).
- Color is never the only signal (icons + text pair everywhere).
- Motion respects `prefers-reduced-motion`.

## 8. Hard constraints — don't fight these

1. **Two themes, both first-class.** Not "dark with a washed-out
   light variant." Both are presentable to their respective users.
2. **Polish + English must both look intentional.** Polish text is
   on average ~15% longer than English — don't design for English
   and then break.
3. **The treasure-chest mark is the logo.** Refine it, don't
   replace it.
4. **Web stack.** Don't design what we can't build in Tailwind +
   Framer Motion + SVG. Fancy WebGL / Lottie is fine if used with
   intent; don't require a full game engine.
5. **Mobile-first, but desktop beautiful.** Our users are on phones;
   our buyers demo on laptops. Both must shine.
6. **This is a financial product.** No dark patterns. No
   urgency-manipulation. No FOMO scrollers. The game loop is
   intrinsic, not extractive.

## 9. What "done" looks like

We consider the redesign done when:

- A PKO product manager looks at a screenshot and says "this looks
  like something we'd ship to our customers."
- A 28-year-old crypto-native looks at it and says "this actually
  looks good, I'd try it."
- A 45-year-old who has never touched crypto says "I understand what
  I'm supposed to do here" within 5 seconds of landing on the hub.
- The mascot has a name people remember and a voice they'd recognize
  in a tweet.
- The badges, when a user posts them on Farcaster, make other people
  want to earn one.

## 10. Timeline & format

- **First pass**: hero screens (hub, quiz runtime, completion, chat
  popover) in dark theme. Hi-fi, mobile + desktop.
- **Second pass**: same in light (PKO) theme.
- **Third pass**: system (tokens, components, mascot sheet,
  illustration rules).
- **Format**: Figma file, frames organized as above. Export tokens
  as JSON or CSS vars. Export mascot as SVG where possible.

When in doubt, **choose restraint over decoration**, **earned delight
over constant delight**, and **specific over generic**. Every pixel
should look like someone who cared put it there.
