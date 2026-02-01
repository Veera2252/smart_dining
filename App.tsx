import React, { useState, useMemo } from 'react';
import { MENU_ITEMS as INITIAL_MENU_ITEMS, CATEGORIES } from './data/menu';
import MenuItemCard from './components/MenuItemCard';
import CustomizationModal from './components/CustomizationModal';
import CartDrawer from './components/CartDrawer';
import KitchenView from './components/KitchenView';
import AdminDashboard from './components/AdminDashboard';
import LoginScreen from './components/LoginScreen';
import { MenuItem, OrderItem, CustomizationOptions, Order, AiAnalysisResult, SpiceLevel, CustomerSession } from './types';
import { ShoppingBag, Search, UtensilsCrossed, ChefHat, LayoutGrid, BarChart3, LogOut } from 'lucide-react';

// --- MOCK DATA SEEDING ---
const generateMockOrders = (currentMenuItems: MenuItem[]): Order[] => {
    const orders: Order[] = [];
    const getRandomItem = () => currentMenuItems[Math.floor(Math.random() * currentMenuItems.length)];
    
    for(let i=0; i<5; i++) {
        const items: OrderItem[] = [];
        const numItems = Math.floor(Math.random() * 3) + 1;
        for(let j=0; j<numItems; j++) {
            items.push({
                cartId: `mock-${i}-${j}`,
                menuItem: getRandomItem(),
                quantity: 1,
                customization: {
                    lowSalt: Math.random() > 0.7,
                    lowSugar: Math.random() > 0.8,
                    lowOil: false,
                    spiceLevel: Math.random() > 0.8 ? SpiceLevel.HOT : SpiceLevel.NONE,
                    allergyNotes: Math.random() > 0.9 ? 'Peanuts' : '',
                    specialRequests: ''
                }
            });
        }
        orders.push({
            id: `hist-${i}`,
            tableNumber: (Math.floor(Math.random() * 10) + 1).toString(),
            items: items,
            status: 'completed',
            timestamp: new Date(Date.now() - Math.random() * 10000000)
        });
    }
    return orders;
};

const App: React.FC = () => {
  // Navigation State
  const [view, setView] = useState<'customer' | 'kitchen' | 'admin'>('customer');

  // Customer Session State
  const [customerSession, setCustomerSession] = useState<CustomerSession | null>(null);

  // App Data State
  const [menuItems, setMenuItems] = useState<MenuItem[]>(INITIAL_MENU_ITEMS);
  const [orders, setOrders] = useState<Order[]>(generateMockOrders(INITIAL_MENU_ITEMS));

  // Customer Interaction State
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedItemForCustomization, setSelectedItemForCustomization] = useState<MenuItem | null>(null);

  // ---- Login Handler ----
  const handleLogin = (table: string, name: string) => {
    setCustomerSession({ tableNumber: table, customerName: name });
  };

  const handleStaffAccess = () => {
      // In a real app, this would route to a separate URL or prompt for authentication
      setView('admin');
  };

  const handleLogout = () => {
    setCustomerSession(null);
    setCart([]);
  };

  // ---- CRUD Handlers ----
  const handleAddMenuItem = (item: MenuItem) => {
    setMenuItems(prev => [...prev, item]);
  };

  const handleUpdateMenuItem = (updatedItem: MenuItem) => {
    setMenuItems(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const handleDeleteMenuItem = (id: string) => {
    setMenuItems(prev => prev.filter(item => item.id !== id));
  };

  // ---- Logic ----

  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            item.description.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchTerm, menuItems]);

  const handleOpenCustomization = (item: MenuItem) => {
    setSelectedItemForCustomization(item);
    setIsModalOpen(true);
  };

  const handleAddToCart = (customization: CustomizationOptions, quantity: number) => {
    if (!selectedItemForCustomization) return;

    const newItem: OrderItem = {
      cartId: Math.random().toString(36).substr(2, 9),
      menuItem: selectedItemForCustomization,
      customization,
      quantity
    };

    setCart(prev => [...prev, newItem]);
    setIsModalOpen(false);
    setSelectedItemForCustomization(null);
  };

  const handleRemoveFromCart = (cartId: string) => {
    setCart(prev => prev.filter(item => item.cartId !== cartId));
  };

  const handlePlaceOrder = (items: OrderItem[], analysis: Record<string, AiAnalysisResult>) => {
    if (!customerSession) return;

    const newOrder: Order = {
        id: Math.random().toString(36).substr(2, 9),
        tableNumber: customerSession.tableNumber,
        customerName: customerSession.customerName,
        items: [...items],
        status: 'pending',
        timestamp: new Date(),
        analysisResults: analysis
    };
    setOrders(prev => [...prev, newOrder]);
    setCart([]);
  };

  const handleCompleteOrder = (orderId: string) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'completed' } : o));
  };

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  // Render Login Screen if in Customer View and Not Logged In
  if (view === 'customer' && !customerSession) {
      return (
         <LoginScreen onLogin={handleLogin} onStaffAccess={handleStaffAccess} />
      );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24 font-sans text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-blue-900/95 backdrop-blur-md border-b border-blue-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => setView('customer')}>
            <div className="bg-white text-blue-900 p-2 rounded-lg shadow-sm">
                <UtensilsCrossed size={20} />
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight hidden sm:block">DineRight</h1>
          </div>

          {/* View Toggle - ONLY visible if NOT a customer (i.e. Admin or Kitchen view) or if explicitly switched */}
          {view !== 'customer' && (
             <div className="flex bg-blue-800/50 p-1 rounded-lg overflow-x-auto no-scrollbar">
                <button 
                   onClick={() => setView('customer')}
                   className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${view === 'customer' ? 'bg-white shadow text-blue-900' : 'text-blue-100 hover:text-white hover:bg-blue-700/50'}`}
                >
                   <LayoutGrid size={16} /> <span className="hidden sm:inline">Menu</span>
                </button>
                <button 
                   onClick={() => setView('kitchen')}
                   className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${view === 'kitchen' ? 'bg-white shadow text-blue-900' : 'text-blue-100 hover:text-white hover:bg-blue-700/50'}`}
                >
                   <ChefHat size={16} /> 
                   <span className="hidden sm:inline">Kitchen</span>
                   {pendingOrdersCount > 0 && <span className="ml-1 bg-red-500 text-white text-[10px] px-1.5 rounded-full">{pendingOrdersCount}</span>}
                </button>
                <button 
                   onClick={() => setView('admin')}
                   className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap ${view === 'admin' ? 'bg-white shadow text-blue-900' : 'text-blue-100 hover:text-white hover:bg-blue-700/50'}`}
                >
                   <BarChart3 size={16} /> <span className="hidden sm:inline">Admin</span>
                </button>
             </div>
          )}
          
          <div className="flex items-center gap-3">
              {view === 'customer' && customerSession && (
                <div className="hidden md:flex flex-col items-end text-white text-xs">
                    <span className="opacity-70">Table {customerSession.tableNumber}</span>
                    <span className="font-bold">{customerSession.customerName}</span>
                </div>
              )}

              {view === 'customer' && (
                <button 
                    onClick={() => setIsCartOpen(true)}
                    className={`relative p-2 rounded-full transition-colors text-white hover:bg-blue-800`}
                >
                    <ShoppingBag size={24} />
                    {totalItems > 0 && (
                    <span className="absolute top-0 right-0 bg-sky-400 text-blue-950 text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full shadow-sm ring-2 ring-blue-900">
                        {totalItems}
                    </span>
                    )}
                </button>
              )}
              
              {/* Logout / Exit Buttons */}
              {view === 'customer' && customerSession && (
                  <button onClick={handleLogout} className="p-2 text-blue-200 hover:text-white hover:bg-blue-800 rounded-full" title="Leave Table">
                      <LogOut size={20} />
                  </button>
              )}
              {view !== 'customer' && (
                  <button onClick={() => setView('customer')} className="p-2 text-blue-200 hover:text-white hover:bg-blue-800 rounded-full" title="Exit Staff Mode">
                       <LogOut size={20} />
                  </button>
              )}
          </div>
        </div>

        {/* Categories Scroller (Only in Menu View) */}
        {view === 'customer' && (
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-7xl mx-auto px-4 py-3 overflow-x-auto no-scrollbar">
                    <div className="flex gap-2">
                        {CATEGORIES.map(cat => (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                                    selectedCategory === cat 
                                    ? 'bg-blue-600 text-white shadow-md shadow-blue-200' 
                                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        
        {view === 'customer' && (
            <>
                {/* Search Bar */}
                <div className="relative mb-8">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input 
                        type="text" 
                        placeholder="Search for dishes..." 
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-900/10 focus:border-blue-500 transition-all"
                    />
                </div>

                {/* Menu Grid */}
                {filteredItems.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredItems.map(item => (
                            <MenuItemCard 
                                key={item.id} 
                                item={item} 
                                onAdd={handleOpenCustomization} 
                            />
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20">
                        <p className="text-slate-400 text-lg">No items found matching your criteria.</p>
                    </div>
                )}
            </>
        )}

        {view === 'kitchen' && (
            <KitchenView 
                orders={orders} 
                onCompleteOrder={handleCompleteOrder}
                menuItems={menuItems}
                onAddMenu={handleAddMenuItem}
                onUpdateMenu={handleUpdateMenuItem}
                onDeleteMenu={handleDeleteMenuItem}
            />
        )}

        {view === 'admin' && (
            <AdminDashboard 
                orders={orders}
                menuItems={menuItems}
                onAddMenu={handleAddMenuItem}
                onUpdateMenu={handleUpdateMenuItem}
                onDeleteMenu={handleDeleteMenuItem}
            />
        )}
       
      </main>

      {/* Modals */}
      <CustomizationModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        item={selectedItemForCustomization}
        onConfirm={handleAddToCart}
      />

      <CartDrawer 
        isOpen={isCartOpen}
        onClose={() => setIsCartOpen(false)}
        cart={cart}
        onRemove={handleRemoveFromCart}
        onClear={() => setCart([])}
        onPlaceOrder={handlePlaceOrder}
      />
    </div>
  );
};

export default App;