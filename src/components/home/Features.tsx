
import React from "react";
import { Shield, Key, Clock, Users, Server, Zap } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";

const features = [
  {
    icon: Shield,
    title: "Financial Security",
    description: "OFS provides 100% financial security and transparency for all currency holders globally."
  },
  {
    icon: Key,
    title: "Asset-Backed Currency",
    description: "All sovereign currencies will be asset-backed after reevaluation, ensuring stable value."
  },
  {
    icon: Clock,
    title: "End of Corruption",
    description: "Put an end to corruption, usury, and manipulation within the banking system."
  },
  {
    icon: Users,
    title: "Decentralized Control",
    description: "OFS replaces the centrally controlled SWIFT system with decentralized CIPS."
  },
  {
    icon: Server,
    title: "Secure Validation",
    description: "Secure verification and validation of digital assets with our advanced system."
  },
  {
    icon: Zap,
    title: "Instant Transfers",
    description: "Fast and secure global transfers without the need for excessive transaction fees."
  }
];

const Features = () => {
  return (
    <section id="features" className="section-padding bg-slate-50 relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-100/40 rounded-full blur-3xl opacity-50" />
      <div className="absolute bottom-20 left-10 w-72 h-72 bg-blue-100/40 rounded-full blur-3xl opacity-50" />

      <div className="container-custom relative z-10">
        <AnimatedSection>
          <div className="text-center max-w-3xl mx-auto mb-16">
            <span className="inline-block px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-medium shadow-sm mb-4">
              <span className="inline-block w-2 h-2 rounded-full bg-indigo-500 mr-2"></span> Key Features
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-slate-900">
              OFSLEDGER <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">Capabilities</span>
            </h2>
            <p className="text-lg text-slate-600">
              Our platform delivers a revolutionary solution for securing and validation your digital assets with institutional-grade precision.
            </p>
          </div>
        </AnimatedSection>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <AnimatedSection key={feature.title} delay={(index % 3 + 1) as 1 | 2 | 3 | 4}>
              <div className="group bg-white p-8 rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl hover:border-indigo-100 transition-all duration-300 h-full">
                <div className="bg-slate-50 group-hover:bg-indigo-50 p-3 rounded-xl w-14 h-14 flex items-center justify-center mb-6 transition-colors duration-300">
                  <feature.icon className="h-7 w-7 text-slate-600 group-hover:text-indigo-600 transition-colors" />
                </div>
                <h3 className="text-xl font-bold mb-3 text-slate-900">{feature.title}</h3>
                <p className="text-slate-600 leading-relaxed">{feature.description}</p>
              </div>
            </AnimatedSection>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
