import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Package, 
  Users, 
  ShoppingCart, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  XCircle,
  Truck,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  MessageSquare,
  FileImage,
  Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import AdminChatSupport from '@/components/admin/AdminChatSupport';

interface Prescription {
  id: string;
  image_path: string;
  parsed_medicines: string[];
  user_consent: boolean;
}

interface Order {
  id: string;
  order_number: number;
  customer_phone: string;
  customer_name: string | null;
  items: any[];
  status: string;
  total_amount: number;
  delivery_fee: number;
  discount: number;
  address: any;
  payment_method: string;
  created_at: string;
  updated_at: string;
  prescription_id: string | null;
  prescription?: Prescription;
}

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending' },
  confirmed: { color: 'bg-blue-100 text-blue-800', icon: CheckCircle, label: 'Confirmed' },
  preparing: { color: 'bg-purple-100 text-purple-800', icon: Package, label: 'Preparing' },
  out_for_delivery: { color: 'bg-indigo-100 text-indigo-800', icon: Truck, label: 'Out for Delivery' },
  delivered: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Delivered' },
  cancelled: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Cancelled' },
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { user, isAdmin, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeller, setIsSeller] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [viewingPrescription, setViewingPrescription] = useState<{ url: string; medicines: string[] } | null>(null);

  // Check if user has seller role
  useEffect(() => {
    const checkSellerRole = async () => {
      if (!user) return;
      
      try {
        const { data, error } = await supabase
          .rpc('has_role', { _user_id: user.id, _role: 'seller' });
        
        if (!error) {
          setIsSeller(data === true);
        }
      } catch (err) {
        console.error('Error checking seller role:', err);
      }
    };

    checkSellerRole();
  }, [user]);

  // Redirect if not authorized
  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth');
      return;
    }
    
    if (!authLoading && user && !isAdmin && !isSeller) {
      // Wait a bit for role check to complete
      const timer = setTimeout(() => {
        if (!isAdmin && !isSeller) {
          toast({
            title: 'Access Denied',
            description: 'You do not have permission to access the admin dashboard.',
            variant: 'destructive',
          });
          navigate('/');
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [authLoading, user, isAdmin, isSeller, navigate, toast]);

  // Fetch orders with prescriptions
  const fetchOrders = async () => {
    try {
      setIsRefreshing(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Fetch prescriptions for orders that have them
      const ordersWithPrescriptions = await Promise.all(
        (data || []).map(async (order: any) => {
          if (order.prescription_id) {
            const { data: prescription } = await supabase
              .from('prescriptions')
              .select('id, image_path, parsed_medicines, user_consent')
              .eq('id', order.prescription_id)
              .single();
            
            return { ...order, prescription };
          }
          return order;
        })
      );

      setOrders(ordersWithPrescriptions as Order[]);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch orders: ' + err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  // View prescription image
  const handleViewPrescription = async (prescription: Prescription) => {
    try {
      const { data } = await supabase.storage
        .from('prescriptions')
        .createSignedUrl(prescription.image_path, 300); // 5 minute URL

      if (data?.signedUrl) {
        setViewingPrescription({
          url: data.signedUrl,
          medicines: prescription.parsed_medicines as string[],
        });
      }
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to load prescription image',
        variant: 'destructive',
      });
    }
  };

  useEffect(() => {
    if (user && (isAdmin || isSeller)) {
      fetchOrders();
    }
  }, [user, isAdmin, isSeller]);

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => 
        prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        )
      );

      toast({
        title: 'Status Updated',
        description: `Order status changed to ${statusConfig[newStatus]?.label || newStatus}`,
      });
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to update status: ' + err.message,
        variant: 'destructive',
      });
    }
  };

  // Filter orders
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.order_number.toString().includes(searchQuery) ||
      order.customer_phone.includes(searchQuery) ||
      (order.customer_name?.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  // Stats
  const stats = {
    total: orders.length,
    pending: orders.filter(o => o.status === 'pending').length,
    inProgress: orders.filter(o => ['confirmed', 'preparing', 'out_for_delivery'].includes(o.status)).length,
    delivered: orders.filter(o => o.status === 'delivered').length,
    revenue: orders.filter(o => o.status === 'delivered').reduce((sum, o) => sum + Number(o.total_amount), 0),
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin && !isSeller) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-bold mb-2">Checking Permissions...</h2>
          <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 md:pb-8">
      {/* Header */}
      <div className="bg-card border-b border-border sticky top-16 z-40">
        <div className="container px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-muted-foreground text-sm">
                {isAdmin ? 'Administrator' : 'Approved Seller'} Access
              </p>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={fetchOrders}
              disabled={isRefreshing}
            >
              <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      <div className="container px-4 py-6 space-y-6">
        {/* Tabs for Orders and Chat */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-2 max-w-md">
            <TabsTrigger value="orders" className="flex items-center gap-2">
              <Package className="w-4 h-4" />
              Orders
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4" />
              Chat Support
            </TabsTrigger>
          </TabsList>

          <TabsContent value="orders" className="space-y-6 mt-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Total Orders</CardDescription>
                  <CardTitle className="text-2xl">{stats.total}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ShoppingCart className="w-8 h-8 text-muted-foreground" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Pending</CardDescription>
                  <CardTitle className="text-2xl text-yellow-600">{stats.pending}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Clock className="w-8 h-8 text-yellow-600" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>In Progress</CardDescription>
                  <CardTitle className="text-2xl text-blue-600">{stats.inProgress}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Truck className="w-8 h-8 text-blue-600" />
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription>Revenue</CardDescription>
                  <CardTitle className="text-2xl text-green-600">Rs. {stats.revenue.toLocaleString()}</CardTitle>
                </CardHeader>
                <CardContent>
                  <TrendingUp className="w-8 h-8 text-green-600" />
                </CardContent>
              </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by order #, phone, or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Orders</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="confirmed">Confirmed</SelectItem>
                  <SelectItem value="preparing">Preparing</SelectItem>
                  <SelectItem value="out_for_delivery">Out for Delivery</SelectItem>
                  <SelectItem value="delivered">Delivered</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Orders List */}
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Package className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="font-medium text-lg">No orders found</h3>
                    <p className="text-muted-foreground">
                      {searchQuery || statusFilter !== 'all' 
                        ? 'Try adjusting your filters' 
                        : 'Orders will appear here once customers place them'}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredOrders.map((order) => {
                  const status = statusConfig[order.status] || statusConfig.pending;
                  const StatusIcon = status.icon;
                  const itemCount = order.items?.length || 0;

                  return (
                    <Card key={order.id} className="overflow-hidden">
                      <CardHeader className="pb-2">
                        <div className="flex items-start justify-between">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              Order #{order.order_number}
                              <Badge className={cn("text-xs", status.color)}>
                                <StatusIcon className="w-3 h-3 mr-1" />
                                {status.label}
                              </Badge>
                            </CardTitle>
                            <CardDescription>
                              {new Date(order.created_at).toLocaleString()}
                            </CardDescription>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-primary">Rs. {Number(order.total_amount).toLocaleString()}</p>
                            <p className="text-xs text-muted-foreground">{order.payment_method}</p>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* Customer Info */}
                        <div className="flex items-center gap-4 text-sm">
                          <div className="flex items-center gap-2">
                            <Users className="w-4 h-4 text-muted-foreground" />
                            <span>{order.customer_name || 'Guest'}</span>
                          </div>
                          <div className="text-muted-foreground">
                            {order.customer_phone}
                          </div>
                        </div>

                        {/* Items Summary */}
                        <div className="text-sm text-muted-foreground">
                          {itemCount} item{itemCount !== 1 ? 's' : ''} • 
                          {order.address?.fullAddress || 'No address'}
                        </div>

                        {/* Prescription */}
                        {order.prescription && order.prescription.user_consent && (
                          <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg">
                            <FileImage className="w-4 h-4 text-primary" />
                            <span className="text-sm text-primary font-medium">Prescription attached</span>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewPrescription(order.prescription!)}
                              className="ml-auto gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              View
                            </Button>
                          </div>
                        )}

                        {/* Status Update */}
                        <div className="flex items-center gap-2 pt-2 border-t border-border">
                          <span className="text-sm text-muted-foreground">Update Status:</span>
                          <div className="flex flex-wrap gap-2">
                            {['confirmed', 'preparing', 'out_for_delivery', 'delivered', 'cancelled'].map((s) => (
                              <Button
                                key={s}
                                variant={order.status === s ? 'default' : 'outline'}
                                size="sm"
                                onClick={() => updateOrderStatus(order.id, s)}
                                disabled={order.status === s}
                                className="text-xs"
                              >
                                {statusConfig[s]?.label || s}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })
              )}
            </div>
          </TabsContent>

          <TabsContent value="chat" className="mt-6">
            <AdminChatSupport />
          </TabsContent>
        </Tabs>
      </div>

      {/* Prescription View Modal */}
      {viewingPrescription && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4" onClick={() => setViewingPrescription(null)}>
          <div className="bg-card rounded-2xl p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <FileImage className="w-5 h-5 text-primary" />
              Prescription Image
            </h3>
            <img 
              src={viewingPrescription.url} 
              alt="Prescription" 
              className="w-full rounded-lg border border-border mb-4"
            />
            {viewingPrescription.medicines.length > 0 && (
              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-sm font-medium mb-2">Detected Medicines:</p>
                <div className="flex flex-wrap gap-2">
                  {viewingPrescription.medicines.map((med, i) => (
                    <Badge key={i} variant="secondary">{med}</Badge>
                  ))}
                </div>
              </div>
            )}
            <Button className="w-full mt-4" onClick={() => setViewingPrescription(null)}>
              Close
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;