'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getProductById, updateProduct, deleteProduct, type Product, type UpdateProductDto } from '@/lib/api';

export default function ProductDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = Array.isArray(params?.id) ? params.id[0] : (params?.id as string);

  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [editForm, setEditForm] = useState<UpdateProductDto>({});

  useEffect(() => {
    if (!id) return;
    let isMounted = true;
    setIsLoading(true);
    setError(null);
    getProductById(id)
      .then((data) => {
        if (!isMounted) return;
        setProduct(data);
        setEditForm({
          productName: data.productName,
          currentStock: data.currentStock,
          model: data.model,
          purchasePrice: data.purchasePrice,
          sellingPrice: data.sellingPrice,
          lastRestockDate: data.lastRestockDate,
        });
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.message || 'No se pudo cargar el producto');
      })
      .finally(() => {
        if (!isMounted) return;
        setIsLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleSave = async () => {
    if (!id || !product) return;
    
    setIsSaving(true);
    setError(null);
    
    try {
      const updatedProduct = await updateProduct(id, editForm);
      setProduct(updatedProduct);
      setIsEditing(false);
    } catch (err: any) {
      setError(err?.message || 'No se pudo actualizar el producto');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    if (product) {
      setEditForm({
        productName: product.productName,
        currentStock: product.currentStock,
        model: product.model,
        purchasePrice: product.purchasePrice,
        sellingPrice: product.sellingPrice,
        lastRestockDate: product.lastRestockDate,
      });
    }
    setIsEditing(false);
    setError(null);
  };

  const handleInputChange = (field: keyof UpdateProductDto, value: string | number) => {
    setEditForm(prev => ({
      ...prev,
      [field]: value === '' ? undefined : value
    }));
  };

  const handleDelete = async () => {
    if (!id) return;
    
    setIsDeleting(true);
    setError(null);
    
    try {
      await deleteProduct(id);
      router.push('/products');
    } catch (err: any) {
      setError(err?.message || 'No se pudo eliminar el producto');
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
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="text-gray-700 animate-pulse">Cargando producto…</div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-4">
        <p className="text-red-600">{error || 'Producto no encontrado'}</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300 text-gray-800"
        >
          Volver
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-gray-800">Detalle de Producto</h1>
        <div className="flex gap-2">
          {!isEditing ? (
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
          <label className="text-sm text-gray-500 block">Nombre</label>
          {isEditing ? (
            <input
              type="text"
              value={editForm.productName || ''}
              onChange={(e) => handleInputChange('productName', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
            />
          ) : (
            <div className="text-lg font-medium text-gray-900">{product.productName}</div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Modelo</label>
          {isEditing ? (
            <input
              type="text"
              value={editForm.model || ''}
              onChange={(e) => handleInputChange('model', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
              placeholder="N/D"
            />
          ) : (
            <div className="text-lg text-gray-900">{product.model || 'N/D'}</div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Existencias</label>
          {isEditing ? (
            <input
              type="number"
              min="0"
              value={editForm.currentStock ?? ''}
              onChange={(e) => handleInputChange('currentStock', parseInt(e.target.value) || 0)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
            />
          ) : (
            <div className="text-lg text-gray-900">{product.currentStock ?? 0}</div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Precio de Compra</label>
          {isEditing ? (
            <input
              type="number"
              min="0"
              step="0.01"
              value={editForm.purchasePrice ?? ''}
              onChange={(e) => handleInputChange('purchasePrice', parseFloat(e.target.value) || undefined)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
              placeholder="0.00"
            />
          ) : (
            <div className="text-lg text-gray-900">{product.purchasePrice != null ? `$${Number(product.purchasePrice).toFixed(2)}` : 'N/D'}</div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Precio de Venta</label>
          {isEditing ? (
            <input
              type="number"
              min="0"
              step="0.01"
              value={editForm.sellingPrice ?? ''}
              onChange={(e) => handleInputChange('sellingPrice', parseFloat(e.target.value) || undefined)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
              placeholder="0.00"
            />
          ) : (
            <div className="text-lg text-gray-900">{product.sellingPrice != null ? `$${Number(product.sellingPrice).toFixed(2)}` : 'N/D'}</div>
          )}
        </div>

        <div>
          <label className="text-sm text-gray-500 block">Último Reabastecimiento</label>
          {isEditing ? (
            <input
              type="date"
              value={editForm.lastRestockDate || ''}
              onChange={(e) => handleInputChange('lastRestockDate', e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-pink-500 focus:ring-pink-500"
              disabled={isSaving}
            />
          ) : (
            <div className="text-lg text-gray-900">{product.lastRestockDate ? new Date(product.lastRestockDate).toLocaleDateString() : 'N/D'}</div>
          )}
        </div>

        <div>
          <div className="text-sm text-gray-500">Creado</div>
          <div className="text-lg text-gray-900">{new Date(product.createdAt).toLocaleString()}</div>
        </div>

        <div>
          <div className="text-sm text-gray-500">Actualizado</div>
          <div className="text-lg text-gray-900">{new Date(product.updatedAt).toLocaleString()}</div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Confirmar Eliminación
            </h3>
            <p className="text-gray-600 mb-6">
              ¿Estás seguro de que deseas eliminar el producto "{product.productName}"? 
              Esta acción no se puede deshacer.
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


