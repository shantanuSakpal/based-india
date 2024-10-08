// assistantConfig.ts

export const assistantIds = {
  base: process.env.BASE_ASSISTANT_ID || "",
  optimism: process.env.OPTIMISM_ASSISTANT_ID || "",
};

export const getAssistantId = (type: "base" | "optimism" = "base"): string => {
  return assistantIds[type];
};
