import React from "react";
import { Link } from "react-router-dom";
import { Github, Twitter, Linkedin, Facebook, Instagram, ChevronRight } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-slate-50 border-t border-slate-200 pt-16 pb-8">
      <div className="container-custom">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1 md:col-span-1">
            <Link to="/" className="inline-block mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">O</div>
                <span className="text-xl font-bold tracking-tight text-slate-900">OFSLEDGER</span>
              </div>
            </Link>
            <p className="text-slate-500 text-sm leading-relaxed mb-6">
              The secure, compliant, and sovereign infrastructure for the next generation of digital finance.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-slate-400 hover:text-indigo-600 transition-colors">
                <Github className="h-5 w-5" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-wider uppercase mb-6">
              Platform
            </h3>
            <ul className="space-y-4">
              {[
                { name: "Features", path: "/#features" },
                { name: "Security", path: "/#security" },
                { name: "Validation", path: "/validate" },
                { name: "Market", path: "/#market" }
              ].map((item) => (
                <li key={item.name}>
                  <Link to={item.path} className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-wider uppercase mb-6">
              Company
            </h3>
            <ul className="space-y-4">
              {[
                { name: "About", path: "/about" },
                { name: "FAQ", path: "/faq" },
                { name: "Contact", path: "/contact" },
                { name: "Careers", path: "/careers" }
              ].map((item) => (
                <li key={item.name}>
                  <Link to={item.path} className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-bold text-slate-900 tracking-wider uppercase mb-6">
              Legal
            </h3>
            <ul className="space-y-4">
              {[
                { name: "Privacy Policy", path: "/privacy" },
                { name: "Terms of Service", path: "/terms" },
                { name: "Security", path: "/security-policy" },
                { name: "Compliance", path: "/compliance" }
              ].map((item) => (
                <li key={item.name}>
                  <Link to={item.path} className="text-slate-500 hover:text-indigo-600 text-sm transition-colors">
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 text-sm">
            © {currentYear} OFSLEDGER. All rights reserved.
          </p>
          <div className="flex space-x-8">
            <a href="#" className="text-slate-400 hover:text-indigo-600 text-sm transition-colors">Privacy</a>
            <a href="#" className="text-slate-400 hover:text-indigo-600 text-sm transition-colors">Terms</a>
            <a href="#" className="text-slate-400 hover:text-indigo-600 text-sm transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
