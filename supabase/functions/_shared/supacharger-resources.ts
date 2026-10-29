// Generated from src/supacharger.config.ts. Regenerate; do not edit.
export const namespacePrefix = "sc_";
export const resources = {
  "schemas": {
    "app": "sc_app",
    "api": "sc_api",
    "api_edge": "sc_api_edge",
    "internal": "sc_internal",
    "services": "sc_services"
  },
  "buckets": {
    "profile": "sc_user-avatars"
  },
  "functions": {
    "imageUpload": "sc_process_image_upload",
    "profileMedia": "sc_profile-media"
  },
  "secrets": {
    "imageUploadSigning": "SC_IMAGE_UPLOAD_SIGNING_SECRET"
  }
} as const;
