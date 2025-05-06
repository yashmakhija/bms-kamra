import { privacy } from "../data/privacy";

export default function Privacy() {
  return (
    <div className=" bg-[#111111] mx-auto px-4 py-8">
      <div className="container mx-auto">
        <h1 className="text-4xl mt-14 text-center text-white font-bold">{privacy.title}</h1>
        <div className="mt-4 text-white leading-8 tracking-wide" dangerouslySetInnerHTML={{ __html: privacy.content }} />
      </div>
    </div>
  );
}
