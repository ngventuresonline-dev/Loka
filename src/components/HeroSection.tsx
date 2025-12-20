// Server-rendered Hero Section - Ultra-fast load (<0.2s)
// No client-side JS, no animations, no font loading delays

export default function HeroSection() {
  return (
    <section 
      className="relative w-full min-h-[60vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20"
      style={{
        // Inline critical CSS - no external stylesheet needed
        background: 'linear-gradient(135deg, #ffffff 0%, #f9fafb 100%)',
      }}
    >
      {/* Hero Content */}
      <div className="w-full max-w-6xl mx-auto text-center">
        {/* Main Heading */}
        <h1 
          className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-4 sm:mb-6 text-gray-900"
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: '1.1',
            letterSpacing: '-0.02em',
          }}
        >
          Find Your Perfect
          <br />
          <span 
            style={{
              background: 'linear-gradient(135deg, #FF5200 0%, #E4002B 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Commercial Space
          </span>
        </h1>

        {/* Subheading */}
        <p 
          className="text-base sm:text-lg md:text-xl text-gray-600 mb-8 sm:mb-10 max-w-2xl mx-auto"
          style={{
            fontFamily: 'system-ui, -apple-system, sans-serif',
            lineHeight: '1.6',
          }}
        >
          AI-powered matchmaking connecting brands with property owners in Bangalore
        </p>

        {/* Search Bar Container - Will be hydrated by client component */}
        <div 
          id="hero-search-container"
          className="w-full max-w-5xl mx-auto"
          style={{
            minHeight: '80px', // Prevent layout shift
          }}
        >
          {/* Placeholder - will be replaced by HeroSearch on client */}
          <div 
            className="w-full relative p-[2px] rounded-2xl"
            style={{
              background: 'linear-gradient(90deg, #FF5200, #E4002B, #FF6B35, #FF5200)',
              backgroundSize: '200% 200%',
            }}
          >
            <div className="w-full flex items-center gap-2 sm:gap-4 bg-white rounded-xl sm:rounded-2xl px-2.5 sm:px-6 py-2.5 sm:py-4 shadow-sm">
              <div className="w-7 h-7 sm:w-11 sm:h-11 bg-gradient-to-br from-[#E4002B] to-[#FF5200] rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
                <svg className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  placeholder="Looking for 800 sqft cafe space in Indiranagar"
                  className="w-full bg-transparent border-none outline-none text-base sm:text-base md:text-lg text-gray-900 font-medium"
                  style={{
                    fontFamily: 'system-ui, -apple-system, sans-serif',
                    fontSize: '16px',
                  }}
                  disabled
                />
              </div>
              <button
                className="px-3 py-2 sm:px-5 sm:py-2.5 bg-gradient-to-r from-[#FF5200] to-[#E4002B] text-white rounded-lg sm:rounded-xl text-xs sm:text-sm md:text-base font-semibold flex-shrink-0 flex items-center gap-1 sm:gap-2"
                style={{
                  fontFamily: 'system-ui, -apple-system, sans-serif',
                }}
                disabled
              >
                <span className="hidden sm:inline">Find a property</span>
                <span className="sm:hidden">Find</span>
                <svg className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Toggle - Static version */}
        <div className="mt-6 sm:mt-8 flex flex-col items-center gap-2 sm:gap-2.5">
          <div className="inline-flex items-center border border-gray-200 rounded-full p-0.5 sm:p-1 bg-white shadow-sm">
            <button
              className="px-3 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm md:text-base font-semibold text-white bg-gradient-to-r from-[#FF5200] to-[#E4002B]"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              Brand - Looking For Space
            </button>
            <button
              className="px-3 sm:px-6 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm md:text-base font-semibold text-gray-600"
              style={{
                fontFamily: 'system-ui, -apple-system, sans-serif',
              }}
            >
              List Property
            </button>
          </div>
          <p 
            className="text-xs sm:text-sm md:text-base text-center max-w-md px-2 sm:px-4 font-medium text-gray-700"
            style={{
              fontFamily: 'system-ui, -apple-system, sans-serif',
            }}
          >
            Select preferences and click to browse spaces
          </p>
        </div>
      </div>
    </section>
  )
}

