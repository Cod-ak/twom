import { connection } from "next/server";
import { createClient } from "@/lib/supabase-server";
import AdminHeaderNav from "@/components/AdminHeaderNav";
import AdminCustomersTable from "@/components/AdminCustomersTable";
import type { CustomerSummary, OrderStatus } from "@/lib/types";

export const instant = false;

interface RawProfile {
  id: string;
  email: string | null;
  role: string;
  created_at: string;
}

interface RawOrderItem {
  quantity: number;
}

interface RawOrder {
  id: string;
  customer_name: string;
  customer_email: string;
  shipping_address: string;
  total_amount: number;
  status: OrderStatus;
  created_at: string;
  order_items: RawOrderItem[];
}

export default async function AdminCustomersPage() {
  await connection();
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Parallel fetch: profiles (registered members) + all orders
  const [profilesRes, ordersRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, email, role, created_at")
      .order("created_at", { ascending: false }),
    supabase
      .from("orders")
      .select(`
        id,
        customer_name,
        customer_email,
        shipping_address,
        total_amount,
        status,
        created_at,
        order_items ( quantity )
      `)
      .order("created_at", { ascending: false }),
  ]);

  const profiles = (profilesRes.data as RawProfile[]) || [];
  const orders = (ordersRes.data as unknown as RawOrder[]) || [];

  // Aggregation map keyed by lowercased email
  const customerMap = new Map<string, CustomerSummary>();

  // 1. Ingest registered members from profiles
  for (const p of profiles) {
    if (!p.email) continue;
    const key = p.email.toLowerCase().trim();
    customerMap.set(key, {
      id: p.id,
      email: p.email,
      name: p.email.split("@")[0],
      is_registered: true,
      role: p.role,
      orders_count: 0,
      lifetime_spend: 0,
      first_seen: p.created_at,
      last_order_date: null,
      latest_shipping_address: null,
      orders: [],
    });
  }

  // 2. Ingest and aggregate all order purchases
  const validRevenueStatuses: OrderStatus[] = ["paid", "processing", "shipped", "delivered"];

  for (const o of orders) {
    if (!o.customer_email) continue;
    const key = o.customer_email.toLowerCase().trim();
    let client = customerMap.get(key);

    if (!client) {
      // Guest buyer
      client = {
        id: o.id,
        email: o.customer_email,
        name: o.customer_name || o.customer_email.split("@")[0],
        is_registered: false,
        orders_count: 0,
        lifetime_spend: 0,
        first_seen: o.created_at,
        last_order_date: null,
        latest_shipping_address: o.shipping_address || null,
        orders: [],
      };
      customerMap.set(key, client);
    } else {
      // If client was created from profile with fallback username, prefer their real name from shipping
      if (o.customer_name && client.name === client.email.split("@")[0]) {
        client.name = o.customer_name;
      }
      if (!client.latest_shipping_address && o.shipping_address) {
        client.latest_shipping_address = o.shipping_address;
      }
    }

    client.orders_count += 1;

    if (validRevenueStatuses.includes(o.status)) {
      client.lifetime_spend += o.total_amount || 0;
    }

    if (!client.last_order_date || new Date(o.created_at) > new Date(client.last_order_date)) {
      client.last_order_date = o.created_at;
    }

    const itemsCount = o.order_items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
    client.orders.push({
      id: o.id,
      total_amount: o.total_amount,
      status: o.status,
      created_at: o.created_at,
      items_count: itemsCount,
    });
  }

  // Convert to array and sort by lifetime spend descending
  const customers = Array.from(customerMap.values()).sort(
    (a, b) => b.lifetime_spend - a.lifetime_spend
  );

  return (
    <div className="min-h-screen bg-twom-bg pt-[4.25rem] md:pt-[4.75rem] pb-24 px-6 md:px-12">
      <div className="max-w-6xl mx-auto">
        <AdminHeaderNav currentTab="customers" userEmail={user?.email} />

        {/* Section Header */}
        <div className="mb-6">
          <h2 className="font-zodiak text-2xl text-twom-title">
            Client Directory
          </h2>
          <p className="text-xs text-twom-muted mt-0.5">
            Review customer profiles, purchasing history, and client lifetime value (LTV).
          </p>
        </div>

        <AdminCustomersTable initialCustomers={customers} />
      </div>
    </div>
  );
}
