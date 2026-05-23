import { Helmet } from "react-helmet-async";

export default function PrivacyPolicyPage() {
  return (
    <div className="container px-4 py-8 max-w-3xl">
      <Helmet>
        <title>Privacy Policy — MediEase</title>
        <meta name="description" content="How MediEase collects, uses, stores, and protects your data including voice recordings and prescription images." />
        <link rel="canonical" href="https://mediz.lovable.app/privacy" />
      </Helmet>
      <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
      <p className="text-sm text-muted-foreground mb-6">Last updated: 23 May 2026</p>

      <section className="space-y-6 text-sm leading-relaxed">
        <div>
          <h2 className="text-xl font-semibold mb-2">1. What we collect</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Account info:</strong> name, mobile number, delivery address.</li>
            <li><strong>Order data:</strong> medicines, quantities, payment method, order history.</li>
            <li><strong>Voice recordings:</strong> audio captured when you place a Voice Order, used to transcribe and fulfil your order.</li>
            <li><strong>Prescription images:</strong> photos of prescriptions uploaded for OCR and pharmacist verification.</li>
            <li><strong>Chat messages:</strong> support conversations between you and our team.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">2. How we use your data</h2>
          <p>We process your data only to fulfil orders, verify prescriptions, provide customer support, and comply with Pakistan’s pharmacy regulations. Voice recordings and prescription images are processed by Google Gemini for transcription and OCR.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">3. Consent</h2>
          <p>Voice recordings and prescription images are only captured after you explicitly opt in. You can withdraw consent at any time from your Profile.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">4. Storage & security</h2>
          <p>Data is stored on Lovable Cloud (Supabase) with Row-Level Security so only you, the assigned pharmacy, and our admin team can access your records. Transmissions use HTTPS.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">5. Sharing</h2>
          <p>We share order, prescription and contact details with the pharmacy fulfilling your order and the rider delivering it. We never sell your data.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">6. Retention</h2>
          <p>Voice recordings: 90 days. Prescription images: 3 years (regulatory). Account & order history: until you delete your account.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">7. Your rights</h2>
          <p>You can request access, correction, or deletion of your data by contacting <a className="underline" href="mailto:privacy@mediease.pk">privacy@mediease.pk</a>. Account deletion removes your profile, orders, prescriptions, and uploaded files.</p>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">8. Permissions on Android</h2>
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Microphone:</strong> only while recording a Voice Order.</li>
            <li><strong>Camera:</strong> only while scanning a prescription.</li>
            <li><strong>Storage / Photos:</strong> only when you pick a prescription image from your gallery.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-xl font-semibold mb-2">9. Contact</h2>
          <p>MediEase Support — <a className="underline" href="mailto:support@mediease.pk">support@mediease.pk</a></p>
        </div>
      </section>
    </div>
  );
}