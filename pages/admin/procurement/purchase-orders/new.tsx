// pages/admin/procurement/purchase-orders/new.tsx

import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useForm, useFieldArray } from 'react-hook-form';
import { GetServerSideProps } from 'next';
import { getIronSession } from 'iron-session';
import { sessionOptions } from '@/lib/session';
import { procurementApi, Supplier, Item, PurchaseOrderCreate } from '@/lib/procurementApi';
import DashboardLayout from '@/components/DashboardLayout';
import Head from 'next/head';
import Footer from '@/components/Footer';
import Link from 'next/link';

/* ── Toast (same as other pages) ──────────────── */
function Toast({ message, type = 'success', onClose }: {
  message: string
  type?: 'success' | 'error'
  onClose: () => void
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000)
    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <div className={`toast toast--${type}`} role="alert" aria-live="polite">
      <i className={`fas fa-${type === 'success' ? 'check-circle' : 'exclamation-circle'}`} />
      <span>{message}</span>
      <button onClick={onClose} aria-label="Dismiss">
        <i className="fas fa-times" />
      </button>
      <style jsx>{`
        .toast {
          position: fixed; bottom: 24px; right: 24px; z-index: 600; display: flex; align-items: center; gap: 0.5rem;
          padding: 0.75rem 1rem; border-radius: 10px; background: #fff; color: #111; font-size: 0.85rem; font-weight: 500;
          box-shadow: 0 12px 30px rgba(0,0,0,0.1); border: 1px solid #ebebeb; animation: toastIn 0.25s ease;
        }
        .toast--success { border-left: 4px solid #22c55e; }
        .toast--error { border-left: 4px solid #ef4444; }
        .toast button { background: none; border: none; color: #888; cursor: pointer; padding: 0; margin-left: 0.5rem; font-size: 0.9rem; }
        .toast button:hover { color: #111; }
        @keyframes toastIn { from { opacity: 0; transform: translateX(20px); } to { opacity: 1; transform: translateX(0); } }
      `}</style>
    </div>
  )
}

/* ── Default labels ───────────────────────────── */
const DEFAULT_LABELS = {
  title: 'New Purchase Order | Admin',
  heading: 'New Purchase Order',
  back_link: 'Back to Purchase Orders',
  messages: {
    created: 'Purchase order created successfully.',
    create_failed: 'Failed to create purchase order.',
    fetch_error: 'Could not load suppliers / items.',
  },
  form: {
    supplier_label: 'Supplier',
    supplier_placeholder: '-- Select Supplier --',
    notes_label: 'Notes',
    notes_placeholder: 'Optional notes...',
    expected_date_label: 'Expected Delivery Date',
    items_heading: 'Items',
    item_id_label: 'Existing Item',
    item_id_placeholder: '-- New item --',
    title_override_label: 'Title (if new)',
    title_override_placeholder: 'Item name',
    sku_label: 'SKU',
    sku_placeholder: 'Optional',
    quantity_label: 'Qty',
    add_item_button: 'Add Item',
    remove_item_button: 'Remove',
    submit_button: 'Create Purchase Order',
    cancel_button: 'Cancel',
    errors: {
      supplier_required: 'Please select a supplier.',
      item_qty_required: 'Qty is required.',
      min_one_item: 'At least one item is required.',
    },
  },
};

interface FormData {
  supplier_id: string;
  notes?: string;
  expected_date?: string;
  items: {
    item_id: string;
    title_override: string;
    sku_override: string;
    quantity_ordered: number;
  }[];
}

export const getServerSideProps: GetServerSideProps = async ({ req, res }) => {
  const session = await getIronSession(req, res, sessionOptions);
  if (!session.user || session.user.role?.toLowerCase() !== 'admin') {
    return { redirect: { destination: '/login', permanent: false } };
  }
  return {
    props: { user: session.user, isSuperAdmin: session.user.isSuperAdmin ?? false },
  };
};

export default function NewPurchaseOrder({ user }: any) {
  const L = DEFAULT_LABELS;
  const router = useRouter();

  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [inventoryItems, setInventoryItems] = useState<Item[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    defaultValues: {
      supplier_id: '',
      items: [{ item_id: '', title_override: '', sku_override: '', quantity_ordered: 1 }],
    },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    Promise.all([procurementApi.listSuppliers(), procurementApi.listItems()])
      .then(([s, i]) => {
        setSuppliers(s);
        setInventoryItems(i);
      })
      .catch(() => setToast({ message: L.messages.fetch_error, type: 'error' }))
      .finally(() => setLoadingData(false));
  }, []);

  const onSubmit = async (data: FormData) => {
    const payload: PurchaseOrderCreate = {
      supplier_id: data.supplier_id,
      items: data.items.map((item) => ({
        item_id: item.item_id || undefined,
        title_override: item.title_override || undefined,
        sku_override: item.sku_override || undefined,
        quantity_ordered: Number(item.quantity_ordered),
      })),
      notes: data.notes || undefined,
      expected_date: data.expected_date || undefined,
    };

    try {
      await procurementApi.createPO(payload);
      setToast({ message: L.messages.created, type: 'success' });
      setTimeout(() => router.push('/admin/procurement/purchase-orders'), 800);
    } catch (err: any) {
      setToast({ message: err.message || L.messages.create_failed, type: 'error' });
    }
  };

  return (
    <>
      <Head>
        <title>{L.title}</title>
      </Head>
      <DashboardLayout user={user}>
        <div className="page">
          <div className="page-header">
            <div>
              <Link href="/admin/procurement/purchase-orders" className="back-link">
                <i className="fas fa-arrow-left" /> {L.back_link}
              </Link>
              <h1 className="page-title">{L.heading}</h1>
            </div>
          </div>

          {loadingData ? (
            <p>Loading form data...</p>
          ) : (
            <div className="card">
              <div className="card-head">
                <i className="fas fa-file-invoice" />
                <h2>Purchase Order Details</h2>
              </div>
              <form onSubmit={handleSubmit(onSubmit)} className="compact-form">
                <div className="form-row">
                  <div className="form-group">
                    <label>{L.form.supplier_label}</label>
                    <select
                      {...register('supplier_id', { required: true })}
                      className={errors.supplier_id ? 'error' : ''}
                    >
                      <option value="">{L.form.supplier_placeholder}</option>
                      {suppliers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    {errors.supplier_id && (
                      <span className="field-hint">{L.form.errors.supplier_required}</span>
                    )}
                  </div>
                  <div className="form-group">
                    <label>{L.form.expected_date_label}</label>
                    <input type="date" {...register('expected_date')} />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group" style={{ flex: 1 }}>
                    <label>{L.form.notes_label}</label>
                    <input
                      type="text"
                      {...register('notes')}
                      placeholder={L.form.notes_placeholder}
                    />
                  </div>
                </div>

                {/* Items section */}
                <div style={{ marginTop: '1.5rem' }}>
                  <div className="card-head" style={{ padding: '0 0 0.75rem' }}>
                    <i className="fas fa-cubes" />
                    <h2>{L.form.items_heading}</h2>
                  </div>

                  <div className="items-grid">
                    {fields.map((field, index) => (
                      <div key={field.id} className="item-row">
                        <div className="form-group" style={{ flex: 1.5 }}>
                          <label>{L.form.item_id_label}</label>
                          <select {...register(`items.${index}.item_id`)}>
                            <option value="">{L.form.item_id_placeholder}</option>
                            {inventoryItems.map((it) => (
                              <option key={it.id} value={it.id}>
                                {it.name} (stock: {it.quantity})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="form-group" style={{ flex: 1.5 }}>
                          <label>{L.form.title_override_label}</label>
                          <input
                            type="text"
                            {...register(`items.${index}.title_override`)}
                            placeholder={L.form.title_override_placeholder}
                          />
                        </div>
                        <div className="form-group" style={{ flex: 0.8 }}>
                          <label>{L.form.sku_label}</label>
                          <input
                            type="text"
                            {...register(`items.${index}.sku_override`)}
                            placeholder={L.form.sku_placeholder}
                          />
                        </div>
                        <div className="form-group" style={{ flex: 0.5 }}>
                          <label>{L.form.quantity_label}</label>
                          <input
                            type="number"
                            {...register(`items.${index}.quantity_ordered`, {
                              required: true,
                              min: 1,
                              valueAsNumber: true,
                            })}
                            className={
                              errors.items?.[index]?.quantity_ordered ? 'error' : ''
                            }
                          />
                          {errors.items?.[index]?.quantity_ordered && (
                            <span className="field-hint">
                              {L.form.errors.item_qty_required}
                            </span>
                          )}
                        </div>
                        {/* Remove button aligned perfectly with inputs */}
                        <div className="form-group" style={{ flex: 'none', width: 'auto', marginBottom: '1rem' }}>
                          <label style={{ visibility: 'hidden' }}>&nbsp;</label>
                          <button
                            type="button"
                            onClick={() => remove(index)}
                            className="btn-icon btn-icon--danger"
                            title={L.form.remove_item_button}
                            disabled={fields.length === 1}
                            style={{ padding: '0.55rem', marginTop: 0 }}
                          >
                            <i className="fas fa-trash" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      append({
                        item_id: '',
                        title_override: '',
                        sku_override: '',
                        quantity_ordered: 1,
                      })
                    }
                    className="btn btn-secondary"
                    style={{ marginTop: '0.5rem' }}
                  >
                    <i className="fas fa-plus" /> {L.form.add_item_button}
                  </button>
                </div>

                {/* Action buttons – Cancel left, Create right */}
                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
                  <Link
                    href="/admin/procurement/purchase-orders"
                    className="btn btn-secondary"
                  >
                    {L.form.cancel_button}
                  </Link>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={isSubmitting}
                  >
                    {L.form.submit_button}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>

        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}

        <Footer />

        <style jsx>{`
          .page { max-width: 900px; margin: 0 auto; width: 100%; }
          .page-header { margin-bottom: 1.75rem; }
          .back-link {
            display: inline-flex;
            align-items: center;
            gap: 0.4rem;
            font-size: 0.82rem;
            color: #0a6ed1;
            text-decoration: none;
            margin-bottom: 0.5rem;
          }
          .back-link:hover { text-decoration: underline; }
          .page-title { font-size: 1.75rem; font-weight: 800; color: #111; letter-spacing: -0.03em; margin: 0; }

          .card { border-radius: 16px; border: 1px solid #ebebeb; overflow: hidden; margin-bottom: 1.25rem; }
          .card-head { display: flex; align-items: center; gap: 0.5rem; padding: 1.1rem 1.4rem 0.75rem; }
          .card-head i { font-size: 1.1rem; color: var(--sap-primary, #0a6ed1); }
          .card-head h2 { font-size: 0.92rem; font-weight: 700; color: #111; margin: 0; }
          .compact-form { padding: 0 1.4rem 1.25rem; }

          .form-row { display: flex; gap: 1rem; }
          .form-group { flex: 1; margin-bottom: 1rem; }
          .form-group label {
            font-size: 0.75rem; font-weight: 600; color: #666;
            margin-bottom: 0.3rem; display: block;
          }
          .form-group input,
          .form-group select,
          .form-group textarea {
            width: 100%; padding: 0.55rem 0.75rem;
            border: 1px solid #d1d5db; border-radius: 8px;
            font-size: 0.85rem; color: #111;
            transition: border-color 0.15s, box-shadow 0.15s;
            background: #fff;
          }
          .form-group input:focus,
          .form-group select:focus,
          .form-group textarea:focus {
            border-color: var(--sap-primary, #0a6ed1);
            box-shadow: 0 0 0 3px rgba(10,110,209,0.15);
            outline: none;
          }
          .form-group input.error,
          .form-group select.error { border-color: #ef4444; }
          .field-hint {
            display: block; margin-top: 0.2rem; font-size: 0.72rem; color: #ef4444;
          }

          .btn {
            padding: 0.5rem 1rem; border-radius: 8px; font-size: 0.85rem;
            font-weight: 600; cursor: pointer; border: none;
            text-decoration: none; display: inline-flex; align-items: center;
            gap: 0.3rem; transition: background 0.2s, opacity 0.2s;
          }
          .btn:disabled { opacity: 0.6; cursor: not-allowed; }
          .btn-primary { background: var(--sap-primary, #0a6ed1); color: #fff; }
          .btn-primary:hover:not(:disabled) { background: #0854a0; }
          .btn-secondary { background: #f5f5f5; color: #555; border: 1px solid #e8e8e8; }
          .btn-secondary:hover:not(:disabled) { background: #ebebeb; }

          .btn-icon {
            background: none; border: none; color: #888; cursor: pointer;
            font-size: 1rem; padding: 0.3rem; border-radius: 6px;
            transition: background 0.15s, color 0.15s;
          }
          .btn-icon:hover { background: #f5f5f5; color: #111; }
          .btn-icon--danger:hover { color: #ef4444; background: #fee2e2; }
          .btn-icon:disabled { opacity: 0.3; cursor: not-allowed; }

          .items-grid { display: flex; flex-direction: column; gap: 1rem; }
          .item-row { display: flex; gap: 0.75rem; align-items: flex-end; flex-wrap: wrap; }
          @media (max-width: 768px) {
            .item-row { flex-direction: column; }
            .form-row { flex-direction: column; gap: 0; }
            .page { padding: 0 1rem; }
          }
        `}</style>
      </DashboardLayout>
    </>
  );
}