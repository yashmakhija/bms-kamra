import styles from "../hero.module.css";

export function HeroLarge() {
  return (
    <section className="w-full h-[581px] relative bg-gradient-to-b from-neutral-900 to-[#f2f900] overflow-hidden">
      <div className="absolute md:top-10 left-1/2 sm:top-13  -translate-x-1/2 md:left-[50%] lg:top-10 top-10 w-[490px] md:w-[420px] h-[599px] z-0">
        <img
          src="/kunal-hero.png"
          alt="Kunal Kamra"
          className="h-full w-full object-contain"
        />
      </div>

      <div className="relative z-10 mt-20 lg:left-4 lg:mt-22 xl:left-12 container mx-auto h-full flex items-center">
        <div className="text-center relative w-full max-w-auto mx-auto px-4">
          <div
            className={`${styles.heroText} flex flex-col items-center pt-8 sm:pt-12 md:pt-16 lg:pt-0`}
          >
            <div className="flex flex-col items-center">
              <span className="text-5xl text-white font-medium self-start">
                welcome to the
              </span>

              <h1 className="text-center xl:text-[154px] lg:text-[130px] md:text-[130px] text-[100px] font-black leading-[123.20px] text-white">
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
                      clipPath: "polygon(0 0, 40% 0, 15% 100%, 0 100%)",
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
                      clipPath: "polygon(100% 0, 100% 0, 100% 100%, 96% 100%)",
                    }}
                  >
                    KA
                  </span>
                </span>
                MRA
              </h1>
              <div className="text-white text-5xl font-medium relative lg:-mt-4 xl:-mt-2 self-end mr-0 lg:mr-0 xl:mr-0">
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
