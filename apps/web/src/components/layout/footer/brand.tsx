export function Brand() {
  return (
    <div className="flex flex-col">
      <div className=" items-start gap-4 ">
        <img
          src="/main-logo.png"
          alt="The Kunal Kamra App"
          width={52}
          height={52}
          className="rounded-lg sm:mx-auto lg:mx-0"
        />
        <h2 className="justify-start mt-4 text-neutral-50 text-base font-bold leading-tight">
          Kunal Kamra
        </h2>
      </div>
      <div className="self-stretch mt-2 justify-start text-neutral-50 text-sm font-normal">
        Disclaimer: All content on this site is fictional and satirical,
        <br />
        intended purely for entertainment purposes.
      </div>
    </div>
  );
}
