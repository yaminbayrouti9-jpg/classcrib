import Link from "next/link";

export const metadata = {
  title: "Privacy Policy — ClassCrib",
  description: "ClassCrib Privacy Policy.",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto min-h-screen max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-black text-text-primary">Privacy Policy</h1>
      <p className="mt-4 text-text-secondary">
        Privacy Policy content is pending publication by ClassCrib. This placeholder does not describe the service&apos; data practices and is not a published privacy notice.
      </p>
      <Link href="/terms" className="mt-8 inline-block text-primary underline">
        Terms of Service
      </Link>
    </main>
  );
}
