"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Building2, Mail, Phone, User, FileText, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const steps = ["Personal Info", "Business Info", "Documents", "Review"];

export default function SellerSignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [form, setForm] = useState({
    name: "", email: "", phone: "", password: "",
    businessName: "", gstin: "", category: "", address: "",
    description: "", bankAccount: "", ifsc: "",
  });

  const update = (k: string, v: string) => setForm({ ...form, [k]: v });

  const handleNext = () => {
    if (step < steps.length - 1) setStep(step + 1);
  };

  const handleSubmit = async () => {
    setSubmitted(true);
    await new Promise((r) => setTimeout(r, 500));
    toast.success("Application submitted! Admin will review within 2-3 business days.");
    setTimeout(() => router.push("/vendor/login"), 2000);
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
            Your seller application for <strong>{form.businessName}</strong> has been submitted.
            Our admin team will review and verify your details within 2-3 business days.
          </p>
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-blue-800 mb-6">
            <p className="font-medium mb-1">What happens next?</p>
            <ul className="text-left space-y-1 list-disc list-inside">
              <li>Admin reviews your application</li>
              <li>Document verification</li>
              <li>Account approval notification via email</li>
              <li>Start listing your products!</li>
            </ul>
          </div>
          <Link href="/">
            <Button className="bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold">
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 py-8">
      <div className="w-full max-w-lg">
        <div className="text-center mb-6">
          <Link href="/" className="inline-block">
            <div className="text-3xl font-extrabold">
              <span className="text-gray-900">Shop</span>
              <span className="text-[#0d9488]">Hub</span>
            </div>
          </Link>
          <p className="text-gray-600 text-sm mt-1">Seller Registration</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center">
              <div className={`flex flex-col items-center ${i <= step ? "text-[#0d9488]" : "text-gray-400"}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 ${
                  i < step ? "bg-[#0d9488] border-[#0d9488] text-white" :
                  i === step ? "border-[#0d9488] text-[#0d9488]" : "border-gray-300 text-gray-400"
                }`}>
                  {i < step ? "✓" : i + 1}
                </div>
                <span className="text-xs mt-1 hidden sm:block">{s}</span>
              </div>
              {i < steps.length - 1 && (
                <div className={`h-0.5 w-12 sm:w-20 mx-1 ${i < step ? "bg-[#0d9488]" : "bg-gray-200"}`} />
              )}
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm">
          {step === 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Personal Information</h2>
              <div>
                <Label>Full Name</Label>
                <div className="relative mt-1.5">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input className="pl-9" placeholder="Your full name" value={form.name} onChange={(e) => update("name", e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Email Address</Label>
                <div className="relative mt-1.5">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input className="pl-9" type="email" placeholder="business@example.com" value={form.email} onChange={(e) => update("email", e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Phone Number</Label>
                <div className="relative mt-1.5">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input className="pl-9" placeholder="+91 9876543210" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Password</Label>
                <Input type="password" placeholder="Min 8 characters" value={form.password} onChange={(e) => update("password", e.target.value)} />
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Business Information</h2>
              <div>
                <Label>Business Name</Label>
                <div className="relative mt-1.5">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input className="pl-9" placeholder="Your Store Name" value={form.businessName} onChange={(e) => update("businessName", e.target.value)} />
                </div>
              </div>
              <div>
                <Label>GSTIN (Optional)</Label>
                <Input placeholder="22AAAAA0000A1Z5" value={form.gstin} onChange={(e) => update("gstin", e.target.value)} />
              </div>
              <div>
                <Label>Primary Category</Label>
                <select
                  className="w-full mt-1.5 h-10 px-3 rounded-md border border-input bg-background text-sm"
                  value={form.category}
                  onChange={(e) => update("category", e.target.value)}
                >
                  <option value="">Select category</option>
                  <option>Electronics</option>
                  <option>Fashion</option>
                  <option>Home & Kitchen</option>
                  <option>Books</option>
                  <option>Sports</option>
                  <option>Beauty</option>
                  <option>Toys</option>
                  <option>Grocery</option>
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
              <div>
                <Label>Bank Account Number</Label>
                <Input placeholder="Your bank account number" value={form.bankAccount} onChange={(e) => update("bankAccount", e.target.value)} />
              </div>
              <div>
                <Label>IFSC Code</Label>
                <Input placeholder="SBIN0001234" value={form.ifsc} onChange={(e) => update("ifsc", e.target.value)} />
              </div>
              <div>
                <Label>PAN Card (Upload)</Label>
                <div className="mt-1.5 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#0d9488] transition-colors">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload PAN Card</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (max 5MB)</p>
                </div>
              </div>
              <div>
                <Label>Aadhaar Card (Upload)</Label>
                <div className="mt-1.5 border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#0d9488] transition-colors">
                  <FileText className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600">Click to upload Aadhaar</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG (max 5MB)</p>
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-4">
              <h2 className="text-xl font-bold mb-4">Review & Submit</h2>
              <div className="space-y-3 text-sm">
                {[
                  { label: "Name", value: form.name || "—" },
                  { label: "Email", value: form.email || "—" },
                  { label: "Phone", value: form.phone || "—" },
                  { label: "Business Name", value: form.businessName || "—" },
                  { label: "GSTIN", value: form.gstin || "—" },
                  { label: "Category", value: form.category || "—" },
                ].map((item) => (
                  <div key={item.label} className="flex justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-500">{item.label}</span>
                    <span className="font-medium text-gray-900">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-sm text-amber-800">
                <p className="font-medium">⚠️ Important</p>
                <p className="mt-1">After submission, your application will be reviewed by our admin team. You'll receive an email once your account is approved.</p>
              </div>
              <div className="flex items-start gap-2">
                <input type="checkbox" id="sellerTerms" className="mt-0.5" required />
                <label htmlFor="sellerTerms" className="text-xs text-gray-600">
                  I agree to Bigpool's <Link href="#" className="text-[#0d9488] hover:underline">Seller Terms</Link> and confirm all information provided is accurate.
                </label>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-6">
            {step > 0 && (
              <Button variant="outline" onClick={() => setStep(step - 1)} className="flex-1">
                Back
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button onClick={handleNext} className="flex-1 bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold">
                Continue
              </Button>
            ) : (
              <Button onClick={handleSubmit} className="flex-1 bg-[#0d9488] hover:bg-[#0f766e] text-white font-semibold">
                Submit Application
              </Button>
            )}
          </div>
        </div>

        <div className="text-center mt-4 text-sm text-gray-500">
          Already registered?{" "}
          <Link href="/vendor/login" className="text-[#0d9488] hover:underline">Sign in</Link>
        </div>
      </div>
    </div>
  );
}
