'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import {
    getExpenses,
    createExpense,
    createExpensesBatch,
    parseReceipt,
    deleteExpense,
    Expense,
    ParsedExpenseItem,
    CreateExpensePayload,
} from '@/lib/api/expenses';

const CATEGORIES = [
    'Uñas',
    'Pestañas',
    'Cabello',
    'Maquillajes',
    'Servicios Públicos',
    'Mantenimiento',
    'Inversión',
    'Otros',
];

function getCurrentMonth() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

function getTodayDate() {
    return new Date().toISOString().split('T')[0];
}

interface ExpensesTabProps {
    monthlyExpensesFromAnalytics: number | null;
    formatCurrency: (v: number) => string;
}

export default function ExpensesTab({ monthlyExpensesFromAnalytics, formatCurrency }: ExpensesTabProps) {
    const [expenses, setExpenses] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(getCurrentMonth);

    // Manual form
    const [formDate, setFormDate] = useState(getTodayDate);
    const [formName, setFormName] = useState('');
    const [formQty, setFormQty] = useState(1);
    const [formUnitPrice, setFormUnitPrice] = useState('');
    const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
    const [formDesc, setFormDesc] = useState('');
    const [saving, setSaving] = useState(false);

    // Receipt upload
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [parsing, setParsing] = useState(false);
    const [parsedItems, setParsedItems] = useState<(ParsedExpenseItem & { date: string })[] | null>(null);
    const [savingBatch, setSavingBatch] = useState(false);

    const loadExpenses = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getExpenses(month);
            setExpenses(data);
        } catch {
            setExpenses([]);
        } finally {
            setLoading(false);
        }
    }, [month]);

    useEffect(() => {
        loadExpenses();
    }, [loadExpenses]);

    const totalForMonth = expenses.reduce((sum, e) => sum + Number(e.total_price), 0);

    const handleManualSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formName.trim() || !formUnitPrice) return;
        setSaving(true);
        try {
            const unitPrice = parseFloat(formUnitPrice);
            const payload: CreateExpensePayload = {
                date: formDate,
                product_name: formName.trim(),
                quantity: formQty,
                unit_price: unitPrice,
                total_price: unitPrice * formQty,
                category: formCategory,
                description: formDesc.trim() || undefined,
            };
            await createExpense(payload);
            setFormName('');
            setFormQty(1);
            setFormUnitPrice('');
            setFormDesc('');
            await loadExpenses();
        } finally {
            setSaving(false);
        }
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setParsing(true);
        setParsedItems(null);
        try {
            const items = await parseReceipt(file);
            setParsedItems(items.map(i => ({ ...i, date: getTodayDate() })));
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Error al analizar el ticket');
        } finally {
            setParsing(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const updateParsedItem = (index: number, field: string, value: string | number) => {
        setParsedItems(prev => {
            if (!prev) return prev;
            const copy = [...prev];
            copy[index] = { ...copy[index], [field]: value };
            if (field === 'quantity' || field === 'unit_price') {
                const qty = field === 'quantity' ? Number(value) : copy[index].quantity;
                const up = field === 'unit_price' ? Number(value) : copy[index].unit_price;
                copy[index].total_price = qty * up;
            }
            return copy;
        });
    };

    const removeParsedItem = (index: number) => {
        setParsedItems(prev => prev ? prev.filter((_, i) => i !== index) : prev);
    };

    const confirmParsedItems = async () => {
        if (!parsedItems || parsedItems.length === 0) return;
        setSavingBatch(true);
        try {
            const batch: CreateExpensePayload[] = parsedItems.map(i => ({
                date: i.date,
                product_name: i.product_name,
                quantity: i.quantity,
                unit_price: i.unit_price,
                total_price: i.total_price,
                category: i.category,
            }));
            await createExpensesBatch(batch);
            setParsedItems(null);
            await loadExpenses();
        } finally {
            setSavingBatch(false);
        }
    };

    const handleDelete = async (id: number) => {
        await deleteExpense(id);
        await loadExpenses();
    };

    return (
        <div className="space-y-6">
            {/* Summary cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-red-500 to-red-600 rounded-lg p-6 text-white">
                    <h3 className="text-sm font-medium opacity-80">Gastos Registrados ({month})</h3>
                    <p className="text-3xl font-bold mt-2">{formatCurrency(totalForMonth)}</p>
                </div>
                {monthlyExpensesFromAnalytics != null && (
                    <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-6 text-white">
                        <h3 className="text-sm font-medium opacity-80">Gastos Procesados (Dagster)</h3>
                        <p className="text-3xl font-bold mt-2">{formatCurrency(monthlyExpensesFromAnalytics)}</p>
                    </div>
                )}
            </div>

            {/* Manual entry form + receipt upload */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Registrar Gasto</h2>

                <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha</label>
                        <input
                            type="date"
                            value={formDate}
                            onChange={e => setFormDate(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Producto / Concepto</label>
                        <input
                            type="text"
                            value={formName}
                            onChange={e => setFormName(e.target.value)}
                            placeholder="Ej: Esmalte gel UV"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Categoría</label>
                        <select
                            value={formCategory}
                            onChange={e => setFormCategory(e.target.value)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                        >
                            {CATEGORIES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Cantidad</label>
                        <input
                            type="number"
                            min={1}
                            value={formQty}
                            onChange={e => setFormQty(parseInt(e.target.value) || 1)}
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Precio Unitario</label>
                        <input
                            type="number"
                            min={0}
                            step="0.01"
                            value={formUnitPrice}
                            onChange={e => setFormUnitPrice(e.target.value)}
                            placeholder="0.00"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Descripción (opcional)</label>
                        <input
                            type="text"
                            value={formDesc}
                            onChange={e => setFormDesc(e.target.value)}
                            placeholder="Notas adicionales"
                            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                        />
                    </div>
                    <div className="md:col-span-3 flex justify-end">
                        <button
                            type="submit"
                            disabled={saving}
                            className="bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-6 rounded-md transition-colors disabled:opacity-50"
                        >
                            {saving ? 'Guardando...' : 'Agregar Gasto'}
                        </button>
                    </div>
                </form>

                <div className="border-t pt-4">
                    <h3 className="text-md font-semibold text-gray-800 mb-3">O sube una foto del ticket</h3>
                    <div className="flex items-center gap-4">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/jpeg,image/png,image/webp,image/heic"
                            onChange={handleFileChange}
                            className="block text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-pink-50 file:text-pink-700 hover:file:bg-pink-100"
                        />
                        {parsing && (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                <div className="animate-spin h-4 w-4 border-2 border-pink-600 border-t-transparent rounded-full" />
                                Analizando ticket con IA...
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Gemini preview section */}
            {parsedItems && (
                <div className="bg-white rounded-lg shadow-md p-6 border-2 border-pink-200">
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Productos detectados en el ticket</h2>
                    <p className="text-sm text-gray-500 mb-4">Revisa y edita los datos antes de confirmar.</p>
                    {parsedItems.length === 0 ? (
                        <p className="text-gray-500">No se detectaron productos. Intenta con otra imagen.</p>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="px-3 py-2 text-left font-medium text-gray-600">Fecha</th>
                                            <th className="px-3 py-2 text-left font-medium text-gray-600">Producto</th>
                                            <th className="px-3 py-2 text-left font-medium text-gray-600">Cantidad</th>
                                            <th className="px-3 py-2 text-left font-medium text-gray-600">P. Unitario</th>
                                            <th className="px-3 py-2 text-left font-medium text-gray-600">Total</th>
                                            <th className="px-3 py-2 text-left font-medium text-gray-600">Categoría</th>
                                            <th className="px-3 py-2"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {parsedItems.map((item, idx) => (
                                            <tr key={idx}>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="date"
                                                        value={item.date}
                                                        onChange={e => updateParsedItem(idx, 'date', e.target.value)}
                                                        className="border border-gray-300 rounded px-2 py-1 text-sm w-36"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="text"
                                                        value={item.product_name}
                                                        onChange={e => updateParsedItem(idx, 'product_name', e.target.value)}
                                                        className="border border-gray-300 rounded px-2 py-1 text-sm w-full min-w-[140px]"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        min={1}
                                                        value={item.quantity}
                                                        onChange={e => updateParsedItem(idx, 'quantity', parseInt(e.target.value) || 1)}
                                                        className="border border-gray-300 rounded px-2 py-1 text-sm w-16"
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        min={0}
                                                        step="0.01"
                                                        value={item.unit_price}
                                                        onChange={e => updateParsedItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                                                        className="border border-gray-300 rounded px-2 py-1 text-sm w-24"
                                                    />
                                                </td>
                                                <td className="px-3 py-2 font-medium">
                                                    {formatCurrency(item.total_price)}
                                                </td>
                                                <td className="px-3 py-2">
                                                    <select
                                                        value={item.category}
                                                        onChange={e => updateParsedItem(idx, 'category', e.target.value)}
                                                        className="border border-gray-300 rounded px-2 py-1 text-sm"
                                                    >
                                                        {CATEGORIES.map(c => (
                                                            <option key={c} value={c}>{c}</option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <button
                                                        onClick={() => removeParsedItem(idx)}
                                                        className="text-red-500 hover:text-red-700 text-xs font-medium"
                                                    >
                                                        Quitar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="flex justify-end gap-3 mt-4">
                                <button
                                    onClick={() => setParsedItems(null)}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={confirmParsedItems}
                                    disabled={savingBatch}
                                    className="bg-pink-600 hover:bg-pink-700 text-white font-medium py-2 px-6 rounded-md transition-colors disabled:opacity-50 text-sm"
                                >
                                    {savingBatch ? 'Guardando...' : `Confirmar ${parsedItems.length} productos`}
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Expenses table */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">Gastos del mes</h2>
                    <input
                        type="month"
                        value={month}
                        onChange={e => setMonth(e.target.value)}
                        className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-pink-500"
                    />
                </div>

                {loading ? (
                    <div className="flex justify-center py-8">
                        <div className="animate-spin h-8 w-8 border-2 border-pink-600 border-t-transparent rounded-full" />
                    </div>
                ) : expenses.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No hay gastos registrados para {month}</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50">
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Fecha</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Producto</th>
                                    <th className="px-4 py-3 text-left font-medium text-gray-600">Categoría</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">Cant.</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">P. Unitario</th>
                                    <th className="px-4 py-3 text-right font-medium text-gray-600">Total</th>
                                    <th className="px-4 py-3"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {expenses.map(exp => (
                                    <tr key={exp.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-gray-700">{exp.date}</td>
                                        <td className="px-4 py-3 text-gray-900 font-medium">
                                            {exp.product_name}
                                            {exp.description && (
                                                <span className="block text-xs text-gray-400">{exp.description}</span>
                                            )}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-block bg-pink-50 text-pink-700 text-xs font-medium px-2 py-1 rounded-full">
                                                {exp.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-right">{exp.quantity}</td>
                                        <td className="px-4 py-3 text-right">{formatCurrency(Number(exp.unit_price))}</td>
                                        <td className="px-4 py-3 text-right font-medium">{formatCurrency(Number(exp.total_price))}</td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={() => handleDelete(exp.id)}
                                                className="text-red-500 hover:text-red-700 text-xs font-medium"
                                            >
                                                Eliminar
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot>
                                <tr className="bg-gray-50 font-semibold">
                                    <td colSpan={5} className="px-4 py-3 text-right text-gray-700">Total del mes:</td>
                                    <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(totalForMonth)}</td>
                                    <td></td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
