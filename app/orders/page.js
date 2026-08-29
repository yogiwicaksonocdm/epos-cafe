"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import {
  Plus,
  Minus,
  Trash2,
  Search,
  ShoppingBag,
  ClipboardList,
  CheckCircle2,
  XCircle,
  Clock,
  Send,
  X,
  PackageCheck,
  Receipt,
  User,
  FileText,
  ChevronDown,
  ChevronUp,
  Printer,
} from "lucide-react";

const CATS = ["Kopi", "Non-Kopi", "Makanan", "Snack"];
const CAT_ICON = { Kopi: "☕", "Non-Kopi": "🧋", Makanan: "🍽️", Snack: "🍪" };
const STATUS = {
  diproses: { label: "Diproses", icon: Clock, clr: "bg-[#FFF3E0] border-[#D4A843] text-[#8B6914]" },
  selesai: { label: "Selesai", icon: CheckCircle2, clr: "bg-[#F0F7E8] border-[#6B7B3A] text-[#6B7B3A]" },
  batal: { label: "Batal", icon: XCircle, clr: "bg-[#F5E0DE] border-[#C04000] text-[#C04000]" },
};

export default function OrdersPage() {
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("Semua");
  const [busy, setBusy] = useState(false);
  const [activeTab, setActiveTab] = useState("new"); // "new" | "history"
  const [expandedOrder, setExpandedOrder] = useState(null);
  const [invoiceOrder, setInvoiceOrder] = useState(null); // order to print invoice for

  /* ── Realtime listeners ── */
  useEffect(() => {
    const qProd = query(collection(db, "products"), orderBy("createdAt", "desc"));
    const unsubProd = onSnapshot(qProd, (s) =>
      setProducts(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    const qOrd = query(collection(db, "orders"), orderBy("createdAt", "desc"));
    const unsubOrd = onSnapshot(qOrd, (s) =>
      setOrders(s.docs.map((d) => ({ id: d.id, ...d.data() })))
    );

    return () => { unsubProd(); unsubOrd(); };
  }, []);

  /* ── Cart helpers ── */
  const addToCart = (product) => {
    if (product.stock <= 0) return;
    setCart((prev) => {
      const exist = prev.find((c) => c.id === product.id);
      const inCart = exist ? exist.qty : 0;
      if (inCart >= product.stock) return prev;
      if (exist) return prev.map((c) => c.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id: product.id, name: product.name, price: product.price, category: product.category, qty: 1, maxStock: product.stock }];
    });
  };

  const updateQty = (id, delta) => {
    setCart((prev) => prev.map((c) => {
      if (c.id !== id) return c;
      const newQty = c.qty + delta;
      if (newQty <= 0) return null;
      if (newQty > c.maxStock) return c;
      return { ...c, qty: newQty };
    }).filter(Boolean));
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((c) => c.id !== id));
  const clearCart = () => { setCart([]); setCustomerName(""); setNote(""); };

  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.qty, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.qty, 0);

  /* ── Submit order ── */
  const submitOrder = async () => {
    if (cart.length === 0) return;
    setBusy(true);
    try {
      await addDoc(collection(db, "orders"), {
        customerName: customerName || "Walk-in",
        note,
        items: cart.map((c) => ({
          productId: c.id,
          name: c.name,
          price: c.price,
          category: c.category,
          qty: c.qty,
          subtotal: c.price * c.qty,
        })),
        total: cartTotal,
        status: "diproses",
        createdAt: serverTimestamp(),
      });
      clearCart();
      setActiveTab("history");
    } catch (e) { console.error(e); }
    finally { setBusy(false); }
  };

  /* ── Update order status ── */
  const changeStatus = async (orderId, status) => {
    await updateDoc(doc(db, "orders", orderId), { status });
  };

  /* ── Invoice & QRIS ── */
  const openInvoice = (order) => setInvoiceOrder(order);
  const closeInvoice = () => setInvoiceOrder(null);

  const printInvoice = () => {
    const el = document.getElementById("invoice-content");
    if (!el) return;
    const w = window.open("", "_blank", "width=420,height=700");
    w.document.write(`
      <!DOCTYPE html>
      <html><head>
        <title>Invoice - ${invoiceOrder?.customerName || "Order"}</title>
        <link href="https://fonts.googleapis.com/css2?family=Fredoka:wght@400;500;600;700&family=Lora:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Playfair+Display:wght@700;900&display=swap" rel="stylesheet" />
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: 'Lora', Georgia, serif; color: #2C1810; font-size: 13px; line-height: 1.5; }
          .paper { padding: 20px 16px; max-width: 380px; margin: 0 auto; }
          .hdr { text-align: center; padding-bottom: 14px; border-bottom: 2px dashed #c9a988; margin-bottom: 14px; }
          .hdr h2 { font-family: 'Playfair Display', serif; font-size: 20px; font-weight: 900; color: #3B2316; margin: 0 0 2px; }
          .hdr p { font-size: 11px; color: #8B7355; }
          .meta { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 12px; }
          .meta span { color: #8B7355; }
          .meta strong { color: #3B2316; }
          hr.div { border: none; border-top: 1px dashed #ddd0b8; margin: 10px 0; }
          .items { margin: 10px 0; }
          .item { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; padding: 5px 0; }
          .item-name { flex: 1; }
          .item-name strong { font-size: 13px; color: #3B2316; }
          .item-name span { font-size: 11px; color: #8B7355; display: block; }
          .item-price { text-align: right; white-space: nowrap; }
          .item-price strong { font-size: 13px; color: #6B7B3A; font-family: 'Fredoka'; }
          .total { display: flex; justify-content: space-between; padding: 10px 0; border-top: 2px solid #3B2316; margin-top: 6px; }
          .total span { font-family: 'Fredoka'; font-weight: 700; font-size: 15px; color: #3B2316; }
          .total strong { font-family: 'Fredoka'; font-weight: 700; font-size: 17px; color: #6B7B3A; }
          .note { background: #FFF8E7; border: 1px solid #c9a988; border-radius: 6px; padding: 6px 10px; margin-top: 8px; font-size: 11px; color: #8B7355; font-style: italic; }
          .qris { text-align: center; margin-top: 14px; padding-top: 14px; border-top: 2px dashed #c9a988; }
          .qris p { font-family: 'Fredoka'; font-weight: 600; font-size: 12px; color: #3B2316; margin-bottom: 8px; }
          .qris img { width: 160px; height: 160px; border: 2px solid #c9a988; border-radius: 8px; }
          .ftr { text-align: center; margin-top: 14px; padding-top: 10px; border-top: 2px dashed #c9a988; }
          .ftr p { font-size: 11px; color: #B8A08A; font-style: italic; }
          @media print {
            body { background: #fff; }
            .paper { padding: 12px; max-width: none; }
          }
        </style>
      </head><body>
        <div class="paper">${el.innerHTML}</div>
      </body></html>
    `);
    w.document.close();
    setTimeout(() => { w.print(); }, 500);
  };

  /* ── Generate QRIS content ── */
  const getQRISData = (order) => {
    const ref = order.id?.slice(0, 12) || "INV001";
    const amount = order.total || 0;
    // QRIS static payload: merchant name + amount
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(`QRIS ePOS Cafe\n${order.customerName || "Walk-in"}\nRef: ${ref}\nTotal: Rp ${amount.toLocaleString("id-ID")}\nBayar sekarang`)}`;
  };

  /* ── Filtered products ── */
  const filteredProducts = products.filter((p) => {
    const okS = p.name.toLowerCase().includes(search.toLowerCase());
    const okC = catFilter === "Semua" || p.category === catFilter;
    return okS && okC;
  });

  /* ── Stats ── */
  const totalOrders = orders.length;
  const pendingOrders = orders.filter((o) => o.status === "diproses").length;
  const todayRevenue = orders
    .filter((o) => o.status === "selesai")
    .reduce((s, o) => s + (o.total || 0), 0);

  const stats = [
    { label: "Total Order", val: totalOrders, icon: ClipboardList, clr: "text-[#C04000]" },
    { label: "Diproses", val: pendingOrders, icon: Clock, clr: "text-[#D4A843]" },
    { label: "Pendapatan", val: `Rp ${(todayRevenue).toLocaleString("id-ID")}`, icon: Receipt, clr: "text-[#6B7B3A]" },
  ];

  /* ════════════════════════════════════ */
  return (
    <div className="page-wrap">

      {/* ── HEADER ── */}
      <header className="card text-center mb-5 sm:mb-6">
        <div className="flo mx-auto mb-3 w-[52px] h-[52px] sm:w-[64px] sm:h-[64px] rounded-full flex items-center justify-center border-[3px] border-[#3B2316]"
          style={{ background: "linear-gradient(135deg, #6B7B3A, #4A5C22)" }}>
          <ShoppingBag className="w-6 h-6 sm:w-8 sm:h-8 text-[#FFF8E7]" />
        </div>
        <h1 className="text-2xl sm:text-[32px] font-bold text-[#3B2316] leading-tight"
          style={{ fontFamily: "'Playfair Display', serif" }}>
          Buka Orderan
        </h1>
        <p className="text-xs sm:text-sm text-[#8B7355] mt-1 italic"
          style={{ fontFamily: "'Lora', serif" }}>
          Buat dan kelola pesanan pelanggan
        </p>
        {/* Navigation */}
        <div className="flex justify-center gap-3 mt-4">
          <a href="/" className="pill">
            ☕ Produk
          </a>
          <a href="/orders" className="pill on">
            🛒 Orderan
          </a>
        </div>
      </header>

      {/* ── STATS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
        {stats.map((s, i) => (
          <div key={i} className="stat">
            <div className={`stat-ico ${s.clr}`}>
              <s.icon className="w-5 h-5" />
            </div>
            <div>
              <div className="lbl">{s.label}</div>
              <div className="text-lg sm:text-xl font-bold text-[#3B2316] truncate" style={{ fontFamily: "'Fredoka'" }}>
                {s.val}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div className="flex gap-2 mb-5 sm:mb-6">
        <button onClick={() => setActiveTab("new")} className={`pill flex-1 sm:flex-none ${activeTab === "new" ? "on" : ""}`}>
          <Plus className="w-4 h-4" /> Order Baru
        </button>
        <button onClick={() => setActiveTab("history")} className={`pill flex-1 sm:flex-none ${activeTab === "history" ? "on" : ""}`}>
          <ClipboardList className="w-4 h-4" /> Riwayat
          {pendingOrders > 0 && (
            <span className="ml-1 inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#C04000] text-white text-[10px] font-bold">
              {pendingOrders}
            </span>
          )}
        </button>
      </div>

      {/* ═══════════════════════════════════
          TAB: ORDER BARU
          ═══════════════════════════════════ */}
      {activeTab === "new" && (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-5 sm:gap-6 items-start">

          {/* ── PRODUCT PICKER ── */}
          <div className="flex flex-col gap-4">

            {/* Search */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-[#8B7355]" />
              <input type="text" placeholder="Cari produk..."
                value={search} onChange={(e) => setSearch(e.target.value)}
                className="inp pl-11" />
            </div>

            {/* Category pills */}
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setCatFilter("Semua")} className={`pill ${catFilter === "Semua" ? "on" : ""}`}>
                📋 Semua
              </button>
              {CATS.map((c) => (
                <button key={c} onClick={() => setCatFilter(c)} className={`pill ${catFilter === c ? "on" : ""}`}>
                  {CAT_ICON[c]} {c}
                </button>
              ))}
            </div>

            {/* Product grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3 gap-3">
              {filteredProducts.map((p) => {
                const inCart = cart.find((c) => c.id === p.id);
                const outOfStock = p.stock <= 0;
                const atMax = inCart && inCart.qty >= p.stock;
                return (
                  <button key={p.id} onClick={() => addToCart(p)} disabled={outOfStock || atMax}
                    className={`card text-left transition-all ${outOfStock ? "opacity-50 cursor-not-allowed" : atMax ? "ring-2 ring-[#6B7B3A]" : "hover:translate-y-[-2px] hover:shadow-[6px_6px_0_var(--brown)] cursor-pointer"}`}>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className={`badge ${p.stock <= 5 ? "bg-[#FFF3E0] border-[#C04000] text-[#C04000]" : "bg-[#F0F7E8] border-[#6B7B3A] text-[#6B7B3A]"}`}>
                        <PackageCheck className="w-3 h-3" /> {p.stock}
                      </span>
                      {inCart && (
                        <span className="badge bg-[#6B7B3A] border-[#4A5C22] text-white">
                          ×{inCart.qty}
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-sm text-[#3B2316] truncate mb-1" style={{ fontFamily: "'Lora'" }}>
                      {CAT_ICON[p.category] || "📦"} {p.name}
                    </p>
                    <p className="font-bold text-sm text-[#6B7B3A]" style={{ fontFamily: "'Fredoka'" }}>
                      Rp {p.price?.toLocaleString("id-ID")}
                    </p>
                    {outOfStock && <p className="text-[10px] text-[#C04000] mt-1 italic">Stok habis</p>}
                  </button>
                );
              })}
              {filteredProducts.length === 0 && (
                <div className="col-span-full text-center py-10">
                  <div className="text-4xl mb-2">📭</div>
                  <p className="text-[#8B7355] italic text-sm" style={{ fontFamily: "'Lora'" }}>
                    Tidak ada produk ditemukan
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ── CART SIDEBAR ── */}
          <div className="card lg:sticky lg:top-6 order-2">
            <h2 className="text-base font-bold flex items-center gap-2 text-[#3B2316] mb-4" style={{ fontFamily: "'Fredoka'" }}>
              <ShoppingBag className="w-[18px] h-[18px] text-[#6B7B3A]" />
              Keranjang
              {cartCount > 0 && (
                <span className="ml-auto badge bg-[#C04000] border-[#8B2500] text-white">
                  {cartCount} item
                </span>
              )}
            </h2>

            {/* Customer name */}
            <div className="mb-3">
              <label className="lbl"><User className="w-3 h-3 inline" /> Nama Pelanggan</label>
              <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)}
                placeholder="Nama pelanggan (opsional)" className="inp" />
            </div>

            {/* Note */}
            <div className="mb-4">
              <label className="lbl"><FileText className="w-3 h-3 inline" /> Catatan</label>
              <input type="text" value={note} onChange={(e) => setNote(e.target.value)}
                placeholder="Catatan order (opsional)" className="inp" />
            </div>

            {/* Cart items */}
            <div className="flex flex-col gap-2 mb-4 max-h-[300px] overflow-y-auto pr-1">
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-3xl mb-2">🛒</div>
                  <p className="text-xs text-[#B8A08A] italic" style={{ fontFamily: "'Lora'" }}>
                    Klik produk untuk menambah ke keranjang
                  </p>
                </div>
              ) : cart.map((c) => (
                <div key={c.id} className="flex items-center gap-3 p-2.5 bg-[#FFF8E7] border-2 border-[#c9a988] rounded-lg">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-[#3B2316] truncate" style={{ fontFamily: "'Fredoka'" }}>
                      {CAT_ICON[c.category] || "📦"} {c.name}
                    </p>
                    <p className="text-[11px] text-[#8B7355]">
                      Rp {c.price?.toLocaleString("id-ID")} × {c.qty}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => updateQty(c.id, -1)}
                      className="btn btn-ic w-7 h-7 min-w-0 min-h-0 bg-[#F5E0DE] text-[#C04000] border-[#C04000] text-xs">
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-bold text-[#3B2316]" style={{ fontFamily: "'Fredoka'" }}>
                      {c.qty}
                    </span>
                    <button onClick={() => updateQty(c.id, 1)}
                      disabled={c.qty >= c.maxStock}
                      className="btn btn-ic w-7 h-7 min-w-0 min-h-0 bg-[#F0F7E8] text-[#6B7B3A] border-[#6B7B3A] text-xs disabled:opacity-40">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="font-bold text-xs text-[#6B7B3A] whitespace-nowrap" style={{ fontFamily: "'Fredoka'" }}>
                    Rp {(c.price * c.qty).toLocaleString("id-ID")}
                  </p>
                  <button onClick={() => removeFromCart(c.id)}
                    className="btn btn-ic w-7 h-7 min-w-0 min-h-0">
                    <Trash2 className="w-3.5 h-3.5 text-[#C04000]" />
                  </button>
                </div>
              ))}
            </div>

            {/* Total & Submit */}
            {cart.length > 0 && (
              <>
                <div className="flex items-center justify-between py-3 border-t-2 border-dashed border-[#c9a988]">
                  <span className="font-bold text-sm text-[#3B2316]" style={{ fontFamily: "'Fredoka'" }}>Total</span>
                  <span className="font-bold text-lg text-[#6B7B3A]" style={{ fontFamily: "'Fredoka'" }}>
                    Rp {cartTotal.toLocaleString("id-ID")}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={submitOrder} disabled={busy}
                    className="btn btn-g flex-1">
                    {busy ? "Mengirim..." : <><Send className="w-4 h-4" /> Kirim Order</>}
                  </button>
                  <button onClick={clearCart} className="btn btn-m">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════
          TAB: RIWAYAT ORDER
          ═══════════════════════════════════ */}
      {activeTab === "history" && (
        <div className="flex flex-col gap-4">
          {orders.length === 0 ? (
            <div className="card text-center py-12">
              <div className="text-5xl mb-3">📋</div>
              <p className="text-[#8B7355] italic" style={{ fontFamily: "'Lora'" }}>
                Belum ada orderan
              </p>
              <p className="text-xs text-[#B8A08A] mt-1">
                Buat order baru untuk mulai mencatat
              </p>
            </div>
          ) : orders.map((o) => {
            const st = STATUS[o.status] || STATUS.diproses;
            const StIcon = st.icon;
            const isExpanded = expandedOrder === o.id;
            const created = o.createdAt?.toDate?.();
            const dateStr = created ? created.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" }) : "";
            const timeStr = created ? created.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "";

            return (
              <div key={o.id} className="card">
                {/* Order header */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-[#3B2316]" style={{ fontFamily: "'Fredoka'" }}>
                        {o.customerName || "Walk-in"}
                      </span>
                      <span className={`badge ${st.clr}`}>
                        <StIcon className="w-3 h-3" /> {st.label}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#B8A08A] mt-0.5">
                      {dateStr} • {timeStr}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-sm text-[#6B7B3A] whitespace-nowrap" style={{ fontFamily: "'Fredoka'" }}>
                      Rp {o.total?.toLocaleString("id-ID")}
                    </span>
                    <button onClick={() => setExpandedOrder(isExpanded ? null : o.id)}
                      className="btn btn-ic">
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Expanded details */}
                {isExpanded && (
                  <div className="border-t-2 border-dashed border-[#c9a988] pt-3">
                    {/* Note */}
                    {o.note && (
                      <p className="text-xs text-[#8B7355] italic mb-3 bg-[#FFF8E7] p-2.5 rounded-lg border border-[#c9a988]">
                        📝 {o.note}
                      </p>
                    )}

                    {/* Items list - mobile */}
                    <div className="flex flex-col gap-1.5 mb-4 lg:hidden">
                      {o.items?.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm py-1.5 px-2 bg-[#FFF8E7] rounded-lg">
                          <span className="text-[#3B2316] truncate flex-1">
                            {CAT_ICON[item.category] || "📦"} {item.name} × {item.qty}
                          </span>
                          <span className="font-semibold text-[#6B7B3A] whitespace-nowrap ml-2" style={{ fontFamily: "'Fredoka'" }}>
                            Rp {item.subtotal?.toLocaleString("id-ID")}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Items table - desktop */}
                    <div className="hidden lg:block overflow-x-auto mb-4">
                      <table className="tbl">
                        <thead>
                          <tr>
                            <th>Produk</th>
                            <th>Harga</th>
                            <th>Qty</th>
                            <th className="text-right">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody>
                          {o.items?.map((item, idx) => (
                            <tr key={idx}>
                              <td className="font-semibold text-[#3B2316] whitespace-nowrap">
                                {CAT_ICON[item.category] || "📦"} {item.name}
                              </td>
                              <td>Rp {item.price?.toLocaleString("id-ID")}</td>
                              <td className="font-bold">{item.qty}</td>
                              <td className="text-right font-bold text-[#6B7B3A]">
                                Rp {item.subtotal?.toLocaleString("id-ID")}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => openInvoice(o)} className="btn btn-g text-xs h-9">
                        <Printer className="w-3.5 h-3.5" /> Cetak Invoice
                      </button>
                      {o.status !== "selesai" && (
                        <button onClick={() => changeStatus(o.id, "selesai")} className="btn btn-y text-xs h-9">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
                        </button>
                      )}
                      {o.status !== "diproses" && (
                        <button onClick={() => changeStatus(o.id, "diproses")} className="btn btn-y text-xs h-9">
                          <Clock className="w-3.5 h-3.5" /> Proses Ulang
                        </button>
                      )}
                      {o.status !== "batal" && (
                        <button onClick={() => changeStatus(o.id, "batal")} className="btn btn-m text-xs h-9">
                          <XCircle className="w-3.5 h-3.5" /> Batalkan
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Footer */}
          <p className="text-center text-xs text-[#B8A08A] italic" style={{ fontFamily: "'Lora'" }}>
            ePOS Cafe Manager — Dibuat dengan ♥
          </p>
        </div>
      )}

      {/* ═══════════════════════════════════
          INVOICE MODAL
          ═══════════════════════════════════ */}
      {invoiceOrder && (() => {
        const o = invoiceOrder;
        const created = o.createdAt?.toDate?.();
        const dateStr = created ? created.toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" }) : "-";
        const timeStr = created ? created.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) : "-";
        const ref = o.id?.slice(0, 12)?.toUpperCase() || "INV001";
        const qrisUrl = getQRISData(o);

        return (
          <div className="invoice-overlay" onClick={(e) => e.target === e.currentTarget && closeInvoice()}>
            <div className="invoice-modal">
              {/* Hidden content for printing */}
              <div id="invoice-content" style={{ display: "none" }}>
                <div className="inv-paper">
                  <div className="inv-header">
                    <h2>☕ ePOS Cafe</h2>
                    <p>Jl. Contoh No. 123, Kota — Telp: 0812-3456-7890</p>
                  </div>
                  <div className="inv-meta">
                    <div><span>No. </span><strong>{ref}</strong></div>
                    <div style={{ textAlign: "right" }}><span>{dateStr}</span><br /><span>{timeStr}</span></div>
                  </div>
                  <div className="inv-meta">
                    <div><span>Pelanggan: </span><strong>{o.customerName || "Walk-in"}</strong></div>
                  </div>
                  <hr className="inv-divider" />
                  <div className="inv-items">
                    {o.items?.map((item, idx) => (
                      <div key={idx} className="inv-item">
                        <div className="inv-item-name">
                          <strong>{item.name}</strong>
                          <span>{CAT_ICON[item.category] || "📦"} Rp {item.price?.toLocaleString("id-ID")} × {item.qty}</span>
                        </div>
                        <div className="inv-item-price">
                          <strong>Rp {item.subtotal?.toLocaleString("id-ID")}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="inv-total">
                    <span>Total</span>
                    <strong>Rp {o.total?.toLocaleString("id-ID")}</strong>
                  </div>
                  {o.note && (
                    <div className="inv-note">📝 {o.note}</div>
                  )}
                  <div className="inv-qris">
                    <p>📱 Scan QRIS untuk Bayar</p>
                    <img src={qrisUrl} alt="QRIS QR Code" />
                    <p style={{ marginTop: 6, fontSize: 11, color: '#8B7355', fontFamily: 'Lora' }}>
                      Total: <strong style={{ color: '#6B7B3A' }}>Rp {o.total?.toLocaleString("id-ID")}</strong>
                    </p>
                  </div>
                  <div className="inv-footer">
                    <p>Terima kasih atas kunjungan Anda! 🙏</p>
                    <p style={{ marginTop: 2 }}>ePOS Cafe — Dibuat dengan ♥</p>
                  </div>
                </div>
              </div>

              {/* Visible preview */}
              <div style={{ padding: 0, position: "relative" }}>
                <div className="inv-paper">
                  <div className="inv-header">
                    <h2>☕ ePOS Cafe</h2>
                    <p>Jl. Contoh No. 123, Kota — Telp: 0812-3456-7890</p>
                  </div>
                  <div className="inv-meta">
                    <div><span>No. </span><strong>{ref}</strong></div>
                    <div style={{ textAlign: "right" }}><span>{dateStr}</span><br /><span>{timeStr}</span></div>
                  </div>
                  <div className="inv-meta">
                    <div><span>Pelanggan: </span><strong>{o.customerName || "Walk-in"}</strong></div>
                  </div>
                  <hr className="inv-divider" />
                  <div className="inv-items">
                    {o.items?.map((item, idx) => (
                      <div key={idx} className="inv-item">
                        <div className="inv-item-name">
                          <strong>{item.name}</strong>
                          <span>{CAT_ICON[item.category] || "📦"} Rp {item.price?.toLocaleString("id-ID")} × {item.qty}</span>
                        </div>
                        <div className="inv-item-price">
                          <strong>Rp {item.subtotal?.toLocaleString("id-ID")}</strong>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="inv-total">
                    <span>Total</span>
                    <strong>Rp {o.total?.toLocaleString("id-ID")}</strong>
                  </div>
                  {o.note && (
                    <div className="inv-note">📝 {o.note}</div>
                  )}
                  <div className="inv-qris">
                    <p>📱 Scan QRIS untuk Bayar</p>
                    <img src={qrisUrl} alt="QRIS QR Code" />
                    <p style={{ marginTop: 6, fontSize: 11, color: '#8B7355', fontFamily: 'Lora' }}>
                      Total: <strong style={{ color: '#6B7B3A' }}>Rp {o.total?.toLocaleString("id-ID")}</strong>
                    </p>
                  </div>
                  <div className="inv-footer">
                    <p>Terima kasih atas kunjungan Anda! 🙏</p>
                    <p style={{ marginTop: 2 }}>ePOS Cafe — Dibuat dengan ♥</p>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="invoice-actions">
                <button onClick={printInvoice} className="inv-btn-print">
                  <Printer className="w-4 h-4" /> Cetak Invoice
                </button>
                <button onClick={closeInvoice} className="inv-btn-close">
                  <X className="w-4 h-4" /> Tutup
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
