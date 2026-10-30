import Link from "next/link";

export const metadata = {
  title: "Terms of Service — ClassCrib",
  description: "ClassCrib Terms of Service.",
};

export default function TermsPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-black text-text-primary">Terms of Service</h1>
      <p className="mt-4 text-text-secondary">
        Terms of Service content is pending publication by ClassCrib. Do not rely on this page as the service&apos; terms.
      </p>
      <Link href="/privacy" className="mt-8 inline-block text-primary underline">
        Privacy Policy
      </Link>
    </main>
  );
}
