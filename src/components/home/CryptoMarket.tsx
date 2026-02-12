
import React from "react";
import AnimatedSection from "@/components/ui/AnimatedSection";

const CryptoMarket = () => {
  React.useEffect(() => {
    // Create and load TradingView widget script
    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/external-embedding/embed-widget-screener.js';
    script.async = true;
    script.innerHTML = JSON.stringify({
      "width": "100%",
      "height": 490,
      "defaultColumn": "overview",
      "screener_type": "crypto_mkt",
      "displayCurrency": "USD",
      "colorTheme": "light",
      "locale": "en",
      "isTransparent": false
    });

    // Find the container and append the script
    const container = document.getElementById('tradingview-widget-container');
    if (container) {
      container.appendChild(script);
    }

    return () => {
      // Cleanup
      if (container && container.contains(script)) {
        container.removeChild(script);
      }
    };
  }, []);

  return (
    <section id="market" className="section-padding bg-gradient-to-b from-gray-50 to-white">
      <div className="container-custom">
        <AnimatedSection>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Crypto Market <span className="text-gradient">Updates</span>
            </h2>
            <p className="text-lg text-gray-600">
              Real-time cryptocurrency market data powered by TradingView.
              Stay informed with the latest prices, trends, and market movements.
            </p>
          </div>
        </AnimatedSection>

        <AnimatedSection delay={2}>
          <div className="rounded-xl overflow-hidden shadow-lg border border-gray-100">
            <div className="tradingview-widget-container" id="tradingview-widget-container">
              <div className="tradingview-widget-container__widget"></div>
              <div className="tradingview-widget-copyright">
                <a href="https://www.tradingview.com/" rel="noopener nofollow" target="_blank">
                  <span className="text-xs text-gray-400">Powered by TradingView</span>
                </a>
              </div>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default CryptoMarket;
