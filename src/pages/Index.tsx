
import { useState, useEffect } from 'react';
import { Order, Channel } from '@/types/pastry';
import { OrderCalculator } from '@/components/OrderCalculator';
import { WeeklyCalendar } from '@/components/WeeklyCalendar';
import { ChannelAllocator } from '@/components/ChannelAllocator';
import { DecisionHelper } from '@/components/DecisionHelper';
import { Insights } from '@/components/Insights';
import { AuthForm } from '@/components/AuthForm';
import { ReportGenerator } from '@/components/ReportGenerator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useOrders } from '@/hooks/useOrders';
import { Plus, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';

/**
 * The main index page of the Polvo Planner application.
 * This component serves as the primary dashboard, orchestrating various sub-components
 * like the calendar, decision helper, and channel allocator.
 * It also handles user authentication and data fetching.
 */
const Index = () => {
  // State for user session and UI control.
  const [user, setUser] = useState<any>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [activeTab, setActiveTab] = useState('calendar');

  // Custom hook to manage order data, including fetching and mutations.
  const {
    orders,
    addOrder,
    updateOrder,
    isLoading
  } = useOrders();

  // Effect to handle user authentication state changes.
  useEffect(() => {
    supabase.auth.getSession().then(({
      data: {
        session
      }
    }) => {
      setUser(session?.user ?? null);
    });
    const {
      data: {
        subscription
      }
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Handlers for order actions, passed down to child components.
  const handleAddOrder = async (order: Order) => {
    await addOrder(order);
    setIsCalculatorOpen(false);
  };

  const handleSelectOrder = (order: Order) => {
    // Placeholder for future functionality, e.g., opening an order detail view.
    console.log('Selected order:', order);
  };

  const handleUpdateOrder = async (order: Order) => {
    await updateOrder(order);
  };

  const handleApprove = async (order: Order) => {
    await updateOrder({ ...order, status: 'approved' });
    toast.success(`${order.name} approved!`);
  };

  const handleReject = async (order: Order) => {
    await updateOrder({ ...order, status: 'rejected' });
    toast.info(`${order.name} rejected`);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success('Signed out successfully');
  };

  const handleChannelClick = (channel: Channel) => {
    setSelectedChannel(channel);
    setActiveTab('calendar'); // Switch to calendar view when a channel is selected.
  };

  // Filter orders based on their status for different parts of the UI.
  const pendingOrders = orders.filter(o => o.status === 'pending');
  const approvedOrders = orders.filter(o => o.status === 'approved');
  // Further filter approved orders if a specific channel is selected.
  const filteredOrders = selectedChannel 
    ? approvedOrders.filter(o => o.channel === selectedChannel)
    : approvedOrders;

  // If the user is not authenticated, show the login form.
  if (!user) {
    return <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <AuthForm />
      </div>;
  }

  // Display a loading state while orders are being fetched.
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto" />
          <p className="text-muted-foreground">Loading your orders...</p>
        </div>
      </div>
    );
  }

  // Main dashboard layout.
  return <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        <header className="text-center space-y-2">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-3xl md:text-4xl font-bold">Polvo Planner</h1>
            <div className="flex gap-2">
              <ReportGenerator orders={filteredOrders} />
              <Button variant="outline" onClick={() => window.location.href = '/settings'}>
                <SettingsIcon className="h-4 w-4 mr-2" />
                Settings
              </Button>
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground">
            Plan production, calculate ROI, and optimize your pastry business
          </p>
        </header>

        {/* Tab-based navigation for the main sections of the dashboard. */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
            <TabsTrigger value="channels">Channels</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="calendar" className="space-y-6">
            <DecisionHelper 
              pendingOrders={pendingOrders} 
              onApprove={handleApprove}
              onReject={handleReject}
            />
            <WeeklyCalendar orders={filteredOrders} onSelectOrder={handleSelectOrder} onUpdateOrder={handleUpdateOrder} />
            {selectedChannel && (
              <div className="flex items-center gap-2 justify-center">
                <span className="text-sm text-muted-foreground">
                  Showing {selectedChannel} orders only
                </span>
                <Button variant="ghost" size="sm" onClick={() => setSelectedChannel(null)}>
                  Clear filter
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="channels" className="space-y-6">
            <ChannelAllocator orders={orders} onChannelClick={handleChannelClick} />
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <Insights orders={orders} />
          </TabsContent>
        </Tabs>

        {/* Floating action button to open the new order calculator dialog. */}
        <Dialog open={isCalculatorOpen} onOpenChange={setIsCalculatorOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="fixed bottom-8 right-8 h-14 w-14 rounded-full shadow-lg">
              <Plus className="h-6 w-6" />
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create New Order</DialogTitle>
            </DialogHeader>
            <OrderCalculator onAddOrder={handleAddOrder} />
          </DialogContent>
        </Dialog>
      </div>
    </div>;
};
export default Index;
