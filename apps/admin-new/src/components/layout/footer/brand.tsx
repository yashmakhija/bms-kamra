export function Brand() {
  return (
    <div className="flex flex-col">
      <div className=" items-start gap-4">
        <img
          src="/logo.png"
          alt="The Kunal Kamra App"
          width={52}
          height={52}
          className="rounded-lg"
        />
        <h2 className="text-white mt-6 text-xl font-medium leading-tight">
          The Kunal Kamra App
        </h2>
      </div>
    </div>
  );
}
