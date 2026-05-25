import { getRuntimeMode, getRuntimeModeLabel } from "@/src/features/runtime/runtimeMode";

export default function HomePage() {
  const mode = getRuntimeMode();

  return (
    <main>
      <h1>Travogue</h1>
      <p>Pack looks, not doubts.</p>
      <p>{getRuntimeModeLabel(mode)}</p>
    </main>
  );
}
