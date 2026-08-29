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
  Sparkles,
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
    window.scrollTo({ top: 0, behavior: "smooth" });
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
  const totalStock = products.reduce((acc, p) => acc + (p.stock || 0), 0);

  const categoryColors = {
    Kopi: { bg: "bg-amber-50", border: "border-amber-700", text: "text-amber-800", badge: "bg-amber-100 border-amber-600 text-amber-800" },
    "Non-Kopi": { bg: "bg-teal-50", border: "border-teal-700", text: "text-teal-800", badge: "bg-teal-100 border-teal-600 text-teal-800" },
    Makanan: { bg: "bg-orange-50", border: "border-orange-700", text: "text-orange-800", badge: "bg-orange-100 border-orange-600 text-orange-800" },
    Snack: { bg: "bg-rose-50", border: "border-rose-700", text: "text-rose-800", badge: "bg-rose-100 border-rose-600 text-rose-800" },
  };

  const categoryIcons = {
    Kopi: "☕",
    "Non-Kopi": "🧋",
    Makanan: "🍽️",
    Snack: "🍪",
  };

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <header>
        <div className="vintage-card p-6 md:p-8 text-center">
          <div className="flex flex-col items-center gap-3">
            <div className="float-icon p-4 bg-gradient-to-br from-[#C04000] to-[#8B2500] rounded-full shadow-lg" style={{border: '3px solid #3B2316'}}>
              <Coffee className="w-8 h-8 text-[#FFF8E7]" />
            </div>
            <div>
              <h1
                className="text-3xl md:text-4xl font-bold text-[#3B2316]"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                ✦ ePOS Cafe Manager ✦
              </h1>
              <p
                className="text-sm text-[#8B7355] mt-1 italic"
                style={{ fontFamily: "'Lora', serif" }}
              >
                Kelola inventaris dan stok menu cafe Anda dengan gaya
              </p>
            </div>
          </div>
        </div>
      </header>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat-card-vintage p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFF8E7] border-2 border-[#5C3D2E] rounded-xl text-[#C04000]">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p
                className="text-xs font-semibold text-[#8B7355] uppercase tracking-wide"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                Total Produk
              </p>
              <h3
                className="text-2xl font-bold text-[#3B2316]"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                {products.length}
              </h3>
            </div>
          </div>
        </div>

        <div className="stat-card-vintage p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFF8E7] border-2 border-[#5C3D2E] rounded-xl text-[#6B7B3A]">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <p
                className="text-xs font-semibold text-[#8B7355] uppercase tracking-wide"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                Kategori
              </p>
              <h3
                className="text-2xl font-bold text-[#3B2316]"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                {totalCategories}
              </h3>
            </div>
          </div>
        </div>

        <div className="stat-card-vintage p-5">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-[#FFF8E7] border-2 border-[#5C3D2E] rounded-xl text-[#3A7D7E]">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <p
                className="text-xs font-semibold text-[#8B7355] uppercase tracking-wide"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                Total Stok
              </p>
              <h3
                className="text-2xl font-bold text-[#3B2316]"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                {totalStock}
              </h3>
            </div>
          </div>
        </div>

        <div className="stat-card-vintage p-5">
          <div className="flex items-center gap-3">
            <div
              className={`p-3 border-2 rounded-xl ${
                lowStockCount > 0
                  ? "bg-[#FFF3E0] border-[#C04000] text-[#C04000]"
                  : "bg-[#FFF8E7] border-[#5C3D2E] text-[#6B7B3A]"
              }`}
            >
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <p
                className="text-xs font-semibold text-[#8B7355] uppercase tracking-wide"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                Stok Menipis
              </p>
              <h3
                className={`text-2xl font-bold ${
                  lowStockCount > 0 ? "text-[#C04000]" : "text-[#3B2316]"
                }`}
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                {lowStockCount}
              </h3>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Form Tambah/Edit */}
        <div className="vintage-card p-5 md:p-6 sticky top-6">
          <h2
            className="text-lg font-bold mb-5 flex items-center gap-2 text-[#3B2316]"
            style={{ fontFamily: "'Fredoka', sans-serif" }}
          >
            {editingId ? (
              <>
                <Edit3 className="w-5 h-5 text-[#C04000]" />
                <span>Edit Produk</span>
              </>
            ) : (
              <>
                <Plus className="w-5 h-5 text-[#6B7B3A]" />
                <span>Tambah Produk Baru</span>
              </>
            )}
          </h2>

          {editingId && (
            <div className="mb-4 p-3 bg-[#FFF3E0] border-2 border-dashed border-[#D4A843] rounded-xl text-center">
              <p
                className="text-xs text-[#8B6914] font-medium"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                ✏️ Sedang mengedit produk
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                className="block text-xs font-semibold text-[#8B7355] mb-1.5 uppercase tracking-wide"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                Nama Produk
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Avocado Coffee Shake"
                className="vintage-input w-full"
                required
              />
            </div>

            <div>
              <label
                className="block text-xs font-semibold text-[#8B7355] mb-1.5 uppercase tracking-wide"
                style={{ fontFamily: "'Fredoka', sans-serif" }}
              >
                Kategori
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="vintage-input w-full"
              >
                <option value="Kopi">☕ Kopi</option>
                <option value="Non-Kopi">🧋 Non-Kopi</option>
                <option value="Makanan">🍽️ Makanan</option>
                <option value="Snack">🍪 Snack</option>
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-xs font-semibold text-[#8B7355] mb-1.5 uppercase tracking-wide"
                  style={{ fontFamily: "'Fredoka', sans-serif" }}
                >
                  Harga (Rp)
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="25000"
                  className="vintage-input w-full"
                  required
                />
              </div>
              <div>
                <label
                  className="block text-xs font-semibold text-[#8B7355] mb-1.5 uppercase tracking-wide"
                  style={{ fontFamily: "'Fredoka', sans-serif" }}
                >
                  Stok Awal
                </label>
                <input
                  type="number"
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  placeholder="20"
                  className="vintage-input w-full"
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3">
              <button
                type="submit"
                disabled={loading}
                className="vintage-btn flex-1 flex items-center justify-center gap-2 text-white"
                style={{
                  background: editingId
                    ? "linear-gradient(135deg, #D4A843, #B8860B)"
                    : "linear-gradient(135deg, #6B7B3A, #4A5A28)",
                  color: "white",
                }}
              >
                {loading ? (
                  "Menyimpan..."
                ) : editingId ? (
                  <>
                    <Save className="w-4 h-4" />
                    Perbarui
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    Tambah Produk
                  </>
                )}
              </button>
              {editingId && (
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  className="vintage-btn flex items-center gap-1"
                  style={{
                    background: "#8B7355",
                    color: "white",
                  }}
                >
                  <X className="w-4 h-4" />
                  Batal
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Tabel List Produk */}
        <div className="lg:col-span-2 space-y-4">
          {/* Filter & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B7355]" />
              <input
                type="text"
                placeholder="Cari nama produk..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="vintage-input w-full pl-10 h-[42px]"
              />
            </div>
          </div>

          {/* Category Filter Pills */}
          <div className="flex flex-wrap gap-2">
            {["Semua", "Kopi", "Non-Kopi", "Makanan", "Snack"].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`category-pill ${
                  selectedCategory === cat ? "active" : ""
                }`}
              >
                {cat === "Semua" ? "📋" : categoryIcons[cat]} {cat}
              </button>
            ))}
          </div>

          {/* Table Container */}
          <div className="vintage-card overflow-hidden mt-2">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm vintage-table">
                <thead>
                  <tr>
                    <th>Produk</th>
                    <th>Kategori</th>
                    <th>Harga</th>
                    <th>Stok</th>
                    <th className="text-right">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-4 py-12 text-center"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-4xl">📭</span>
                          <p
                            className="text-[#8B7355] italic"
                            style={{ fontFamily: "'Lora', serif" }}
                          >
                            Tidak ada produk ditemukan.
                          </p>
                          <p className="text-xs text-[#B8A08A]">
                            Coba tambahkan produk baru atau ubah filter pencarian
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id}>
                        <td className="px-4 py-3.5">
                          <span
                            className="font-semibold text-[#3B2316]"
                            style={{ fontFamily: "'Lora', serif" }}
                          >
                            {categoryIcons[p.category] || "📦"} {p.name}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`badge-vintage ${
                              categoryColors[p.category]?.badge ||
                              "bg-[#F5E6C8] border-[#8B7355] text-[#5C3D2E]"
                            }`}
                          >
                            {p.category || "Umum"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className="font-bold text-[#6B7B3A]"
                            style={{ fontFamily: "'Fredoka', sans-serif" }}
                          >
                            Rp {p.price?.toLocaleString("id-ID")}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span
                            className={`badge-vintage ${
                              p.stock <= 5
                                ? "bg-[#FFF3E0] border-[#C04000] text-[#C04000]"
                                : "bg-[#F0F7E8] border-[#6B7B3A] text-[#6B7B3A]"
                            }`}
                          >
                            <PackageCheck className="w-3.5 h-3.5" />
                            {p.stock}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleEdit(p)}
                              className="p-2 text-[#8B7355] hover:text-[#D4A843] hover:bg-[#FFF8E7] border-2 border-transparent hover:border-[#D4A843] rounded-xl transition-all"
                              title="Edit"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(p.id)}
                              className="p-2 text-[#8B7355] hover:text-[#A0322E] hover:bg-[#FFF0EE] border-2 border-transparent hover:border-[#A0322E] rounded-xl transition-all"
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

          {/* Footer credit */}
          <div className="text-center pt-4 pb-2">
            <p
              className="text-xs text-[#B8A08A] italic"
              style={{ fontFamily: "'Lora', serif" }}
            >
              ✦ ePOS Cafe Manager — Dibuat dengan ♥ ✦
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
