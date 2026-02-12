import { LocalStore } from "../dist/store/localStore.js";

const key = process.env.CUBOID_NVIDIA_API_KEY?.trim();
if (!key) {
  console.error("CUBOID_NVIDIA_API_KEY is required.");
  process.exit(1);
}

const main = async () => {
  const store = new LocalStore();
  await store.init();
  const settings = await store.updateSettings({
    aiEnabled: true,
    aiProvider: "nvidia",
    aiBaseUrl: "https://integrate.api.nvidia.com",
    allowedAiDomains: ["integrate.api.nvidia.com", "build.nvidia.com"],
    aiModel: "moonshotai/kimi-k2.5",
    aiApiKey: key,
  });

  console.log(JSON.stringify({
    aiEnabled: settings.aiEnabled,
    aiProvider: settings.aiProvider,
    aiBaseUrl: settings.aiBaseUrl,
    aiModel: settings.aiModel,
    hasAiApiKey: settings.hasAiApiKey,
  }));
};

void main().catch((error) => {
  console.error("Failed to configure NVIDIA settings:", error instanceof Error ? error.message : String(error));
  process.exit(1);
});
