import type { UploadSourceType } from "@/src/domain/wardrobe";

interface UploadChoiceCardProps {
  title: string;
  description: string;
  sourceType: UploadSourceType;
  onChoose: (sourceType: UploadSourceType) => void;
}

export function UploadChoiceCard({ title, description, sourceType, onChoose }: UploadChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={() => onChoose(sourceType)}
      className="card"
      style={{ width: "100%", textAlign: "left", minHeight: 110, background: "var(--paper)" }}
    >
      <strong>{title}</strong>
      <p className="subtle" style={{ marginBottom: 0 }}>
        {description}
      </p>
    </button>
  );
}
