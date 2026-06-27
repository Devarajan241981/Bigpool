"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import {
  Building2, Mail, Phone, User, FileText, CheckCircle, Store,
  Clock, Plus, ChevronRight, AlertCircle, Banknote, MapPin,
  Tag, ShieldCheck, Eye, EyeOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useAuthStore, useSellerApplicationStore } from "@/lib/store";
import { toast } from "sonner";

const STEPS = ["Personal Info", "Business Info", "Bank Details", "Review & Submit"];

const CATEGORIES = [
  "Electronics", "Fashion", "Home & Kitchen", "Books", "Sports & Outdoors",
  "Beauty & Personal Care", "Toys & Games", "Grocery & Gourmet", "Jewellery",
  "Automotive", "Health & Wellness", "Pet Supplies",
];

function FieldError({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <p className="flex items-center gap-1 text-xs text-red-500 mt-1">
      <AlertCircle className="w-3 h-3 flex-shrink-0" />
      {msg}
    </p>
  );
}

function RequiredLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-sm font-semibold text-gray-700">
      {children} <span className="text-red-500">*</span>
    </Label>
  );
}

function OptionalLabel({ children }: { children: React.ReactNode }) {
  return (
    <Label className="text-sm font-semibold text-gray-700">
      {children} <span className="text-gray-400 font-normal text-xs">(optional)</span>
    </Label>
  );
}

export default function VendorApplicationPage() {
  const { user, isAuthenticated } = useAuthStore();
  const { applications, submit } = useSellerApplicationStore();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [applyAnother, setApplyAnother] = useState(false);
  const [savedBank, setSavedBank] = useState<Record<string, string> | null>(null);
  const [useSavedBank, setUseSavedBank] = useState<boolean | null>(null);
  const [showPass, setShowPass] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [termsChecked, setTermsChecked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

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
    accountHolder: "",
    bankAccount: "",
    ifsc: "",
    bankName: "",
    upiId: "",
  });

  useEffect(() => {
    if (!user) return;
    setForm((prev) => ({ ...prev, name: user.name ?? "", email: user.email ?? "", phone: (user as unknown as Record<string, string>).phone ?? "" }));
    if (user.email) {
      fetch(`/api/user/bank-details?email=${encodeURIComponent(user.email)}`)
        .then(r => r.json())
        .then(data => { if (data?.bank_account) setSavedBank(data); })
        .catch(() => {});
    }
  }, [user?.email]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (useSavedBank === true && savedBank) {
      setForm(prev => ({
        ...prev,
        bankAccount: savedBank.bank_account ?? "",
        ifsc: savedBank.ifsc ?? "",
        bankName: savedBank.bank_name ?? "",
        accountHolder: savedBank.account_holder ?? "",
        upiId: savedBank.upi_id ?? "",
      }));
    } else if (useSavedBank === false) {
      setForm(prev => ({ ...prev, bankAccount: "", ifsc: "", bankName: "", accountHolder: "", upiId: "" }));
    }
  }, [useSavedBank]); // eslint-disable-line react-hooks/exhaustive-deps

  const myApps = applications.filter((a) => a.email === (user?.email ?? ""));
  const activeApp = myApps.find((a) => a.status === "pending" || a.status === "approved");

  const update = (k: string, v: string) => {
    setForm((prev) => ({ ...prev, [k]: v }));
    if (errors[k]) setErrors(prev => { const e = { ...prev }; delete e[k]; return e; });
  };

  const validateStep = (s: number): Record<string, string> => {
    const e: Record<string, string> = {};
    if (s === 0) {
      if (!form.name.trim()) e.name = "Full name is required";
      if (!form.email.trim()) e.email = "Email is required";
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email address";
      if (!form.phone.trim()) e.phone = "Phone number is required";
      else if (form.phone.replace(/\D/g, "").length < 10) e.phone = "Enter a valid 10-digit phone number";
      if (!isAuthenticated && !form.password.trim()) e.password = "Password is required";
      else if (!isAuthenticated && form.password.length < 8) e.password = "Password must be at least 8 characters";
    }
    if (s === 1) {
      if (!form.businessName.trim()) e.businessName = "Business name is required";
      if (!form.category) e.category = "Please select a category";
      if (!form.address.trim()) e.address = "Business address is required";
      if (!form.description.trim()) e.description = "Business description is required";
      else if (form.description.trim().length < 30) e.description = "Please write at least 30 characters describing your business";
    }
    if (s === 2 && useSavedBank !== true) {
      if (!form.accountHolder.trim()) e.accountHolder = "Account holder name is required";
      if (!form.bankAccount.trim()) e.bankAccount = "Bank account number is required";
      else if (form.bankAccount.replace(/\D/g, "").length < 9) e.bankAccount = "Enter a valid account number (min 9 digits)";
      if (!form.ifsc.trim()) e.ifsc = "IFSC code is required";
      else if (!/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc.toUpperCase())) e.ifsc = "Enter a valid IFSC code (e.g. SBIN0001234)";
    }
    return e;
  };

  const handleNext = () => {
    const errs = validateStep(step);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      toast.error("Please fill all required fields correctly.");
      return;
    }
    setErrors({});
    setStep(s => s + 1);
  };

  const handleSubmit = async () => {
    if (!termsChecked) { toast.error("Please accept the Vendor Terms to proceed."); return; }
    setSubmitting(true);
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
      ifsc: form.ifsc.toUpperCase(),
      fromCustomer: isAuthenticated && user?.role === "customer",
    };
    submit(payload);
    try {
      await fetch("/api/vendor-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch { /* non-critical */ }
    setSubmitted(true);
    setSubmitting(false);
    toast.success("Application submitted! Admin will review within 2–3 business days.");
  };

  // ── Already applied screen ──────────────────────────────────────────────────
  if (activeApp && !submitted && !applyAnother) {
    const timeline = [
      { label: "Application Submitted", done: true, date: activeApp.submittedAt },
      { label: "Admin Review in Progress", done: activeApp.status !== "pending", active: activeApp.status === "pending" },
      { label: activeApp.status === "approved" ? "Application Approved ✓" : "Awaiting Decision", done: activeApp.status === "approved", pending: activeApp.status === "pending" },
    ];
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="text-center mb-6">
              {activeApp.status === "approved"
                ? <CheckCircle className="w-14 h-14 text-green-500 mx-auto mb-3" />
                : <Clock className="w-14 h-14 text-amber-400 mx-auto mb-3" />}
              <h1 className="text-xl font-bold text-gray-900">
                {activeApp.status === "approved" ? "Application Approved!" : "Application Under Review"}
              </h1>
              <p className="text-sm text-gray-500 mt-1">{activeApp.businessName} · {activeApp.category}</p>
            </div>
            <div className="space-y-4 mb-6">
              {timeline.map((t, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${t.done ? "bg-green-500" : t.active ? "bg-amber-400" : "bg-gray-200"}`}>
                    {t.done ? <CheckCircle className="w-4 h-4 text-white" /> : t.active ? <Clock className="w-4 h-4 text-white animate-pulse" /> : <div className="w-2 h-2 rounded-full bg-gray-400" />}
                  </div>
                  <div className="flex-1 pt-0.5">
                    <p className={`text-sm font-medium ${t.done ? "text-gray-900" : t.active ? "text-amber-700" : "text-gray-400"}`}>{t.label}</p>
                    {t.date && <p className="text-xs text-gray-400 mt-0.5">Submitted on {t.date}</p>}
                    {t.active && <p className="text-xs text-amber-600 mt-0.5">Usually takes 2–3 business days</p>}
                  </div>
                </div>
              ))}
            </div>
            {activeApp.status === "approved" ? (
              <Link href="/vendor/login"><Button className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold h-11">Go to Vendor Dashboard</Button></Link>
            ) : (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 mb-3">
                You'll be notified by email once the admin reviews your application.
              </div>
            )}
            <button onClick={() => setApplyAnother(true)} className="mt-3 w-full flex items-center justify-center gap-1.5 text-xs text-[#0d9488] hover:underline font-medium py-2">
              <Plus className="w-3.5 h-3.5" /> Apply for a different product category
            </button>
            <Link href="/customer/profile" className="mt-1 block text-center text-xs text-gray-400 hover:underline">Back to Profile</Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (submitted) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center p-4">
        <div className="text-center max-w-md w-full">
          <div className="bg-green-100 rounded-full w-20 h-20 flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Application Submitted!</h1>
          <p className="text-gray-600 mb-5">
            Your vendor application for <strong>{form.businessName}</strong> has been submitted successfully.
          </p>
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-800 mb-5 text-left">
            <p className="font-semibold mb-2">Next steps:</p>
            <ol className="list-decimal list-inside space-y-1.5 text-xs text-amber-700">
              <li>Admin reviews &amp; verifies your business details</li>
              <li>You'll receive approval notification via email</li>
              <li>Log in at <span className="font-mono bg-amber-100 px-1 rounded">/vendor/login</span> to start selling</li>
            </ol>
          </div>
          <div className="flex gap-3">
            <Link href="/" className="flex-1"><Button variant="outline" className="w-full">Back to Home</Button></Link>
            <Link href="/vendor/login" className="flex-1"><Button className="w-full bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold">Vendor Login</Button></Link>
          </div>
        </div>
      </div>
    );
  }

  // ── Main form ───────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="w-full max-w-2xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-3">
            <img src="/logo.png" alt="Bigpool" width={44} height={44} style={{ mixBlendMode: "multiply" }} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Become a Vendor</h1>
          <p className="text-sm text-gray-500 mt-1">Start selling on Bigpool in 4 simple steps</p>
        </div>

        {/* Logged-in banner */}
        {isAuthenticated && user?.role === "customer" && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-5 flex items-center gap-2 text-sm text-blue-800">
            <User className="w-4 h-4 flex-shrink-0 text-blue-600" />
            <span>Applying as <strong>{user.name}</strong> — your details have been pre-filled.</span>
          </div>
        )}

        {/* Step indicator */}
        <div className="flex items-center mb-6">
          {STEPS.map((label, i) => (
            <div key={i} className="flex items-center flex-1">
              <div className="flex flex-col items-center">
                <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-all ${
                  i < step ? "bg-[#0d9488] border-[#0d9488] text-white" :
                  i === step ? "border-[#0d9488] text-[#0d9488] bg-white shadow-sm" :
                  "border-gray-200 text-gray-400 bg-white"
                }`}>
                  {i < step ? <CheckCircle className="w-5 h-5" /> : i + 1}
                </div>
                <span className={`text-[10px] mt-1 font-medium text-center hidden sm:block whitespace-nowrap ${i === step ? "text-[#0d9488]" : i < step ? "text-gray-500" : "text-gray-300"}`}>
                  {label}
                </span>
              </div>
              {i < STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 mx-2 transition-all ${i < step ? "bg-[#0d9488]" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

          {/* Step title bar */}
          <div className="bg-gradient-to-r from-[#0d9488] to-[#0f766e] px-6 py-4">
            <div className="flex items-center gap-2 text-white">
              {step === 0 && <User className="w-5 h-5" />}
              {step === 1 && <Building2 className="w-5 h-5" />}
              {step === 2 && <Banknote className="w-5 h-5" />}
              {step === 3 && <ShieldCheck className="w-5 h-5" />}
              <div>
                <p className="text-[11px] text-teal-200 font-medium">Step {step + 1} of {STEPS.length}</p>
                <h2 className="text-lg font-bold">{STEPS[step]}</h2>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-5">

            {/* ── STEP 0: Personal Info ───────────────────────────────────── */}
            {step === 0 && (
              <>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <RequiredLabel>Full Name</RequiredLabel>
                    <div className="relative mt-1.5">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        className={`pl-9 h-11 ${errors.name ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                        placeholder="Enter your full name"
                        value={form.name}
                        onChange={e => update("name", e.target.value)}
                      />
                    </div>
                    <FieldError msg={errors.name} />
                  </div>

                  <div>
                    <RequiredLabel>Email Address</RequiredLabel>
                    <div className="relative mt-1.5">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        className={`pl-9 h-11 ${errors.email ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                        type="email"
                        placeholder="you@example.com"
                        value={form.email}
                        onChange={e => update("email", e.target.value)}
                      />
                    </div>
                    <FieldError msg={errors.email} />
                  </div>

                  <div>
                    <RequiredLabel>Phone Number</RequiredLabel>
                    <div className="relative mt-1.5">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        className={`pl-9 h-11 ${errors.phone ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                        placeholder="+91 9876543210"
                        value={form.phone}
                        onChange={e => update("phone", e.target.value)}
                      />
                    </div>
                    <FieldError msg={errors.phone} />
                  </div>

                  {!isAuthenticated && (
                    <div className="sm:col-span-2">
                      <RequiredLabel>Password</RequiredLabel>
                      <div className="relative mt-1.5">
                        <Input
                          className={`pr-10 h-11 ${errors.password ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                          type={showPass ? "text" : "password"}
                          placeholder="Min 8 characters"
                          value={form.password}
                          onChange={e => update("password", e.target.value)}
                        />
                        <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <FieldError msg={errors.password} />
                    </div>
                  )}
                </div>
              </>
            )}

            {/* ── STEP 1: Business Info ───────────────────────────────────── */}
            {step === 1 && (
              <>
                <div className="grid sm:grid-cols-2 gap-5">
                  <div className="sm:col-span-2">
                    <RequiredLabel>Business / Store Name</RequiredLabel>
                    <div className="relative mt-1.5">
                      <Store className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        className={`pl-9 h-11 ${errors.businessName ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                        placeholder="Your Store or Brand Name"
                        value={form.businessName}
                        onChange={e => update("businessName", e.target.value)}
                      />
                    </div>
                    <FieldError msg={errors.businessName} />
                  </div>

                  <div>
                    <RequiredLabel>Primary Category</RequiredLabel>
                    <div className="relative mt-1.5">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                      <select
                        className={`w-full h-11 pl-9 pr-4 rounded-md border bg-background text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-[#0d9488] ${errors.category ? "border-red-400" : "border-input"}`}
                        value={form.category}
                        onChange={e => update("category", e.target.value)}
                      >
                        <option value="">— Select category —</option>
                        {CATEGORIES.map(c => <option key={c}>{c}</option>)}
                      </select>
                    </div>
                    <FieldError msg={errors.category} />
                  </div>

                  <div>
                    <OptionalLabel>GSTIN</OptionalLabel>
                    <Input
                      className="mt-1.5 h-11 font-mono uppercase"
                      placeholder="22AAAAA0000A1Z5"
                      maxLength={15}
                      value={form.gstin}
                      onChange={e => update("gstin", e.target.value.toUpperCase())}
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <RequiredLabel>Business Address</RequiredLabel>
                    <div className="relative mt-1.5">
                      <MapPin className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                      <Textarea
                        className={`pl-9 min-h-[80px] resize-none ${errors.address ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                        placeholder="Door No, Street, City, State, PIN"
                        value={form.address}
                        onChange={e => update("address", e.target.value)}
                      />
                    </div>
                    <FieldError msg={errors.address} />
                  </div>

                  <div className="sm:col-span-2">
                    <RequiredLabel>Business Description</RequiredLabel>
                    <Textarea
                      className={`mt-1.5 min-h-[100px] resize-none ${errors.description ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                      placeholder="Describe what products you sell, your experience, target customers… (min 30 characters)"
                      value={form.description}
                      onChange={e => update("description", e.target.value)}
                    />
                    <div className="flex items-center justify-between mt-1">
                      <FieldError msg={errors.description} />
                      <span className={`text-xs ml-auto ${form.description.length < 30 ? "text-gray-400" : "text-green-600"}`}>
                        {form.description.length}/30 min
                      </span>
                    </div>
                  </div>
                </div>
              </>
            )}

            {/* ── STEP 2: Bank Details ────────────────────────────────────── */}
            {step === 2 && (
              <>
                {/* Saved bank prompt */}
                {savedBank?.bank_account && useSavedBank === null && (
                  <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 mb-1">
                    <p className="text-sm font-semibold text-teal-800 mb-0.5">Saved bank details found</p>
                    <p className="text-xs text-teal-600 mb-3">Account ending ••••{savedBank.bank_account.slice(-4)} · IFSC: {savedBank.ifsc}</p>
                    <div className="grid grid-cols-2 gap-2">
                      <button onClick={() => setUseSavedBank(true)} className="bg-teal-600 text-white text-sm font-semibold py-2 rounded-lg hover:bg-teal-700 transition-colors">
                        Use Saved Details
                      </button>
                      <button onClick={() => setUseSavedBank(false)} className="bg-white border border-teal-300 text-teal-700 text-sm font-semibold py-2 rounded-lg hover:bg-teal-50 transition-colors">
                        Enter New Details
                      </button>
                    </div>
                  </div>
                )}

                {useSavedBank === true && (
                  <div className="bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl p-4 text-white mb-1">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-sm font-semibold">Using Saved Bank Details</p>
                      <button onClick={() => setUseSavedBank(null)} className="text-xs text-slate-300 underline hover:text-white">Change</button>
                    </div>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-slate-300">Account Holder</span><span className="font-medium">{savedBank?.account_holder || "—"}</span></div>
                      <div className="flex justify-between"><span className="text-slate-300">Account Number</span><span className="font-mono">••••{savedBank?.bank_account?.slice(-4)}</span></div>
                      <div className="flex justify-between"><span className="text-slate-300">IFSC Code</span><span className="font-mono">{savedBank?.ifsc}</span></div>
                      {savedBank?.bank_name && <div className="flex justify-between"><span className="text-slate-300">Bank</span><span>{savedBank.bank_name}</span></div>}
                    </div>
                  </div>
                )}

                {useSavedBank !== true && (
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div className="sm:col-span-2">
                      <RequiredLabel>Account Holder Name</RequiredLabel>
                      <Input
                        className={`mt-1.5 h-11 ${errors.accountHolder ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                        placeholder="Name as per bank records"
                        value={form.accountHolder}
                        onChange={e => update("accountHolder", e.target.value)}
                      />
                      <FieldError msg={errors.accountHolder} />
                    </div>

                    <div>
                      <RequiredLabel>Bank Account Number</RequiredLabel>
                      <Input
                        className={`mt-1.5 h-11 font-mono ${errors.bankAccount ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                        placeholder="Enter account number"
                        value={form.bankAccount}
                        onChange={e => update("bankAccount", e.target.value.replace(/\D/g, ""))}
                      />
                      <FieldError msg={errors.bankAccount} />
                    </div>

                    <div>
                      <RequiredLabel>IFSC Code</RequiredLabel>
                      <Input
                        className={`mt-1.5 h-11 font-mono uppercase ${errors.ifsc ? "border-red-400 focus-visible:ring-red-300" : ""}`}
                        placeholder="e.g. SBIN0001234"
                        maxLength={11}
                        value={form.ifsc}
                        onChange={e => update("ifsc", e.target.value.toUpperCase())}
                      />
                      <FieldError msg={errors.ifsc} />
                    </div>

                    <div>
                      <OptionalLabel>Bank Name</OptionalLabel>
                      <Input
                        className="mt-1.5 h-11"
                        placeholder="e.g. State Bank of India"
                        value={form.bankName}
                        onChange={e => update("bankName", e.target.value)}
                      />
                    </div>

                    <div>
                      <OptionalLabel>UPI ID</OptionalLabel>
                      <Input
                        className="mt-1.5 h-11"
                        placeholder="name@upi"
                        value={form.upiId}
                        onChange={e => update("upiId", e.target.value)}
                      />
                    </div>
                  </div>
                )}

                <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800 flex gap-2 mt-1">
                  <ShieldCheck className="w-4 h-4 flex-shrink-0 text-amber-600 mt-0.5" />
                  Your bank details are used only for processing vendor payouts and are stored securely.
                </div>
              </>
            )}

            {/* ── STEP 3: Review & Submit ─────────────────────────────────── */}
            {step === 3 && (
              <>
                <div className="space-y-3">
                  {/* Personal */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Personal Information</p>
                    <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                      {[
                        { label: "Full Name", value: form.name },
                        { label: "Email", value: form.email },
                        { label: "Phone", value: form.phone },
                      ].map(row => (
                        <div key={row.label} className="flex items-center justify-between px-4 py-3 text-sm bg-gray-50">
                          <span className="text-gray-500 font-medium w-32">{row.label}</span>
                          <span className="font-semibold text-gray-900 text-right">{row.value || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Business */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Business Information</p>
                    <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                      {[
                        { label: "Business Name", value: form.businessName },
                        { label: "Category", value: form.category },
                        { label: "GSTIN", value: form.gstin || "Not provided" },
                        { label: "Address", value: form.address },
                      ].map(row => (
                        <div key={row.label} className="flex items-start justify-between px-4 py-3 text-sm bg-gray-50">
                          <span className="text-gray-500 font-medium w-32 flex-shrink-0">{row.label}</span>
                          <span className="font-semibold text-gray-900 text-right">{row.value || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Bank */}
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Bank Details</p>
                    <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-100">
                      {[
                        { label: "Account Holder", value: form.accountHolder },
                        { label: "Account No.", value: form.bankAccount ? `••••${form.bankAccount.slice(-4)}` : "—" },
                        { label: "IFSC", value: form.ifsc },
                      ].map(row => (
                        <div key={row.label} className="flex items-center justify-between px-4 py-3 text-sm bg-gray-50">
                          <span className="text-gray-500 font-medium w-32">{row.label}</span>
                          <span className="font-semibold text-gray-900 font-mono text-right">{row.value || "—"}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                    After submission, admin will review within 2–3 business days. You will be notified via email once approved.
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={termsChecked}
                      onChange={e => setTermsChecked(e.target.checked)}
                      className="mt-0.5 w-4 h-4 accent-[#0d9488] cursor-pointer"
                    />
                    <span className="text-sm text-gray-600 group-hover:text-gray-800">
                      I confirm all information above is accurate and I agree to Bigpool's{" "}
                      <Link href="#" className="text-[#0d9488] underline underline-offset-2">Vendor Terms & Conditions</Link>.
                    </span>
                  </label>
                </div>
              </>
            )}
          </div>

          {/* Footer nav */}
          <div className="px-6 sm:px-8 pb-6 flex gap-3">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1 h-11 font-semibold">
                ← Back
              </Button>
            )}
            {step < STEPS.length - 1 ? (
              <Button onClick={handleNext} className="flex-1 h-11 bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold gap-1.5">
                Continue <ChevronRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={handleSubmit}
                disabled={!termsChecked || submitting}
                className="flex-1 h-11 bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold gap-1.5 disabled:opacity-60"
              >
                {submitting ? "Submitting..." : "Submit Application"}
                {!submitting && <CheckCircle className="w-4 h-4" />}
              </Button>
            )}
          </div>
        </div>

        <p className="text-center text-sm text-gray-500 mt-4">
          Already approved?{" "}
          <Link href="/vendor/login" className="text-[#0d9488] hover:underline font-medium">Vendor Login</Link>
        </p>
      </div>
    </div>
  );
}
