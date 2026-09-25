# EV-R3 — Hotfix 2.0.3 concurrent install (prepare-only)

## Symptom (v2.0.2 CI)

- Ubuntu Node 24 / Windows Node 24: FAIL
- Test: `concurrent installs never produce a misleading success [ACH-010/CR-017]`
- Observed codes: `0,3,2,3` (exit 2 = conflicts)

## Exit-code contract

| Code | Meaning                     |
| ---- | --------------------------- |
| 0    | success                     |
| 1    | failure                     |
| 2    | conflicts (nothing written) |
| 3    | busy / interrupted          |
| 64   | usage                       |

ACH-010 property: concurrent installs never produce a **misleading success**.
Losers must be `3` (busy), not `0`. Exit `2` under a live concurrent writer is a
**false conflict** (operator told to resolve conflicts; should retry / wait).

## Root cause

`computePlan` only called `lockHolderAlive` when a journal existed. Between
`unlink(journal)` and lock release, another install could observe transient
disk/manifest drift as `locally-modified` / similar **without** seeing busy,
then the unlocked pass returned **2**.

Node 24 scheduling made that window more likely on CI; Node 22 often hit
`BusyError`/`acquireLock` first (`3`).

## Classification

**Real product bug** (false conflict under concurrency). Sequence `0,3,2,3` still
had a single success and likely intact destination, but violated the loser
contract and emitted a misleading conflict signal.

Not a rigid-test issue: expecting only `{0,3}` matches the product contract.

## Fix

1. Throw `BusyError` when a live lock holder exists, **even without** a journal.
2. Quiescent content conflicts still return `2` without creating control dirs
   (ACH-001 preserved).
3. Interrupted journal (no live holder) no longer returns `2` from the unlocked
   conflict list; lock path raises `InterruptedError` → exit `3`.
4. Regression: live lock, no journal, local drift → must exit `3`.

## Local proofs (prepare-only)

- Focal ACH-010 (+ journal refuse) Node 22 / 24: PASS
- Stress concurrency: Node 24 0/15 fail, Node 22 0/10 fail
- Regression lock-no-journal: PASS
- `pnpm qa`: PASS (161 tests)
- `catalog --check`: PASS after `--write-lock` (libraryVersion 2.0.3)
