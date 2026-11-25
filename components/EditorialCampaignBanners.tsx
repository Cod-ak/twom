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
    <section className="w-full px-4 py-0">
      <Link
        href={activeBanner.link}
        className={`group relative block h-175 w-full overflow-hidden ${
          isLogo ? "bg-zinc-950" : "bg-zinc-100"
        }`}
      >
        <Image
          src={activeBanner.image}
          alt={`${activeBanner.title} Campaign`}
          fill
          sizes="430px"
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
        <div className="absolute top-4 left-4 z-10 flex flex-col items-start gap-1">
          <h2 className="font-nippo italic font-black text-2xl text-white uppercase tracking-wider drop-shadow-sm leading-tight">
            {activeBanner.title}
          </h2>
          <span className="font-nippo italic font-bold text-[11px] text-white uppercase tracking-wider underline underline-offset-4 group-hover:opacity-80 transition-opacity">
            Shop Now
          </span>
        </div>
      </Link>
    </section>
  );
}
