// components/admin/procurement/SupplierForm.tsx

import { useRouter } from 'next/router';
import { useForm } from 'react-hook-form';
import { SupplierCreate, Supplier } from '@/lib/procurementApi';

interface Props {
  initialData?: Supplier;
  onSubmit: (data: SupplierCreate) => Promise<void>;
}

export default function SupplierForm({ initialData, onSubmit }: Props) {
  const router = useRouter();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SupplierCreate>({
    defaultValues: initialData ? {
      name: initialData.name,
      contact: initialData.contact || '',
      address: initialData.address || '',
      terms: initialData.terms || '',
    } : {},
  });

  const doSubmit = async (data: SupplierCreate) => {
    await onSubmit(data);
    router.push('/admin/procurement/suppliers');
  };

  return (
    <form onSubmit={handleSubmit(doSubmit)} className="space-y-4 max-w-md">
      <div>
        <label className="block">Name</label>
        <input {...register('name', { required: true })} className="border p-2 w-full" />
        {errors.name && <span className="text-red-500">Required</span>}
      </div>
      <div>
        <label className="block">Contact</label>
        <input {...register('contact')} className="border p-2 w-full" />
      </div>
      <div>
        <label className="block">Address</label>
        <textarea {...register('address')} className="border p-2 w-full" />
      </div>
      <div>
        <label className="block">Terms</label>
        <input {...register('terms')} className="border p-2 w-full" />
      </div>
      <button type="submit" disabled={isSubmitting} className="bg-blue-600 text-white px-4 py-2 rounded">
        {initialData ? 'Update' : 'Create'}
      </button>
    </form>
  );
}