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
import { Coffee, Plus, Trash2, Edit3, Search, PackageCheck } from "lucide-react";

export default function POSPage() {
  const [products, setProducts] = useState([]);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Kopi");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Ambil Data Realtime dari Firestore
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

  // Simpan / Edit Produk
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

  // Muat Data ke Form untuk Edit
  const handleEdit = (product) => {
    setEditingId(product.id);
    setName(product.name);
    setCategory(product.category || "Kopi");
    setPrice(product.price);
    setStock(product.stock);
  };

  // Batal Edit
  const handleCancelEdit = () => {
    setEditingId(null);
    setName("");
    setPrice("");
    setStock("");
    setCategory("Kopi");
  };

  // Hapus Produk
  const handleDelete = async (id) => {
    if (confirm("Yakin ingin menghapus produk ini?")) {
      await deleteDoc(doc(db, "products", id));
    }
  };

  // Filter Berdasarkan Pencarian
  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8">
      {/* Header */}
      <header className="flex items-center justify-between border-b border-slate-800 pb-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-xl">
            <Coffee className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold">POS Cafe Hub</h1>
            <p className="text-sm text-slate-400">Manajemen Stok & Harga Produk</p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Form Tambah/Edit Produk */}
        <div className="bg-slate-800 border border-slate-700/60 p-6 rounded-2xl h-fit">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            {editingId ? <Edit3 className="w-5 h-5 text-indigo-400" /> : <Plus className="w-5 h-5 text-indigo-400" />}
            {editingId ? "Edit Produk" : "Tambah Produk Baru"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Nama Produk</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Espresso Single"
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-400 mb-1">Kategori</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
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
                  placeholder="20000"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-400 mb-1">Stok</label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="50"
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="submit"
                disabled={loading}
                className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg text-sm transition duration-150 disabled:opacity-50"
              >
                {loading ? "Menyimpan..." : editingId ? "Perbarui" : "Simpan"}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="bg-slate-700 hover:bg-slate-600 text-slate-300 font-medium px-4 py-2 rounded-lg text-sm transition duration-150"
                >
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Daftar Produk */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Cari produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          <div className="bg-slate-800 border border-slate-700/60 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-900/50 text-slate-400 text-xs uppercase border-b border-slate-700">
                  <tr>
                    <th className="p-4">Produk</th>
                    <th className="p-4">Kategori</th>
                    <th className="p-4">Harga</th>
                    <th className="p-4">Stok</th>
                    <th className="p-4 text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="p-8 text-center text-slate-500">
                        Belum ada data produk.
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-700/30 transition">
                        <td className="p-4 font-medium text-slate-200">{p.name}</td>
                        <td className="p-4">
                          <span className="px-2.5 py-1 bg-slate-700 text-indigo-300 rounded-full text-xs font-medium">
                            {p.category || "Umum"}
                          </span>
                        </td>
                        <td className="p-4 text-emerald-400 font-semibold">
                          Rp {p.price?.toLocaleString("id-ID")}
                        </td>
                        <td className="p-4">
                          <span className={`flex items-center gap-1 font-semibold ${p.stock < 10 ? 'text-amber-400' : 'text-slate-300'}`}>
                            <PackageCheck className="w-4 h-4" /> {p.stock}
                          </span>
                        </td>
                        <td className="p-4 text-right space-x-2">
                          <button
                            onClick={() => handleEdit(p)}
                            className="p-1.5 text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(p.id)}
                            className="p-1.5 text-rose-400 hover:bg-rose-500/10 rounded-lg transition"
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