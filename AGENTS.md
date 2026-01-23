# Agent Instructions

This project uses **bd** (beads) for issue tracking. Run `bd onboard` to get started.

## Quick Reference

```bash
bd ready              # Find available work
bd show <id>          # View issue details
bd update <id> --status in_progress  # Claim work
bd close <id>         # Complete work
bd sync               # Sync with git
```

## Landing the Plane (Session Completion)

**When ending a work session**, you MUST complete ALL steps below. Work is NOT complete until `git push` succeeds.

**MANDATORY WORKFLOW:**

1. **File issues for remaining work** - Create issues for anything that needs follow-up
2. **Run quality gates** (if code changed) - Tests, linters, builds
3. **Update issue status** - Close finished work, update in-progress items
4. **PUSH TO REMOTE** - This is MANDATORY:

   ```bash
   git pull --rebase
   bd sync
   git push
   git status  # MUST show "up to date with origin"
   ```

5. **Clean up** - Clear stashes, prune remote branches
6. **Verify** - All changes committed AND pushed
7. **Hand off** - Provide context for next session

**CRITICAL RULES:**

- Work is NOT complete until `git push` succeeds
- NEVER stop before pushing - that leaves work stranded locally
- NEVER say "ready to push when you are" - YOU must push
- If push fails, resolve and retry until it succeeds

<!-- bv-agent-instructions-v1 -->

---

## Beads Workflow Integration

This project uses [beads_viewer](https://github.com/Dicklesworthstone/beads_viewer) for issue tracking. Issues are stored in `.beads/` and tracked in git.

### Essential Commands

```bash
# View issues (launches TUI - avoid in automated sessions)
bv

# CLI commands for agents (use these instead)
bd ready              # Show issues ready to work (no blockers)
bd list --status=open # All open issues
bd show <id>          # Full issue details with dependencies
bd create --title="..." --type=task --priority=2
bd update <id> --status=in_progress
bd close <id> --reason="Completed"
bd close <id1> <id2>  # Close multiple issues at once
bd sync               # Commit and push changes
```

### Workflow Pattern

1. **Start**: Run `bd ready` to find actionable work
2. **Claim**: Use `bd update <id> --status=in_progress`
3. **Work**: Implement the task
4. **Complete**: Use `bd close <id>`
5. **Sync**: Always run `bd sync` at session end

### Key Concepts

- **Dependencies**: Issues can block other issues. `bd ready` shows only unblocked work.
- **Priority**: P0=critical, P1=high, P2=medium, P3=low, P4=backlog (use numbers, not words)
- **Types**: task, bug, feature, epic, question, docs
- **Blocking**: `bd dep add <issue> <depends-on>` to add dependencies

### Session Protocol

**Before ending any session, run this checklist:**

```bash
git status              # Check what changed
git add <files>         # Stage code changes
bd sync                 # Commit beads changes
git commit -m "..."     # Commit code
bd sync                 # Commit any new beads changes
git push                # Push to remote
```

### Best Practices

- Check `bd ready` at session start to find available work
- Update status as you work (in_progress → closed)
- Create new issues with `bd create` when you discover tasks
- Use descriptive titles and set appropriate priority/type
- Always `bd sync` before ending session

<!-- end-bv-agent-instructions -->

## MCP Agent Mail: coordination for multi-agent workflows

What it is

- A mail-like layer that lets coding agents coordinate asynchronously via MCP tools and resources.
- Provides identities, inbox/outbox, searchable threads, and advisory file reservations, with human-auditable artifacts in Git.

Why it's useful

- Prevents agents from stepping on each other with explicit file reservations (leases) for files/globs.
- Keeps communication out of your token budget by storing messages in a per-project archive.
- Offers quick reads (`resource://inbox/...`, `resource://thread/...`) and macros that bundle common flows.

How to use effectively

1) Same repository
   - Register an identity: call `ensure_project`, then `register_agent` using this repo's absolute path as `project_key`.
   - Reserve files before you edit: `file_reservation_paths(project_key, agent_name, ["src/**"], ttl_seconds=3600, exclusive=true)` to signal intent and avoid conflict.
   - Communicate with threads: use `send_message(..., thread_id="FEAT-123")`; check inbox with `fetch_inbox` and acknowledge with `acknowledge_message`.
   - Read fast: `resource://inbox/{Agent}?project=<abs-path>&limit=20` or `resource://thread/{id}?project=<abs-path>&include_bodies=true`.
   - Tip: set `AGENT_NAME` in your environment so the pre-commit guard can block commits that conflict with others' active exclusive file reservations.

2) Across different repos in one project (e.g., Next.js frontend + FastAPI backend)
   - Option A (single project bus): register both sides under the same `project_key` (shared key/path). Keep reservation patterns specific (e.g., `frontend/**` vs `backend/**`).
   - Option B (separate projects): each repo has its own `project_key`; use `macro_contact_handshake` or `request_contact`/`respond_contact` to link agents, then message directly. Keep a shared `thread_id` (e.g., ticket key) across repos for clean summaries/audits.

Macros vs granular tools

- Prefer macros when you want speed or are on a smaller model: `macro_start_session`, `macro_prepare_thread`, `macro_file_reservation_cycle`, `macro_contact_handshake`.
- Use granular tools when you need control: `register_agent`, `file_reservation_paths`, `send_message`, `fetch_inbox`, `acknowledge_message`.

Common pitfalls

- "from_agent not registered": always `register_agent` in the correct `project_key` first.
- "FILE_RESERVATION_CONFLICT": adjust patterns, wait for expiry, or use a non-exclusive reservation when appropriate.
- Auth errors: if JWT+JWKS is enabled, include a bearer token with a `kid` that matches server JWKS; static bearer is used only when JWT is disabled.

## Integrating with Beads (dependency-aware task planning)

Beads provides a lightweight, dependency-aware issue database and a CLI (`bd`) for selecting "ready work," setting priorities, and tracking status. It complements MCP Agent Mail's messaging, audit trail, and file-reservation signals. Project: [steveyegge/beads](https://github.com/steveyegge/beads)

Recommended conventions

- **Single source of truth**: Use **Beads** for task status/priority/dependencies; use **Agent Mail** for conversation, decisions, and attachments (audit).
- **Shared identifiers**: Use the Beads issue id (e.g., `bd-123`) as the Mail `thread_id` and prefix message subjects with `[bd-123]`.
- **Reservations**: When starting a `bd-###` task, call `file_reservation_paths(...)` for the affected paths; include the issue id in the `reason` and release on completion.

Typical flow (agents)

1) **Pick ready work** (Beads)
   - `bd ready --json` → choose one item (highest priority, no blockers)
2) **Reserve edit surface** (Mail)
   - `file_reservation_paths(project_key, agent_name, ["src/**"], ttl_seconds=3600, exclusive=true, reason="bd-123")`
3) **Announce start** (Mail)
   - `send_message(..., thread_id="bd-123", subject="[bd-123] Start: <short title>", ack_required=true)`
4) **Work and update**
   - Reply in-thread with progress and attach artifacts/images; keep the discussion in one thread per issue id
5) **Complete and release**
   - `bd close bd-123 --reason "Completed"` (Beads is status authority)
   - `release_file_reservations(project_key, agent_name, paths=["src/**"])`
   - Final Mail reply: `[bd-123] Completed` with summary and links

Mapping cheat-sheet

- **Mail `thread_id`** ↔ `bd-###`
- **Mail subject**: `[bd-###] …`
- **File reservation `reason`**: `bd-###`
- **Commit messages (optional)**: include `bd-###` for traceability

Event mirroring (optional automation)

- On `bd update --status blocked`, send a high-importance Mail message in thread `bd-###` describing the blocker.
- On Mail "ACK overdue" for a critical decision, add a Beads label (e.g., `needs-ack`) or bump priority to surface it in `bd ready`.

Pitfalls to avoid

- Don't create or manage tasks in Mail; treat Beads as the single task queue.
- Always include `bd-###` in message `thread_id` to avoid ID drift across tools.

---

## Orchestrator Pattern: How Work Gets Done

### Architecture

This project uses an **orchestrator-subagent** model:

```
User Request
    ↓
Main Agent (Orchestrator) ← You're here
    ↓
Breaks into Beads Issues
    ↓
Spawns Subagents (one per issue)
    ↓
Subagents register with Agent Mail
    ↓
Subagents complete work & report back
    ↓
Orchestrator integrates & closes issues
```

### Orchestrator Responsibilities

**The agent you're speaking to should:**

1. **Decompose** user requests into Beads issues
2. **Delegate** each issue to a subagent via the Task tool
3. **Monitor** Agent Mail inbox for subagent messages
4. **Coordinate** between subagents (resolve blockers, conflicts)
5. **Integrate** completed work and update the user

**The orchestrator should NOT:**
- Implement tasks directly (delegate instead)
- Skip creating Beads issues for work
- Let subagents work without Agent Mail registration

### Subagent Responsibilities

**Each subagent must:**

1. **Register** with Agent Mail on startup:
   ```python
   register_agent(project_key, program="subagent", model="...", task_description="bd-123: task title")
   ```

2. **Reserve files** before editing:
   ```python
   file_reservation_paths(project_key, agent_name, ["path/**"], exclusive=true, reason="bd-123")
   ```

3. **Send messages** for questions or blockers:
   ```python
   send_message(
       project_key, agent_name, 
       to=["VioletStream"], 
       subject="[bd-123] Need clarification",
       thread_id="bd-123"
   )
   ```

4. **Complete and report**:
   ```python
   # Close the issue
   bd close bd-123
   
   # Send completion message
   send_message(..., subject="[bd-123] Completed: summary", thread_id="bd-123")
   
   # Release reservations
   release_file_reservations(project_key, agent_name)
   ```

### Typical Orchestrator Session

```bash
# 1. User asks for a feature
# Orchestrator: "Let me break this down..."

# 2. Create Beads issues
bd create --title="Design database schema" --type=task --priority=1
bd create --title="Implement API endpoints" --type=task --priority=2
bd create --title="Add frontend UI" --type=task --priority=2

# 3. Add dependencies
bd dep add <ui-issue> <api-issue>  # UI depends on API

# 4. Find ready work (no blockers)
bd ready

# 5. Spawn subagent for first ready issue
Task(
    subagent_type="generalPurpose",
    prompt="Work on bd-123: Design database schema. Register with Agent Mail, reserve files, complete work, report back.",
    description="Database schema design"
)

# 6. Check inbox while waiting
fetch_inbox(project_key, "VioletStream")

# 7. Respond to subagent if needed
reply_message(project_key, message_id, "VioletStream", "Here's the clarification...")

# 8. When done, spawn next subagent
# Repeat until all issues complete
```

### Benefits of This Pattern

- **Parallel Work**: Multiple subagents can work on independent issues
- **Clear Ownership**: Each issue has exactly one subagent
- **Traceability**: Issue ID → Thread ID → File Reservations → Git Commits
- **Conflict Prevention**: File reservations prevent simultaneous edits
- **Async Coordination**: Agent Mail enables non-blocking communication

### Integration with Beads

- **Issue ID = Thread ID**: Use `bd-123` as the Mail thread_id
- **Issue Status**: Beads is the single source of truth for status
- **Dependencies**: Use `bd dep` to control subagent spawn order
- **Priority**: Use Beads priority to decide which issues to tackle first

### Integration with Agent Mail

- **Project Key**: Always use the absolute project path
- **Agent Names**: Auto-generated (e.g., "BlueLake", "RedStone")
- **Thread Per Issue**: Each Beads issue gets its own Mail thread
- **File Reservations**: Required before any edits
- **Completion Messages**: Always send when done

### Example Multi-Agent Workflow

```
User: "Add authentication to the app"

Orchestrator (VioletStream):
  1. Creates issues: bd-101 (schema), bd-102 (API), bd-103 (UI)
  2. Sets dependency: bd-103 depends on bd-102
  3. Spawns subagent for bd-101 (no dependencies)
  4. Spawns subagent for bd-102 (no dependencies)

Subagent BlueLake (bd-101):
  1. Registers: register_agent(..., task="bd-101: Design auth schema")
  2. Reserves: file_reservation_paths(..., ["db/migrations/**"])
  3. Works on schema design
  4. Messages: send_message(..., subject="[bd-101] Schema ready for review")
  5. Closes: bd close bd-101
  6. Releases: release_file_reservations(...)

Subagent GreenStone (bd-102):
  1. Registers: register_agent(..., task="bd-102: Auth API")
  2. Reserves: file_reservation_paths(..., ["app/api/auth/**"])
  3. Implements API endpoints
  4. Messages: send_message(..., subject="[bd-102] API complete, tests passing")
  5. Closes: bd close bd-102
  6. Releases: release_file_reservations(...)

Orchestrator (VioletStream):
  1. Sees bd-102 complete → bd-103 now ready (dependency cleared)
  2. Spawns subagent for bd-103

Subagent RedRiver (bd-103):
  1. Registers for bd-103 (UI)
  2. Reserves: file_reservation_paths(..., ["app/web/components/auth/**"])
  3. Builds login UI
  4. Closes bd-103
  5. Reports completion

Orchestrator:
  1. All issues complete
  2. Runs integration tests
  3. Reports to user: "Authentication added successfully"
```

### Key Takeaway

**The orchestrator coordinates; subagents execute.**

Every user request → Beads issues → Subagents → Agent Mail coordination → Integrated result
