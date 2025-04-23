import styles from "../hero.module.css";

export function HeroMedium() {
  return (
    <section className="w-auto h-[581px] relative bg-gradient-to-b from-[#171717] to-[#510000] overflow-hidden">
      <div className="absolute md:top-10 left-1/2 sm:top-13  -translate-x-1/2 md:left-[50%] lg:top-10 top-10 w-[490px] md:w-[420px] h-[599px] z-0">
        <img
          src="/kunal-hero.png"
          alt="Kunal Kamra"
          className="h-full w-full object-contain"
        />
      </div>

      <div className="relative  z-10 mt-20 lg:left-4 lg:mt-22 xl:left-12 container mx-auto h-full flex items-center">
        <div className="relative w-full max-w-auto mx-auto px-4">
          <div className={`${styles.heroText} pt-8 sm:pt-12 md:pt-16 lg:pt-0`}>
            <span className="sm:leading-3 text-2xl  text-white font-medium leading-tight mb-6">
              welcome to the
            </span>

            <div className="relative ">
              <h1 className="text-8xl font-black leading-[67.21px] text-white">
                KU
                <span className="relative inline-block">
                  <span
                    className="text-transparent"
                    style={{
                      WebkitTextStroke: "1.5px white",
                      WebkitTextFillColor: "transparent",
                    }}
                  >
                    NAL
                  </span>
                  <span
                    className="absolute inset-0 text-white"
                    style={{
                      clipPath: "polygon(0 0, 40% 0, 15% 100%, 0 100%)",
                    }}
                  >
                    NAL
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
                    KAM
                  </span>
                  <span
                    className="absolute inset-0 text-white"
                    style={{
                      clipPath: "polygon(80% 0, 100% 0, 100% 100%, 85% 100%)",
                    }}
                  >
                    KAM
                  </span>
                </span>
                RA
              </h1>
              <div className="absolute sm:-bottom-6 leading-6 right-8 text-white text-2xl font-medium">
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
