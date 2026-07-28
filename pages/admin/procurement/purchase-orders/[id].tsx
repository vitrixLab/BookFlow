// pages/admin/procurement/purchase-orders/[id].tsx

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import DashboardLayout from '@/components/DashboardLayout';
import ClientOnly from '@/components/ClientOnly';
import { procurementApi, PurchaseOrder, ReceiveItemPayload } from '@/lib/procurementApi';

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getIronSession(req, res, sessionOptions);
  if (!session.user) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  return { props: { user: session.user } };
};

const PODetailPage = ({ user }: { user: any }) => {
  const router = useRouter();
  const { id } = router.query;
  const [po, setPO] = useState<PurchaseOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [receiveQtys, setReceiveQtys] = useState<Record<string, number>>({});

  useEffect(() => {
    if (id) procurementApi.getPO(id as string)
      .then(setPO)
      .finally(() => setLoading(false));
  }, [id]);

  if ((user.role || '').toLowerCase() !== 'admin') {
    return (
      <DashboardLayout user={user}>
        <ClientOnly>
          <div className="p-8 text-center">
            <h2 className="text-xl font-semibold text-red-600">Access Denied</h2>
            <p className="text-gray-500 mt-2">You do not have permission to view this page.</p>
          </div>
        </ClientOnly>
      </DashboardLayout>
    );
  }

  if (loading) return <DashboardLayout user={user}><ClientOnly><p>Loading...</p></ClientOnly></DashboardLayout>;
  if (!po) return <DashboardLayout user={user}><ClientOnly><p>Not found</p></ClientOnly></DashboardLayout>;

  const handleReceive = async () => {
    if (!po) return;
    const payload: ReceiveItemPayload[] = Object.entries(receiveQtys)
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => ({ item_id: itemId, quantity_received: qty }));
    if (payload.length === 0) return alert('Enter at least one quantity');
    await procurementApi.receiveItems(po.id, payload);
    setPO(await procurementApi.getPO(po.id));
    setReceiveQtys({});
  };

  const pendingItems = po.items.filter((i) => i.quantity_received < i.quantity_ordered);

  return (
    <DashboardLayout user={user}>
      <ClientOnly>
        <div className="p-4 max-w-4xl">
          <h1 className="text-2xl font-bold mb-2">Purchase Order {po.id.slice(0,8)}</h1>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div><strong>Supplier:</strong> {po.supplier?.name || '-'}</div>
            <div>
              <strong>Status:</strong> <span className={`px-2 py-1 rounded text-xs font-medium ${
                po.status === 'received' ? 'bg-green-100 text-green-800' :
                po.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>{po.status}</span>
            </div>
            <div><strong>Order Date:</strong> {po.order_date ? new Date(po.order_date).toLocaleDateString() : '-'}</div>
            <div><strong>Expected:</strong> {po.expected_date ? new Date(po.expected_date).toLocaleDateString() : '-'}</div>
          </div>
          {po.notes && <p className="mb-4"><strong>Notes:</strong> {po.notes}</p>}

          <h2 className="text-xl font-semibold mb-2">Items</h2>
          <table className="w-full border mb-4">
            <thead>
              <tr className="bg-gray-100">
                <th className="p-2">Item</th>
                <th className="p-2">Ordered</th>
                <th className="p-2">Received</th>
                <th className="p-2">Remaining</th>
              </tr>
            </thead>
            <tbody>
              {po.items.map((item) => (
                <tr key={item.id} className="border-t">
                  <td className="p-2">{item.item?.name || item.title_override || '-'}</td>
                  <td className="p-2">{item.quantity_ordered}</td>
                  <td className="p-2">{item.quantity_received}</td>
                  <td className="p-2">{item.quantity_ordered - item.quantity_received}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {po.status !== 'received' && po.status !== 'cancelled' && (
            <div className="border p-4 rounded space-y-3">
              <h3 className="font-semibold">Receive Items</h3>
              {pendingItems.map((item) => {
                const remaining = item.quantity_ordered - item.quantity_received;
                return (
                  <div key={item.id} className="flex items-center space-x-2">
                    <span className="w-40">{item.item?.name || item.title_override}</span>
                    <input
                      type="number"
                      min={0}
                      max={remaining}
                      placeholder="0"
                      value={receiveQtys[item.id] || ''}
                      onChange={(e) => setReceiveQtys({ ...receiveQtys, [item.id]: Number(e.target.value) })}
                      className="border p-1 w-20"
                    />
                    <span className="text-sm text-gray-500">(max {remaining})</span>
                  </div>
                );
              })}
              <button onClick={handleReceive} className="bg-green-600 text-white px-4 py-2 rounded">
                Confirm Receipt
              </button>
            </div>
          )}
        </div>
      </ClientOnly>
    </DashboardLayout>
  );
};

export default PODetailPage;