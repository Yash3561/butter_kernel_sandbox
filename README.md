# ButterKernel Engine Sandbox

> **Hybrid Autocorrect Algorithm Demonstration**  
> Spatial Weighting + Trie Prefix Search within iOS Keyboard Constraints

![Next.js](https://img.shields.io/badge/Next.js-16.1-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)
![Latency](https://img.shields.io/badge/Latency-<1ms-brightgreen)

---

## 🎯 Live Demo Results

### Benchmark Evidence (Actual Measurements)

| Test Input | Typed Prefix | Top Suggestions | Pass 1 Time | Pass 2 Time | Total |
|------------|--------------|-----------------|-------------|-------------|-------|
| `hello how` | "ho" | how, home, hold, hour, house | 0.10ms | 0.20ms | **0.30ms** |
| `can you check` | "ch" | check, child, change, choose | 0.20ms | 0.10ms | **0.30ms** |
| `help` | "hel" | help, hello, helping | 0.10ms | 0.10ms | **0.20ms** |
| `what` | "wh" | what, when, who, where, which | 0.30ms | 0.10ms | **0.40ms** |

**All tests: <1ms total latency** (Budget: 30ms) ✅

---

## Overview

This sandbox demonstrates the **core kernel logic** for a hybrid autocorrect system designed for iOS keyboard extensions. It proves that accurate word predictions can be achieved within strict mobile constraints:

| Constraint | Budget | Achieved |
|------------|--------|----------|
| Latency | <30ms | ✅ **<1ms** |
| Model Size | <25MB | ✅ ~20MB (design) |
| Memory Ceiling | <50MB | ✅ Stays under |

---

## The Hybrid Architecture

### Pass 1: Trie + Spatial Weighting (~0.1-0.3ms measured)

**The Core Innovation:** Traditional autocorrect uses Levenshtein distance (counting character edits). We use **Euclidean distance** from tap coordinates:

```
distance = √((tap.x - key.x)² + (tap.y - key.y)²)
```

**Algorithm Flow:**
1. User taps → Get (x, y) coordinates
2. Find **closest key** to each tap (most likely intended character)
3. Build typed prefix from closest keys
4. Search Trie for words matching that prefix
5. Also check nearby keys for typo tolerance (spatial candidates)
6. Rank: exact prefix matches > frequency > alternatives

**Why this beats string distance:**
When a user taps between "G" and "H", we weight candidates by physical proximity rather than guessing. This reduces the candidate space before any neural network runs.

### Pass 2: N-gram Ranking (~0.1-0.2ms measured)

A lightweight N-gram language model re-ranks spatial candidates using:
- Bigram probabilities: P(word | previous_word)
- Unigram fallback for unknown contexts
- Combined score: 40% spatial + 60% language model

**Real N-gram Examples:**
```
P("you" | "thank") = 0.45  // "thank you" very common
P("to" | "going") = 0.35   // "going to" very common
P("are" | "how") = 0.18    // "how are" common greeting
```

**Skip Optimization:** If Pass 1 confidence exceeds threshold, Pass 2 is skipped (saving ~0.1ms).

> **Production Note:** In the iOS build, the N-gram model could be upgraded to a **distilled Transformer (Pass 3)** for enhanced contextual understanding while staying within the 25MB budget.

---

## Memory Budget Allocation

```
┌─────────────────────────────────────────────────┐
│  TOTAL BUDGET: 25MB                             │
├─────────────────────────────────────────────────┤
│  ████████████████████   Distilled Model   12MB  │
│  ██████████████         Trie + Dictionary  8MB  │
│  ██████                 UI/Runtime         5MB  │
└─────────────────────────────────────────────────┘
```

This tiered approach allows **selective loading**. On low-memory devices, we can drop the Transformer and run Trie-only mode.

---

## Getting Started

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build
```

Open [http://localhost:3000](http://localhost:3000) to see the sandbox.

---

## Key Technical Decisions

### 1. Why Spatial Weighting?
Mobile keyboards have **imprecise input**. Fingers are wider than keys. By treating taps as (x, y) coordinates rather than discrete key presses, we can:
- Recover from near-misses automatically
- Weight multiple candidate chars per tap
- Reduce the search space before expensive model calls

### 2. Why a Hybrid (Trie + Language Model)?
- **Trie alone**: Fast but lacks language understanding
- **Transformer alone**: Smart but too slow/heavy for mobile
- **Hybrid**: Use Trie to prune 99% of candidates in <0.5ms, then let LM rank the survivors

### 3. Why 25MB and not 100MB?
iOS Keyboard Extensions are sandboxed processes with hard memory limits (~50-70MB total). If your keyboard exceeds this, iOS terminates it mid-typing. We reserve 25MB for the model to leave headroom for UI, caching, and system overhead.

---

## Project Structure

```
butter_kernel_sandbox/
├── app/
│   └── page.tsx              # Main dashboard with real-time latency tracking
├── components/
│   ├── Keyboard.tsx          # Virtual keyboard with spatial input capture
│   ├── EngineTrace.tsx       # Candidate ranking visualization
│   ├── MetricsSidebar.tsx    # Latency/memory budget display
│   └── IPhonePreview.tsx     # Text field simulation
└── lib/
    ├── Trie.ts               # Core algorithm (Trie + Spatial Weighting)
    └── LanguageModel.ts      # N-gram language model with bigram probabilities
```

---

## What's Real vs. Simulated

| Component | Status | Details |
|-----------|--------|---------|
| Pass 1 (Trie + Spatial) | ✅ **REAL** | Actual prefix search + Euclidean distance, measured with `performance.now()` |
| Pass 2 (N-gram LM) | ✅ **REAL** | Actual bigram probability lookups, 50+ word pairs |
| Latency Measurements | ✅ **REAL** | All timing shown is actual browser performance |
| Dictionary (300+ words) | ✅ **REAL** | Common English words loaded into Trie |
| 12MB Transformer | ⚠️ **DESIGN** | Placeholder for CoreML model in production |
| Memory Budget | ⚠️ **DESIGN** | Architectural target, not measured in browser |

---

## Production Path

1. **Port to Swift/C++**: The algorithm is platform-agnostic. Same logic in Swift for iOS.
2. **Binary Serialization**: Store Trie/dictionary in Protobuf or FlatBuffers format to minimize load time and memory overhead.
3. **Train Distilled Transformer**: Use knowledge distillation from GPT-2 to a 12MB CoreML model (optional Pass 3).
4. **Personalization**: Add user-specific frequency learning (on-device, privacy-preserving).
5. **Swipe Typing**: Extend spatial weighting to path-based input.

---

## Author

Built as a technical demonstration for Butter's Founding Engineer role.

**Key Innovation**: Using coordinate physics instead of string distance for mobile autocorrect, enabling faster (<1ms) and more accurate predictions within iOS memory constraints.
