
import React from "react";
import AnimatedSection from "@/components/ui/AnimatedSection";

const partners = [
  { name: "Acme Corp", logo: "https://via.placeholder.com/150x80?text=PARTNER1" },
  { name: "Globex", logo: "https://via.placeholder.com/150x80?text=PARTNER2" },
  { name: "Initech", logo: "https://via.placeholder.com/150x80?text=PARTNER3" },
  { name: "Massive Dynamic", logo: "https://via.placeholder.com/150x80?text=PARTNER4" },
  { name: "Wayne Enterprises", logo: "https://via.placeholder.com/150x80?text=PARTNER5" },
  { name: "Stark Industries", logo: "https://via.placeholder.com/150x80?text=PARTNER6" },
];

const Partners = () => {
  return (
    <section className="section-padding bg-gradient-to-b from-gray-50 to-white relative overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-radial from-transparent to-indigo-50/80 z-0" />
      <div className="absolute top-10 right-10 w-60 h-60 bg-indigo-500/5 rounded-full blur-3xl spin-slow" />
      <div className="absolute bottom-10 left-10 w-72 h-72 bg-purple-400/10 rounded-full blur-3xl" />
      
      <div className="container-custom relative z-10">
        <AnimatedSection>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-700 text-sm font-medium border border-indigo-100 shadow-sm mb-4">
              <span className="animate-pulse mr-2">●</span> Growing Network
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Trusted by <span className="text-gradient-purple">Industry Leaders</span>
            </h2>
            <p className="text-lg text-gray-600">
              We work with the best in the industry to provide you with the most secure and reliable service.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={2}>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-8">
            {partners.map((partner, index) => (
              <div 
                key={partner.name} 
                className="flex items-center justify-center p-6 rounded-xl shadow-sm border border-gray-100 bg-white/90 backdrop-blur-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-1"
              >
                <img 
                  src={partner.logo} 
                  alt={`${partner.name} logo`} 
                  className="max-h-12 opacity-80 hover:opacity-100 transition-all duration-300" 
                />
              </div>
            ))}
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default Partners;
