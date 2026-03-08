## Motion `layout` vs `layoutId`

Framer Motion provides two different mechanisms for layout-based animations: `layout` and `layoutId`.  
They solve **different problems** and have **very different performance characteristics**.

---

## `layout`

`layout` enables **automatic layout animations** for a component **and its entire subtree**.

When `layout` is enabled, Framer Motion will:

1. Measure the layout of the component **and all child elements** before render
2. Apply DOM / React updates
3. Measure the layout again **for the entire subtree**
4. Animate all detected layout changes

This allows Framer Motion to animate:

- Size changes
- Position changes
- `height: auto` transitions
- Reflows caused by dynamic content

### Characteristics

- Measures the **entire subtree**
- Performance cost grows with the number of child nodes
- Triggers browser layout calculations
- Expensive for:
  - Large lists
  - Accordions
  - Deeply nested trees
  - Data-driven UI

### When to use `layout`

- Small components
- Shallow, stable DOM trees
- Headers, toolbars, cards
- Components where child layout changes must animate together

### When **not** to use `layout`

- Large lists
- Frequently mounting / unmounting children
- Highly dynamic content
- Performance-critical paths

---

## `layoutId`

`layoutId` enables **shared layout transitions** using the **FLIP technique**:

**First → Last → Invert → Play**

When using `layoutId`, Framer Motion will:

1. Measure the **bounding box of the element itself**
2. Apply layout changes
3. Measure the new bounding box
4. Animate the element using transforms

### Key distinction

> `layoutId` measures **only the element itself**, not its children or subtree.

It does **not**:

- Measure child layouts
- Animate internal layout changes
- Depend on subtree complexity

### Characteristics

- Measures:
  - Position
  - Width / height
  - Border radius (when supported)
- Uses FLIP-based transforms
- Constant cost regardless of child complexity
- Ideal for container-level transitions

### When to use `layoutId`

- Shared element transitions
- Panel / container resizing
- Moving wrappers between layouts
- Animating frames around dynamic content

---

## Performance Comparison

| Feature                   | `layout`          | `layoutId`        |
| ------------------------- | ----------------- | ----------------- |
| Measures subtree          | ✅ Yes            | ❌ No             |
| Measures children         | ✅ Yes            | ❌ No             |
| Uses FLIP                 | ❌ No             | ✅ Yes            |
| Cost scales with children | ❌ Yes            | ✅ No             |
| Safe for large lists      | ❌ No             | ✅ Yes            |
| Primary use               | Animate internals | Animate container |

---

## Mental Model

> **`layoutId` animates the frame**  
> **`layout` animates the internals**

---

## Recommended Pattern

```tsx
<motion.div layoutId="panel">
  <!-- Small, stable element -->
  <motion.div layout="position">
    <Header />
  </motion.div>

  <!-- Large or dynamic content -->
  {isOpen && <LargeList />}
</motion.div>
```

### Why This Pattern Works

- Minimizes layout measurement
- Avoids subtree layout costs
- Scales well with dynamic content

---

## Summary

- `layout` performs full subtree layout measurement
- `layoutId` animates a single element using FLIP
- Avoid `layout` on large lists or deep trees
- Combine `layoutId` (container) with `layout` (small child
