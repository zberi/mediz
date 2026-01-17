import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, 
  Play, 
  Pause, 
  Volume2, 
  Clock, 
  CheckCircle, 
  XCircle,
  Loader2,
  Eye,
  RefreshCw,
  Phone,
  User,
  FileText,
  AlertTriangle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';

interface ParsedItem {
  name: string;
  quantity: number;
  notes?: string;
}

interface ParsedOrder {
  items: ParsedItem[];
  customerNotes?: string;
  confidence: 'high' | 'medium' | 'low';
  warnings?: string[];
}

interface VoiceOrder {
  id: string;
  user_id: string;
  customer_phone: string;
  customer_name: string | null;
  audio_path: string;
  audio_duration_seconds: number | null;
  transcription: string | null;
  parsed_items: ParsedOrder | null;
  status: string;
  processing_status: string;
  order_id: string | null;
  user_consent: boolean;
  admin_notes: string | null;
  created_at: string;
  updated_at: string;
}

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock, label: 'Pending Review' },
  reviewed: { color: 'bg-blue-100 text-blue-800', icon: Eye, label: 'Reviewed' },
  confirmed: { color: 'bg-green-100 text-green-800', icon: CheckCircle, label: 'Confirmed' },
  rejected: { color: 'bg-red-100 text-red-800', icon: XCircle, label: 'Rejected' },
};

export default function AdminVoiceOrders() {
  const { toast } = useToast();
  const [voiceOrders, setVoiceOrders] = useState<VoiceOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<VoiceOrder | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const audioRef = useRef<HTMLAudioElement>(null);

  // Fetch voice orders
  const fetchVoiceOrders = async () => {
    try {
      setIsRefreshing(true);
      const { data, error } = await supabase
        .from('voice_orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Type cast the parsed_items correctly
      const typedOrders = (data || []).map(order => ({
        ...order,
        parsed_items: order.parsed_items as unknown as ParsedOrder | null
      }));

      setVoiceOrders(typedOrders);
    } catch (err: any) {
      toast({
        title: 'Error',
        description: 'Failed to fetch voice orders: ' + err.message,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVoiceOrders();

    // Set up realtime subscription
    const channel = supabase
      .channel('voice_orders_changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'voice_orders' },
        () => fetchVoiceOrders()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Load audio for playback
  const loadAudio = async (order: VoiceOrder) => {
    setSelectedOrder(order);
    setAdminNotes(order.admin_notes || '');

    if (order.user_consent) {
      try {
        const { data } = await supabase.storage
          .from('voice-orders')
          .createSignedUrl(order.audio_path, 600); // 10 minute URL

        if (data?.signedUrl) {
          setAudioUrl(data.signedUrl);
        }
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to load audio',
          variant: 'destructive',
        });
      }
    }
  };

  // Toggle playback
  const togglePlayback = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Update order status
  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('voice_orders')
        .update({ 
          status: newStatus,
          admin_notes: adminNotes 
        })
        .eq('id', orderId);

      if (error) throw error;

      setVoiceOrders(prev =>
        prev.map(order =>
          order.id === orderId ? { ...order, status: newStatus, admin_notes: adminNotes } : order
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
  const filteredOrders = voiceOrders.filter(order => {
    return statusFilter === 'all' || order.status === statusFilter;
  });

  // Stats
  const stats = {
    total: voiceOrders.length,
    pending: voiceOrders.filter(o => o.status === 'pending').length,
    reviewed: voiceOrders.filter(o => o.status === 'reviewed').length,
    confirmed: voiceOrders.filter(o => o.status === 'confirmed').length,
  };

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case 'high':
        return <Badge className="bg-green-100 text-green-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge variant="destructive">Low</Badge>;
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Voice Orders</CardDescription>
            <CardTitle className="text-2xl">{stats.total}</CardTitle>
          </CardHeader>
          <CardContent>
            <Mic className="w-8 h-8 text-muted-foreground" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Pending Review</CardDescription>
            <CardTitle className="text-2xl text-yellow-600">{stats.pending}</CardTitle>
          </CardHeader>
          <CardContent>
            <Clock className="w-8 h-8 text-yellow-600" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Reviewed</CardDescription>
            <CardTitle className="text-2xl text-blue-600">{stats.reviewed}</CardTitle>
          </CardHeader>
          <CardContent>
            <Eye className="w-8 h-8 text-blue-600" />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Confirmed</CardDescription>
            <CardTitle className="text-2xl text-green-600">{stats.confirmed}</CardTitle>
          </CardHeader>
          <CardContent>
            <CheckCircle className="w-8 h-8 text-green-600" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-4">
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Orders</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="confirmed">Confirmed</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>

        <Button
          variant="outline"
          size="sm"
          onClick={fetchVoiceOrders}
          disabled={isRefreshing}
        >
          <RefreshCw className={cn("w-4 h-4 mr-2", isRefreshing && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Mic className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="font-medium text-lg">No voice orders found</h3>
              <p className="text-muted-foreground">
                Voice orders will appear here when customers place them
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const status = statusConfig[order.status] || statusConfig.pending;
            const StatusIcon = status.icon;
            const parsedItems = order.parsed_items;

            return (
              <Card key={order.id} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Mic className="w-4 h-4 text-primary" />
                        Voice Order
                        <Badge className={cn("text-xs", status.color)}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </Badge>
                        {parsedItems && getConfidenceBadge(parsedItems.confidence)}
                      </CardTitle>
                      <CardDescription>
                        {format(new Date(order.created_at), 'PPp')}
                      </CardDescription>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => loadAudio(order)}
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  {/* Customer Info */}
                  <div className="flex items-center gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{order.customer_name || 'Guest'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Phone className="w-4 h-4" />
                      {order.customer_phone}
                    </div>
                    {order.audio_duration_seconds && (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="w-4 h-4" />
                        {Math.floor(order.audio_duration_seconds)}s
                      </div>
                    )}
                  </div>

                  {/* Transcription Preview */}
                  {order.transcription && (
                    <div className="p-3 bg-muted rounded-lg text-sm">
                      <p className="font-medium text-muted-foreground mb-1">Transcription:</p>
                      <p className="line-clamp-2">{order.transcription}</p>
                    </div>
                  )}

                  {/* Detected Items */}
                  {parsedItems && parsedItems.items.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {parsedItems.items.slice(0, 3).map((item, idx) => (
                        <Badge key={idx} variant="secondary">
                          {item.name} x{item.quantity}
                        </Badge>
                      ))}
                      {parsedItems.items.length > 3 && (
                        <Badge variant="outline">+{parsedItems.items.length - 3} more</Badge>
                      )}
                    </div>
                  )}

                  {/* Consent Warning */}
                  {!order.user_consent && (
                    <div className="flex items-center gap-2 text-sm text-destructive">
                      <AlertTriangle className="w-4 h-4" />
                      No consent for audio playback
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Detail Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => {
        setSelectedOrder(null);
        setAudioUrl(null);
        setIsPlaying(false);
      }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mic className="w-5 h-5 text-primary" />
              Voice Order Details
            </DialogTitle>
            <DialogDescription>
              Review and process this voice order
            </DialogDescription>
          </DialogHeader>
          
          {selectedOrder && (
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Customer Info */}
                <div className="space-y-2">
                  <h4 className="font-medium">Customer Information</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Name:</span>
                      <p className="font-medium">{selectedOrder.customer_name || 'Guest'}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>
                      <p className="font-medium">{selectedOrder.customer_phone}</p>
                    </div>
                  </div>
                </div>

                {/* Audio Player */}
                {audioUrl && selectedOrder.user_consent && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <Volume2 className="w-4 h-4" />
                      Audio Recording
                    </h4>
                    <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={togglePlayback}
                      >
                        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      </Button>
                      <audio
                        ref={audioRef}
                        src={audioUrl}
                        onEnded={() => setIsPlaying(false)}
                        className="flex-1"
                        controls
                      />
                    </div>
                  </div>
                )}

                {/* Transcription */}
                {selectedOrder.transcription && (
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <FileText className="w-4 h-4" />
                      Transcription
                    </h4>
                    <div className="p-4 bg-muted rounded-lg">
                      <p>{selectedOrder.transcription}</p>
                    </div>
                  </div>
                )}

                {/* Parsed Items */}
                {selectedOrder.parsed_items && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Detected Items</h4>
                      {getConfidenceBadge(selectedOrder.parsed_items.confidence)}
                    </div>
                    
                    {selectedOrder.parsed_items.items.length > 0 ? (
                      <div className="space-y-2">
                        {selectedOrder.parsed_items.items.map((item, idx) => (
                          <div key={idx} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                            <div>
                              <p className="font-medium">{item.name}</p>
                              {item.notes && <p className="text-sm text-muted-foreground">{item.notes}</p>}
                            </div>
                            <Badge>Qty: {item.quantity}</Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No items detected</p>
                    )}

                    {selectedOrder.parsed_items.warnings && selectedOrder.parsed_items.warnings.length > 0 && (
                      <div className="p-3 bg-destructive/10 rounded-lg">
                        <p className="font-medium text-destructive mb-1">Warnings:</p>
                        <ul className="list-disc pl-4 text-sm">
                          {selectedOrder.parsed_items.warnings.map((warning, idx) => (
                            <li key={idx}>{warning}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}

                {/* Admin Notes */}
                <div className="space-y-2">
                  <h4 className="font-medium">Admin Notes</h4>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Add notes about this order..."
                    className="min-h-24"
                  />
                </div>

                {/* Status Actions */}
                <div className="space-y-2">
                  <h4 className="font-medium">Update Status</h4>
                  <div className="flex flex-wrap gap-2">
                    {['reviewed', 'confirmed', 'rejected'].map((s) => (
                      <Button
                        key={s}
                        variant={selectedOrder.status === s ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => updateOrderStatus(selectedOrder.id, s)}
                        disabled={selectedOrder.status === s}
                      >
                        {statusConfig[s]?.label || s}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
