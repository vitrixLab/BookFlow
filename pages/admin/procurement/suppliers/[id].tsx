// pages/admin/procurement/suppliers/[id].tsx

import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { GetServerSideProps } from 'next';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import DashboardLayout from '@/components/DashboardLayout';
import ClientOnly from '@/components/ClientOnly';
import SupplierForm from '@/components/admin/procurement/SupplierForm';
import { procurementApi, Supplier } from '@/lib/procurementApi';

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getIronSession(req, res, sessionOptions);
  if (!session.user) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  return { props: { user: session.user } };
};

const EditSupplier = ({ user }: { user: any }) => {
  const router = useRouter();
  const { id } = router.query;
  const [supplier, setSupplier] = useState<Supplier | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) procurementApi.getSupplier(id as string)
      .then(setSupplier)
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
  if (!supplier) return <DashboardLayout user={user}><ClientOnly><p>Supplier not found</p></ClientOnly></DashboardLayout>;

  return (
    <DashboardLayout user={user}>
      <ClientOnly>
        <h1 className="text-2xl font-bold mb-4 p-4">Edit Supplier</h1>
        <div className="p-4">
          <SupplierForm
            initialData={supplier}
            onSubmit={(data) => procurementApi.updateSupplier(supplier.id, data)}
          />
        </div>
      </ClientOnly>
    </DashboardLayout>
  );
};

export default EditSupplier;