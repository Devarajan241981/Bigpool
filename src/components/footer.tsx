"use client";

import Link from "next/link";
import { Smartphone, Download } from "lucide-react";

const LinkedInIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.064 2.064 0 1 1 2.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-current" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
);

export default function Footer() {
  return (
    <footer className="bg-[#1e293b] text-gray-300 mt-auto">
      <div className="bg-[#334155] py-3 text-center">
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="text-white text-sm hover:text-[#0d9488] transition-colors"
        >
          Back to top ↑
        </button>
      </div>

      {/* Download App Banner */}
      <div className="bg-gradient-to-r from-[#0d9488] to-[#0f766e] py-5">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-white/20 rounded-xl p-2.5">
              <Smartphone className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-base">Get the Bigpool App</p>
              <p className="text-teal-100 text-xs">Faster checkout · App-only deals · Offline access</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => {
                const e = new CustomEvent("triggerInstall");
                window.dispatchEvent(e);
                if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
                  alert("Tap the Share button in Safari, then select 'Add to Home Screen' to install Bigpool.");
                }
              }}
              className="flex items-center gap-2 bg-white text-[#0d9488] font-bold text-sm px-4 py-2.5 rounded-xl hover:bg-teal-50 transition-colors"
            >
              <Download className="w-4 h-4" />
              Install App
            </button>
            <div className="flex flex-col items-center justify-center text-teal-100 text-[10px] leading-tight text-center">
              <span>Works on</span>
              <span className="font-semibold">Android & iOS</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
        <div>
          <h3 className="text-white font-semibold mb-4">Get to Know Us</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="#" className="hover:text-[#0d9488]">About Bigpool</Link></li>
            <li><Link href="#" className="hover:text-[#0d9488]">Careers</Link></li>
            <li><Link href="#" className="hover:text-[#0d9488]">Press Releases</Link></li>
            <li><Link href="#" className="hover:text-[#0d9488]">Bigpool Science</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Connect with Us</h3>
          <ul className="space-y-2 text-sm">
            <li>
              <Link href="https://www.linkedin.com/in/devarajan241981/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#0d9488]">
                <LinkedInIcon /> LinkedIn
              </Link>
            </li>
            <li>
              <Link href="https://www.instagram.com/y__not__jai/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-[#0d9488]">
                <InstagramIcon /> Instagram
              </Link>
            </li>
            <li><Link href="#" className="hover:text-[#0d9488]">Twitter / X</Link></li>
            <li><Link href="#" className="hover:text-[#0d9488]">YouTube</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Make Money with Us</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/vendor/application/signup" className="hover:text-[#0d9488]">Sell on Bigpool</Link></li>
            <li><Link href="/vendor/promotions" className="hover:text-[#0d9488]">Advertise Your Products</Link></li>
            <li><Link href="#" className="hover:text-[#0d9488]">Bigpool Business</Link></li>
            <li><Link href="#" className="hover:text-[#0d9488]">Become an Affiliate</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="text-white font-semibold mb-4">Let Us Help You</h3>
          <ul className="space-y-2 text-sm">
            <li><Link href="/customer/profile" className="hover:text-[#0d9488]">Your Account</Link></li>
            <li><Link href="/customer/profile/orders" className="hover:text-[#0d9488]">Your Orders</Link></li>
            <li><Link href="#" className="hover:text-[#0d9488]">Shipping Rates & Policies</Link></li>
            <li><Link href="/customer/profile/refunds" className="hover:text-[#0d9488]">Returns & Replacements</Link></li>
            <li><Link href="/customer/help" className="hover:text-[#0d9488]">Help & FAQs</Link></li>
          </ul>
        </div>
      </div>

      <div className="border-t border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-2xl font-extrabold">
            <span className="text-white">Big</span>
            <span className="text-[#0d9488]">pool</span>
          </div>
          <div className="flex items-center gap-5 text-gray-400">
            <Link href="https://www.linkedin.com/in/devarajan241981/" target="_blank" rel="noopener noreferrer" className="hover:text-[#0d9488] transition-colors">
              <LinkedInIcon />
            </Link>
            <Link href="https://www.instagram.com/y__not__jai/" target="_blank" rel="noopener noreferrer" className="hover:text-[#0d9488] transition-colors">
              <InstagramIcon />
            </Link>
            <Link href="#" className="text-sm hover:text-[#0d9488]">Twitter</Link>
            <Link href="#" className="text-sm hover:text-[#0d9488]">YouTube</Link>
          </div>
          <div className="text-xs text-center">
            © 2025 Bigpool. All rights reserved. |{" "}
            <Link href="#" className="hover:text-[#0d9488]">Privacy Policy</Link> |{" "}
            <Link href="/terms" className="hover:text-[#0d9488]">Terms of Use</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
