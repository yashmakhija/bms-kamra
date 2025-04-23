import { HeroLarge } from "./hero/HeroLarge";

import { HeroMedium } from "./hero/HeroMedium";
import { HeroSmall } from "./hero/HeroSmall";
export function Hero() {
  return (
   <>
   <div className="hidden lg:block">
    <HeroLarge />
      </div>
      <div className="hidden md:block lg:hidden">
        <HeroMedium />
      </div>
      <div className="block md:hidden">
        <HeroSmall />
      </div>
    </>
  );
}
