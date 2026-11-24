import Hero from "../components/Hero";
import ProductCard from "../components/ProductCard";
import EditorialCampaignBanners from "../components/EditorialCampaignBanners";
import CategoryShowcase from "../components/CategoryShowcase";
import { supabase } from "../lib/supabase";
import { Product } from "../lib/types";
import { SAMPLE_TEES } from "../lib/showcase-catalog";

export const instant = false;

interface RawBannerItemRow {
  banner_product_id: string;
  item_product_id: string;
  tab_type: "apparel" | "accessories";
  sort_order: number;
}

export default async function Home() {
  // 1. Fetch all active products safely
  let products: Product[] = [];
  try {
    if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false });
      if (data) products = data as Product[];
    }
  } catch {
    // Falls back gracefully when database is unconfigured
  }

  const productById = new Map<string, Product>(
    products.map((p) => [p.id, p]),
  );

  // 2. Top Featured Row (Single Pieces only: pinned ★ Featured items, or 4 newest Single Pieces)
  const singlePieces = products.filter((p) => !p.is_campaign_banner);
  const pinnedFeatured = singlePieces.filter((p) => p.is_featured);
  const featuredProducts =
    pinnedFeatured.length > 0
      ? pinnedFeatured
      : singlePieces.length > 0
      ? singlePieces.slice(0, 4)
      : (SAMPLE_TEES.slice(0, 4) as Product[]);

  // 3. Active Campaign Banners sorted by display order
  const campaignBanners = products
    .filter((p) => Boolean(p.is_campaign_banner))
    .sort((a, b) => (a.banner_order ?? 0) - (b.banner_order ?? 0));

  // 4. Fetch Apparel & Accessories breakdown links for active Campaign Banners
  const bannerBreakdownMap = new Map<
    string,
    { apparel: Product[]; accessories: Product[] }
  >();

  if (campaignBanners.length > 0 && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    try {
      const bannerIds = campaignBanners.map((b) => b.id);
      const { data: itemsData, error: itemsErr } = await supabase
        .from("campaign_banner_items")
        .select("banner_product_id, item_product_id, tab_type, sort_order")
        .in("banner_product_id", bannerIds)
        .order("sort_order", { ascending: true });

      if (!itemsErr && itemsData) {
        for (const row of itemsData as RawBannerItemRow[]) {
          const itemProduct = productById.get(row.item_product_id);
          if (!itemProduct) continue;

          const entry = bannerBreakdownMap.get(row.banner_product_id) ?? {
            apparel: [],
            accessories: [],
          };
          if (row.tab_type === "apparel") {
            entry.apparel.push(itemProduct);
          } else if (row.tab_type === "accessories") {
            entry.accessories.push(itemProduct);
          }
          bannerBreakdownMap.set(row.banner_product_id, entry);
        }
      }
    } catch {
      // Graceful fallback if campaign_banner_items table isn't created yet
    }
  }

  return (
    <div className="w-full bg-twom-bg text-twom-body">
      <Hero />

      {/* Infinite Marquee Ticker */}
      <div className="w-full overflow-hidden border-y border-twom-border/50 bg-twom-bg flex items-center h-12">
        <div className="flex w-max animate-marquee">
          <div className="flex items-center gap-10 px-5 text-xs md:text-sm font-medium tracking-wider text-twom-title shrink-0">
            <span>Good things stay good ✳</span>
            <span>Good things stay good ✳</span>
            <span>Good things stay good ✳</span>
            <span>Good things stay good ✳</span>
            <span>Good things stay good ✳</span>
            <span>Good things stay good ✳</span>
          </div>
          <div
            className="flex items-center gap-10 px-5 text-xs md:text-sm font-medium tracking-wider text-twom-title shrink-0"
            aria-hidden="true"
          >
            <span>Good things stay good ✳</span>
            <span>Good things stay good ✳</span>
            <span>Good things stay good ✳</span>
            <span>Good things stay good ✳</span>
            <span>Good things stay good ✳</span>
            <span>Good things stay good ✳</span>
          </div>
        </div>
      </div>

      {/* Featured Pieces Selection (Single Pieces Only) */}
      <section
        id="collection"
        className="max-w-7xl mx-auto px-4 md:px-6 pt-6 pb-4"
      >
        {/* Mobile Horizontal Carousel & Desktop Grid */}
        <div className="flex items-stretch md:grid md:grid-cols-2 gap-4 md:gap-6 overflow-x-auto md:overflow-visible snap-x snap-mandatory scroll-px-4 no-scrollbar -mx-4 px-4 md:scroll-px-0 md:mx-0 md:px-0 pb-2">
          {featuredProducts.map((product: Product) => (
            <div
              key={product.id}
              className="w-[72vw] min-w-[72vw] sm:w-[48vw] sm:min-w-[48vw] shrink-0 snap-start md:w-auto md:min-w-0 md:shrink flex flex-col h-full"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </section>

      {/* Dynamic Campaign Banners + [ APPAREL | ACCESSORIES ] Breakdown */}
      {campaignBanners.length > 0 ? (
        campaignBanners.map((banner, index) => {
          const breakdown = bannerBreakdownMap.get(banner.id) ?? {
            apparel: [],
            accessories: [],
          };

          return (
            <div key={banner.id}>
              <EditorialCampaignBanners
                banner={{
                  title: banner.banner_title?.trim() || banner.name,
                  image: banner.image_url,
                  link: `/products/${banner.slug}`,
                  priority: index === 0,
                }}
              />

              <CategoryShowcase
                dbProducts={singlePieces}
                apparelProducts={breakdown.apparel}
                accessoriesProducts={breakdown.accessories}
                isCuratedBanner
                tabs={["APPAREL", "ACCESSORIES"]}
              />
            </div>
          );
        })
      ) : (
        /* Fallback Defaults when no Campaign Banners are published in DB yet */
        <>
          <EditorialCampaignBanners
            banner={{
              title: "Tees & Tanks",
              image: "/campaign/tees-and-tanks.jpg",
              link: "/products?category=Tees%20%26%20Tanks",
              priority: true,
            }}
          />

          <CategoryShowcase
            dbProducts={singlePieces}
            tabs={["APPAREL", "ACCESSORIES"]}
          />

          <EditorialCampaignBanners
            banner={{
              title: "Hoodies",
              image: "/TWOM.png",
              link: "/products?category=Hoodies",
              priority: false,
            }}
          />

          <CategoryShowcase
            dbProducts={singlePieces}
            tabs={["APPAREL", "ACCESSORIES"]}
          />

          <EditorialCampaignBanners
            banner={{
              title: "Anime",
              image: "/TWOM.png",
              link: "/products?category=Anime",
              priority: false,
            }}
          />

          <CategoryShowcase
            dbProducts={singlePieces}
            tabs={["APPAREL", "ACCESSORIES"]}
          />
        </>
      )}
    </div>
  );
}
