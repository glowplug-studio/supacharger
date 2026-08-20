import { associationDocumentResponse, createAndroidAssetLinks } from '@/supacharger/auth/mobile-deep-linking';
import { SC_CONFIG } from '@/supacharger/supacharger-config';

export function GET() {
  return associationDocumentResponse(createAndroidAssetLinks(SC_CONFIG.MOBILE_DEEP_LINKING));
}
