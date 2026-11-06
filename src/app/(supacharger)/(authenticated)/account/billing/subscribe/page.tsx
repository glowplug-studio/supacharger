import { redirect } from 'next/navigation';

export default function BillingSubscribePage() {
  redirect('/account/billing/upgrade');
}
