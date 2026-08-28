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
} from "lucide-react";

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
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setProducts(docs);
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
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setName(product.name);
    setCategory(product.category || "Kopi");
    setPrice(product.price);
    setStock(product.stock);
  };

  const handleCancelEdit = () => {
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

  // Filter Produk
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory =
      selectedCategory === "Semua" || p.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Statistik Ringkasan
  const lowStockCount = products.filter((p) => p.stock <= 5).length;
  const totalCategories = new Set(products.map((p) => p.category)).size;

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8">
      {/* Header */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-gradient-to-tr from-amber-600 to-orange-500 rounded-2xl shadow-lg shadow-orange-500/20">
            <Coffee className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">
              ePOS Cafe Manager
            </h1>
            <p className="text-sm text-slate-400">Kelola inventaris dan stok menu cafe Anda</p>
          </div>
        </div>
      </header>

      {/* Ringkasan Dashboard / Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-800/60 border border-slate-700/50 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Total Produk</p>
            <h3 className="text-2xl font-bold text-white mt-1">{products.length}</h3>
          </div>
          <div className="p-3 bg-indigo-500/10 text-indigo-400 rounded-xl">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Kategori Menu</p>
            <h3 className="text-2xl font-bold text-white mt-1">{totalCategories}</h3>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl">
            <Layers className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-slate-800/60 border border-slate-700/50 p-5 rounded-2xl flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Stok Menipis (≤5)</p>
            <h3 className={`text-2xl font-bold mt-1 ${lowStockCount > 0 ? 'text-amber-400' : 'text-white'}`}>
              {lowStockCount}
            </h3>
          </div>
          <div className={`p-3 rounded-xl ${lowStockCount > 0 ? 'bg-amber-500/10 text-amber-400' : 'bg-slate-700/50 text-slate-400'}`}>
            <AlertTriangle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Form Tambah/Edit */}
        <div className="bg-slate-800/80 border border-slate-700/60 p-6 rounded-2xl shadow-xl backdrop-blur-sm sticky top-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2 text-white">
            {editingId ? <Edit3 className="w-5 h-5 text-amber-400" /> : <Plus className="w-5 h-5 text-amber-400" />}
            {editingId ? "Edit Produk" : "Tambah Produk Baru"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nama Produk</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Avocado Coffee Shake"
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition text-slate-200"
              >
                <option value="Kopi">Kopi</option>
                <option value="Non-Kopi">Non-Kopi</option>
                <option value="Makanan">Makanan</option>
                <option value="Snack">Snack</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Harga (Rp)</label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="25000"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Stok Awal</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="20"
                  className="w-full bg-slate-900/90 border border-slate-700 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-medium py-2.5 rounded-xl text-sm transition duration-150 disabled:opacity-50 shadow-lg shadow-amber-600/20"
              >
                {loading ? "Menyimpan..." : editingId ? "Perbarui Produk" : "Tambah Produk"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium px-4 py-2.5 rounded-xl text-sm transition"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tabel List Produk */}
        <div className="lg:col-span-2 space-y-4">
          {/* Baris Filter & Pencarian */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Cari nama produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800/80 border border-slate-700/60 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="bg-slate-800/80 border border-slate-700/60 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition text-slate-300"
            >
              <option value="Semua">Semua Kategori</option>
              <option value="Kopi">Kopi</option>
              <option value="Non-Kopi">Non-Kopi</option>
              <option value="Makanan">Makanan</option>
              <option value="Snack">Snack</option>
            </select>
          </div>

          {/* Tabel Container */}
          <div className="bg-slate-800/80 border border-slate-700/60 rounded-2xl overflow-hidden shadow-xl backdrop-blur-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase border-b border-slate-700/60">
                  <tr>
                    <th className="p-4">Produk</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4">Harga</th>
                    <th className="p-4">Stok</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/40">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500">
                        Tidak ada produk ditemukan.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-700/20 transition">
                        <td className="p-4 font-medium text-slate-100">{p.name}</td>
                        <td className="p-4">
                          <span className="px-3 py-1 bg-slate-700/60 border border-slate-600/40 text-amber-300 rounded-full text-xs font-medium">
                            {p.category || "Umum"}
                          </span>
                        </td>
                        <td className="p-4 text-emerald-400 font-semibold">
                          Rp {p.price?.toLocaleString("id-ID")}
                        </td>
                        <td className="p-4">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold ${
                              p.stock <= 5
                                ? "bg-amber-500/10 text-amber-400 border border-amber-500/30"
                                : "bg-slate-700/30 text-slate-300"
                            }`}
                          >
                            <PackageCheck className="w-3.5 h-3.5" /> {p.stock}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-1">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-2 text-slate-400 hover:text-amber-400 hover:bg-amber-400/10 rounded-lg transition"
                            title="Edit"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-400/10 rounded-lg transition"
                            title="Hapus"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
