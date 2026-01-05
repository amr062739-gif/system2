
import React, { useState, useEffect, useMemo } from 'react';
import { 
  ShoppingCart, 
  Package, 
  Users, 
  Warehouse, 
  BarChart3, 
  Settings as SettingsIcon, 
  LogOut,
  Plus,
  Search,
  Trash2,
  Edit,
  Download,
  Upload,
  Printer,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';
import { storage } from './services/storage.ts';
import { DBState, AppTab, Item, Customer, Store, Sale, SaleItem } from './types.ts';

// Helper components
const Card: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className }) => (
  <div className={`bg-white rounded-xl shadow-sm border border-slate-200 p-6 ${className || ''}`}>
    {children}
  </div>
);

const Button: React.FC<{ 
  onClick?: () => void; 
  children: React.ReactNode; 
  variant?: 'primary' | 'secondary' | 'danger' | 'success';
  type?: 'button' | 'submit';
  className?: string;
  disabled?: boolean;
}> = ({ onClick, children, variant = 'primary', type = 'button', className = '', disabled }) => {
  const variants = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700',
    secondary: 'bg-slate-200 text-slate-800 hover:bg-slate-300',
    danger: 'bg-rose-600 text-white hover:bg-rose-700',
    success: 'bg-emerald-600 text-white hover:bg-emerald-700'
  };
  return (
    <button 
      type={type} 
      onClick={onClick} 
      disabled={disabled}
      className={`px-4 py-2 rounded-lg font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-50 ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

const Input: React.FC<any> = (props) => (
  <input 
    {...props} 
    className={`w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${props.className || ''}`} 
  />
);

const Select: React.FC<any> = ({ children, ...props }) => (
  <select 
    {...props} 
    className={`w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all ${props.className || ''}`}
  >
    {children}
  </select>
);

const Label: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-sm font-semibold text-slate-700 mb-1">{children}</label>
);

// --- Sub-pages ---

const SalePage: React.FC<{ db: DBState, setDb: (db: DBState) => void }> = ({ db, setDb }) => {
  const [cart, setCart] = useState<SaleItem[]>([]);
  const [search, setSearch] = useState('');
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [qty, setQty] = useState(1);
  const [paid, setPaid] = useState(0);
  const [customerId, setCustomerId] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'credit'>('cash');

  const filteredItems = useMemo(() => {
    if (!search) return [];
    return db.items.filter(i => i.code.includes(search) || i.name.includes(search)).slice(0, 5);
  }, [search, db.items]);

  const total = cart.reduce((acc, item) => acc + item.total, 0);
  const change = Math.max(0, paid - total);

  const addToCart = () => {
    if (!selectedItem) return;
    const existingIndex = cart.findIndex(i => i.itemId === selectedItem.id);
    if (existingIndex > -1) {
      const newCart = [...cart];
      newCart[existingIndex].quantity += qty;
      newCart[existingIndex].total = newCart[existingIndex].quantity * newCart[existingIndex].price;
      setCart(newCart);
    } else {
      setCart([...cart, {
        itemId: selectedItem.id,
        name: selectedItem.name,
        price: selectedItem.salePrice,
        quantity: qty,
        total: qty * selectedItem.salePrice
      }]);
    }
    setSelectedItem(null);
    setSearch('');
    setQty(1);
  };

  const removeFromCart = (index: number) => {
    setCart(cart.filter((_, i) => i !== index));
  };

  const saveSale = () => {
    if (cart.length === 0) return alert('الفاتورة فارغة!');
    
    const newSale: Sale = {
      id: Date.now().toString(),
      date: new Date().toISOString(),
      items: [...cart],
      total,
      paid: paymentMethod === 'cash' ? paid : 0,
      change: paymentMethod === 'cash' ? change : 0,
      customerId: customerId || undefined,
      paymentMethod
    };

    const updatedItems = db.items.map(item => {
      const sold = cart.find(ci => ci.itemId === item.id);
      return sold ? { ...item, quantity: item.quantity - sold.quantity } : item;
    });

    let updatedCustomers = [...db.customers];
    if (customerId && paymentMethod === 'credit') {
      updatedCustomers = updatedCustomers.map(c => 
        c.id === customerId ? { ...c, balance: c.balance + total } : c
      );
    }

    setDb({
      ...db,
      sales: [...db.sales, newSale],
      items: updatedItems,
      customers: updatedCustomers
    });

    alert('تم حفظ الفاتورة بنجاح');
    setCart([]);
    setPaid(0);
    setCustomerId('');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-indigo-600" />
            شاشة البيع
          </h2>
          <div className="flex flex-wrap gap-4 items-end mb-6">
            <div className="flex-1 min-w-[200px] relative">
              <Label>بحث عن صنف (كود أو اسم)</Label>
              <div className="relative">
                <Search className="absolute right-3 top-2.5 w-5 h-5 text-slate-400" />
                <Input 
                  placeholder="ابحث هنا..." 
                  className="pr-10"
                  value={search}
                  onChange={(e: any) => setSearch(e.target.value)}
                />
              </div>
              {filteredItems.length > 0 && (
                <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
                  {filteredItems.map(item => (
                    <div 
                      key={item.id} 
                      className="px-4 py-2 hover:bg-slate-50 cursor-pointer border-b last:border-0"
                      onClick={() => { setSelectedItem(item); setSearch(item.name); }}
                    >
                      {item.name} ({item.code}) - {item.salePrice} {db.settings.currency}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="w-24">
              <Label>الكمية</Label>
              <Input type="number" value={qty} onChange={(e: any) => setQty(Number(e.target.value))} />
            </div>
            <Button onClick={addToCart} disabled={!selectedItem}>إضافة</Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-right">
              <thead className="bg-slate-50">
                <tr>
                  <th className="p-3 border-b text-slate-600">الصنف</th>
                  <th className="p-3 border-b text-slate-600">السعر</th>
                  <th className="p-3 border-b text-slate-600">الكمية</th>
                  <th className="p-3 border-b text-slate-600">الإجمالي</th>
                  <th className="p-3 border-b text-slate-600">إجراء</th>
                </tr>
              </thead>
              <tbody>
                {cart.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-400">لا توجد أصناف في الفاتورة</td>
                  </tr>
                )}
                {cart.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50">
                    <td className="p-3 border-b font-semibold">{item.name}</td>
                    <td className="p-3 border-b">{item.price}</td>
                    <td className="p-3 border-b">{item.quantity}</td>
                    <td className="p-3 border-b font-bold text-indigo-600">{item.total}</td>
                    <td className="p-3 border-b">
                      <button onClick={() => removeFromCart(idx)} className="text-rose-500 hover:text-rose-700">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card className="bg-indigo-50 border-indigo-200">
          <h3 className="text-lg font-bold mb-4">ملخص الفاتورة</h3>
          <div className="space-y-4">
            <div className="flex justify-between items-center text-2xl font-black text-indigo-900">
              <span>الإجمالي:</span>
              <span>{total} {db.settings.currency}</span>
            </div>
            <hr className="border-indigo-200" />
            <div>
              <Label>العميل (اختياري)</Label>
              <Select value={customerId} onChange={(e: any) => setCustomerId(e.target.value)}>
                <option value="">عميل نقدي</option>
                {db.customers.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>طريقة الدفع</Label>
              <Select value={paymentMethod} onChange={(e: any) => setPaymentMethod(e.target.value as 'cash' | 'credit')}>
                <option value="cash">نقدي</option>
                <option value="credit">آجل (على الحساب)</option>
              </Select>
            </div>
            {paymentMethod === 'cash' && (
              <>
                <div>
                  <Label>المبلغ المدفوع</Label>
                  <Input type="number" value={paid} onChange={(e: any) => setPaid(Number(e.target.value))} />
                </div>
                <div className="flex justify-between text-lg font-bold text-slate-700">
                  <span>المتبقي:</span>
                  <span className="text-rose-600">{change} {db.settings.currency}</span>
                </div>
              </>
            )}
            <div className="pt-4 space-y-2">
              <Button className="w-full h-12" onClick={saveSale} variant="success">حفظ الفاتورة</Button>
              <Button className="w-full" variant="secondary" onClick={() => window.print()}>
                <Printer className="w-5 h-5" /> طباعة
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};

const ItemsPage: React.FC<{ db: DBState, setDb: (db: DBState) => void }> = ({ db, setDb }) => {
  const [form, setForm] = useState<Partial<Item>>({ code: '', name: '', salePrice: 0, purchasePrice: 0, quantity: 0, storeId: db.stores[0]?.id || '', lowStockThreshold: 5 });
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const saveItem = () => {
    if (!form.code || !form.name) return alert('برجاء إدخال البيانات كاملة');
    if (editingId) {
      setDb({
        ...db,
        items: db.items.map(i => i.id === editingId ? { ...i, ...form } as Item : i)
      });
      setEditingId(null);
    } else {
      setDb({
        ...db,
        items: [...db.items, { ...form, id: Date.now().toString() } as Item]
      });
    }
    setForm({ code: '', name: '', salePrice: 0, purchasePrice: 0, quantity: 0, storeId: db.stores[0]?.id || '', lowStockThreshold: 5 });
  };

  const filtered = db.items.filter(i => i.name.includes(search) || i.code.includes(search));

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="h-fit">
        <h3 className="text-lg font-bold mb-4">{editingId ? 'تعديل صنف' : 'إضافة صنف جديد'}</h3>
        <div className="space-y-4">
          <div><Label>كود الصنف</Label><Input value={form.code} onChange={(e: any) => setForm({...form, code: e.target.value})} /></div>
          <div><Label>اسم الصنف</Label><Input value={form.name} onChange={(e: any) => setForm({...form, name: e.target.value})} /></div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>سعر الشراء</Label><Input type="number" value={form.purchasePrice} onChange={(e: any) => setForm({...form, purchasePrice: Number(e.target.value)})} /></div>
            <div><Label>سعر البيع</Label><Input type="number" value={form.salePrice} onChange={(e: any) => setForm({...form, salePrice: Number(e.target.value)})} /></div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div><Label>الكمية الحالية</Label><Input type="number" value={form.quantity} onChange={(e: any) => setForm({...form, quantity: Number(e.target.value)})} /></div>
            <div><Label>تنبيه عند</Label><Input type="number" value={form.lowStockThreshold} onChange={(e: any) => setForm({...form, lowStockThreshold: Number(e.target.value)})} title="الحد الأدنى للكمية للتنبيه" /></div>
          </div>
          <div>
            <Label>المخزن</Label>
            <Select value={form.storeId} onChange={(e: any) => setForm({...form, storeId: e.target.value})}>
              {db.stores.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </Select>
          </div>
          <Button className="w-full" onClick={saveItem}>{editingId ? 'تحديث' : 'حفظ'}</Button>
          {editingId && <Button className="w-full" variant="secondary" onClick={() => { setEditingId(null); setForm({ code: '', name: '', salePrice: 0, purchasePrice: 0, quantity: 0, storeId: db.stores[0]?.id || '', lowStockThreshold: 5 }); }}>إلغاء</Button>}
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold">قائمة الأصناف</h3>
          <div className="relative w-64">
            <Search className="absolute right-3 top-2.5 w-4 h-4 text-slate-400" />
            <Input placeholder="بحث..." className="pr-9" value={search} onChange={(e: any) => setSearch(e.target.value)} />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-3 border-b">الكود</th>
                <th className="p-3 border-b">الاسم</th>
                <th className="p-3 border-b">السعر</th>
                <th className="p-3 border-b">الكمية</th>
                <th className="p-3 border-b">المخزن</th>
                <th className="p-3 border-b">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-slate-50">
                  <td className="p-3 border-b">{item.code}</td>
                  <td className="p-3 border-b font-semibold">{item.name}</td>
                  <td className="p-3 border-b">{item.salePrice}</td>
                  <td className="p-3 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${item.quantity <= item.lowStockThreshold ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'}`}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="p-3 border-b">{db.stores.find(s => s.id === item.storeId)?.name}</td>
                  <td className="p-3 border-b flex gap-2">
                    <button className="text-indigo-600" onClick={() => { setEditingId(item.id); setForm(item); }}><Edit className="w-5 h-5"/></button>
                    <button className="text-rose-600" onClick={() => setDb({...db, items: db.items.filter(i => i.id !== item.id)})}><Trash2 className="w-5 h-5"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const CustomersPage: React.FC<{ db: DBState, setDb: (db: DBState) => void }> = ({ db, setDb }) => {
  const [form, setForm] = useState<Partial<Customer>>({ name: '', phone: '', address: '', balance: 0 });
  const [editingId, setEditingId] = useState<string | null>(null);

  const saveCustomer = () => {
    if (!form.name) return alert('اسم العميل مطلوب');
    if (editingId) {
      setDb({ ...db, customers: db.customers.map(c => c.id === editingId ? { ...c, ...form } as Customer : c) });
      setEditingId(null);
    } else {
      setDb({ ...db, customers: [...db.customers, { ...form, id: Date.now().toString() } as Customer] });
    }
    setForm({ name: '', phone: '', address: '', balance: 0 });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <Card className="h-fit">
        <h3 className="text-lg font-bold mb-4">{editingId ? 'تعديل عميل' : 'إضافة عميل جديد'}</h3>
        <div className="space-y-4">
          <div><Label>اسم العميل</Label><Input value={form.name} onChange={(e: any) => setForm({...form, name: e.target.value})} /></div>
          <div><Label>رقم الهاتف</Label><Input value={form.phone} onChange={(e: any) => setForm({...form, phone: e.target.value})} /></div>
          <div><Label>العنوان</Label><Input value={form.address} onChange={(e: any) => setForm({...form, address: e.target.value})} /></div>
          <div><Label>الرصيد الافتتاحي (مديونية)</Label><Input type="number" value={form.balance} onChange={(e: any) => setForm({...form, balance: Number(e.target.value)})} /></div>
          <Button className="w-full" onClick={saveCustomer}>{editingId ? 'تحديث' : 'حفظ'}</Button>
        </div>
      </Card>

      <Card className="lg:col-span-2">
        <h3 className="text-lg font-bold mb-6">قائمة العملاء</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-3 border-b">الاسم</th>
                <th className="p-3 border-b">الهاتف</th>
                <th className="p-3 border-b">المديونية</th>
                <th className="p-3 border-b">إجراء</th>
              </tr>
            </thead>
            <tbody>
              {db.customers.map(c => (
                <tr key={c.id} className="hover:bg-slate-50">
                  <td className="p-3 border-b font-semibold">{c.name}</td>
                  <td className="p-3 border-b">{c.phone}</td>
                  <td className="p-3 border-b text-rose-600 font-bold">{c.balance} {db.settings.currency}</td>
                  <td className="p-3 border-b flex gap-2">
                    <button className="text-indigo-600" onClick={() => { setEditingId(c.id); setForm(c); }}><Edit className="w-5 h-5"/></button>
                    <button className="text-rose-600" onClick={() => setDb({...db, customers: db.customers.filter(cust => cust.id !== c.id)})}><Trash2 className="w-5 h-5"/></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const StoresPage: React.FC<{ db: DBState, setDb: (db: DBState) => void }> = ({ db, setDb }) => {
  const [storeName, setStoreName] = useState('');

  const addStore = () => {
    if (!storeName) return;
    setDb({ ...db, stores: [...db.stores, { id: Date.now().toString(), name: storeName }] });
    setStoreName('');
  };

  const lowStockItems = db.items.filter(i => i.quantity <= i.lowStockThreshold);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <h3 className="text-lg font-bold mb-4">إضافة مخزن</h3>
          <div className="flex gap-2">
            <Input value={storeName} onChange={(e: any) => setStoreName(e.target.value)} placeholder="اسم المخزن" />
            <Button onClick={addStore}>إضافة</Button>
          </div>
          <div className="mt-6 space-y-2">
            {db.stores.map(s => (
              <div key={s.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg">
                <span className="font-semibold">{s.name}</span>
                <span className="text-sm text-slate-500">
                  {db.items.filter(i => i.storeId === s.id).length} صنف
                </span>
              </div>
            ))}
          </div>
        </Card>

        <Card className="border-rose-200 bg-rose-50">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-rose-700">
            <AlertTriangle className="w-5 h-5" /> تنبيهات نقص المخزون
          </h3>
          <div className="space-y-3">
            {lowStockItems.length === 0 && <p className="text-slate-500">لا توجد تنبيهات حالياً</p>}
            {lowStockItems.map(item => (
              <div key={item.id} className="flex justify-between items-center p-3 bg-white border border-rose-100 rounded-lg">
                <span className="font-semibold">{item.name}</span>
                <span className="font-bold text-rose-600">{item.quantity} (حد التنبيه: {item.lowStockThreshold})</span>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

const ReportsPage: React.FC<{ db: DBState }> = ({ db }) => {
  const [dateFrom, setDateFrom] = useState(new Date().toISOString().split('T')[0]);
  const [dateTo, setDateTo] = useState(new Date().toISOString().split('T')[0]);

  const filteredSales = db.sales.filter(s => {
    const d = s.date.split('T')[0];
    return d >= dateFrom && d <= dateTo;
  });

  const totalSales = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalProfit = filteredSales.reduce((acc, s) => {
    const profit = s.items.reduce((itemAcc, si) => {
      const originalItem = db.items.find(i => i.id === si.itemId);
      const purchasePrice = originalItem?.purchasePrice || 0;
      return itemAcc + (si.price - purchasePrice) * si.quantity;
    }, 0);
    return acc + profit;
  }, 0);

  return (
    <div className="space-y-6">
      <Card>
        <div className="flex flex-wrap gap-4 items-end">
          <div><Label>من تاريخ</Label><Input type="date" value={dateFrom} onChange={(e: any) => setDateFrom(e.target.value)} /></div>
          <div><Label>إلى تاريخ</Label><Input type="date" value={dateTo} onChange={(e: any) => setDateTo(e.target.value)} /></div>
          <Button variant="secondary" onClick={() => window.print()}><Printer className="w-4 h-4"/> طباعة التقرير</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-indigo-600 text-white">
          <p className="text-indigo-100">إجمالي المبيعات</p>
          <h2 className="text-3xl font-black mt-1">{totalSales} {db.settings.currency}</h2>
        </Card>
        <Card className="bg-emerald-600 text-white">
          <p className="text-emerald-100">إجمالي الأرباح التقديرية</p>
          <h2 className="text-3xl font-black mt-1">{totalProfit} {db.settings.currency}</h2>
        </Card>
        <Card className="bg-rose-600 text-white">
          <p className="text-rose-100">عدد الفواتير</p>
          <h2 className="text-3xl font-black mt-1">{filteredSales.length}</h2>
        </Card>
      </div>

      <Card>
        <h3 className="text-lg font-bold mb-4">تفاصيل المبيعات</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead>
              <tr className="bg-slate-50">
                <th className="p-3 border-b">التاريخ</th>
                <th className="p-3 border-b">العميل</th>
                <th className="p-3 border-b">المبلغ</th>
                <th className="p-3 border-b">طريقة الدفع</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map(s => (
                <tr key={s.id} className="hover:bg-slate-50">
                  <td className="p-3 border-b">{new Date(s.date).toLocaleDateString('ar-EG')}</td>
                  <td className="p-3 border-b">{db.customers.find(c => c.id === s.customerId)?.name || 'نقدي'}</td>
                  <td className="p-3 border-b font-bold">{s.total}</td>
                  <td className="p-3 border-b">
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${s.paymentMethod === 'cash' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {s.paymentMethod === 'cash' ? 'نقدي' : 'آجل'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

const SettingsPage: React.FC<{ db: DBState, setDb: (db: DBState) => void }> = ({ db, setDb }) => {
  const [form, setForm] = useState(db.settings);

  const save = () => {
    setDb({ ...db, settings: form });
    alert('تم حفظ الإعدادات');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        setDb(data);
        alert('تم استعادة البيانات بنجاح');
      } catch (err) {
        alert('فشل في قراءة الملف');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <h3 className="text-lg font-bold mb-4">إعدادات الشركة</h3>
        <div className="space-y-4">
          <div><Label>اسم الشركة</Label><Input value={form.companyName} onChange={(e: any) => setForm({...form, companyName: e.target.value})} /></div>
          <div><Label>العملة</Label><Input value={form.currency} onChange={(e: any) => setForm({...form, currency: e.target.value})} /></div>
          <div><Label>اسم المستخدم</Label><Input value={form.username} onChange={(e: any) => setForm({...form, username: e.target.value})} /></div>
          <div><Label>كلمة المرور الجديدة</Label><Input type="password" value={form.password} onChange={(e: any) => setForm({...form, password: e.target.value})} /></div>
          <Button className="w-full" onClick={save}>حفظ التغييرات</Button>
        </div>
      </Card>

      <Card>
        <h3 className="text-lg font-bold mb-4">النسخ الاحتياطي</h3>
        <div className="space-y-4">
          <p className="text-slate-500 text-sm">احتفظ بنسخة من بياناتك بانتظام لتجنب فقدانها عند مسح بيانات المتصفح.</p>
          <Button variant="secondary" className="w-full" onClick={() => storage.backup()}>
            <Download className="w-5 h-5" /> تحميل نسخة احتياطية (JSON)
          </Button>
          <div className="border-t pt-4">
            <Label>استعادة نسخة سابقة</Label>
            <div className="relative mt-2">
               <input type="file" onChange={handleFileUpload} className="opacity-0 absolute inset-0 cursor-pointer" />
               <Button variant="primary" className="w-full pointer-events-none">
                 <Upload className="w-5 h-5" /> اختيار ملف الاستعادة
               </Button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

// --- Main App ---

export default function App() {
  const [db, setDb] = useState<DBState>(() => storage.loadData());
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<AppTab>('sale');
  
  const [loginUser, setLoginUser] = useState('');
  const [loginPass, setLoginPass] = useState('');

  useEffect(() => {
    storage.saveData(db);
  }, [db]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginUser === db.settings.username && loginPass === db.settings.password) {
      setIsAuthenticated(true);
    } else {
      alert('خطأ في اسم المستخدم أو كلمة المرور');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
        <Card className="w-full max-w-md p-10">
          <div className="text-center mb-10">
            <div className="w-20 h-20 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white shadow-lg shadow-indigo-200 mb-6">
              <ShoppingCart className="w-10 h-10" />
            </div>
            <h1 className="text-3xl font-black text-slate-900">نظام المبيعات POS</h1>
            <p className="text-slate-500 mt-2">برجاء تسجيل الدخول للمتابعة</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <Label>اسم المستخدم</Label>
              <Input value={loginUser} onChange={(e: any) => setLoginUser(e.target.value)} required />
            </div>
            <div>
              <Label>كلمة المرور</Label>
              <Input type="password" value={loginPass} onChange={(e: any) => setLoginPass(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full h-12 text-lg">دخول</Button>
          </form>
          <div className="mt-8 pt-6 border-t border-slate-100 text-center text-sm text-slate-400">
            جميع البيانات مخزنة محلياً على هذا الجهاز
          </div>
        </Card>
      </div>
    );
  }

  const NavItem = ({ id, label, icon: Icon }: { id: AppTab, label: string, icon: any }) => (
    <button
      onClick={() => setActiveTab(id)}
      className={`flex items-center gap-3 px-6 py-4 font-bold transition-all border-b-2 whitespace-nowrap ${
        activeTab === id 
          ? 'text-indigo-600 border-indigo-600 bg-indigo-50/50' 
          : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'
      }`}
    >
      <Icon className="w-5 h-5" />
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-20 no-print">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-600 p-2 rounded-lg text-white">
              <ShoppingCart className="w-6 h-6" />
            </div>
            <span className="text-xl font-black text-slate-900">{db.settings.companyName}</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
               مرحباً، {db.settings.username}
            </span>
            <button onClick={() => setIsAuthenticated(false)} className="text-rose-500 hover:text-rose-700">
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
        
        <div className="max-w-7xl mx-auto px-4 overflow-x-auto scrollbar-hide">
          <nav className="flex items-center">
            <NavItem id="sale" label="البيع" icon={ShoppingCart} />
            <NavItem id="items" label="الأصناف" icon={Package} />
            <NavItem id="customers" label="العملاء" icon={Users} />
            <NavItem id="stores" label="المخازن" icon={Warehouse} />
            <NavItem id="reports" label="التقارير" icon={BarChart3} />
            <NavItem id="settings" label="الإعدادات" icon={SettingsIcon} />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto w-full p-4 lg:p-8">
        <div className="mb-8 flex items-center gap-2 text-slate-400 no-print">
           <span className="text-xs uppercase font-bold tracking-wider">نظام POS</span>
           <ChevronRight className="w-4 h-4" />
           <span className="text-slate-900 font-bold capitalize">
             {activeTab === 'sale' && 'نقطة البيع المباشر'}
             {activeTab === 'items' && 'إدارة الأصناف والمخزون'}
             {activeTab === 'customers' && 'إدارة العملاء والمديونيات'}
             {activeTab === 'stores' && 'إدارة المخازن والمستودعات'}
             {activeTab === 'reports' && 'التقارير والإحصائيات'}
             {activeTab === 'settings' && 'إعدادات النظام'}
           </span>
        </div>

        <div className="pb-12">
          {activeTab === 'sale' && <SalePage db={db} setDb={setDb} />}
          {activeTab === 'items' && <ItemsPage db={db} setDb={setDb} />}
          {activeTab === 'customers' && <CustomersPage db={db} setDb={setDb} />}
          {activeTab === 'stores' && <StoresPage db={db} setDb={setDb} />}
          {activeTab === 'reports' && <ReportsPage db={db} />}
          {activeTab === 'settings' && <SettingsPage db={db} setDb={setDb} />}
        </div>
      </main>

      <footer className="bg-white border-t border-slate-200 py-4 text-center text-slate-400 text-sm no-print">
        © {new Date().getFullYear()} نظام المبيعات المباشرة. يعمل بالكامل دون الحاجة لإنترنت.
      </footer>
    </div>
  );
}
