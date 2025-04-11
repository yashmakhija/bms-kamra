import styles from "./hero.module.css";

export function Hero() {
  return (
    <section className="w-full h-[581px] relative bg-gradient-to-b from-[#171717] to-[#510000] overflow-hidden">
      <div className="absolute md:top-10 left-1/2 sm:top-10 -translate-x-1/2   md:left-[50%] lg:top-10 top-10 w-[420px] md:w-[420px] h-[599px] z-0">
        <img
          src="/kunal-hero.png"
          alt="Kunal Kamra"
          className="h-full w-full object-contain"
        />
      </div>

      <div className="relative z-10 container mx-auto h-full flex items-center">
        <div className="relative w-full max-w-[1200px] mx-auto px-4">
          <div className={`${styles.heroText} pt-8 sm:pt-12 md:pt-16 lg:pt-0`}>
            <span className="block text-sm sm:text-2xl md:text-3xl lg:text-5xl text-white font-medium lg:leading-10 mb-2 sm:mb-4 md:mb-6">
              welcome to the
            </span>
            <div className="relative">
              <h1 className="text-[60px] sm:text-[80px] md:text-[100px] lg:text-[154px] font-black leading-9 sm:leading-[67.21px] md:leading-[123.20px] lg:leading-[123.20px] tracking-wide text-white">
                KUN
                <span className="relative inline-block">
                  <span
                    className="text-transparent"
                    style={{
                      WebkitTextStroke: "1.5px white",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    AL
                  </span>
                  <span
                    className="absolute inset-0 text-white"
                    style={{
                      clipPath: "polygon(0 0, 44% 0, 15% 100%, 0 100%)",
                    }}
                  >
                    AL
                  </span>
                </span>{" "}
                <span className="relative inline-block">
                  <span
                    className="text-transparent"
                    style={{
                      WebkitTextStroke: "1.5px white",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    KA
                  </span>
                  <span
                    className="absolute inset-0 text-white"
                    style={{
                      clipPath: "polygon(60% 0, 100% 0, 100% 100%, 85% 100%)",
                    }}
                  >
                    KA
                  </span>
                </span>
                MRA
              </h1>
              <div className="absolute -bottom-2 sm:-bottom-3 md:-bottom-4 right-0 text-white text-xl sm:text-2xl md:text-3xl lg:text-5xl font-medium">
                app
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-[#171717] to-[#510000] z-[1] opacity-0" />
    </section>
  );
}
