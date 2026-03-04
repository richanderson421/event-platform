import SignInCard from '@/components/SignInCard';

export default function OrgSignInPage() {
  return (
    <SignInCard
      title="Tournament Organizer sign in"
      description="Use your organizer email to sign in and manage organizations and leagues."
      returnTo="/dashboard/org"
    />
  );
}
