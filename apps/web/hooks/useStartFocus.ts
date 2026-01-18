// import { useState } from "react";
// import { startFocusSession } from "@workspace/application/startFocusSession";
// import { FocusContext, FocusPlan } from "@workspace/domain/focus/focus.types";
//
// export function useStartFocus() {
//   const [plan, setPlan] = useState<FocusPlan | null>(null);
//   const [loading, setLoading] = useState(false);
//   const [error, setError] = useState<Error | null>(null);
//
//   const start = async (context: FocusContext) => {
//     try {
//       setLoading(true);
//       setError(null);
//
//       const result = await startFocusSession(context);
//       setPlan(result);
//     } catch (err) {
//       setError(err as Error);
//     } finally {
//       setLoading(false);
//     }
//   };
//
//   return { start, plan, loading, error };
// }
