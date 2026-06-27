"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, Mail, Phone, User, FileText, CheckCircle, Store, Clock, XCircle, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore, useSellerApplicationStore } from "@/lib/store";
import { toast } from "sonner";

const steps = ["Personal Info", "Business Info", "Documents", "Review"];

export default function VendorApplicationPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { applications, submit } = useSellerApplicationStore();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [applyAnother, setApplyAnother] = useState(false);
  const [savedBank, setSavedBank] = useState<Record<string, string> | null>(null);
  const [useSavedBank, setUseSavedBank] = useState<boolean | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    businessName: "",
    gstin: "",
    category: "",
    address: "",
    description: "",
    bankAccount: "",
    ifsc: "",
    bankName: "",
    accountHolder: "",
  });

  // Pre-fill name/email/phone from logged-in user + check for saved bank details
  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({ ...prev, name: user.name || "", email: user.email || "", phone: user.phone || "" }));
    if (user.email) {
      fetch(`/api/user/bank-details?email=${encodeURIComponent(user.email)}`)
        .then(r => r.json())
        .then(data => { if (data?.bank_account) setSavedBank(data); })
        .catch(() => {});
    }
  }, [user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  // When user chooses to use saved bank details
  useEffect(() => {
    if (useSavedBank === true && savedBank) {
      setForm(prev => ({ ...prev, bankAccount: savedBank.bank_account ?? "", ifsc: savedBank.ifsc ?? "", bankName: savedBank.bank_name ?? "", accountHolder: savedBank.account_holder ?? "" }));
    } else if (useSavedBank === false) {
      setForm(prev => ({ ...prev, bankAccount: "", ifsc: "", bankName: "", accountHolder: "" }));
    }
  }, [useSavedBank]); // eslint-disable-line react-hooks/exhaustive-deps

  // Applications submitted by this user (matched by email)
  const myApps = applications.filter((a) => a.email === (user?.email ?? ""));
  const activeApp = myApps.find((a) => a.status === "pending" || a.status === "approved");

  // Show status screen if they already have an active application
  if (activeApp && !submitted && !applyAnother) {
    const timeline = [
      { label: "Application Submitted", done: true, date: activeApp.submittedAt },
      { label: "Admin Review in Progress", done: activeApp.status !== "pending", active: activeApp.status === "pending" },
      { label: activeApp.status === "approved" ? "Application Approved ✓" : "Decision", done: activeApp.status === "approved", pending: activeApp.status === "pending" },
    ];
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="text-center mb-6">
              {activeApp.status === "approved" ? (
                <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
              ) : (
                <Clock className="w-14 h-14 text-amber-400 mx-auto mb-3" />
              )}
              <h1 className="text-xl font-bold text-gray-900">
                {activeApp.status === "approved" ? "Application Approved!" : "Application Under Review"}
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                {activeApp.businessName} · {activeApp.category}
              </p>
            </div>

            {/* Timeline */}
            <div className="space-y-4 mb-6">
              {timeline.map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    step.done ? "bg-green-500" : step.active ? "bg-amber-400" : "bg-gray-200"
                  }`}>
                    {step.done ? (
                      <CheckCircle className="w-4 h-4 text-white" />
                    ) : step.active ? (
                      <Clock className="w-4 h-4 text-white animate-pulse" />
                    ) : (
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0 pt-0.5">
                    <p className={`text-sm font-medium ${step.done ? "text-gray-900" : step.active ? "text-amber-700" : "text-gray-400"}`}>
                      {step.label}
                    </p>
                    {step.date && <p className="text-xs text-gray-400 mt-0.5">Submitted on {step.date}</p>}
                    {step.active && <p className="text-xs text-amber-600 mt-0.5">Usually takes 2–3 business days</p>}
                  </div>
                </div>
              ))}
            </div>

            {activeApp.status === "approved" ? (
              <Link href="/vendor/login">
                <Button className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold h-11">
                  Go to Vendor Dashboard
                </Button>
              </Link>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 mb-4">
                You'll be notified by email once admin reviews your application. Check your notifications in the profile section.
              </div>
            )}

            <button
              onClick={() => setApplyAnother(true)}
              className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-[#0d9488] hover:underline font-medium py-2"
            >
              <Plus className="w-3.5 h-3.5" /> Apply for a different product category
            </button>
            <Link href="/customer/profile" className="mt-1 block text-center text-xs text-gray-400 hover:underline">
              Back to Profile
            </Link>
          </div>
        </div>
      </div>
    );
  }
  const update = (k: string, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const handleSubmit = async () => {
    const payload = {
      name: form.name,
      email: form.email,
      phone: form.phone,
      businessName: form.businessName,
      gstin: form.gstin,
      category: form.category,
      address: form.address,
      description: form.description,
      bankAccount: form.bankAccount,
      ifsc: form.ifsc,
      fromCustomer: isAuthenticated && user?.role === "customer",
    };
    // Save to local store (for same-browser status tracking)
    submit(payload);
    // Also POST to server so admin can see it from any browser
    fetch("/api/vendor-applications", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {});
    setSubmitted(true);
    toast.success("Application submitted! Admin will review within 2-3 business days.");
  };

  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
          <p className="text-gray-600 mb-4">
            Your vendor application for <strong>{form.businessName}</strong> has been submitted.
            The admin team will review within 2-3 business days.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800 mb-4 text-left">
            <p className="font-semibold mb-1">📋 Next steps:</p>
            <ol className="list-decimal list-inside space-y-1 text-xs">
              <li>Admin reviews & verifies your documents</li>
              <li>You'll receive approval via email</li>
              <li>Log in at <span className="font-mono">/vendor/login</span> to start selling</li>
            </ol>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full">Back to Home</Button>
            </Link>
            <Link href="/vendor/login" className="flex-1">
              <Button className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold">Vendor Login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <img src="/logo.png" alt="Bigpool" width={48} height={48} style={{ mixBlendMode: "multiply" }} />
          </Link>
          <div className="flex items-center justify-center gap-2 mt-1">
            <Store className="w-4 h-4 text-[#0d9488]" />
            <p className="text-gray-600 text-sm font-medium">Vendor Registration</p>
          </div>
          <p className="text-xs text-gray-400 mt-0.5">bigpool.com/vendor/application/signup</p>
        </div>

        {isAuthenticated && user?.role === "customer" && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-4 text-sm text-blue-800 flex items-center gap-2">
            <User className="w-4 h-4 flex-shrink-0" />
            <span>You're applying as a vendor while logged in as <strong>{user.name}</strong>. Your details have been pre-filled.</span>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`flex flex-col items-center ${i <= step ? "text-[#0d9488]" : "text-gray-400"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${i < step ? "bg-[#0d9488] border-[#0d9488] text-white" : i === step ? "border-[#0d9488] text-[#0d9488]" : "border-gray-300 text-gray-400"}`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className="text-[10px] mt-1 hidden sm:block text-center">{s}</span>
              </div>
              {i < steps.length - 1 && <div className={`h-0.5 w-10 sm:w-16 mx-1 ${i < step ? "bg-[#0d9488]" : "bg-gray-200"}`} />}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Personal Information</h2>
              <div>
                <Label>Full Name</Label>
                <div className="relative mt-1.5"><User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input className="pl-9" placeholder="Your full name" value={form.name} onChange={(e) => update("name", e.target.value)} /></div>
              </div>
              <div>
                <Label>Email</Label>
                <div className="relative mt-1.5"><Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input className="pl-9" type="email" placeholder="business@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} /></div>
              </div>
              <div>
                <Label>Phone</Label>
                <div className="relative mt-1.5"><Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input className="pl-9" placeholder="+91 9876543210" value={form.phone} onChange={(e) => update("phone", e.target.value)} /></div>
              </div>
              {!isAuthenticated && (
                <div>
                  <Label>Password (for vendor account)</Label>
                  <Input type="password" placeholder="Min 8 characters" value={form.password} onChange={(e) => update("password", e.target.value)} />
                </div>
              )}
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Business Information</h2>
              <div>
                <Label>Business / Store Name *</Label>
                <div className="relative mt-1.5"><Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input className="pl-9" placeholder="Your Store Name" value={form.businessName} onChange={(e) => update("businessName", e.target.value)} /></div>
              </div>
              <div>
                <Label>GSTIN (Optional)</Label>
                <Input placeholder="22AAAAA0000A1Z5" value={form.gstin} onChange={(e) => update("gstin", e.target.value)} />
              </div>
              <div>
                <Label>Primary Category *</Label>
                <select className="w-full mt-1.5 h-10 px-3 rounded-md border border-input bg-background text-sm" value={form.category} onChange={(e) => update("category", e.target.value)}>
                  <option value="">Select category</option>
                  <option>Electronics</option><option>Fashion</option><option>Home & Kitchen</option>
                  <option>Books</option><option>Sports</option><option>Beauty</option>
                  <option>Toys</option><option>Grocery</option>
                </select>
              </div>
              <div>
                <Label>Business Address</Label>
                <Textarea placeholder="Full business address" value={form.address} onChange={(e) => update("address", e.target.value)} />
              </div>
              <div>
                <Label>Business Description</Label>
                <Textarea placeholder="Tell us about your business..." value={form.description} onChange={(e) => update("description", e.target.value)} />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Bank & Documents</h2>

              {/* Saved bank details prompt */}
              {savedBank?.bank_account && useSavedBank === null && (
                <div className="bg-teal-50 border border-teal-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-teal-800 mb-1">💳 You have saved bank details</p>
                  <p className="text-xs text-teal-600 mb-3">Account ending in ••••{savedBank.bank_account.slice(-4)} · {savedBank.ifsc}</p>
                  <div className="flex gap-2">
                    <button onClick={() => setUseSavedBank(true)} className="flex-1 bg-teal-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-teal-700 transition-colors">
                      Use Saved Details
                    </button>
                    <button onClick={() => setUseSavedBank(false)} className="flex-1 bg-white border border-teal-300 text-teal-700 text-sm font-semibold py-2 rounded-lg hover:bg-teal-50 transition-colors">
                      Enter New Details
                    </button>
                  </div>
                </div>
              )}
              {useSavedBank === true && (
                <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-green-800">✅ Using saved bank details</p>
                    <p className="text-xs text-green-600">Account ••••{savedBank?.bank_account?.slice(-4)} · {savedBank?.ifsc}</p>
                  </div>
                  <button onClick={() => setUseSavedBank(null)} className="text-xs text-green-600 underline">Change</button>
                </div>
              )}

              {useSavedBank !== true && (
                <>
              <div>
                <Label>Account Holder Name</Label>
                <Input className="mt-1.5" placeholder="As per bank records" value={form.accountHolder} onChange={(e) => update("accountHolder", e.target.value)} />
              </div>
              <div>
                <Label>Bank Account Number</Label>
                <Input className="mt-1.5" placeholder="Your bank account number" value={form.bankAccount} onChange={(e) => update("bankAccount", e.target.value)} />
              </div>
              <div>
                <Label>IFSC Code</Label>
                <Input className="mt-1.5 uppercase font-mono" placeholder="SBIN0001234" value={form.ifsc} onChange={(e) => update("ifsc", e.target.value.toUpperCase())} />
              </div>
                </>
              )}
              <div>
                <Label>PAN Card</Label>
                <div className="mt-1.5 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#0d9488] transition-colors">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload PAN Card</p>
                  <p className="text-xs text-gray-400">PDF, JPG, PNG (max 5MB)</p>
                </div>
              </div>
              <div>
                <Label>Aadhaar Card</Label>
                <div className="mt-1.5 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#0d9488] transition-colors">
                  <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload Aadhaar</p>
                  <p className="text-xs text-gray-400">PDF, JPG, PNG (max 5MB)</p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Review & Submit</h2>
              <div className="space-y-2 text-sm">
                {[
                  { label: "Name", value: form.name || "—" },
                  { label: "Email", value: form.email || "—" },
                  { label: "Phone", value: form.phone || "—" },
                  { label: "Business Name", value: form.businessName || "—" },
                  { label: "GSTIN", value: form.gstin || "Not provided" },
                  { label: "Category", value: form.category || "—" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-medium">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 text-xs text-amber-800">
                After submission, admin will review within 2-3 business days. You'll be notified via email once approved.
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" id="vendorTerms" className="mt-0.5" required />
                <label htmlFor="vendorTerms" className="text-xs text-gray-600">
                  I agree to Bigpool's <Link href="#" className="text-[#0d9488]">Vendor Terms</Link> and confirm all info is accurate.
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 0 && <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">Back</Button>}
            {step < steps.length - 1 ? (
              <Button onClick={() => setStep(step + 1)} className="flex-1 bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold">Continue</Button>
            ) : (
              <Button onClick={handleSubmit} className="flex-1 bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold">Submit Application</Button>
            )}
          </div>
        </div>

        <div className="text-center mt-4 text-sm text-gray-500">
          Already approved? <Link href="/vendor/login" className="text-[#0d9488] hover:underline">Vendor Login</Link>
        </div>
      </div>
    </div>
  );
}
