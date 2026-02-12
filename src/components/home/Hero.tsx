import React, { useEffect, useState } from "react";
import { ArrowRight, Shield, Zap, Globe, CheckCircle } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { Link } from "react-router-dom";
import MarketTicker from "./MarketTicker";

const Hero = () => {
  const [offsetY, setOffsetY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setOffsetY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <section className="relative pt-20 pb-12 md:pt-24 md:pb-20 overflow-hidden bg-white">
        {/* Subtle Background Elements */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[60%] h-[60%] bg-gradient-to-bl from-indigo-50/80 to-transparent rounded-bl-full"></div>
          <div className="absolute bottom-0 left-0 w-[40%] h-[40%] bg-gradient-to-tr from-blue-50/80 to-transparent rounded-tr-full"></div>
          <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.02]" style={{ backgroundSize: '40px 40px' }}></div>
        </div>

        <div className="container-custom relative z-10 px-4 md:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">

            {/* Left Content */}
            <div className="lg:col-span-7 flex flex-col items-start bg-white/80 backdrop-blur-sm p-6 lg:p-0 rounded-3xl lg:bg-transparent">
              <AnimatedSection>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 mb-6">
                  <span className="flex h-2 w-2 rounded-full bg-indigo-600"></span>
                  <span className="text-xs font-semibold text-slate-600 uppercase tracking-wide">Enterprise Grade Finance</span>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={1}>
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-slate-900 mb-6 leading-[1.1]">
                  The Standard for <br />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-600">
                    Sovereign Assets
                  </span>
                </h1>
              </AnimatedSection>

              <AnimatedSection delay={2}>
                <p className="text-lg md:text-xl text-slate-600 mb-8 max-w-xl leading-relaxed">
                  OFSLEDGER provides the infrastructure for next-generation finance.
                  Secure, compliant, and built for institutional scale.
                </p>
              </AnimatedSection>

              <AnimatedSection delay={3}>
                <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                  <Link to="/sign-in">
                    <button className="group px-8 py-4 rounded-xl bg-slate-900 text-white font-semibold shadow-xl hover:shadow-2xl hover:bg-slate-800 transition-all duration-300 flex items-center gap-2">
                      Start Now
                      <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </Link>
                  <a href="#features">
                    <button className="px-8 py-4 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 hover:border-slate-300 transition-all duration-300">
                      View Documentation
                    </button>
                  </a>
                </div>
              </AnimatedSection>

              <AnimatedSection delay={4}>
                <div className="mt-12 flex flex-col sm:flex-row gap-6 sm:gap-12 text-sm font-medium text-slate-500">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span>Audited Smart Contracts</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                    <span>SEC Compliant Structure</span>
                  </div>
                </div>
              </AnimatedSection>
            </div>

            {/* Right Visual: Feature Cards */}
            <div className="lg:col-span-5 relative mt-12 lg:mt-0 perspective-1000">
              <AnimatedSection delay={2}>
                <div className="relative space-y-6">
                  {/* Card 1 */}
                  <div
                    className="p-6 rounded-2xl bg-white border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transform transition-transform duration-500 hover:-translate-x-2"
                    style={{ transform: `translateX(${offsetY * -0.02}px)` }}
                  >
                    <div className="h-12 w-12 rounded-xl bg-blue-50 flex items-center justify-center mb-4">
                      <Shield className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Maximum Security</h3>
                    <p className="text-slate-500">Multi-signature wallets and cold storage protocols ensure your assets are never compromised.</p>
                  </div>

                  {/* Card 2 */}
                  <div
                    className="p-6 rounded-2xl bg-white border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transform transition-transform duration-500 hover:-translate-x-2 ml-8 lg:ml-12"
                    style={{ transform: `translateX(${offsetY * 0.02}px)` }}
                  >
                    <div className="h-12 w-12 rounded-xl bg-indigo-50 flex items-center justify-center mb-4">
                      <Zap className="h-6 w-6 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Instant Settlement</h3>
                    <p className="text-slate-500">Lightning-fast transaction finality with zero gas fees for qualified institutional partners.</p>
                  </div>

                  {/* Card 3 */}
                  <div
                    className="p-6 rounded-2xl bg-white border border-slate-100 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.1)] transform transition-transform duration-500 hover:-translate-x-2"
                    style={{ transform: `translateX(${offsetY * -0.01}px)` }}
                  >
                    <div className="h-12 w-12 rounded-xl bg-purple-50 flex items-center justify-center mb-4">
                      <Globe className="h-6 w-6 text-purple-600" />
                    </div>
                    <h3 className="text-xl font-bold text-slate-900 mb-2">Global Access</h3>
                    <p className="text-slate-500">Trade from anywhere in the world with 24/7 support and 99.99% uptime guarantee.</p>
                  </div>
                </div>
              </AnimatedSection>
            </div>

          </div>
        </div>
      </section>
      <MarketTicker />
    </>
  );
};

export default Hero;
