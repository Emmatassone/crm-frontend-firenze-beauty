'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProductSaleById, updateProductSale, deleteProductSale, type ProductSale, type UpdateProductSaleDto } from '@/lib/api';
import { useAuthStore } from '@/lib/store/auth';

export default function SaleDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);
  const { isViewOnly } = useAuthStore();

  const [sale, setSale] = useState<ProductSale | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState<{ discountApplied?: string[]; comment?: string }>({});

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    getProductSaleById(id)
      .then((data) => {
        if (isMounted) {
          setSale(data);
          // Ensure discountApplied is stored as array in editForm state
          const discounts = Array.isArray(data.discountApplied)
            ? data.discountApplied
            : (data.discountApplied ? [data.discountApplied] : []);

          setEditForm({
            discountApplied: discounts,
            comment: data.comment,
          });
        }
      })
      .catch((err) => { if (isMounted) setError(err?.message || 'No se pudo cargar la venta'); })
      .finally(() => { if (isMounted) setIsLoading(false); });
    return () => { isMounted = false; };
  }, [id]);

  const handleSave = async () => {
    if (!id || !sale) return;

    setIsSaving(true);
    setError(null);

    try {
      // The update DTO expects discountApplied? to be string[] if present
      const updateData: UpdateProductSaleDto = {
        discountApplied: editForm.discountApplied,
        comment: editForm.comment
      };

      const updatedSale = await updateProductSale(id, updateData);
      setSale(updatedSale);
      setIsEditing(false);
    } catch (err: any) {
      setError(err?.message || 'No se pudo actualizar la venta');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (sale) {
      const discounts = Array.isArray(sale.discountApplied)
        ? sale.discountApplied
        : (sale.discountApplied ? [sale.discountApplied] : []);

      setEditForm({
        discountApplied: discounts,
        comment: sale.comment,
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const handleCommentChange = (value: string) => {
    setEditForm(prev => ({ ...prev, comment: value === '' ? undefined : value }));
  };

  // Only supporting bulk update of discounts as text for now or we disable editing discounts if it's too complex for this view
  // Or we assume single item sale. Let's make it smarter:
  // Since the user asked to preserve prices, editing discounts post-facto is tricky if we don't know which item.
  // We will disable editing "discountApplied" in this view because it's an array and the UI is too simple (a single input).
  // I'll make the discount input read-only or remove it from editing if multiple items.
  // But for now to fix the type, I'll assume we only edit comment. OR I need to handle array input.

  // Actually, to comply with the type errors, let's fix the state type.
  // And for the UI, if we edit discounts, we probably shouldn't with a single input if it's an array. 
  // But let's assume valid array state.

  const handleDelete = async () => {
    if (!id) return;

    setIsDeleting(true);
    setError(null);

    try {
      await deleteProductSale(id);
      router.push('/sales');
    } catch (err: any) {
      setError(err?.message || 'No se pudo eliminar la venta');
      setIsDeleting(false);
    }
  };

  const confirmDelete = () => {
    setShowDeleteConfirm(true);
  };

  const cancelDelete = () => {
    setShowDeleteConfirm(false);
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-[40vh] text-gray-700 animate-pulse">Cargando venta…</div>;
  }

  if (error || !sale) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{error || 'Venta no encontrada'}</p>
        <button onClick={() => router.back()} className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800">Volver</button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Detalle de Venta</h1>
        <div className="flex gap-2">
          {!isEditing ? (
            <>
              {!isViewOnly && (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-4 py-2 rounded bg-pink-600 hover:bg-pink-700 text-white"
                  >
                    Editar
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white"
                  >
                    {isDeleting ? 'Eliminando...' : 'Borrar'}
                  </button>
                </>
              )}
              <button
                onClick={() => router.back()}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
              >
                Volver
              </button>
            </>
          ) : (
            <>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="px-4 py-2 rounded bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white"
              >
                {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={handleCancel}
                disabled={isSaving}
                className="px-4 py-2 rounded bg-gray-500 hover:bg-gray-600 disabled:bg-gray-400 text-white"
              >
                Cancelar
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      <div className="bg-white rounded-lg shadow p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="text-sm text-gray-500">Producto</div>
          <div className="text-lg text-gray-900">
            {Array.isArray(sale.productName)
              ? (sale.productName as string[]).join(', ')
              : sale.productName}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">SKU</div>
          <div className="text-lg text-gray-900">
            {Array.isArray(sale.sku)
              ? (sale.sku as string[]).join(', ')
              : (sale.sku || 'N/D')}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Fecha</div>
          <div className="text-lg text-gray-900">{new Date(sale.dateTime).toLocaleString()}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Cantidad</div>
          <div className="text-lg text-gray-900">
            {Array.isArray(sale.quantitySold)
              ? (sale.quantitySold as number[]).join(', ')
              : sale.quantitySold}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Precio Unit.</div>
          <div className="text-lg text-gray-900">
            {Array.isArray(sale.sellingPricePerUnit)
              ? (sale.sellingPricePerUnit as number[]).map(p => `$${Number(p).toFixed(2)}`).join(', ')
              : `$${Number(sale.sellingPricePerUnit).toFixed(2)}`}
          </div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Total de Venta</div>
          <div className="text-lg text-gray-900">
            {Array.isArray(sale.totalSaleAmount)
              ? (sale.totalSaleAmount as number[]).map(t => `$${Number(t).toFixed(2)}`).join(', ')
              : `$${Number(sale.totalSaleAmount).toFixed(2)}`}
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Descuento Aplicado</label>
          <div className="text-lg text-gray-900">
            {Array.isArray(sale.discountApplied)
              ? (sale.discountApplied as string[]).map(d => `${d}%`).join(', ')
              : (sale.discountApplied || 'N/D')}
          </div>
          {isEditing && (
            <p className="text-xs text-gray-500 italic mt-1">
              La edición de descuentos solo está disponible al crear la venta para preservar la integridad de los datos.
            </p>
          )}
        </div>

        <div>
          <div className="text-sm text-gray-500">Total Final</div>
          <div className="text-lg text-gray-900 font-semibold">${Number(sale.finalAmount).toFixed(2)}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Vendedor</div>
          <div className="text-lg text-gray-900">{sale.sellerEmployee?.name || 'N/D'}</div>
        </div>

        <div className="md:col-span-2">
          <label className="text-sm text-gray-500 block">Comentarios</label>
          {isEditing ? (
            <textarea
              value={editForm.comment || ''}
              onChange={(e) => handleCommentChange(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
              rows={3}
              placeholder="N/D"
            />
          ) : (
            <div className="text-lg text-gray-900">{sale.comment || 'N/D'}</div>
          )}
        </div>

        <div>
          <div className="text-sm text-gray-500">Creado</div>
          <div className="text-lg text-gray-900">{new Date(sale.createdAt).toLocaleString()}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Actualizado</div>
          <div className="text-lg text-gray-900">{new Date(sale.updatedAt).toLocaleString()}</div>
        </div>
      </div>

      {isEditing && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-yellow-800 text-sm">
            <strong>Nota:</strong> Por razones de integridad financiera, solo se pueden editar los campos de descuento y comentarios en las ventas.
          </p>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar la venta de "{sale.productName}" por ${Number(sale.finalAmount).toFixed(2)}?
              Esta acción no se puede deshacer y puede afectar el inventario.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={cancelDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800 disabled:bg-gray-100"
              >
                Cancelar
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="px-4 py-2 rounded bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white"
              >
                {isDeleting ? 'Eliminando...' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


