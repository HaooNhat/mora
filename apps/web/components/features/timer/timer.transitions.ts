// timer.animations.ts
import { Transition } from "motion/react";

export const bouncySpring: Transition = {
  type: "spring",
  stiffness: 200,
  damping: 18,
  mass: 1,
};

export const fastSpring: Transition = {
  type: "spring",
  stiffness: 500,
  damping: 40,
};
