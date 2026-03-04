import SignInCard from '@/components/SignInCard';

export default function AdminSignInPage() {
  return (
    <SignInCard
      title="Administrator sign in"
      description="Platform administrators can sign in here to access /admin tools."
      returnTo="/admin"
    />
  );
}
