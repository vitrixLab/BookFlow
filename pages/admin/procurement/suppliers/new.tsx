// pages/admin/procurement/suppliers/new.tsx

import { GetServerSideProps } from 'next';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import DashboardLayout from '@/components/DashboardLayout';
import ClientOnly from '@/components/ClientOnly';
import SupplierForm from '@/components/admin/procurement/SupplierForm';
import { procurementApi } from '@/lib/procurementApi';

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getIronSession(req, res, sessionOptions);
  if (!session.user) {
    return { redirect: { destination: '/login', permanent: false } };
  }
  return { props: { user: session.user } };
};

const NewSupplier = ({ user }: { user: any }) => {
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

  return (
    <DashboardLayout user={user}>
      <ClientOnly>
        <h1 className="text-2xl font-bold mb-4 p-4">New Supplier</h1>
        <div className="p-4">
          <SupplierForm onSubmit={(data) => procurementApi.createSupplier(data)} />
        </div>
      </ClientOnly>
    </DashboardLayout>
  );
};

export default NewSupplier;