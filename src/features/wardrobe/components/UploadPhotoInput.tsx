import React, { type ChangeEventHandler } from "react";
import { Camera, ImagePlus } from "lucide-react";

interface UploadPhotoInputProps {
  selectedFileName: string | null;
  onFileChange: ChangeEventHandler<HTMLInputElement>;
}

const acceptedImageTypes = "image/png,image/jpeg,image/webp";

export function UploadPhotoInput({ selectedFileName, onFileChange }: UploadPhotoInputProps) {
  return (
    <div style={{ display: "grid", gap: 10 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, minmax(0, 1fr))", gap: 10 }}>
        <label
          htmlFor="item_photo_library"
          style={{
            display: "grid",
            placeItems: "center",
            minHeight: 116,
            border: "1px dashed var(--line)",
            borderRadius: 8,
            background: "var(--paper)",
            textAlign: "center",
            padding: 14,
            cursor: "pointer",
          }}
        >
          <ImagePlus size={28} />
          <strong style={{ marginTop: 8, fontSize: 15, lineHeight: 1.2 }}>Choose from library</strong>
          <input
            id="item_photo_library"
            name="item_photo"
            type="file"
            accept={acceptedImageTypes}
            onChange={onFileChange}
            style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
          />
        </label>

        <label
          htmlFor="item_photo_camera"
          style={{
            display: "grid",
            placeItems: "center",
            minHeight: 116,
            border: "1px dashed var(--line)",
            borderRadius: 8,
            background: "var(--paper)",
            textAlign: "center",
            padding: 14,
            cursor: "pointer",
          }}
        >
          <Camera size={28} />
          <strong style={{ marginTop: 8, fontSize: 15, lineHeight: 1.2 }}>Take photo</strong>
          <input
            id="item_photo_camera"
            name="item_photo"
            type="file"
            accept={acceptedImageTypes}
            capture="environment"
            onChange={onFileChange}
            style={{ position: "absolute", opacity: 0, pointerEvents: "none" }}
          />
        </label>
      </div>
      <span className="subtle" style={{ fontSize: 14, textAlign: "center" }}>
        {selectedFileName ?? "JPG, PNG, or WebP under 10MB"}
      </span>
    </div>
  );
}
