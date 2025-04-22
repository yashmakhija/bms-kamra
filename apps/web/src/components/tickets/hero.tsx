import styles from "./hero.module.css";

export function Hero() {
  return (
    <section className="w-full h-[600px] relative bg-gradient-to-b from-[#171717] to-[#510000] rounded-bl-[64px] rounded-br-[64px] overflow-hidden">
      <div className="relative lg:z-10 md:z-0 sm:z-0 z-0 lg:mt-10 md:mt-20 sm:mt-22 mt-22 container mx-auto h-full flex lg:items-center md:items-start sm:items-start items-start">
        <div className="relative w-full max-w-[1200px] mx-auto px-4">
          <div
            className={`lg:justify-start md:justify-center sm:justify-center justify-center flex lg:text-left md:text-center sm:text-center text-center text-white text-5xl font-bold leading-[57.60px] ${styles.heroText}`}
          >
            BOOK TICKETS
          </div>
        </div>
      </div>

      <div
        className={`absolute lg:-right-1 lg:translate-x-60 lg:top-20 md:left-1/2 md:-translate-x-1/2 md:top-26 sm:left-1/2 sm:-translate-x-1/2 translate-x-10 sm:top-28 top-28 w-[500px] md:w-[420px] md:h-[525px] sm:h-[525px] sm:w-[490px] lg:h-[595px] h-[580px] lg:z-0 md:z-10 sm:z-10 z-10 ${styles.heroImage}`}
      >
        <img
          src="/tickets/jokes.png"
          alt="Kunal Kamra"
          className="h-full w-full object-contain"
        />
      </div>

      <div className="absolute inset-0 bg-gradient-to-b from-[#171717] to-[#510000] z-[1] opacity-0" />
    </section>
  );
}
