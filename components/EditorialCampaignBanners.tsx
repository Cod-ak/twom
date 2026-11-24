import Image from "next/image";
import Link from "next/link";

export interface CampaignBannerItem {
  title: string;
  image: string;
  link: string;
  priority?: boolean;
}

interface EditorialCampaignBannersProps {
  banner?: CampaignBannerItem;
  banner1?: CampaignBannerItem;
  banner2?: CampaignBannerItem;
}

const DEFAULT_BANNER: CampaignBannerItem = {
  title: "Tees & Tanks",
  image: "/campaign/tees-and-tanks.jpg",
  link: "/products?category=Tees%20%26%20Tanks",
  priority: true,
};

export default function EditorialCampaignBanners({
  banner,
  banner1,
}: EditorialCampaignBannersProps) {
  const activeBanner = banner || banner1 || DEFAULT_BANNER;
  const isLogo =
    activeBanner.image.includes("TWOM.png") ||
    activeBanner.image.includes("Twom.png");

  return (
    <section className="w-full max-w-7xl mx-auto px-4 md:px-6 py-0">
      <Link
        href={activeBanner.link}
        className={`group relative block h-175 md:h-175 w-full overflow-hidden ${
          isLogo ? "bg-zinc-950" : "bg-zinc-100"
        }`}
      >
        <Image
          src={activeBanner.image}
          alt={`${activeBanner.title} Campaign`}
          fill
          sizes="(max-width: 768px) 100vw, 100vw"
          priority={activeBanner.priority}
          className={`transition-transform duration-700 ease-out group-hover:scale-105 ${
            isLogo
              ? "object-contain p-16 invert opacity-90"
              : "object-cover object-center"
          }`}
        />

        {/* Subtle gradient vignette to ensure text contrast */}
        <div className="absolute inset-0 bg-linear-to-b from-black/55 via-black/15 to-transparent pointer-events-none" />

        {/* Editorial Typography Overlay */}
        <div className="absolute top-4 left-4 md:top-8 md:left-8 z-10 flex flex-col items-start gap-1">
          <h2 className="font-nippo italic font-black text-2xl md:text-3xl text-white uppercase tracking-wider drop-shadow-sm leading-tight">
            {activeBanner.title}
          </h2>
          <span className="font-nippo italic font-bold text-[11px] md:text-xs text-white uppercase tracking-wider underline underline-offset-4 group-hover:opacity-80 transition-opacity">
            Shop Now
          </span>
        </div>
      </Link>
    </section>
  );
}
