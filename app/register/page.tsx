import RegisterClientForm from './client-page';

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }>}) {
    const params = await searchParams
    const redirectUrl = String(params.redirect || "")
  return <RegisterClientForm redirectUrl={redirectUrl} />;
}
