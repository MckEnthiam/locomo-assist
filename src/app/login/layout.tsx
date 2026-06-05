import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Connexion - Locomo-assist",
  description: "Connectez-vous à votre espace de rééducation Locomo-assist",
};

export default function LoginLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <>{children}</>;
}
