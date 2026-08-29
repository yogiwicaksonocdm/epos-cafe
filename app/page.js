"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  Coffee,
  Plus,
  Trash2,
  Edit3,
  Search,
  PackageCheck,
  AlertTriangle,
  Layers,
  ShoppingBag,
  X,
  Save,
  Loader2,
} from "lucide-react";

const CATEGORIES = ["Kopi", "Non-Kopi", "Makanan", "Snack"];
const CATEGORY_ICONS = { Kopi: "☕", "Non-Kopi": "🧋", Makanan: "🍽️", Snack: "🍪" };

const CATEGORY_BADGE = {
  Kopi: "bg-amber-50 border-amber-200 text-amber-800",
  "Non-Kopi": "bg-teal-50 border-teal-200 text-teal-800",
  Makanan: "bg-orange-50 border-orange-200 text-orange-800",
  Snack: "bg-rose-50 border-rose-200 text-rose-800",
};

export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Kopi");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("Semua");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubscribe = onSnapshot(q, (snap) => {
      setProducts(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
    });
    return () => unsubscribe();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !price || stock === "") return;
    setLoading(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "products", editingId), {
          name,
          category,
          price: Number(price),
          stock: Number(stock),
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, "products"), {
          name,
          category,
          price: Number(price),
          stock: Number(stock),
          createdAt: serverTimestamp(),
        });
      }
      setName("");
      setPrice("");
      setStock("");
      setCategory("Kopi");
    } catch (err) {
      console.error("Gagal menyimpan:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (p) => {
    setEditingId(p.id);
    setName(p.name);
    setCategory(p.category || "Kopi");
    setPrice(p.price);
    setStock(p.stock);
  };

  const handleCancel = () => {
    setEditingId(null);
    setName("");
    setPrice("");
    setStock("");
    setCategory("Kopi");
  };

  const handleDelete = async (id) => {
    if (confirm("Yakin ingin menghapus produk ini?")) {
      await deleteDoc(doc(db, "products", id));
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === "Semua" || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const lowStockCount = products.filter((p) => (p.stock || 0) <= 5).length;
  const totalCategories = new Set(products.map((p) => p.category)).size;
  const totalStock = products.reduce((a, p) => a + (p.stock || 0), 0);

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Header */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-200/80 flex flex-col items-center text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none" />
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-amber-700 to-amber-500 text-white flex items-center justify-center shadow-lg shadow-amber-900/10 mb-3">
            <Coffee className="w-7 h-7" />
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            ePOS Cafe Manager
          </h1>
          <p className="text-sm text-slate-500 mt-1 max-w-md">
            Kelola inventaris, kategori, dan stok menu cafe Anda secara *real-time*.
          </p>
        </div>

        {/* Dynamic Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors">
            <div className="p-3.5 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Produk</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{products.length}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors">
            <div className="p-3.5 rounded-xl bg-teal-50 text-teal-700 border border-teal-100">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Kategori</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{totalCategories}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors">
            <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-700 border border-indigo-100">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Total Stok</p>
              <h3 className="text-2xl font-bold text-slate-900 mt-0.5">{totalStock}</h3>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-sm flex items-center gap-4 hover:border-slate-300 transition-colors">
            <div className={`p-3.5 rounded-xl border ${lowStockCount > 0 ? "bg-rose-50 text-rose-600 border-rose-100" : "bg-emerald-50 text-emerald-600 border-emerald-100"}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">Stok Menipis</p>
              <h3 className={`text-2xl font-bold mt-0.5 ${lowStockCount > 0 ? "text-rose-600" : "text-slate-900"}`}>
                {lowStockCount}
              </h3>
            </div>
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Form Panel */}
          <div className="lg:col-span-4 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm lg:sticky lg:top-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                {editingId ? (
                  <>
                    <Edit3 className="w-5 h-5 text-amber-600" /> Edit Produk
                  </>
                ) : (
                  <>
                    <Plus className="w-5 h-5 text-emerald-600" /> Tambah Produk
                  </>
                )}
              </h2>
              {editingId && (
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                  Mode Edit
                </span>
              )}
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Nama Produk
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Avocado Coffee"
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                  Kategori
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all cursor-pointer"
                >
                  {CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {CATEGORY_ICONS[c]} {c}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Harga (Rp)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="25000"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 uppercase tracking-wider mb-1.5">
                    Stok
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="20"
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className={`flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white shadow-sm transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                    editingId
                      ? "bg-amber-600 hover:bg-amber-700 focus:ring-amber-500"
                      : "bg-slate-900 hover:bg-slate-800 focus:ring-slate-900"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : editingId ? (
                    <>
                      <Save className="w-4 h-4" /> Perbarui
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" /> Tambah
                    </>
                  )}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleCancel}
                    className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-slate-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* Product List Panel */}
          <div className="lg:col-span-8 space-y-4">
            
            {/* Filter and Search Controls */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari nama produk..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all placeholder:text-slate-400"
                />
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  onClick={() => setSelectedCategory("Semua")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedCategory === "Semua"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  📋 Semua
                </button>
                {CATEGORIES.map((c) => (
                  <button
                    key={c}
                    onClick={() => setSelectedCategory(c)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                      selectedCategory === c
                        ? "bg-slate-900 text-white shadow-sm"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {CATEGORY_ICONS[c]} {c}
                  </button>
                ))}
              </div>
            </div>

            {/* Mobile View (Cards) */}
            <div className="md:hidden space-y-3">
              {filtered.length === 0 ? (
                <div className="bg-white rounded-2xl p-8 text-center border border-slate-200/80">
                  <p className="text-3xl mb-2">📭</p>
                  <p className="text-sm font-semibold text-slate-700">Tidak ada produk ditemukan</p>
                  <p className="text-xs text-slate-400 mt-1">Coba sesuaikan pencarian atau kata kunci filter Anda.</p>
                </div>
              ) : (
                filtered.map((p) => (
                  <div key={p.id} className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="font-semibold text-slate-900 text-base">
                          {CATEGORY_ICONS[p.category] || "📦"} {p.name}
                        </span>
                        <div className="mt-1">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium border ${CATEGORY_BADGE[p.category] || "bg-slate-100 text-slate-700"}`}>
                            {p.category || "Umum"}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-slate-900 bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                        Rp {p.price?.toLocaleString("id-ID")}
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                      <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md border ${
                        p.stock <= 5 
                          ? "bg-rose-50 text-rose-700 border-rose-200" 
                          : "bg-emerald-50 text-emerald-700 border-emerald-200"
                      }`}>
                        <PackageCheck className="w-3.5 h-3.5" />
                        Stok: {p.stock}
                      </span>

                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleEdit(p)}
                          className="p-1.5 text-slate-500 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(p.id)}
                          className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/70 border-b border-slate-200/80 text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      <th className="py-3.5 px-4">Produk</th>
                      <th className="py-3.5 px-4">Kategori</th>
                      <th className="py-3.5 px-4">Harga</th>
                      <th className="py-3.5 px-4">Stok</th>
                      <th className="py-3.5 px-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filtered.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="text-center py-12">
                          <div className="flex flex-col items-center justify-center gap-1">
                            <span className="text-3xl mb-1">📭</span>
                            <p className="text-slate-700 font-medium">Tidak ada produk ditemukan</p>
                            <p className="text-xs text-slate-400">Coba kata kunci lain atau ubah filter kategori.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      filtered.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            {CATEGORY_ICONS[p.category] || "📦"} {p.name}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${CATEGORY_BADGE[p.category] || "bg-slate-100 border-slate-200 text-slate-700"}`}>
                              {p.category || "Umum"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            Rp {p.price?.toLocaleString("id-ID")}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                              p.stock <= 5 
                                ? "bg-rose-50 text-rose-700 border-rose-200" 
                                : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                              <PackageCheck className="w-3.5 h-3.5" />
                              {p.stock}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleEdit(p)}
                                className="p-1.5 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(p.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Hapus"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Footer */}
            <p className="text-center text-xs text-slate-400 pt-2">
              ePOS Cafe Manager — Designed for Efficiency
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
