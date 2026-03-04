import { redirect } from 'next/navigation';

export default async function LegacyAdminRoute() {
  redirect('/admin');
}
