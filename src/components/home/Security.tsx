
import React from "react";
import { LockKeyhole, Shield, History, ServerCrash, Fingerprint, FileText } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import ButtonEffect from "@/components/ui/ButtonEffect";

const securityLayers = [
  {
    icon: Fingerprint,
    title: "Biometric Authentication",
    description: "Multi-factor authentication with biometric verification for all critical operations"
  },
  {
    icon: LockKeyhole,
    title: "MPC Technology",
    description: "Multi-Party Computation ensures keys are never stored in a single location"
  },
  {
    icon: Shield,
    title: "Cold Storage Vaults",
    description: "Air-gapped cold storage with geographically distributed secure facilities"
  },
  {
    icon: History,
    title: "Real-time Monitoring",
    description: "24/7 surveillance with automated threat detection and response systems"
  },
  {
    icon: ServerCrash,
    title: "Disaster Recovery",
    description: "Comprehensive disaster recovery with redundant systems and regular testing"
  },
  {
    icon: FileText,
    title: "Insurance Coverage",
    description: "Full insurance coverage for digital assets stored on our platform"
  }
];

const Security = () => {
  return (
    <section id="security" className="section-padding bg-white relative">
      <div className="container-custom">
        <div className="flex flex-col lg:flex-row gap-16 items-center">
          <div className="w-full lg:w-5/12">
            <AnimatedSection>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 mb-6">
                <Shield className="h-4 w-4 text-emerald-600" />
                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Defense In Depth</span>
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-slate-900 leading-tight">
                Multi-Layer <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 to-teal-600">Security Architecture</span>
              </h2>
              <p className="text-lg text-slate-600 mb-6 leading-relaxed">
                Our platform employs a defense-in-depth approach with multiple security layers to provide maximum protection for your digital assets.
              </p>
              <p className="text-slate-500 mb-8 leading-relaxed">
                Each security layer is independently audited and tested by leading cybersecurity firms to ensure the highest standards of protection.
              </p>
              <ButtonEffect variant="primary">
                View Security Whitepaper
              </ButtonEffect>
            </AnimatedSection>
          </div>

          <div className="w-full lg:w-7/12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {securityLayers.map((layer, index) => (
                <AnimatedSection key={layer.title} delay={(index % 4 + 1) as 1 | 2 | 3 | 4}>
                  <div className="flex gap-5 p-6 rounded-2xl border border-slate-200 bg-white hover:border-indigo-200 hover:shadow-lg transition-all duration-300">
                    <div className="flex-shrink-0">
                      <div className="bg-slate-100 p-3 rounded-xl">
                        <layer.icon className="h-6 w-6 text-slate-700" />
                      </div>
                    </div>
                    <div>
                      <h3 className="font-bold mb-2 text-slate-900">{layer.title}</h3>
                      <p className="text-sm text-slate-500 leading-relaxed">{layer.description}</p>
                    </div>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Security;
