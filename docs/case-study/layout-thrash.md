## Layout Thrashing Overview

| Topic                               | Description                                                                                                                                                                                          |
| ----------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| What is layout thrashing?           | A performance issue where the browser is forced to repeatedly recalculate layout (reflow) due to frequent and unnecessary read/write operations on layout-related properties.                        |
| Why it happens                      | It occurs when JavaScript or UI logic alternates between writing to the DOM (changing layout) and reading layout values (e.g. `offsetWidth`, `clientHeight`) in a tight loop or rapid state changes. |
| Why it is expensive                 | Layout calculation is one of the most costly steps in the browser rendering pipeline and may affect many elements in the DOM tree.                                                                   |
| Common triggers                     | Conditional rendering (`mount/unmount`), animations using layout properties (`width`, `height`, `margin`, `top`, `left`), frequent DOM measurements.                                                 |
| Symptoms                            | Janky animations, dropped frames, UI flickering, poor scroll performance, high CPU usage.                                                                                                            |
| React-related causes                | Toggling components with conditional rendering for visual changes, re-rendering large subtrees, uncontrolled layout-dependent effects.                                                               |
| Properties that cause reflow        | `width`, `height`, `margin`, `padding`, `top`, `left`, `right`, `bottom`, `display`, `position`.                                                                                                     |
| Properties that avoid reflow        | `transform`, `opacity`, `filter`, `clip-path` (composited properties).                                                                                                                               |
| Best practices                      | Keep elements mounted, animate using `transform` and `opacity`, batch DOM reads and writes, prefer CSS-driven state (`data-*`) for visual transitions.                                               |
| Recommended approach                | Use state to control logical behavior, and CSS (with `data-state` or classes) to control visual appearance and animations.                                                                           |
| When layout thrashing is acceptable | In unavoidable cases like virtualized lists, complex tables, or layout-driven calculations where accuracy is required.                                                                               |
| Key takeaway                        | If a change does not affect whether a component exists, it should not trigger layout recalculation. Prefer composited animations over layout changes.                                                |

## Lesson Learned: Layout Thrashing in UI Animation

While working on interactive 3D panels and transitions, I ran into a performance issue that didn’t immediately look like a bug — the UI _worked_, but it didn’t feel right. Animations felt slightly janky, and small interactions caused unexpected layout shifts.

This is when I learned about **layout thrashing**.

### What layout thrashing really is

Layout thrashing happens when the browser is forced to recalculate layout repeatedly in a short time span. This usually occurs when UI changes trigger reflow over and over again, especially during animations or rapid state changes.

The key realization for me was:

> Even small layout changes can be expensive if they happen often.

### Where I accidentally caused it

I noticed layout thrashing mostly when I:

- Mounted and unmounted components just to hide or show them
- Used conditional rendering for purely visual states
- Animated layout properties like `width`, `height`, or positioning
- Let React state control visual animation directly

None of these were “wrong” individually, but together they made the UI feel heavy.

### The turning point

The UI became noticeably smoother when I stopped thinking in terms of:

> “Should this component exist?”

and started thinking:

> “Should this component look active or inactive?”

That mental shift changed everything.

### What I do now instead

- Keep UI panels mounted whenever possible
- Use CSS `transform` and `opacity` for animations
- Move visual state into CSS using `data-*` attributes
- Let React state decide _logic_, not _appearance_
- Avoid conditional rendering unless a component truly should not exist

This pattern keeps the browser in the compositing phase instead of triggering layout recalculation.

### Why `transform` matters

Properties like `scale`, `rotate`, and `translate` don’t affect layout. They are GPU-friendly and don’t force reflow, which makes them ideal for interactive UI transitions.

Once I realized this, 3D effects stopped being “expensive” and started feeling natural.

### My rule of thumb

If a change does **not** affect whether a component should exist in the DOM, it should not trigger a re-render or layout recalculation.

Visual changes belong to CSS. Logical decisions belong to React.

### Final takeaway

Layout thrashing isn’t always obvious, but you can feel it. When an interface feels heavy or irritating despite being “correct”, it’s often because the browser is doing more work than necessary.

Designing UI is not just about how things look — it’s about how gently you ask the browser to move them.
