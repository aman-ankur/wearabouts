import type { AvatarRenderProvider, AvatarRenderProviderRequest, AvatarRenderProviderResult } from "./avatarRenderProvider";

interface DemoAvatarRenderProviderOptions {
  forceFailure?: boolean;
}

function stableToken(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase();
}

function createDemoImageUrl(request: AvatarRenderProviderRequest): string {
  const title = request.savedOutfit.name.replace(/[<>&]/g, "");
  const items = request.wardrobeItems.map((item) => item.name).join(" + ").replace(/[<>&]/g, "");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1536" viewBox="0 0 1024 1536">
  <rect width="1024" height="1536" fill="#eeeeec"/>
  <ellipse cx="512" cy="254" rx="112" ry="128" fill="#c49a7a"/>
  <path d="M366 452c48-62 244-62 292 0l62 510c10 83-48 168-130 182l-78 14-78-14c-82-14-140-99-130-182l62-510Z" fill="#315a7d"/>
  <path d="M362 610h300l34 220H328l34-220Z" fill="#f7f4ef" opacity=".92"/>
  <path d="M340 835h344l46 305H294l46-305Z" fill="#30343a"/>
  <path d="M318 1190h152v210H318zM554 1190h152v210H554z" fill="#242622"/>
  <path d="M282 1408h208v48H282zM534 1408h208v48H534z" fill="#6b4a31"/>
  <text x="512" y="90" text-anchor="middle" font-family="Inter, Arial" font-size="42" font-weight="800" fill="#111">${title}</text>
  <text x="512" y="1490" text-anchor="middle" font-family="Inter, Arial" font-size="28" fill="#706b64">${items || "Demo avatar preview"}</text>
</svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString("base64")}`;
}

export function createDemoAvatarRenderProvider(options: DemoAvatarRenderProviderOptions = {}): AvatarRenderProvider {
  return {
    async renderAvatar(request: AvatarRenderProviderRequest): Promise<AvatarRenderProviderResult> {
      if (options.forceFailure) {
        return { status: "failed", qualityNotes: ["Demo provider forced failure."] };
      }

      return {
        status: "ready",
        imageUrl: createDemoImageUrl(request),
        imageAssetId: `demo-avatar-${stableToken(request.cacheKey).slice(-48)}`,
        qualityNotes: ["Demo provider render. No AI was called."],
      };
    },
  };
}
