import SignInCard from '@/components/SignInCard';

export default function SignInPage() {
  return (
    <SignInCard
      title="Player sign in"
      description="Enter your email and we’ll send a magic login link for Player access."
      returnTo="/dashboard/player"
    />
  );
}
