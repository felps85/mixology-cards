import Image from "next/image";
import Link from "next/link";
import { isLowResDrink } from "@/lib/drink-images";
import type { GalleryDrink } from "@/lib/drinks-data";

export function DrinkCard({
  drink,
  href,
  selected,
  chips
}: {
  drink: GalleryDrink;
  href: string;
  selected: boolean;
  chips: string[];
}) {
  const accent = drink.frontBg || "#FFE86C";
  const lowRes = isLowResDrink(drink);

  return (
    <Link
      href={href}
      prefetch={false}
      className={[
        "group relative block aspect-[0.78] w-full overflow-hidden rounded-[24px] border border-white/8 bg-[#120d10] shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition duration-500",
        "hover:-translate-y-2 hover:scale-[1.01] hover:border-[#d8a14d]/35 hover:shadow-[0_32px_60px_rgba(0,0,0,0.5)]",
        selected ? "ring-1 ring-[#dca450]/70 ring-offset-2 ring-offset-[#090507]" : ""
      ].join(" ")}
    >
      <div className="relative h-full w-full">
        {lowRes ? (
          <div
            className="absolute inset-0 scale-[1.08] bg-cover bg-center blur-2xl opacity-45"
            aria-hidden="true"
            style={{ backgroundImage: `url(${drink.imageCardPath})` }}
          />
        ) : null}
        <Image
          src={drink.imageCardPath}
          alt={drink.name}
          fill
          className={[
            "transition duration-700",
            lowRes
              ? "object-contain p-4 group-hover:scale-[1.04]"
              : "object-cover group-hover:scale-[1.08]"
          ].join(" ")}
          sizes="(max-width: 640px) 92vw, (max-width: 900px) 44vw, (max-width: 1280px) 30vw, (max-width: 1680px) 220px, 220px"
          quality={76}
          priority={false}
        />
        <div
          className="absolute inset-x-0 bottom-0 h-[52%] opacity-85 transition duration-500 group-hover:opacity-100"
          aria-hidden="true"
          style={{
            background: `radial-gradient(circle at bottom left, ${accent}40, transparent 34%), linear-gradient(180deg, rgba(7,5,7,0) 0%, rgba(7,5,7,0.08) 18%, rgba(7,5,7,0.42) 52%, rgba(7,5,7,0.94) 100%)`
          }}
        />

        <div className="absolute inset-x-[14px] bottom-[14px] flex flex-col gap-[8px]">
          <div className="flex flex-wrap gap-[6px]">
            {chips.map((chip) => (
              <span
                key={chip}
                className="rounded-full border px-[8px] py-[3px] text-[10px] font-medium uppercase tracking-[0.08em] backdrop-blur-sm"
                style={{
                  borderColor: `${accent}70`,
                  backgroundColor: `${accent}26`,
                  color: "#fff2d6"
                }}
              >
                {chip}
              </span>
            ))}
          </div>
          <div
            className="text-[20px] font-semibold leading-[24px] tracking-[-0.03em] text-[#fff4df]"
          >
            {drink.name}
          </div>
          <p className="overflow-hidden text-[12px] leading-[18px] text-[#f4ead5]/72 [display:-webkit-box] [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {drink.curiosity}
          </p>
        </div>
      </div>
    </Link>
  );
}
