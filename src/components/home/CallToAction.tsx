
import React from "react";
import { ArrowRight, Sparkles } from "lucide-react";
import AnimatedSection from "@/components/ui/AnimatedSection";
import { Link } from "react-router-dom";

const CallToAction = () => {
  return (
    <section id="call-to-action" className="py-24 relative overflow-hidden bg-slate-900">
      {/* Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-600/10 rounded-full blur-[100px]" />
        <div className="absolute inset-0 bg-[url('/grid-pattern.svg')] opacity-[0.03]" style={{ backgroundSize: '40px 40px' }} />
      </div>

      {/* Content */}
      <div className="container-custom relative z-10">
        <AnimatedSection>
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center mb-6 px-4 py-1.5 rounded-full bg-white/10 text-indigo-300 text-sm font-medium backdrop-blur-md border border-white/5">
              <Sparkles className="h-4 w-4 mr-2 text-indigo-400" />
              Join the Financial Revolution
            </div>

            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white tracking-tight">
              Ready to Secure Your <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-blue-400">Digital Financial Future?</span>
            </h2>

            <p className="text-xl text-slate-400 mb-10 leading-relaxed max-w-2xl mx-auto">
              Join thousands of institutions and individuals already benefiting from OFSLEDGER's sovereign financial infrastructure.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center">
              <Link to="/sign-up">
                <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-white text-slate-900 font-bold hover:bg-indigo-50 transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.1)] hover:shadow-[0_0_30px_rgba(255,255,255,0.2)] flex items-center justify-center gap-2 group">
                  Create Account
                  <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
              <Link to="/contact">
                <button className="w-full sm:w-auto px-8 py-4 rounded-full bg-transparent border border-white/20 text-white font-medium hover:bg-white/5 transition-all duration-300 flex items-center justify-center gap-2">
                  Contact Sales
                </button>
              </Link>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default CallToAction;
