import { redirect } from 'next/navigation';
import { createClient } from '@/src/lib/supabase/server';

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect('/login');

  // Fetch summary stats
  const [ordersResult, productsResult, sellersResult, profilesResult] = await Promise.all([
    supabase.from('orders').select('id, total, status', { count: 'exact' }),
    supabase.from('products').select('id', { count: 'exact' }),
    supabase.from('seller_profiles').select('id', { count: 'exact' }),
    supabase.from('profiles').select('id', { count: 'exact' }),
  ]);

  const totalOrders = ordersResult.count ?? 0;
  const totalProducts = productsResult.count ?? 0;
  const totalSellers = sellersResult.count ?? 0;
  const totalBuyers = profilesResult.count ?? 0;
  const totalRevenue = (ordersResult.data ?? [])
    .filter((o) => o.status === 'delivered')
    .reduce((sum, o) => sum + (o.total ?? 0), 0);

  const recentOrders = (ordersResult.data ?? []).slice(0, 5);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-indigo-600 px-6 py-4 shadow">
        <div className="mx-auto flex max-w-7xl items-center justify-between">
          <h1 className="text-xl font-bold text-white">Cartly Admin</h1>
          <form action="/api/auth/signout" method="post">
            <button
              type="submit"
              className="rounded-lg bg-indigo-500 px-3 py-1.5 text-sm text-white hover:bg-indigo-400"
            >
              Sign Out
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Dashboard</h2>

        {/* Stats grid */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {[
            { label: 'Total Orders', value: totalOrders, color: 'bg-blue-500' },
            { label: 'Revenue (NPR)', value: `₨ ${totalRevenue.toLocaleString()}`, color: 'bg-green-500' },
            { label: 'Products', value: totalProducts, color: 'bg-purple-500' },
            { label: 'Buyers', value: totalBuyers, color: 'bg-orange-500' },
            { label: 'Sellers', value: totalSellers, color: 'bg-pink-500' },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl bg-white p-5 shadow-sm">
              <div className={`mb-2 inline-block rounded-lg ${stat.color} px-2 py-1`}>
                <span className="text-xs font-semibold text-white">{stat.label}</span>
              </div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Recent orders */}
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold text-gray-900">Recent Orders</h3>
          {recentOrders.length === 0 ? (
            <p className="text-sm text-gray-500">No orders yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="pb-2 font-medium">Order ID</th>
                  <th className="pb-2 font-medium">Total</th>
                  <th className="pb-2 font-medium">Status</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id} className="border-b last:border-0">
                    <td className="py-2 font-mono text-xs text-gray-600">{order.id.slice(0, 8)}…</td>
                    <td className="py-2">₨ {order.total?.toLocaleString()}</td>
                    <td className="py-2">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium capitalize text-gray-700">
                        {order.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}
