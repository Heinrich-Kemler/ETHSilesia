/**
 * Route-group layout for design-lab sandbox routes.
 *
 * Deliberately minimal: no marketing Navbar, no Privy-gated chrome.
 * The lab is a private preview surface for trialing design experiments
 * against the production styling stack (CSS vars, fonts, providers)
 * without inheriting layout decisions from `(app)` or `(landing)`.
 *
 * Hosted off the Claude Designer v1 handoff (see
 * /tmp/skarbnik-design/skarbnik-game-redesign/ during the exploration).
 * Safe to delete this route group if we decide not to promote any of
 * the designs — nothing under `(app)` or `(landing)` imports from here.
 */

export default function LabLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
