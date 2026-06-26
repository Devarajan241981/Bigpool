import Link from "next/link";
import { FileText, Shield, Store, CreditCard, BadgeCheck, ChevronRight } from "lucide-react";

export const metadata = { title: "Terms & Conditions — Bigpool" };

const Section = ({ id, icon: Icon, title, children }: {
  id: string; icon: React.ElementType; title: string; children: React.ReactNode;
}) => (
  <section id={id} className="mb-10">
    <div className="flex items-center gap-2.5 mb-4">
      <div className="bg-[#0d9488]/10 rounded-lg p-2">
        <Icon className="w-5 h-5 text-[#0d9488]" />
      </div>
      <h2 className="text-xl font-bold text-gray-900">{title}</h2>
    </div>
    <div className="text-gray-700 text-sm leading-relaxed space-y-3">{children}</div>
  </section>
);

const Highlight = ({ children }: { children: React.ReactNode }) => (
  <div className="bg-amber-50 border-l-4 border-amber-400 rounded-r-lg px-4 py-3 text-sm text-amber-900">{children}</div>
);

const Table = ({ headers, rows }: { headers: string[]; rows: (string | number)[][] }) => (
  <div className="overflow-x-auto rounded-xl border border-gray-200 mt-3">
    <table className="w-full text-sm">
      <thead className="bg-gray-50">
        <tr>{headers.map((h) => <th key={h} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-500 uppercase">{h}</th>)}</tr>
      </thead>
      <tbody className="divide-y divide-gray-100">
        {rows.map((row, i) => (
          <tr key={i} className="hover:bg-gray-50">
            {row.map((cell, j) => <td key={j} className="px-4 py-3 text-gray-800">{cell}</td>)}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 bg-[#0d9488]/10 text-[#0d9488] rounded-full px-4 py-1.5 text-sm font-medium mb-4">
          <FileText className="w-4 h-4" /> Legal
        </div>
        <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Terms & Conditions</h1>
        <p className="text-gray-500 text-sm">Last updated: June 2026 · Effective immediately upon registration</p>
      </div>

      {/* TOC */}
      <div className="bg-gray-50 rounded-xl border border-gray-200 p-5 mb-10">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Contents</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
          {[
            ["#general", "1. General Terms"],
            ["#seller-commission", "2. Seller Commission & Fees"],
            ["#verified-badge", "3. Verified Seller Badge"],
            ["#payments", "4. Payments & Refunds"],
            ["#seller-conduct", "5. Seller Conduct"],
            ["#buyer-rights", "6. Buyer Rights & Protections"],
            ["#prohibited", "7. Prohibited Activities"],
            ["#termination", "8. Account Termination"],
            ["#liability", "9. Limitation of Liability"],
            ["#changes", "10. Changes to Terms"],
          ].map(([href, label]) => (
            <a key={href} href={href} className="flex items-center gap-1.5 text-sm text-[#0d9488] hover:underline py-0.5">
              <ChevronRight className="w-3 h-3 flex-shrink-0" /> {label}
            </a>
          ))}
        </div>
      </div>

      {/* Sections */}
      <Section id="general" icon={FileText} title="1. General Terms">
        <p>
          Welcome to Bigpool ("Platform", "we", "us"). By registering as a buyer or seller on Bigpool, you agree to
          be bound by these Terms & Conditions. Please read them carefully before using the Platform.
        </p>
        <p>
          These terms apply to all users — customers (buyers), vendors (sellers), and administrators. If you do not
          agree with any part of these terms, you must not use the Platform.
        </p>
        <p>
          Bigpool is an online marketplace that connects buyers with independent sellers. Bigpool is not the seller
          of record for any products listed by vendors on the Platform.
        </p>
        <Highlight>
          By clicking "I Agree", completing registration, or making a transaction on Bigpool, you accept these terms
          in full and acknowledge that you have read and understood them.
        </Highlight>
      </Section>

      <Section id="seller-commission" icon={CreditCard} title="2. Seller Commission & Fees">
        <p>
          Bigpool operates on a commission-based model. Fees are charged to sellers in two ways: a recurring
          <strong> Listing Fee</strong> based on the number of active products, and a <strong>Transaction
          Commission</strong> deducted per completed order.
        </p>

        <h3 className="font-semibold text-gray-900 mt-4 mb-1">2.1 Listing Fees (Monthly, per seller)</h3>
        <p>Listing fees are charged based on the total number of active products a seller has listed on the Platform:</p>
        <Table
          headers={["Tier", "Products Listed", "Monthly Fee"]}
          rows={[
            ["Starter", "Fewer than 500 products", "₹10 / month"],
            ["Growth", "500 – 999 products", "₹40 / month"],
            ["Pro", "1,000 or more products", "₹70 / month"],
          ]}
        />
        <p className="mt-2 text-xs text-gray-500">
          * Listing fees are waived for the first 3 months after a seller's account is approved. The tier is
          evaluated at the start of each billing cycle based on the count of active listings.
        </p>

        <h3 className="font-semibold text-gray-900 mt-5 mb-1">2.2 Transaction Commissions (Per Order)</h3>
        <p>A platform commission is charged on each successfully completed order. Commissions vary by order value:</p>
        <Table
          headers={["Order Value", "Platform Commission"]}
          rows={[
            ["Below ₹750", "₹15 per order"],
            ["₹750 – ₹1,999", "₹30 per order"],
            ["₹2,000 and above", "₹100 per order"],
          ]}
        />
        <p className="mt-2 text-xs text-gray-500">
          * Commission is deducted automatically at the time of payout. Commissions are not charged for
          cancelled or refunded orders.
        </p>

        <h3 className="font-semibold text-gray-900 mt-5 mb-1">2.3 Admin-Adjusted Rates</h3>
        <p>
          Bigpool reserves the right to adjust commission tiers and rates at its discretion. The Super Admin may
          periodically update the fee structure based on platform policies, market conditions, or seller agreements.
          Sellers will be notified of any changes at least 14 days in advance via email or in-platform notification.
        </p>

        <h3 className="font-semibold text-gray-900 mt-5 mb-1">2.4 Payout Schedule</h3>
        <p>
          Seller payouts are processed every <strong>Friday</strong> for all orders delivered and confirmed in the
          previous week. Payouts are made to the registered bank account after deducting applicable commissions
          and a 2% processing fee.
        </p>

        <Highlight>
          Commission rates displayed in the Vendor Dashboard are always the current applicable rates. Check
          Vendor → Analytics for a full breakdown of commissions deducted from your payouts.
        </Highlight>
      </Section>

      <Section id="verified-badge" icon={BadgeCheck} title="3. Verified Seller Badge">
        <p>
          The Bigpool <strong>Verified Seller Badge</strong> (✓ blue tick) is a mark of trust and authenticity
          granted to sellers who meet specific criteria and pay a one-time badge fee.
        </p>

        <h3 className="font-semibold text-gray-900 mt-4 mb-2">3.1 Eligibility Requirements</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Seller's account must be in <strong>Approved</strong> status.</li>
          <li>Seller must have completed at least <strong>20 orders</strong> (delivered and confirmed) on Bigpool.</li>
          <li>No active policy violations or account strikes within the past 90 days.</li>
          <li>Valid GSTIN on file.</li>
        </ul>

        <h3 className="font-semibold text-gray-900 mt-4 mb-2">3.2 Badge Fee</h3>
        <p>
          The Verified Seller Badge requires a <strong>one-time, non-refundable fee of ₹300</strong>. This fee
          covers the cost of identity verification and badge issuance. Payment is processed via Razorpay before
          the verification request is submitted to the admin team.
        </p>

        <h3 className="font-semibold text-gray-900 mt-4 mb-2">3.3 Verification Process</h3>
        <ol className="list-decimal list-inside space-y-1">
          <li>Seller applies via Vendor → Verified Badge page.</li>
          <li>Eligibility is automatically checked (20+ orders, no strikes).</li>
          <li>Seller pays ₹300 via Razorpay.</li>
          <li>Bigpool admin reviews and approves within 2–3 business days.</li>
          <li>Badge appears on the seller's profile and product listings.</li>
        </ol>

        <h3 className="font-semibold text-gray-900 mt-4 mb-2">3.4 Badge Validity & Revocation</h3>
        <p>
          The Verified Badge is <strong>permanent</strong> unless revoked. Bigpool may revoke the badge if the
          seller violates platform policies, receives excessive negative reviews (below 3.0 rating), or is found to
          have provided false information during verification. No refund is issued on revocation.
        </p>

        <Highlight>
          The Verified Badge fee of ₹300 is strictly non-refundable once payment is processed, regardless of
          whether the verification is approved or rejected.
        </Highlight>
      </Section>

      <Section id="payments" icon={CreditCard} title="4. Payments & Refunds">
        <p>All customer payments on Bigpool are processed securely through <strong>Razorpay</strong>. Bigpool
          does not store card details or UPI credentials on its servers.</p>

        <h3 className="font-semibold text-gray-900 mt-4 mb-2">4.1 Accepted Payment Methods</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>UPI (Google Pay, PhonePe, Paytm, BHIM, and others)</li>
          <li>Credit Cards (Visa, Mastercard, RuPay, American Express)</li>
          <li>Debit Cards (all major banks)</li>
          <li>Net Banking (60+ banks supported)</li>
          <li>Cash on Delivery (COD) — for eligible orders below ₹10,000</li>
        </ul>

        <h3 className="font-semibold text-gray-900 mt-4 mb-2">4.2 Refund Policy</h3>
        <ul className="list-disc list-inside space-y-1">
          <li>Customers may request a return within <strong>7 days of delivery</strong> for most products.</li>
          <li>Refunds are processed to the original payment method after return pickup and inspection.</li>
          <li>UPI/Wallet refunds: 1–2 business days. Card refunds: 5–7 business days.</li>
          <li>COD orders are refunded via bank transfer within 5–7 business days.</li>
        </ul>
      </Section>

      <Section id="seller-conduct" icon={Store} title="5. Seller Conduct">
        <p>Sellers on Bigpool agree to the following conduct standards:</p>
        <ul className="list-disc list-inside space-y-1.5">
          <li>List only genuine products with accurate descriptions, images, and pricing.</li>
          <li>Maintain a minimum seller rating of 3.5 stars. Falling below 3.0 for 30 consecutive days may result in suspension.</li>
          <li>Process and ship orders within <strong>48 hours</strong> of confirmation.</li>
          <li>Update order tracking information within 24 hours of dispatch.</li>
          <li>Not engage in price manipulation, fake reviews, or fraudulent activity.</li>
          <li>Honor all return and refund requests that comply with Bigpool's policy.</li>
          <li>Provide valid GSTIN and accurate business information. False information may result in permanent ban.</li>
        </ul>
      </Section>

      <Section id="buyer-rights" icon={Shield} title="6. Buyer Rights & Protections">
        <ul className="list-disc list-inside space-y-1.5">
          <li><strong>Buyer Protection:</strong> All orders are covered by Bigpool's Buyer Protection — if a seller fails to deliver, you receive a full refund.</li>
          <li><strong>Authentic Products:</strong> Sellers are contractually obligated to list only genuine goods. Counterfeit listings result in immediate seller ban.</li>
          <li><strong>Data Privacy:</strong> Your personal data is processed in accordance with India's IT Act and DPDP Act 2023. We do not sell your data to third parties.</li>
          <li><strong>Dispute Resolution:</strong> In case of a dispute between buyer and seller, Bigpool's decision following investigation is final.</li>
        </ul>
      </Section>

      <Section id="prohibited" icon={Shield} title="7. Prohibited Activities">
        <p>The following activities are strictly prohibited on Bigpool and will result in immediate account termination:</p>
        <ul className="list-disc list-inside space-y-1.5">
          <li>Listing counterfeit, stolen, or illegal goods.</li>
          <li>Manipulating search results, ratings, or reviews.</li>
          <li>Conducting transactions outside the Platform to avoid commissions.</li>
          <li>Creating multiple seller accounts to circumvent suspension.</li>
          <li>Providing false or misleading business information.</li>
          <li>Harassing buyers or Bigpool staff.</li>
          <li>Using automated bots to list or purchase products.</li>
        </ul>
      </Section>

      <Section id="termination" icon={Shield} title="8. Account Termination">
        <p>
          Bigpool reserves the right to suspend or permanently terminate any account that violates these Terms,
          with or without prior notice. Upon termination:
        </p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>All active listings will be removed immediately.</li>
          <li>Pending payouts will be processed within 30 days, minus any outstanding commissions.</li>
          <li>Verified Badge fees are non-refundable upon termination.</li>
          <li>The seller may not re-register on Bigpool without explicit written consent from Bigpool management.</li>
        </ul>
      </Section>

      <Section id="liability" icon={Shield} title="9. Limitation of Liability">
        <p>
          Bigpool is a marketplace platform and is not liable for the quality, safety, or legality of products
          listed by independent sellers. To the maximum extent permitted by law, Bigpool's total liability for
          any claim arising from the use of the Platform shall not exceed the total commissions paid by the
          claimant in the 3 months preceding the claim.
        </p>
      </Section>

      <Section id="changes" icon={FileText} title="10. Changes to Terms">
        <p>
          Bigpool may update these Terms & Conditions at any time. Material changes will be communicated via
          email and an in-platform notice at least 14 days before taking effect. Continued use of the Platform
          after the effective date constitutes acceptance of the revised terms.
        </p>
        <p className="mt-2">
          For questions about these terms, contact us at{" "}
          <a href="mailto:legal@bigpool.in" className="text-[#0d9488] hover:underline">legal@bigpool.in</a>.
        </p>
      </Section>

      {/* Footer CTA */}
      <div className="bg-[#1e293b] rounded-xl p-6 text-center text-white mt-10">
        <p className="text-lg font-bold mb-1">Ready to start selling?</p>
        <p className="text-gray-400 text-sm mb-4">Apply as a vendor and reach millions of customers on Bigpool.</p>
        <Link href="/vendor/application/signup" className="inline-block bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold px-6 py-2.5 rounded-lg transition-colors text-sm">
          Apply as Vendor
        </Link>
      </div>
    </div>
  );
}
