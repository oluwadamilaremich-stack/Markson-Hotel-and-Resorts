import type { Metadata } from "next";
import { site } from "@/lib/site";
import { LightPageHeader } from "@/components/sections/light-page-header";
import { Reveal } from "@/components/ui/reveal";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${site.name} collects, uses and protects your information.`,
};

// Layout follows the reference site (not in Figma). Wording is a sensible starting point;
// the hotel should have it reviewed before launch.
const sections: { title: string; intro?: string; items?: [string | null, string][]; text?: string }[] = [
  {
    title: "1. Information We Collect",
    intro: "We may collect the following types of information:",
    items: [
      ["Personal Information", "Name, email address, phone number, and guest preferences."],
      ["Booking Details", "Room selection, travel dates, number of guests, and special requests."],
      ["Payment Information", "Payments are processed securely by Paystack; we do not store your card details."],
      ["Technical Data", "IP address, browser type, device type, and pages visited on our website."],
      ["Cookies", "We use cookies to improve your experience and understand website traffic. You may disable cookies in your browser settings."],
    ],
  },
  {
    title: "2. How We Use Your Information",
    intro: "We use your information to:",
    items: [
      [null, "Process reservations and manage your stay"],
      [null, "Communicate with you about your booking or inquiries"],
      [null, "Send offers and updates (only with your consent)"],
      [null, "Improve our website and services"],
      [null, "Comply with legal requirements"],
    ],
  },
  {
    title: "3. Information Sharing",
    intro: "We do not sell or rent your personal data. We only share information with:",
    items: [
      [null, "Trusted service providers (e.g. payment processing and email delivery)"],
      [null, "Government authorities where required by law"],
      [null, "Our team, to provide a quality, personalized stay"],
    ],
  },
  {
    title: "4. Data Security",
    text: "We use appropriate security measures to protect your personal data from unauthorized access, alteration, or disclosure. However, no online method is 100% secure, so we cannot guarantee absolute security.",
  },
  {
    title: "5. Your Rights & Choices",
    intro: "You have the right to:",
    items: [
      [null, "Request access to your personal data"],
      [null, "Ask us to correct or delete your information"],
      [null, "Opt out of marketing communications at any time"],
    ],
  },
  {
    title: "6. Third-Party Links",
    text: "Our website may contain links to third-party services (e.g. Tripadvisor, social media). We are not responsible for the privacy practices of those sites.",
  },
  {
    title: "7. Updates to This Policy",
    text: "We may update this Privacy Policy from time to time. Any changes will be posted on this page with an updated effective date.",
  },
  {
    title: "8. Contact Us",
    text: `For any questions about this policy or your data, email us at ${site.emails.general} or call ${site.phone}.`,
  },
];

export default function PrivacyPolicyPage() {
  return (
    <>
      <LightPageHeader title="Privacy Policy" titleClassName="text-h2" />
      <div className="px-site mx-auto max-w-[800px] pb-24 md:pb-32">
        <Reveal y={10}>
          <p className="text-small mt-4 text-center">Effective Date: November 1, 2026</p>
          <p className="mt-10">
            At <strong className="font-semibold">{site.name}</strong>, we are committed to
            protecting your privacy and ensuring a safe online experience. This Privacy Policy
            explains how we collect, use, and safeguard your information when you visit our
            website or book a stay with us.
          </p>
        </Reveal>

        {sections.map((section) => (
          <Reveal key={section.title} y={20} className="mt-10 border-t border-line pt-10">
            <h2 className="text-h4">{section.title}</h2>
            {section.intro && <p className="mt-4">{section.intro}</p>}
            {section.text && <p className="mt-4">{section.text}</p>}
            {section.items && (
              <ul className="mt-4 list-disc space-y-1 pl-5">
                {section.items.map(([lead, text]) => (
                  <li key={text}>
                    {lead && <strong className="font-semibold">{lead}: </strong>}
                    {text}
                  </li>
                ))}
              </ul>
            )}
          </Reveal>
        ))}
      </div>
    </>
  );
}
