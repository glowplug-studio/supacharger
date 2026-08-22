import { ApplicationErrorPage } from '@/components/error-page/application-error-page';

export default function NotFoundPage() {
  return <ApplicationErrorPage kind='notFound' />;
}
