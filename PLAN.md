# ChessStake Execution Plan

## Objective

Turn ChessStake from a hackathon demo into a more mature creator-led interactive AI chess arena.

The project should move away from being positioned as a generic Web3 betting demo and become:

```text
Interactive AI Chess Arena for Creators and Communities
```

Core product narrative:

```text
ChessStake lets creators host live AI chess matches where fans back teams, vote strategy, and share rewards from the outcome.
```

## Game Concept

ChessStake is not only a normal chess match. The strongest concept is:

```text
Crowd-controlled chess with optional player-owned AI agents.
```

Core loop:

```text
1. A creator or community hosts a chess arena.
2. Players join White or Black.
3. Each turn, players back a strategy or piece.
4. The highest-backed legal option wins the crowd decision.
5. An AI resolver chooses the best legal move for that winning option.
6. The board updates and the next side takes the turn.
7. The match ends by checkmate, draw, max move limit, or cancellation.
8. Rewards, reputation, leaderboard points, and creator stats update.
```

Current MVP behavior:

```text
Players vote for a piece type. The system uses chess.js for legal moves and a simple heuristic resolver to choose the move.
```

Target behavior:

```text
Players can either vote manually or delegate their decision to their own AI agent. The arena can also include creator/community agents, public agents, and AI commentary.
```

## AI Integration Direction

The project currently uses a local heuristic move picker, not a real AI provider.

Current files:

```text
apps/web/src/server/game-service.ts
apps/web/src/server/chess-state.ts
```

Current AI logic:

- `chess.js` generates legal moves.
- The resolver prefers moves that capture higher-value pieces.
- No Grok/xAI/OpenAI/Stockfish API is currently used in the Vercel flow.

Target AI architecture:

```text
Chess rules engine: chess.js
Tactical engine: Stockfish or lightweight local evaluator
LLM strategy/commentary: Grok/xAI or OpenAI-compatible provider
Player-owned agents: user-created strategy profiles that vote or recommend moves
```

Important principle:

```text
LLMs should not be trusted to validate chess legality. chess.js must remain the source of truth for legal moves.
```

Recommended AI responsibilities:

- `chess.js`: legal moves, FEN updates, checkmate/draw validation.
- Stockfish: best tactical move from legal candidates.
- Grok/xAI or LLM: explanation, personality, strategy summary, trash talk, social recap, agent reasoning.
- Player agent: preference model that chooses what piece/strategy to back.

## Player-Owned AI Agents

This is the next major feature that can make the game unique.

Concept:

```text
Each player can create an AI agent that represents their chess style. The agent can recommend or auto-submit votes during live matches.
```

Player agent examples:

- Aggressive Attacker: prefers captures, queen pressure, king-side attacks.
- Defensive Wall: prefers safe moves, king safety, pawn structure.
- Gambit Hunter: accepts risk for initiative.
- Endgame Grinder: prefers simplification and material advantage.
- Meme Agent: plays chaotic but legal strategies.

Player agent loop:

```text
1. Player creates an agent.
2. Player chooses personality and strategy weights.
3. Agent can inspect current FEN, legal pieces, vote tally, and match context.
4. Agent recommends a piece or move.
5. Player can manually approve the agent recommendation.
6. Later, player can enable auto-vote within limits.
7. Agent performance is tracked on leaderboard.
```

MVP version:

```text
Agent recommends a piece. Player still clicks to confirm.
```

Advanced version:

```text
Agent auto-votes for the player using a configured budget, risk profile, and allowed match types.
```

## Agent Game Modes

Recommended modes:

```text
Manual Crowd Mode
Players vote manually. Current MVP.
```

```text
Agent Assist Mode
Players create agents that recommend votes, but user confirms.
```

```text
Agent Auto-Vote Mode
Player agents auto-submit votes within user-defined rules.
```

```text
Agent League
Agents compete across matches and climb rankings.
```

```text
Creator Agent Battle
Creator deploys a community agent against another creator/community agent.
```

```text
Human Crowd vs AI Agent
Crowd controls one side, a named AI agent controls the other side.
```

## Player Agent Monetization

AI agents can create a stronger business model than reward-pool fee alone.

Potential revenue streams:

- Paid premium agent slots.
- Agent customization skins/personas.
- Advanced strategy presets.
- Creator-branded agents.
- Agent league entry fee.
- Sponsored agents.
- Marketplace fee if agents/templates are tradable later.

Suggested pricing:

```text
Free: 1 basic agent
Pro: $5/month to $9/month for multiple agents and advanced settings
Creator Pro: custom community agent and analytics
Agent League: entry fee or seasonal pass
```

Important: do not launch paid auto-vote with real-money reward pools before legal review.

## Agent Data Model Direction

Potential Prisma models:

```prisma
model PlayerAgent {
  id              String   @id @default(cuid())
  ownerAddress    String
  name            String
  description     String?
  personality     String
  riskLevel       String   @default("BALANCED")
  preferredTeam   String?
  isPublic        Boolean  @default(false)
  autoVoteEnabled Boolean  @default(false)
  maxVoteWei      String?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
}

model AgentStrategyProfile {
  id             String @id @default(cuid())
  agentId        String @unique
  aggression     Int    @default(50)
  defense        Int    @default(50)
  material       Int    @default(50)
  kingSafety     Int    @default(50)
  centerControl  Int    @default(50)
  randomness     Int    @default(10)
}

model AgentDecision {
  id              String   @id @default(cuid())
  agentId         String
  gameId          String
  turnNumber      Int
  fen             String
  recommendedPiece String
  recommendedMove  String?
  confidence      Int
  reasoning       String?
  wasSubmitted    Boolean  @default(false)
  createdAt       DateTime @default(now())
}
```

MVP can start simpler with only `PlayerAgent` and `AgentDecision`.

## Agent API Direction

Recommended routes:

```text
GET  /api/agents
POST /api/agents
GET  /api/agents/:agentId
PATCH /api/agents/:agentId
POST /api/agents/:agentId/recommend
POST /api/agents/:agentId/auto-vote
GET  /api/agents/:agentId/history
GET  /api/agent-leaderboard
```

Responsibilities:

- `/api/agents`: list agents owned by wallet/session.
- `POST /api/agents`: create player agent.
- `/recommend`: agent inspects match state and recommends a piece/move.
- `/auto-vote`: submits vote only if user enabled auto mode and constraints pass.
- `/history`: shows past agent decisions and performance.
- `/agent-leaderboard`: ranks agents by wins, accuracy, ROI, and activity.

## Agent UI Direction

Recommended pages/components:

```text
/agents
/agents/create
/agents/[agentId]
components/agents/AgentCard.tsx
components/agents/AgentBuilderForm.tsx
components/agents/AgentRecommendationPanel.tsx
components/agents/AgentLeaderboard.tsx
```

Arena integration:

- Show `Use My Agent` button in voting panel.
- Show agent recommendation beside manual piece choices.
- Show confidence and short reasoning.
- Let user click `Back Agent Pick`.
- Later add `Enable Auto-Vote` with clear risk/budget limits.

Agent builder fields:

- Agent name.
- Personality.
- Risk level.
- Preferred strategy.
- Favorite pieces.
- Manual approval or auto-vote.
- Max vote amount.
- Public/private visibility.

## AI Provider Plan

Recommended abstraction:

```text
apps/web/src/server/ai/ai-provider.ts
apps/web/src/server/ai/agent-decision-service.ts
apps/web/src/server/ai/commentary-service.ts
apps/web/src/server/ai/stockfish-service.ts
```

Provider interface:

```ts
type AgentDecisionInput = {
  fen: string;
  team: 'WHITE' | 'BLACK';
  legalPieces: string[];
  legalMovesByPiece: Record<string, string[]>;
  votes: Array<{ piece: string; totalAmountWei: string; bettorCount: number }>;
  agentProfile: {
    personality: string;
    riskLevel: string;
    aggression: number;
    defense: number;
    material: number;
  };
};

type AgentDecisionOutput = {
  piece: string;
  move?: string;
  confidence: number;
  reasoning: string;
};
```

Provider priority:

```text
1. Deterministic local agent scoring for MVP
2. Stockfish for tactical scoring
3. Grok/xAI for reasoning/commentary/personality
4. Optional OpenAI-compatible fallback
```

Environment variables:

```env
XAI_API_KEY=...
AI_PROVIDER=xai
AI_AGENT_MODE=assist
AI_COMMENTARY_ENABLED=true
```

Security rules:

- Never expose API keys to client.
- AI calls must happen server-side.
- Always validate returned piece/move with `chess.js`.
- If AI returns illegal move, fall back to legal local scorer.

## Agent Scoring MVP

Before using Grok/xAI, implement local scoring so the feature works reliably.

Agent scoring can use:

- Capture value.
- Legal move count.
- Piece preference.
- Risk profile.
- Existing vote momentum.
- King safety heuristic.
- Randomness weight.

Example:

```text
Aggressive agent: capture value + queen/rook preference + attack squares
Defensive agent: king safety + avoids hanging pieces
Balanced agent: material + mobility + low randomness
```

This keeps the product functional even without paid AI API usage.

## Updated AI/Agent Execution Phases

### Phase AI-0: Clarify AI In Product

Tasks:

- Rename current resolver from generic AI to `Strategy Resolver` or `AI Resolver` with clear explanation.
- Add UI text explaining that chess legality is enforced by `chess.js`.
- Add move explanation placeholder.

### Phase AI-1: AI Commentary

Tasks:

- Add commentary after every move.
- Use local template first.
- Later connect Grok/xAI for richer commentary.

### Phase AI-2: Player Agent Builder MVP

Tasks:

- Add `/agents` and `/agents/create`.
- Add `PlayerAgent` model.
- Let player create one basic agent.
- Store personality and risk profile.

### Phase AI-3: Agent Recommendation In Arena

Tasks:

- Add `Use My Agent` panel inside voting UI.
- Agent recommends piece for current turn.
- Player manually confirms vote.
- Store `AgentDecision`.

### Phase AI-4: Agent Leaderboard

Tasks:

- Track agent recommendations.
- Track submitted agent votes.
- Rank agents by win rate, activity, and accuracy.

### Phase AI-5: Auto-Vote With Limits

Tasks:

- Add opt-in auto-vote.
- Add max vote amount.
- Add match type allowlist.
- Add emergency disable.
- Do not enable for real-money mainnet without legal review.

### Phase AI-6: Grok/xAI Integration

Tasks:

- Add server-side xAI provider.
- Use it for commentary and agent reasoning first.
- Use deterministic local scoring as fallback.
- Do not let LLM bypass legal move validation.

### Phase AI-7: Agent League

Tasks:

- Public agent profiles.
- Agent rankings.
- Creator/community agents.
- Seasonal competitions.
- Optional paid agent slots or league passes.

## Remaining Gaps Before AI Agent Execution

The AI agent plan is directionally strong, but these gaps must be resolved before implementation starts.

## 1. Agent Ownership And Authentication

Problem:

```text
If agents are owned by wallet addresses, the app needs a reliable way to prove that the current user controls the wallet before editing or using an agent.
```

Required decisions:

- Use wallet signature login or continue with lightweight wallet/session identity.
- Decide whether guest users can create temporary agents.
- Decide whether agents are tied to wallet address, user account, or creator account.
- Decide what happens if a player changes wallet.

Recommended MVP:

```text
Agents are tied to wallet address. Editing or auto-vote requires wallet connection. Recommendation-only can work in demo mode with local/session identity.
```

Implementation notes:

- Add signature-based ownership verification before destructive actions.
- Do not allow editing another wallet's agent.
- Store `ownerAddress` normalized lowercase.

## 2. Agent Safety And Abuse Prevention

Problem:

Player-owned agents can be abused for spam, automation, sybil voting, or griefing.

Risks:

- Unlimited agent creation.
- Vote spam.
- Bot-created agents.
- Agent names/descriptions containing offensive content.
- Auto-vote draining user funds if misconfigured.
- Prompt injection if public descriptions are passed into LLM prompts.

Required safeguards:

- Limit free agents per wallet.
- Rate-limit agent recommendation requests.
- Moderate agent names/descriptions.
- Escape/sanitize all user-generated text.
- Add max auto-vote amount.
- Add daily/weekly auto-vote cap.
- Add emergency disable for auto-vote.
- Never pass untrusted text directly into critical LLM instructions.

Recommended MVP:

```text
1 free agent per wallet. Recommendation only. No auto-vote until abuse controls are implemented.
```

## 3. AI Cost Control

Problem:

If every player agent calls Grok/xAI on every turn, costs can explode quickly.

Cost risks:

- Many players request recommendations at once.
- Same FEN/state produces repeated AI calls.
- Agent league simulations can create heavy background usage.
- Commentary per move adds additional AI calls.

Cost controls:

- Start with local deterministic scoring.
- Cache recommendations by `agentProfileHash + fen + team + legalPieces`.
- Use Grok/xAI only for reasoning text, not every scoring decision.
- Add per-wallet rate limits.
- Add per-match AI budget.
- Add fallback when AI provider fails.

Recommended MVP:

```text
No paid AI provider required for agent recommendation. Use local scorer first, then add Grok/xAI for commentary/personality once engagement is proven.
```

## 4. Agent Performance Metrics

Problem:

Agent leaderboard needs clear scoring rules, otherwise users will not trust it.

Metrics to track:

- Recommendation count.
- Submitted vote count.
- Winning-piece accuracy.
- Match win rate.
- Average reward influence.
- Manual approval rate.
- Auto-vote success rate.
- Illegal recommendation rate.
- Confidence calibration.

Suggested agent score:

```text
Agent Score = win contribution + recommendation accuracy + activity streak - illegal/fallback penalties
```

MVP leaderboard:

- Most used agents.
- Highest recommendation accuracy.
- Most winning picks.
- Best match win rate.

## 5. Agent UX Onboarding

Problem:

If users do not understand what an agent does, the feature will feel confusing or fake.

Required UX explanations:

- What the agent can see.
- What the agent cannot do.
- Difference between recommendation and auto-vote.
- Why a recommendation was made.
- Whether the user still needs to confirm.
- Whether any funds are used.

Recommended UI copy:

```text
Your agent recommends a strategy based on the current board, legal moves, and your selected playstyle. You stay in control and confirm before anything is submitted.
```

MVP UX:

- Add `Use My Agent` button.
- Show recommendation card.
- Show confidence.
- Show short reasoning.
- Show `Back Agent Pick` button.
- Show fallback if no agent exists: `Create your first agent`.

## 6. Agent Decision Transparency

Problem:

Users need to trust why an agent recommended a move or piece.

Required fields in `AgentDecision`:

- `inputFen`
- `legalPieces`
- `recommendedPiece`
- `recommendedMove`
- `confidence`
- `reasoning`
- `scoringBreakdown`
- `provider`
- `fallbackUsed`

Recommended addition:

```prisma
scoringBreakdown Json?
provider         String @default("local")
fallbackUsed     Boolean @default(false)
```

## 7. Real AI vs Marketing AI

Problem:

Current app says AI, but actual move resolver is simple heuristic. If the product adds agents, the marketing must not overclaim.

Required copy discipline:

- Say `AI-assisted strategy` only where AI actually exists.
- Say `local strategy resolver` for heuristic logic.
- Say `Grok-powered commentary` only after Grok is actually integrated.

Recommended product wording before Grok integration:

```text
AI-assisted arena with deterministic chess validation and strategy scoring.
```

After Grok integration:

```text
Grok-powered agent reasoning and live commentary.
```

## 8. Legal And Compliance For Auto-Vote

Problem:

Auto-vote plus real-money pools may create additional regulatory risk because the agent acts on behalf of a user.

Required constraints before auto-vote:

- Explicit opt-in.
- Clear max spend.
- Clear match allowlist.
- Clear stop button.
- Audit trail for every auto-vote.
- Legal review before mainnet.

Recommended rollout:

```text
Recommendation-only -> demo auto-vote -> testnet auto-vote -> legal review -> limited mainnet pilot
```

## 9. Technical Reliability

Problem:

AI requests and auto-votes can fail, timeout, or race with turn close.

Required system behavior:

- Agent recommendation timeout under 2 seconds for MVP.
- If AI fails, local scorer fallback.
- If turn closes before recommendation, do not submit.
- If auto-vote fails, log failure and notify user.
- Do not block turn resolution on agent commentary.

Recommended architecture later:

- Queue background commentary.
- Keep voting path synchronous and fast.
- Store decision attempts even when failed.

## 10. Agent Rollout Acceptance Criteria

Do not move to auto-vote or paid agents until these are true:

- Users create agents without confusion.
- At least 30% of active voters try recommendation.
- At least 50% of recommendations are manually accepted.
- Agent recommendation endpoint has stable latency.
- Illegal recommendation rate is near zero after validation/fallback.
- No major abuse/spam issue appears in test events.
- Users understand agent decisions from reasoning text.

## Agent Discoverability Plan

Problem:

```text
Agent APIs and pages exist, but normal users may not discover that they can create and use their own AI agent.
```

Required UX entry points:

- Landing page hero CTA: `Create Your Agent`.
- Landing page section: `Build Your Chess Agent`.
- Arena match card link: `My Agents`.
- Voting panel empty state: `Create your first agent`.
- Match lobby CTA: `Bring your agent into any arena`.
- Agents page onboarding and empty state.
- Agent create page templates and preview.

Acceptance criteria:

- User can discover agent creation from landing page within 5 seconds.
- User can discover agent creation from arena without opening docs.
- User without an agent sees an actionable CTA, not a dead empty state.
- User creating an agent can choose a template instead of writing strategy from scratch.
- User can understand recommendation-only vs demo auto-vote.

## Current State

The project already has the technical foundation:

- Live chess board.
- FEN-based game state.
- Legal move validation with `chess.js`.
- Voting by piece type.
- Reward pool display.
- Mock/off-chain betting flow for Vercel.
- PostgreSQL/Prisma game state.
- Demo settlement flow.
- Spectator presence tracking.
- Smart contract for on-chain pool/reward/refund logic.

Current weaknesses:

- Product positioning is still too close to "Web3 AI Chess Betting".
- Landing page explains features but does not sell the business value.
- No creator/streamer mode.
- No match lobby.
- Leaderboard is still a placeholder.
- Voting UI does not feel competitive enough.
- No viral sharing loop.
- No event/tournament loop.
- Business model is not visible in the product experience.

## Target Users

Primary target:

```text
Chess streamers and Web3 gaming communities
```

Secondary target:

- Online chess communities.
- Web3 gaming guilds.
- AI entertainment communities.
- Tournament organizers.
- Sponsors and protocols looking for branded events.

Execution priority:

```text
1. Creators
2. Web3 communities
3. Players
4. Sponsors
```

Reason: creators and communities bring distribution. Acquiring players one by one will be too expensive.

## Business Model

Recommended revenue streams:

- Platform fee from reward pools.
- Creator revenue share.
- Sponsored prize pools.
- Premium creator tools.
- Tournament hosting fee.

Recommended pricing:

```text
Public Arena
Fee: 5% from reward pool
Use case: platform-hosted public matches
```

```text
Creator Arena
Fee: 7.5% from reward pool
Creator share: 3%
Platform share: 4.5%
Use case: streamer/community hosted matches
```

```text
Sponsored Arena
Fee: 5% to 10% from reward pool
Sponsor fee: fixed deal
Use case: branded events and prize pool boosts
```

```text
Creator Pro
Subscription: $19/month to $49/month
Use case: custom branding, private matches, analytics, OBS/Twitch overlay
```

North Star Metric:

```text
Weekly Creator-Hosted Reward Pool Volume
```

Supporting metrics:

- Creator-hosted matches per week.
- Average pool per match.
- Votes per match.
- Returning users.
- Share click rate.
- Match completion rate.
- Platform fee generated.
- Creator revenue generated.

## Product Principles

- Sell creator monetization, not gambling.
- Use "back", "support", "stake", "reward pool", and "community arena" instead of "betting", "gamble", "wager", or "casino".
- Scheduled events should come before always-on random arenas.
- Users should understand why the selected move happened.
- Leaderboards and match history are retention features, not extras.
- On-chain real-money mode should wait for legal review.
- Testnet/play-money mode is enough for early business validation.

## Execution Order

Do not build all phases in parallel. The recommended order is:

```text
Phase 0 -> Phase 1 -> Phase 2 -> Phase 3 -> Phase 4 -> Phase 5 -> Phase 6 -> Phase 7
```

Rationale:

- Phase 0 fixes the story before adding more features.
- Phase 1 improves conversion in the core arena.
- Phase 2 adds retention.
- Phase 3 makes the product feel like a platform.
- Phase 4 adds the creator business loop.
- Phase 5 adds growth mechanics.
- Phase 6 improves entertainment and trust.
- Phase 7 should wait until product demand and legal clarity are stronger.

Do not start mainnet/on-chain product completion before:

- Landing and arena positioning are fixed.
- At least one creator-hosted test event has been run.
- Legal/compliance assumptions are documented.
- The team has verified users actually want to participate.

## Core Data Model Direction

The current schema is enough for single-arena demo mode. For the next product version, the data model should support creators, scheduled matches, shareable events, and leaderboard aggregation.

Existing important models:

- `Game`
- `Turn`
- `Bet`
- `Move`
- `PlayerGameState`
- `SpectatorPresence`

Likely new or expanded concepts:

- `Creator`
- `Match` or expanded `Game` metadata
- `ShareEvent`
- `PlayerStats`
- `CreatorStats`
- `Sponsor` or sponsored match metadata

Recommended first step: avoid over-modeling. Extend `Game` first with creator/match metadata before creating too many new tables.

Minimum `Game` additions for product maturity:

```prisma
title          String?
description    String?
creatorName    String?
creatorAddress String?
creatorSlug    String?
isPublic       Boolean  @default(true)
scheduledAt    DateTime?
startedAt      DateTime?
endedAt        DateTime?
creatorFeeBps  Int      @default(0)
sponsorName    String?
sponsorUrl     String?
```

Move to separate `Creator` and `Sponsor` tables only after the product needs reusable profiles.

## API Surface Direction

Current API routes already support the live demo. The next version should make APIs explicit around matches, leaderboard, creator hosting, and sharing.

Recommended new or expanded routes:

```text
GET  /api/matches
POST /api/matches/create
GET  /api/matches/:gameId
GET  /api/leaderboard
POST /api/share-event
GET  /api/creators/:slug
```

Route responsibilities:

- `/api/matches`: list live, upcoming, and completed matches.
- `/api/matches/create`: create creator-hosted or scheduled match.
- `/api/matches/:gameId`: return public match metadata and state summary.
- `/api/leaderboard`: aggregate player, match, and creator stats.
- `/api/share-event`: track share button usage.
- `/api/creators/:slug`: show creator profile and hosted matches.

API responses should avoid leaking unnecessary internal fields. Use explicit response shapes for frontend consumption.

## Analytics Instrumentation

The business plan depends on creator-hosted volume, sharing, and repeat participation. The product should track these from the start.

Events to track:

- `landing_viewed`
- `enter_arena_clicked`
- `host_match_clicked`
- `wallet_connected`
- `team_selected`
- `vote_submitted`
- `vote_failed`
- `turn_resolved`
- `match_finished`
- `claim_checked`
- `claim_completed`
- `share_arena_clicked`
- `share_result_clicked`
- `creator_match_created`
- `match_joined_from_share`

Minimum implementation option:

- Store important product events in the database using a simple `AnalyticsEvent` table.
- Later replace or supplement with PostHog, Plausible, or another analytics tool.

Potential schema:

```prisma
model AnalyticsEvent {
  id        String   @id @default(cuid())
  name      String
  gameId    String?
  address   String?
  sessionId String?
  payload   Json?
  createdAt DateTime @default(now())
}
```

Analytics acceptance criteria:

- Product team can answer how many users entered arena, voted, shared, and returned.
- Creator tests can be evaluated with real data, not feelings.
- Share and host CTAs can be measured.

## Testing And QA Requirements

Before each phase is considered done, run the relevant checks.

Baseline checks:

```text
corepack pnpm@9.0.0 --filter web typecheck
```

Manual QA for every product phase:

- Landing page loads on desktop and mobile.
- Arena loads on desktop and mobile.
- User can select team.
- User can vote only for legal pieces.
- Turn resolves after timer.
- Board updates after move.
- Reward pool updates after vote.
- Spectator count does not break page rendering.
- Claim/reward page still loads.
- No primary UI shows raw wei unless explicitly intended.
- No main marketing surface uses risky betting-heavy wording.

Additional QA for creator/match features:

- Creator can create match.
- Match appears in lobby.
- Match link is shareable.
- Arena displays match title and creator info.
- Completed match appears in history.

Additional QA for leaderboard:

- Leaderboard works with no data.
- Leaderboard works with active data.
- Leaderboard does not expose sensitive information beyond public wallet/address data.

## Launch Readiness Checklist

Before inviting creators or communities, verify:

- Landing page explains the product clearly.
- Arena has a share button.
- Voting UI is understandable without explanation.
- Demo/testnet disclaimer exists but does not dominate the pitch.
- Leaderboard or match result page exists for post-event sharing.
- Host match CTA exists.
- At least one scheduled event is prepared.
- Mobile layout is usable.
- Known failure states have user-friendly messages.
- Environment variables are documented.
- Database migrations/schema changes are applied.
- There is a rollback plan for broken deploys.

## Operations Playbook

For early creator tests, run events manually if needed. Automation can come later.

Pre-event:

- Create or select match.
- Confirm voting timer.
- Confirm reward mode: demo, testnet, or play-money.
- Prepare share link.
- Prepare creator instructions.
- Prepare fallback message if something breaks.

During event:

- Monitor arena state.
- Monitor API errors.
- Watch whether users understand voting.
- Note where users drop off.
- Screenshot good moments.

Post-event:

- Capture match stats.
- Ask creator if they would host again.
- Ask users what was confusing.
- Share result recap.
- Add learnings to next iteration.

Creator test success criteria:

- Creator agrees to run another match.
- At least 30% of live viewers interact with voting.
- Users vote across multiple turns.
- At least 10% of participants click share or ask for another match.
- No critical UX blocker prevents match completion.

## Phase 0: Repositioning And Landing Page

Goal: make the product understandable and sellable.

Files:

```text
apps/web/src/app/page.tsx
apps/web/src/app/layout.tsx
apps/web/src/components/arena/ArenaPage.tsx
```

Tasks:

- Replace "Web3 AI Chess Betting" with "Interactive AI Chess Arena".
- Add creator/community positioning.
- Add CTA for `Enter Arena` and `Host a Match`.
- Add sections for creators, players, game modes, and revenue model.
- Add safer wording around staking and reward pools.
- Reduce visible testnet/demo wording on marketing surfaces.
- Keep legal/demo disclaimers secondary, not as the main pitch.

Suggested hero:

```text
Twitch Plays Chess with Real Stakes
```

Suggested subheadline:

```text
ChessStake lets creators host live AI chess arenas where fans back a team, vote strategy, and share the upside.
```

Acceptance criteria:

- A new visitor can understand who the product is for within 5 seconds.
- The landing page clearly explains why creators would use it.
- The page has a visible `Host a Match` direction, even if the first version is not fully dynamic yet.

## Phase 1: Improve Arena Conversion

Goal: make the live arena feel like an event, not a demo screen.

Files:

```text
apps/web/src/components/arena/ArenaPage.tsx
apps/web/src/components/arena/RewardPoolPanel.tsx
apps/web/src/components/voting/VotingPanel.tsx
apps/web/src/components/arena/GameStatusPanel.tsx
apps/web/src/hooks/useArenaSocket.ts
```

Tasks:

- Add match title, for example `AI Boss Battle #1`.
- Add host/creator identity.
- Add spectator count in the header.
- Add share arena button.
- Add next-match or post-game CTA.
- Format vote amounts as ETH instead of raw wei.
- Add vote progress bars per piece.
- Add `Leading` badge to the highest-backed piece.
- Add `Your Pick` state after user votes.
- Add pool percentage for White vs Black.
- Add reward pool after estimated fee.

Acceptance criteria:

- Voting feels competitive and easy to understand.
- No raw wei is shown in primary UI.
- User can share the arena from the live match page.
- The arena communicates current match context, host, pool, and momentum.

## Phase 2: Real Leaderboard

Goal: add retention and social status.

Files:

```text
apps/web/src/app/leaderboard/page.tsx
apps/web/src/server/game-service.ts
apps/web/src/app/api/leaderboard/route.ts
```

Tasks:

- Replace placeholder leaderboard.
- Add top backers by total amount.
- Add most active voters.
- Add top winning addresses.
- Add biggest pools.
- Add recent winners.
- Add basic player stats.

Suggested leaderboard sections:

- Top Earners.
- Most Active Backers.
- Biggest Supporters.
- Recent Winners.
- Biggest Match Pools.

Acceptance criteria:

- Leaderboard uses real database data.
- It gives users a reason to return.
- It can be shared or used as social proof.

## Phase 3: Match Lobby

Goal: make ChessStake feel like a platform with multiple events.

New files:

```text
apps/web/src/app/matches/page.tsx
apps/web/src/components/matches/MatchCard.tsx
apps/web/src/app/api/matches/route.ts
```

Tasks:

- Add `/matches` page.
- Show live matches.
- Show upcoming scheduled matches.
- Show completed matches.
- Add match cards with title, host, pool, spectators, status, and CTA.
- Link landing page CTA to matches or live arena.

Match card should show:

- Match title.
- Host name.
- Prize pool.
- Spectator count.
- Current status.
- Join button.

Acceptance criteria:

- Product no longer feels like a single hardcoded arena.
- Users can discover live and upcoming matches.
- The page supports future creator-hosted events.

## Phase 4: Creator Mode MVP

Goal: create the first real business loop.

New files:

```text
apps/web/src/app/host/page.tsx
apps/web/src/app/api/matches/create/route.ts
apps/web/src/components/host/HostMatchForm.tsx
```

Potential schema additions:

```prisma
model Creator {
  id        String   @id @default(cuid())
  address   String   @unique
  name      String
  slug      String   @unique
  createdAt DateTime @default(now())
}
```

Potential `Game` fields:

```prisma
creatorId      String?
title          String?
description    String?
isPublic       Boolean  @default(true)
scheduledAt    DateTime?
creatorFeeBps  Int      @default(0)
```

Tasks:

- Add `/host` page.
- Add host match form.
- Save creator name/address.
- Save match title and description.
- Create shareable match link.
- Display creator info in arena.
- Add creator share copy in product.

Acceptance criteria:

- A creator can create or request a hosted match.
- A match has a title, host, and shareable link.
- The arena displays creator identity.
- The feature supports the creator revenue-share narrative.

## Phase 5: Viral Sharing

Goal: make users and creators bring more users.

New file:

```text
apps/web/src/components/share/ShareArenaButton.tsx
```

Tasks:

- Add copy-link button.
- Add X/Twitter intent share.
- Generate share text based on game state.
- Add share result after match ends.
- Add invite-team copy when one side is behind.

Example share copy:

```text
Team White is controlling the board. Join before the next vote closes.
```

```text
Black needs 0.04 ETH to flip the next move. Join the arena.
```

Acceptance criteria:

- Users can share a live match in one click.
- Share copy changes based on match state.
- Result sharing exists after the match ends.

## Phase 6: AI Commentary

Goal: make AI visible as entertainment, not just backend logic.

New files:

```text
apps/web/src/server/ai-commentary.ts
apps/web/src/components/arena/AiCommentaryPanel.tsx
```

Potential schema addition:

```prisma
model Move {
  aiCommentary String?
}
```

Tasks:

- Generate explanation after each resolved move.
- Store commentary with move history.
- Display AI commentary in arena.
- Add match recap after game ends.
- Consider Grok/xAI or Stockfish integration later.

Acceptance criteria:

- Users can understand why a move happened.
- AI has visible personality or strategic explanation.
- Move history becomes more engaging.

## Phase 7: On-Chain Product Completion

Goal: prepare real Web3 mode after product validation and legal review.

Files:

```text
packages/contracts/contracts/PawnPool.sol
apps/web/src/hooks/usePlaceBet.ts
apps/web/src/hooks/useClaimReward.ts
apps/web/src/hooks/useClaimRefund.ts
apps/web/src/server/game-service.ts
```

Tasks:

- Add creator fee support to contract.
- Add creator address per game.
- Split platform fee and creator fee.
- Deploy contract to target testnet.
- Store contract addresses per network.
- Sync contract events to database.
- Enable on-chain place bet.
- Enable on-chain claim reward/refund.
- Add transaction and explorer links.
- Prepare legal/compliance review before mainnet.

Acceptance criteria:

- Testnet on-chain flow works end to end.
- Off-chain database state reconciles with contract events.
- Creator/platform fee split is supported.
- Mainnet launch is blocked until legal review is complete.

## Go-To-Market Plan

### Phase A: Private Creator Test

Target:

- 3 to 5 small chess/Web3 creators.
- 20 to 100 viewers per creator.
- Testnet or play-money mode.

Goal:

- Validate whether audiences vote for multiple turns.
- Validate whether creators want to host again.
- Collect UX feedback.

### Phase B: Weekly Scheduled Event

Format:

```text
ChessStake Friday AI Boss Battle
```

Goal:

- Build a recurring habit.
- Collect clips, screenshots, and testimonials.
- Seed the leaderboard.

### Phase C: Community Vs Community

Format:

```text
Community A vs Community B
```

Goal:

- Use rivalry to increase sharing.
- Increase pool size and viewer retention.

### Phase D: Sponsored Tournament

Format:

```text
Sponsored AI Chess Cup
```

Goal:

- Validate sponsorship revenue.
- Prove the event package can be sold.

## Compliance And Safety

Risks:

- Real-money pool can be treated as gambling in some jurisdictions.
- The word "betting" can create platform, sponsor, and legal friction.
- On-chain mainnet rewards require legal review.
- Trusted backend/operator can create fairness concerns.

Mitigations:

- Use safer wording: back, support, stake, reward pool, strategy arena.
- Start with testnet/play-money events.
- Add clear rules page.
- Add responsible play page.
- Add public vote and move history.
- Add transaction/explorer links for on-chain mode.
- Do not launch mainnet real-money mode before legal review.

## Immediate Execution Checklist

- [ ] Rework landing page positioning.
- [ ] Replace betting-heavy copy.
- [ ] Add `Host a Match` CTA.
- [ ] Add creator/community sections.
- [ ] Add game modes section.
- [ ] Add arena match title and host info.
- [ ] Add share arena button.
- [ ] Format vote amount from wei to ETH.
- [ ] Add vote progress bars.
- [ ] Add leading piece badge.
- [ ] Add reward pool after fee.
- [ ] Replace leaderboard placeholder with real data.
- [ ] Add `/matches` lobby.
- [ ] Add `/host` creator mode MVP.
- [ ] Add AI commentary panel.
- [ ] Plan creator fee split in contract.

## Decisions Before Large Implementation

Recommended defaults:

```text
Initial focus: creators and Web3 communities
Launch mode: testnet/play-money scheduled events
Wording: back/support/reward pool
Creator arena fee: 7.5%
Creator share: 3%
Platform share: 4.5%
Match format: scheduled events first
AI: explanation now, Stockfish/Grok later
First users: small creators and Web3 guilds
```
