import { ApplicationErrorPage } from '@/components/sc_widgets/error-page/application-error-page';

export default function NotFoundPage() {
  return <ApplicationErrorPage kind='notFound' />;
}
