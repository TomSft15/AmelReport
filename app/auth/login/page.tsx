import { LoginForm } from "@/components/auth/login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  return <LoginForm error={params.error} />;
}
