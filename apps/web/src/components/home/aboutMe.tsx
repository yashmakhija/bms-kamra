"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@repo/ui/utils";

interface AboutMeProps {
  className?: string;
}

export function AboutMe({}: AboutMeProps) {
  const bioText =
    "Kunal Kamra is a Bombay based stand-up comedian and host of the popular political-comedy podcast Shut Up Ya Kunal. After 8 years in advertising, Kunal started doing stand-up in 2013. He rose through the ranks at blistering pace and is currently well established as one of India's most important and popular voices on stage and social media, known for his fearless, incisive and often polarizing material. He is also one of the very few from the Indian scene who is a comedian's comedian as well as popular amongst the masses who sells out venues regularly across the country.";

  // Images - these should match the ones in the provided screenshot
  const images = [
    "/images/image-1.png",
    "/images/image-2.png",
    "/images/image-3.png",
    "/images/image-4.png",
  ];

  // Reference to the marquee container for animation
  const marqueeRef = useRef<HTMLDivElement>(null);

  // Set up the automatic scrolling animation using requestAnimationFrame
  useEffect(() => {
    const marqueeElement = marqueeRef.current;
    if (!marqueeElement) return;

    let animationId: number;
    let scrollPosition = 0;
    let scrollSpeed = 0.4; // Make this mutable

    // Function to determine scroll speed based on screen width
    const getScrollSpeed = () => {
      const width = window.innerWidth;
      if (width < 640) return 0.25; // Slower on mobile
      if (width < 1024) return 0.3; // Medium speed on tablets
      return 0.4; // Default speed for desktop
    };

    // Update scroll speed when window is resized
    const updateSpeed = () => {
      scrollSpeed = getScrollSpeed();
    };

    // Add resize listener
    window.addEventListener("resize", updateSpeed);
    updateSpeed(); // Set initial value

    const scrollMarquee = () => {
      if (!marqueeElement) return;

      scrollPosition += scrollSpeed;

      // Create a smooth, continuous loop
      const firstImageSet = marqueeElement.querySelector(
        ".image-set-1"
      ) as HTMLElement;
      if (firstImageSet && scrollPosition >= firstImageSet.offsetWidth + 16) {
        scrollPosition = 0;
      }

      // Apply the scroll position
      marqueeElement.style.transform = `translateX(-${scrollPosition}px)`;

      animationId = requestAnimationFrame(scrollMarquee);
    };

    scrollMarquee();

    return () => {
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
      window.removeEventListener("resize", updateSpeed);
    };
  }, []);

  return (
    <section className="w-full py-16 md:py-20 bg-neutral-900">
      <div className="container mx-auto px-6">
        {/* Title with lines for all screen sizes - wider lines on larger screens */}
        <div className="flex items-center justify-center mb-12 md:mb-10">
          <div className="w-1/4 md:w-1/6 h-px bg-white"></div>
          <h2 className="text-2xl sm:text-4xl font-bold text-white mx-4 md:mx-6 leading-10">
            About Kunal
          </h2>
          <div className="w-1/4 md:w-1/6 h-px bg-white"></div>
        </div>

        {/* Bio text - matches the reference image on all device sizes */}
        <div className="mx-auto text-center px-4">
          {/* Small screen bio text */}
          <p className="text-base font-medium text-white leading-relaxed md:hidden">
            {bioText}
          </p>

          {/* Tablet and larger screen bio text - wider with more spacing */}
          <p className="hidden md:block text-base md:text-lg font-medium text-white leading-relaxed max-w-5xl mx-auto">
            {bioText}
          </p>
        </div>

        <div className="relative w-full overflow-hidden md:block  mt-16">
          <div
            className="relative w-full opacity-90"
            style={{
              maskImage:
                "linear-gradient(to right, transparent, black 0%, black 95%, transparent)",
              WebkitMaskImage:
                "linear-gradient(to right, transparent, black 0%, black 95%, transparent)",
            }}
          >
            <div className="w-full overflow-hidden">
              <div ref={marqueeRef} className="inline-flex">
                <div className="flex gap-3 sm:gap-4 md:gap-6 image-set-1">
                  {images.map((src, index) => (
                    <div
                      key={`img-1-${index}`}
                      className="relative w-60 h-40 sm:w-80 sm:h-48 md:w-96 md:h-64 rounded-xl sm:rounded-2xl overflow-hidden"
                    >
                      <img
                        src={src}
                        alt={`Kunal Kamra ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://placehold.co/600x400/222222/ffffff?text=Kunal+${index + 1}`;
                        }}
                      />
                    </div>
                  ))}
                </div>

                {/* Add extra spacing between image sets - responsive */}
                <div className="w-3 sm:w-4 md:w-6"></div>

                <div className="flex gap-3 sm:gap-4 md:gap-6 image-set-2">
                  {images.map((src, index) => (
                    <div
                      key={`img-2-${index}`}
                      className="relative w-60 h-40 sm:w-80 sm:h-48 md:w-96 md:h-64 rounded-xl sm:rounded-2xl overflow-hidden"
                    >
                      <img
                        src={src}
                        alt={`Kunal Kamra ${index + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = `https://placehold.co/600x400/222222/ffffff?text=Kunal+${index + 1}`;
                        }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default AboutMe;
