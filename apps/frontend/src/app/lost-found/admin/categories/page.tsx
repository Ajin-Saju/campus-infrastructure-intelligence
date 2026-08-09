'use client';

import React, { useEffect, useState } from 'react';
import ProtectedRoute from '../../../../components/ProtectedRoute';
import AppLayoutWrapper from '../../../../components/navigation/AppLayoutWrapper';
import {
  fetchLostFoundCategories,
  createLostFoundCategory,
  deleteLostFoundCategory,
  LostFoundCategory,
} from '../../../../lib/lost-found-client';
import { ShieldCheck, Plus, Trash2, Tag } from 'lucide-react';

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<LostFoundCategory[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [icon, setIcon] = useState('Tag');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const data = await fetchLostFoundCategories();
      setCategories(data);
    } catch (err) {
      console.error('Failed to load categories', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await createLostFoundCategory({
        name,
        code: code.toUpperCase().replace(/\s+/g, '_'),
        description,
        icon,
      });

      setName('');
      setCode('');
      setDescription('');
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to create category');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this category?')) return;
    try {
      await deleteLostFoundCategory(id);
      loadCategories();
    } catch (err: any) {
      alert(err.message || 'Failed to delete category');
    }
  };

  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <div className="space-y-8 max-w-5xl mx-auto pb-12">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 text-xs font-bold border border-indigo-500/20 mb-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Category Management
            </div>
            <h1 className="text-2xl font-black text-white">Lost & Found Categories</h1>
            <p className="text-xs text-slate-400">
              Manage predefined item categories for the Lost & Found module.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Create Category Form */}
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl space-y-4 shadow-xl h-fit">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-indigo-400" /> Add New Category
              </h3>

              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Category Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Sports Equipment"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (!code) setCode(e.target.value.toUpperCase().replace(/\s+/g, '_'));
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Category Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. SPORTS_EQUIPMENT"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-300 block">Description</label>
                  <input
                    type="text"
                    placeholder="Optional details..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2.5 text-xs text-white"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-lg shadow-indigo-600/25 disabled:opacity-40"
                >
                  {submitting ? 'Creating...' : 'Create Category'}
                </button>
              </form>
            </div>

            {/* Categories List */}
            <div className="md:col-span-2 space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
                <div className="p-4 bg-slate-950 border-b border-slate-800 font-bold text-xs text-slate-300">
                  Predefined Categories ({categories.length})
                </div>

                <div className="divide-y divide-slate-800">
                  {loading ? (
                    <div className="p-6 text-center text-xs text-slate-500">Loading categories...</div>
                  ) : categories.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500">No categories found.</div>
                  ) : (
                    categories.map((cat) => (
                      <div key={cat.id} className="p-4 flex items-center justify-between gap-4">
                        <div className="space-y-0.5">
                          <div className="flex items-center gap-2">
                            <Tag className="w-3.5 h-3.5 text-indigo-400" />
                            <h4 className="text-xs font-bold text-white">{cat.name}</h4>
                            <span className="text-[10px] text-slate-500 font-mono">({cat.code})</span>
                          </div>
                          {cat.description && <p className="text-[11px] text-slate-400">{cat.description}</p>}
                        </div>

                        <button
                          onClick={() => handleDelete(cat.id)}
                          className="p-1.5 bg-rose-950/40 hover:bg-rose-900 text-rose-400 rounded-lg"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
    </ProtectedRoute>
  );
}
