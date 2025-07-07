export const SCP_REGISTRY = {
    BREVO: {
      ENABLED: false,
    },
  } as const;

  export type PluginsRegistry = typeof SCP_REGISTRY