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

const CATS = ["Kopi", "Non-Kopi", "Makanan", "Snack"];
const CAT_ICON = { Kopi: "☕", "Non-Kopi": "🧋", Makanan: "🍽️", Snack: "🍪" };
const CAT_CLR = {
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
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Semua");
  const [editId, setEditId] = useState(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsub = onSnapshot(q, (s) =>
      setProducts(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );
    return () => unsub();
  }, []);

  const submit = async (e) => {
    e.preventDefault();
    if (!name || !price || stock === "") return;
    setBusy(true);
    try {
      if (editId) {
        await updateDoc(doc(db, "products", editId), {
          name, category, price: +price, stock: +stock,
        });
        setEditId(null);
      } else {
        await addDoc(collection(db, "products"), {
          name, category, price: +price, stock: +stock,
          createdAt: serverTimestamp(),
        });
      }
      setName(""); setPrice(""); setStock(""); setCategory("Kopi");
    } catch (e) { console.error(e); }
    finally { setBusy(false); }
  };

  const startEdit = (p) => {
    setEditId(p.id);
    setName(p.name);
    setCategory(p.category || "Kopi");
    setPrice(p.price);
    setStock(p.stock);
  };

  const cancel = () => {
    setEditId(null);
    setName(""); setPrice(""); setStock(""); setCategory("Kopi");
  };

  const del = async (id) => {
    if (confirm("Hapus produk ini?")) await deleteDoc(doc(db, "products", id));
  };

  const list = products.filter((p) => {
    const okS = p.name.toLowerCase().includes(search.toLowerCase());
    const okC = catFilter === "Semua" || p.category === catFilter;
    return okS && okC;
  });

  const lowCount = products.filter((p) => p.stock <= 5).length;
  const catCount = new Set(products.map((p) => p.category)).size;
  const totStock = products.reduce((a, p) => a + (p.stock || 0), 0);

  /* ── Stat data ── */
  const stats = [
    { label: "Produk", val: products.length, icon: ShoppingBag, clr: "text-[#C04000]" },
    { label: "Kategori", val: catCount, icon: Layers, clr: "text-[#6B7B3A]" },
    { label: "Total Stok", val: totStock, icon: PackageCheck, clr: "text-[#3A7D7E]" },
    { label: "Stok Tipis", val: lowCount, icon: AlertTriangle, clr: lowCount ? "text-[#C04000]" : "text-[#6B7B3A]" },
  ];

  /* ── Empty state ── */
  const Empty = () => (
    <div className="text-center py-10">
      <div className="text-4xl mb-2">📭</div>
      <p className="text-[#8B7355] italic text-sm" style={{ fontFamily: "'Lora'" }}>
        Belum ada produk
      </p>
      <p className="text-xs text-[#B8A08A] mt-1">
        Tambah produk baru atau ubah filter pencarian
      </p>
    </div>
  );

  /* ── Mobile product card ── */
  const MobCard = ({ p }) => (
    <div className="mcard">
      <div className="mcard-top">
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-sm text-[#3B2316] truncate" style={{ fontFamily: "'Lora'" }}>
            {CAT_ICON[p.category] || "📦"} {p.name}
          </p>
          <span className={`badge mt-2 ${CAT_CLR[p.category] || "bg-[#F5E6C8] border-[#8B7355] text-[#5C3D2E]"}`}>
            {p.category || "Umum"}
          </span>
        </div>
        <p className="font-bold text-sm text-[#6B7B3A] whitespace-nowrap" style={{ fontFamily: "'Fredoka'" }}>
          Rp {p.price?.toLocaleString("id-ID")}
        </p>
      </div>
      <div className="mcard-bot">
        <span className={`badge ${p.stock <= 5 ? "bg-[#FFF3E0] border-[#C04000] text-[#C04000]" : "bg-[#F0F7E8] border-[#6B7B3A] text-[#6B7B3A]"}`}>
          <PackageCheck className="w-3.5 h-3.5" /> {p.stock}
        </span>
        <div className="ml-auto flex gap-2">
          <button onClick={() => startEdit(p)} className="btn btn-ic bg-[#D4A843] text-[#3B2316] border-[#3B2316]">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={() => del(p.id)} className="btn btn-ic bg-[#F5E0DE] text-[#C04000] border-[#C04000]">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  /* ── Desktop table row ── */
  const TRow = ({ p }) => (
    <tr>
      <td className="font-semibold text-[#3B2316] whitespace-nowrap" style={{ fontFamily: "'Lora'" }}>
        {CAT_ICON[p.category] || "📦"} {p.name}
      </td>
      <td>
        <span className={`badge ${CAT_CLR[p.category] || "bg-[#F5E6C8] border-[#8B7355] text-[#5C3D2E]"}`}>
          {p.category || "Umum"}
        </span>
      </td>
      <td className="font-bold text-[#6B7B3A] whitespace-nowrap" style={{ fontFamily: "'Fredoka'" }}>
        Rp {p.price?.toLocaleString("id-ID")}
      </td>
      <td>
        <span className={`badge ${p.stock <= 5 ? "bg-[#FFF3E0] border-[#C04000] text-[#C04000]" : "bg-[#F0F7E8] border-[#6B7B3A] text-[#6B7B3A]"}`}>
          <PackageCheck className="w-3.5 h-3.5" /> {p.stock}
        </span>
      </td>
      <td className="text-right">
        <div className="flex items-center justify-end gap-1">
          <button onClick={() => startEdit(p)} className="btn btn-ic text-[#8B7355] hover:text-[#D4A843]">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={() => del(p.id)} className="btn btn-ic text-[#8B7355] hover:text-[#C04000]">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </td>
    </tr>
  );

  /* ═══════════════════════════════════ */
  return (
    <div className="page-wrap">

      {/* ── HEADER ── */}
      <header className="card text-center mb-5 sm:mb-6">
        <div className="flo mx-auto mb-3 w-[52px] h-[52px] sm:w-[64px] sm:h-[64px] rounded-full flex items-center justify-center border-[3px] border-[#3B2316]"
          style={{ background: "linear-gradient(135deg, #C04000, #8B2500)" }}>
          <Coffee className="w-6 h-6 sm:w-8 sm:h-8 text-[#FFF8E7]" />
        </div>
        <h1 className="text-2xl sm:text-[32px] font-bold text-[#3B2316] leading-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          ePOS Cafe Manager
        </h1>
        <p className="text-xs sm:text-sm text-[#8B7355] mt-1 italic"
          style={{ fontFamily: "'Lora', serif" }}>
          Kelola inventaris dan stok menu cafe Anda
        </p>
        {/* Navigation */}
        <div className="flex justify-center gap-3 mt-4">
          <a href="/" className="pill on">
            ☕ Produk
          </a>
          <a href="/orders" className="pill">
            🛒 Orderan
          </a>
        </div>
      </header>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-5 sm:mb-6">
        {stats.map((s, i) => (
          <div key={i} className="stat">
            <div className={`stat-ico ${s.clr}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="lbl">{s.label}</div>
              <div className="text-lg sm:text-xl font-bold text-[#3B2316]" style={{ fontFamily: "'Fredoka'" }}>
                {s.val}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── MAIN ── */}
      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-5 sm:gap-6 items-start">

        {/* ── FORM ── */}
        <div className="card lg:sticky lg:top-6 order-1">
          <h2 className="text-base font-bold flex items-center gap-2 text-[#3B2316] mb-4"
            style={{ fontFamily: "'Fredoka'" }}>
            {editId
              ? <><Edit3 className="w-[18px] h-[18px] text-[#C04000]" /> Edit Produk</>
              : <><Plus className="w-[18px] h-[18px] text-[#6B7B3A]" /> Tambah Produk</>}
          </h2>

          {editId && (
            <div className="mb-4 p-2.5 bg-[#FFF3E0] border-2 border-dashed border-[#D4A843] rounded-lg text-center">
              <span className="text-xs font-semibold text-[#8B6914]" style={{ fontFamily: "'Fredoka'" }}>
                ✏️ Sedang mengedit
              </span>
            </div>
          )}

          <form onSubmit={submit} className="flex flex-col gap-3.5">
            <div>
              <label className="lbl">Nama Produk</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                placeholder="Avocado Coffee" className="inp" required />
            </div>
            <div>
              <label className="lbl">Kategori</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="sel">
                {CATS.map((c) => <option key={c} value={c}>{CAT_ICON[c]} {c}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="lbl">Harga (Rp)</label>
                <input type="number" value={price} onChange={(e) => setPrice(e.target.value)}
                  placeholder="25000" className="inp" required />
              </div>
              <div>
                <label className="lbl">Stok</label>
                <input type="number" value={stock} onChange={(e) => setStock(e.target.value)}
                  placeholder="20" className="inp" required />
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" disabled={busy}
                className={`btn flex-1 ${editId ? "btn-y" : "btn-g"}`}>
                {busy ? "Menyimpan..." : editId
                  ? <><Save className="w-4 h-4" /> Perbarui</>
                  : <><Plus className="w-4 h-4" /> Tambah</>}
              </button>
              {editId && (
                <button type="button" onClick={cancel} className="btn btn-m">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </form>
        </div>

        {/* ── PRODUCT LIST ── */}
        <div className="flex flex-col gap-4 order-2">

          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#8B7355]" />
            <input type="text" placeholder="Cari nama produk..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="inp pl-11" />
          </div>

          {/* Category pills */}
          <div className="flex flex-wrap gap-2">
            <button onClick={() => setCatFilter("Semua")}
              className={`pill ${catFilter === "Semua" ? "on" : ""}`}>
              📋 Semua
            </button>
            {CATS.map((c) => (
              <button key={c} onClick={() => setCatFilter(c)}
                className={`pill ${catFilter === c ? "on" : ""}`}>
                {CAT_ICON[c]} {c}
              </button>
            ))}
          </div>

          {/* ── MOBILE: product cards ── */}
          <div className="lg:hidden flex flex-col gap-3">
            {list.length === 0 ? <Empty /> : list.map((p) => <MobCard key={p.id} p={p} />)}
          </div>

          {/* ── DESKTOP: table ── */}
          <div className="hidden lg:block card" style={{ padding: 0, overflow: "hidden" }}>
            <div className="overflow-x-auto">
              <table className="tbl">
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
                  {list.length === 0 ? (
                    <tr><td colSpan="5"><Empty /></td></tr>
                  ) : list.map((p) => <TRow key={p.id} p={p} />)}
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
