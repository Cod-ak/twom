import { connection } from "next/server";
import { createClient } from "@/lib/supabase-server";
import AdminHeaderNav from "@/components/AdminHeaderNav";
import AdminOverviewDashboard from "@/components/AdminOverviewDashboard";
import type { OrderStatus } from "@/lib/types";

export const instant = false;

interface RawOrderItem {
  quantity: number;
  products: { name: string } | null;
}

interface RawOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  order_items: RawOrderItem[];
}

interface RawProduct {
  id: string;
  name: string;
  sku: string | null;
  category: string;
  price: number;
  stock_quantity: number;
  image_url: string;
  is_active: boolean;
}

export default async function AdminDashboard() {
  await connection();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Parallel fetch: all orders + active products
  const [ordersRes, productsRes] = await Promise.all([
    supabase
      .from("orders")
      .select(`
        id,
        customer_name,
        customer_email,
        total_amount,
        status,
        created_at,
        order_items (
          quantity,
          products ( name )
        )
      `)
      .order("created_at", { ascending: false }),
    supabase
      .from("products")
      .select("id, name, sku, category, price, stock_quantity, image_url, is_active")
      .eq("is_active", true)
      .order("stock_quantity", { ascending: true }),
  ]);

  const orders = (ordersRes.data as unknown as RawOrder[]) || [];
  const products = (productsRes.data as unknown as RawProduct[]) || [];

  // 1. Calculate Revenue (From confirmed or fulfilled orders)
  const confirmedStatuses: OrderStatus[] = ["paid", "processing", "shipped", "delivered"];
  const totalRevenue = orders.reduce((sum, order) => {
    if (confirmedStatuses.includes(order.status)) {
      return sum + (order.total_amount || 0);
    }
    return sum;
  }, 0);

  // 2. Today's Performance
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const todayOrders = orders.filter((o) => {
    const orderTime = new Date(o.created_at).getTime();
    return orderTime >= todayStart && confirmedStatuses.includes(o.status);
  });
  const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total_amount || 0), 0);
  const todayOrdersCount = todayOrders.length;

  // 3. Operational queues
  const pendingFulfillmentCount = orders.filter((o) =>
    ["paid", "processing"].includes(o.status)
  ).length;

  // 4. Inventory health
  const lowStockProducts = products.filter((p) => p.stock_quantity < 5);
  const lowStockCount = lowStockProducts.length;

  const metrics = {
    totalRevenue,
    todayRevenue,
    todayOrdersCount,
    totalOrdersCount: orders.length,
    pendingFulfillmentCount,
    activeProductsCount: products.length,
    lowStockCount,
  };

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="min-h-screen bg-twom-bg pt-[4.25rem] md:pt-[4.75rem] pb-24 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <AdminHeaderNav currentTab="overview" userEmail={user?.email} />

        <AdminOverviewDashboard
          metrics={metrics}
          lowStockProducts={lowStockProducts}
          recentOrders={recentOrders}
        />
      </div>
    </div>
  );
}
