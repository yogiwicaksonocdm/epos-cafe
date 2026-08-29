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
} from "lucide-react";

const CATEGORIES = ["Kopi", "Non-Kopi", "Makanan", "Snack"];
const CATEGORY_ICONS = { Kopi: "☕", "Non-Kopi": "🧋", Makanan: "🍽️", Snack: "🍪" };
const CATEGORY_BADGE = {
  Kopi: "bg-amber-50 border-amber-600 text-amber-800",
  "Non-Kopi": "bg-teal-50 border-teal-600 text-teal-800",
  Makanan: "bg-orange-50 border-orange-600 text-orange-800",
  Snack: "bg-rose-50 border-rose-600 text-rose-800",
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
          name, category, price: Number(price), stock: Number(stock),
        });
        setEditingId(null);
      } else {
        await addDoc(collection(db, "products"), {
          name, category, price: Number(price), stock: Number(stock),
          createdAt: serverTimestamp(),
        });
      }
      setName(""); setPrice(""); setStock(""); setCategory("Kopi");
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
    setName(""); setPrice(""); setStock(""); setCategory("Kopi");
  };

  const handleDelete = async (id) => {
    if (confirm("Yakin ingin menghapus produk ini?")) {
      await deleteDoc(doc(db, "products", id));
    }
  };

  const filtered = products.filter((p) => {
    const matchSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchCat = selectedCategory === "Semua" || p.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const lowStockCount = products.filter((p) => p.stock <= 5).length;
  const totalCategories = new Set(products.map((p) => p.category)).size;
  const totalStock = products.reduce((a, p) => a + (p.stock || 0), 0);

  /* ────────────────────────────────── */
  return (
    <div className="max-w-[1200px] mx-auto px-4 sm:px-5 py-6 sm:py-8">
      {/* ── Header ── */}
      <div className="v-card mb-5 sm:mb-6 text-center">
        <div className="v-float mx-auto mb-2 sm:mb-3 w-[50px] h-[50px] sm:w-[60px] sm:h-[60px] rounded-full flex items-center justify-center"
          style={{ background: "linear-gradient(135deg, #C04000, #8B2500)", border: "3px solid #3B2316" }}>
          <Coffee className="w-6 h-6 sm:w-7 sm:h-7 text-[#FFF8E7]" />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#3B2316]"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          ePOS Cafe Manager
        </h1>
        <p className="text-xs sm:text-sm text-[#8B7355] mt-1 italic"
          style={{ fontFamily: "'Lora', serif" }}>
          Kelola inventaris dan stok menu cafe Anda
        </p>
      </div>

      {/* ── Stats ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
        <div className="v-stat">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#FFF8E7] border-2 border-[#5C3D2E] text-[#C04000]">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <div className="v-label">Total Produk</div>
            <div className="text-xl font-bold text-[#3B2316]" style={{ fontFamily: "'Fredoka'" }}>{products.length}</div>
          </div>
        </div>
        <div className="v-stat">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#FFF8E7] border-2 border-[#5C3D2E] text-[#6B7B3A]">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="v-label">Kategori</div>
            <div className="text-xl font-bold text-[#3B2316]" style={{ fontFamily: "'Fredoka'" }}>{totalCategories}</div>
          </div>
        </div>
        <div className="v-stat">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#FFF8E7] border-2 border-[#5C3D2E] text-[#3A7D7E]">
            <PackageCheck className="w-5 h-5" />
          </div>
          <div>
            <div className="v-label">Total Stok</div>
            <div className="text-xl font-bold text-[#3B2316]" style={{ fontFamily: "'Fredoka'" }}>{totalStock}</div>
          </div>
        </div>
        <div className="v-stat">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border-2 ${lowStockCount > 0 ? "bg-[#FFF3E0] border-[#C04000] text-[#C04000]" : "bg-[#FFF8E7] border-[#5C3D2E] text-[#6B7B3A]"}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <div className="v-label">Stok Menipis</div>
            <div className={`text-xl font-bold ${lowStockCount > 0 ? "text-[#C04000]" : "text-[#3B2316]"}`} style={{ fontFamily: "'Fredoka'" }}>{lowStockCount}</div>
          </div>
        </div>
      </div>

      {/* ── Main Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 sm:gap-6 items-start">

        {/* ── Form ── */}
        <div className="v-card lg:sticky lg:top-6">
          <h2 className="v-title mb-5">
            {editingId
              ? <><Edit3 className="w-[18px] h-[18px] text-[#C04000]" /> Edit Produk</>
              : <><Plus className="w-[18px] h-[18px] text-[#6B7B3A]" /> Tambah Produk</>}
          </h2>

          {editingId && (
            <div className="mb-4 p-2.5 bg-[#FFF3E0] border-2 border-dashed border-[#D4A843] rounded-lg text-center">
              <span className="text-xs font-semibold text-[#8B6914]" style={{ fontFamily: "'Fredoka'" }}>
                ✏️ Sedang mengedit
              </span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="v-label">Nama Produk</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Avocado Coffee" className="v-input w-full" required />
            </div>
            <div>
              <label className="v-label">Kategori</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="v-select w-full">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_ICONS[c]} {c}</option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="v-label">Harga (Rp)</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                  placeholder="25000" className="v-input w-full" required />
              </div>
              <div>
                <label className="v-label">Stok</label>
                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)}
                  placeholder="20" className="v-input w-full" required />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={loading}
                className={`v-btn flex-1 ${editingId ? "v-btn-edit" : "v-btn-primary"}`}>
                {loading ? "Menyimpan..." : editingId
                  ? <><Save className="w-4 h-4" /> Perbarui</>
                  : <><Plus className="w-4 h-4" /> Tambah</>}
              </button>
              {editingId && (
                <button type="button" onClick={handleCancel} className="v-btn v-btn-muted">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── Product List ── */}
        <div className="flex flex-col gap-4">

          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#8B7355]" />
            <input type="text" placeholder="Cari nama produk..."
              value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
              className="v-input w-full pl-11" />
          </div>

          {/* Category filter */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setSelectedCategory("Semua")}
              className={`v-pill ${selectedCategory === "Semua" ? "active" : ""}`}>
              📋 Semua
            </button>
            {CATEGORIES.map((c) => (
              <button key={c} onClick={() => setSelectedCategory(c)}
                className={`v-pill ${selectedCategory === c ? "active" : ""}`}>
                {CATEGORY_ICONS[c]} {c}
              </button>
            ))}
          </div>

          {/* ── Mobile Cards (hidden on md+) ── */}
          <div className="md:hidden flex flex-col gap-3">
            {filtered.length === 0 ? (
              <div className="v-card text-center py-10">
                <span className="text-3xl">📭</span>
                <p className="text-[#8B7355] italic mt-2" style={{ fontFamily: "'Lora'" }}>
                  Tidak ada produk ditemukan.
                </p>
                <p className="text-xs text-[#B8A08A] mt-1">
                  Coba tambah produk baru atau ubah filter
                </p>
              </div>
            ) : (
              filtered.map((p) => (
                <div key={p.id} className="v-mob-card">
                  <div className="v-mob-card-header">
                    <span className="font-semibold text-[#3B2316] text-sm" style={{ fontFamily: "'Lora'" }}>
                      {CATEGORY_ICONS[p.category] || "📦"} {p.name}
                    </span>
                    <span className="text-sm font-bold text-[#6B7B3A]" style={{ fontFamily: "'Fredoka'" }}>
                      Rp {p.price?.toLocaleString("id-ID")}
                    </span>
                  </div>
                  <div className="v-mob-card-body">
                    <span className={`v-badge ${CATEGORY_BADGE[p.category] || "bg-[#F5E6C8] border-[#8B7355] text-[#5C3D2E]"}`}>
                      {p.category || "Umum"}
                    </span>
                    <span className={`v-badge ${p.stock <= 5 ? "bg-[#FFF3E0] border-[#C04000] text-[#C04000]" : "bg-[#F0F7E8] border-[#6B7B3A] text-[#6B7B3A]"}`}>
                      <PackageCheck className="w-3.5 h-3.5" />
                      Stok: {p.stock}
                    </span>
                    <div className="v-mob-card-actions ml-auto">
                      <button onClick={() => handleEdit(p)} className="v-mob-edit" title="Edit">
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(p.id)} className="v-mob-delete" title="Hapus">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* ── Desktop Table (hidden on mobile) ── */}
          <div className="hidden md:block v-card" style={{ padding: 0 }}>
            <div className="overflow-x-auto">
              <table className="v-table">
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
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="text-center py-12">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-3xl">📭</span>
                          <p className="text-[#8B7355] italic" style={{ fontFamily: "'Lora'" }}>
                            Tidak ada produk ditemukan.
                          </p>
                          <p className="text-xs text-[#B8A08A]">
                            Coba tambah produk baru atau ubah filter
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    filtered.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <span className="font-semibold text-[#3B2316]" style={{ fontFamily: "'Lora'" }}>
                            {CATEGORY_ICONS[p.category] || "📦"} {p.name}
                          </span>
                        </td>
                        <td>
                          <span className={`v-badge ${CATEGORY_BADGE[p.category] || "bg-[#F5E6C8] border-[#8B7355] text-[#5C3D2E]"}`}>
                            {p.category || "Umum"}
                          </span>
                        </td>
                        <td>
                          <span className="font-bold text-[#6B7B3A]" style={{ fontFamily: "'Fredoka'" }}>
                            Rp {p.price?.toLocaleString("id-ID")}
                          </span>
                        </td>
                        <td>
                          <span className={`v-badge ${p.stock <= 5 ? "bg-[#FFF3E0] border-[#C04000] text-[#C04000]" : "bg-[#F0F7E8] border-[#6B7B3A] text-[#6B7B3A]"}`}>
                            <PackageCheck className="w-3.5 h-3.5" />
                            {p.stock}
                          </span>
                        </td>
                        <td className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => handleEdit(p)}
                              className="v-btn-ghost text-[#8B7355] hover:text-[#D4A843]" title="Edit">
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button onClick={() => handleDelete(p.id)}
                              className="v-btn-ghost text-[#8B7355] hover:text-[#A0322E]" title="Hapus">
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
          <p className="text-center text-xs text-[#B8A08A] italic" style={{ fontFamily: "'Lora'" }}>
            ePOS Cafe Manager — Dibuat dengan ♥
          </p>
        </div>
      </div>
    </div>
  );
}
