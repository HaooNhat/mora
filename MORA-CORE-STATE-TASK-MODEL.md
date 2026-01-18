# Mora Companion — Core Arousal–Task Model (v2)

This document defines **Mora Companion’s core operating logic** for aligning work  
with human arousal states and task characteristics.

The system prioritizes:

- **Sustainable productivity**
- **Error avoidance**
- **Nervous system protection**
- **Long-term capacity preservation**

> This is an **operating model**, not a motivation or goal-setting framework.

---

## 1. Core Concept

Mora does not ask what you want to do.

It asks:

> **“What kind of work is safe and effective for your current state?”**

The system is built on two independent components:

- **Arousal** — a real-time user state _(runtime constraint)_
- **Work Type** — an intrinsic task property _(static classification)_

Arousal is treated as a **hard physiological constraint**.  
Priority and importance are treated as **soft decision layers**.

---

## 2. Arousal States (5-Level Model)

Arousal represents the current level of nervous-system activation.

| Level | Label      | Description                         |
| ----: | ---------- | ----------------------------------- |
|     1 | Very Low   | Drowsy, foggy, disengaged           |
|     2 | Low        | Awake but not yet focused           |
|     3 | Optimal    | Calm, alert, fully usable           |
|     4 | High       | Pressured, tense, overstimulated    |
|     5 | Overloaded | Anxious, overwhelmed, near shutdown |

Arousal determines what can be done **without causing harm**.  
It does **not** reflect motivation, discipline, or importance.

---

## 3. Work Type Classification (4-Type Model)

All tasks are classified by **cognitive load and pressure sensitivity**,  
not by profession or job title.

### 3.1 Deep Work

**Characteristics**

- High cognitive load
- Requires sustained focus and internal coherence
- Sensitive to overload but tolerant of moderate pressure

**Examples**

- Programming
- Analytical writing
- Studying complex material
- Logical problem-solving

---

### 3.2 Creative Work

**Characteristics**

- High cognitive load
- Highly sensitive to pressure and evaluation
- Requires psychological safety and openness

**Examples**

- Brainstorming
- Design
- Concept development
- Exploratory writing

---

### 3.3 Repetitive Work

**Characteristics**

- Low cognitive load
- Pressure-tolerant
- Rule-based or mechanical

**Examples**

- Email processing
- Data entry
- Cleanup
- Mechanical execution

---

### 3.4 Light Work

**Characteristics**

- Very low cognitive load
- Used for warm-up or cool-down
- Easily interruptible

**Examples**

- Reading
- Reviewing
- Light organization
- Gentle preparation

---

## 4. Arousal–Task Compatibility Matrix

This table defines which task types are **safe**, **limited**, or **unsafe**  
for each arousal state.

| Arousal ↓      | Deep | Creative | Repetitive | Light |
| -------------- | :--: | :------: | :--------: | :---: |
| 1 — Very Low   |  ❌  |    ❌    |     ⚠️     |  ✅   |
| 2 — Low        |  ⚠️  |    ⚠️    |     ✅     |  ✅   |
| 3 — Optimal    |  ✅  |    ✅    |     ✅     |  ⚠️   |
| 4 — High       |  ⚠️  |    ❌    |     ✅     |  ⚠️   |
| 5 — Overloaded |  ❌  |    ❌    |     ⚠️     |  ❌   |

**Legend**

- ✅ Safe and recommended
- ⚠️ Allowed only with constraints _(short duration, low stakes)_
- ❌ Disallowed _(high risk of error or harm)_

---

## 5. Operating Rules by Arousal Level

### Arousal 1 — Activation State

- Use light work to warm up the system
- Do not attempt demanding tasks

### Arousal 2 — Ramp-Up State

- Use repetitive or light work
- Deep or creative work must be time-boxed

### Arousal 3 — Optimal State

- Primary execution window
- Schedule high-impact deep or creative work here

### Arousal 4 — Pressure State

- Avoid creativity
- Prefer repetitive execution
- Deep work only if mandatory and tightly constrained

### Arousal 5 — Containment State

The system is overloaded.

**Allowed**

- Minimal repetitive tasks only _(optional)_

**Recommended**

- Pause, rest, reset

> Productivity is no longer the goal. **Stability is.**

---

## 6. Mandatory Task Handling (Support Mode)

If a task is mandatory but incompatible with the current arousal state:

- Reduce duration
- Increase breaks
- Decompose into smaller steps
- Switch to **support mode** instead of blocking

Mandatory status **does not override** arousal constraints.

---

## 7. Task Downgrading Rule

When friction appears, downgrade task type:

**Deep → Creative → Repetitive → Light → Stop**

Never upgrade task type when overstimulated or depleted.

---

## 8. System Logic (Simplified)

```pseudo
If arousal == overloaded:
  Block deep and creative work
  Suggest rest or minimal containment

If task is mandatory and compatibility == limited:
  Enable support mode
  Reduce duration and expectations
```

---

## 9. Conceptual Basis (Non-Theoretical Summary)

This model is informed by:

- Yerkes–Dodson Law (arousal–performance relationship)
- Cognitive load theory
- Stress and pressure sensitivity research
- Effort–recovery principles

Mora translates these into **operational constraints**, not advice.

---

## 10. Core Principle

**Rest is not a failure state.**

Ignoring arousal constraints is a **system error**.

Correct pacing preserves capacity.  
Preserved capacity compounds over time.

---

**End of Core Model (v2)**
