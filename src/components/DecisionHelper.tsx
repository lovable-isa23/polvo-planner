import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Order } from "@/types/pastry";
import { calculateROI, getROIColor, getROILabel } from "@/lib/calculations";
import {
  AlertCircle,
  CheckCircle2,
  TrendingDown,
  ThumbsUp,
  ThumbsDown,
  Sparkles,
  X,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatSmart } from "@/lib/formatters";
import { Button } from "@/components/ui/button";
import { useState, useRef, FormEvent } from "react";
import { chatWithAgent } from "@/lib/DecisionAgent";
import { Input } from "@/components/ui/input";
import Draggable from "react-draggable";

interface DecisionHelperProps {
  pendingOrders: Order[];
  onApprove: (order: Order) => void;
  onReject: (order: Order) => void;
}

export function DecisionHelper({
  pendingOrders,
  onApprove,
  onReject,
}: DecisionHelperProps) {
  const [swipingId, setSwipingId] = useState<string | null>(null);
  const [swipeOffset, setSwipeOffset] = useState(0);
  const startXRef = useRef(0);
  const currentXRef = useRef(0);

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<any[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [isAssistantThinking, setIsAssistantThinking] = useState(false);

  const handleSendMessage = async (e: FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMessage = { role: "user", content: chatInput };
    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    setChatInput("");
    setIsAssistantThinking(true);

    const agentResponse = await chatWithAgent(newMessages, pendingOrders);

    setIsAssistantThinking(false);

    if (agentResponse.tool_calls) {
      const toolCalls = agentResponse.tool_calls;
      const toolResponses = [];

      for (const toolCall of toolCalls) {
        let toolResponseContent = "";
        const args = JSON.parse(toolCall.function.arguments);
        if (toolCall.function.name === "approveOrder") {
          const order = pendingOrders.find((o) => o.id === args.orderId);
          if (order) {
            onApprove(order);
            toolResponseContent = `Order ${order.name} approved.`;
          } else {
            toolResponseContent = `Order with ID ${args.orderId} not found.`;
          }
        } else if (toolCall.function.name === "rejectOrder") {
          const order = pendingOrders.find((o) => o.id === args.orderId);
          if (order) {
            onReject(order);
            toolResponseContent = `Order ${order.name} rejected.`;
          } else {
            toolResponseContent = `Order with ID ${args.orderId} not found.`;
          }
        } else if (toolCall.function.name === "listPendingOrders") {
          toolResponseContent = JSON.stringify(
            pendingOrders.map((o) => ({
              id: o.id,
              name: o.name,
              quantity: o.quantity,
              price: o.price,
              profit: calculateROI(o).profit.toFixed(2),
            }))
          );
        }
        toolResponses.push({
          tool_call_id: toolCall.id,
          role: "tool",
          name: toolCall.function.name,
          content: toolResponseContent,
        });
      }

      const newMessagesWithToolResponses = [
        ...newMessages,
        agentResponse,
        ...toolResponses,
      ];
      setChatMessages(newMessagesWithToolResponses);

      setIsAssistantThinking(true);
      const finalAgentResponse = await chatWithAgent(
        newMessagesWithToolResponses,
        pendingOrders
      );
      setIsAssistantThinking(false);
      setChatMessages((prev) => [...prev, finalAgentResponse]);
    } else {
      setChatMessages((prev) => [...prev, agentResponse]);
    }
  };

  function weekStringToDate(weekString: string): Date | null {
    if (!weekString || !/^\d{4}-W\d{1,2}$/.test(weekString)) {
      const d = new Date(weekString);
      return isNaN(d.getTime()) ? null : d;
    }
    const [year, week] = weekString.split("-W").map(Number);
    const d = new Date(Date.UTC(year, 0, 4)); // Jan 4th is always in week 1
    d.setUTCDate(d.getUTCDate() + (week - 1) * 7 - ((d.getUTCDay() + 6) % 7));
    return d;
  }

  const ordersWithMetrics = pendingOrders
    .map((order) => {
      const date = weekStringToDate(order.dueDate);
      const correctedOrder = {
        ...order,
        dueDate: date ? date.toISOString().split("T")[0] : order.dueDate,
      };
      return {
        order: correctedOrder,
        metrics: calculateROI(correctedOrder),
      };
    })
    .sort((a, b) => {
      if (b.metrics.profit !== a.metrics.profit) {
        return b.metrics.profit - a.metrics.profit;
      }
      const dateA = a.order.dueDate
        ? new Date(a.order.dueDate).getTime()
        : Infinity;
      const dateB = b.order.dueDate
        ? new Date(b.order.dueDate).getTime()
        : Infinity;
      return dateA - dateB;
    });

  const handleTouchStart = (e: React.TouchEvent, orderId: string) => {
    setSwipingId(orderId);
    startXRef.current = e.touches[0].clientX;
    currentXRef.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!swipingId) return;
    currentXRef.current = e.touches[0].clientX;
    const offset = currentXRef.current - startXRef.current;
    setSwipeOffset(offset);
  };

  const handleTouchEnd = (order: Order) => {
    if (!swipingId) return;

    const swipeThreshold = 100;
    if (swipeOffset > swipeThreshold) {
      onApprove(order);
    } else if (swipeOffset < -swipeThreshold) {
      onReject(order);
    }

    setSwipingId(null);
    setSwipeOffset(0);
  };

  const handleMouseDown = (e: React.MouseEvent, orderId: string) => {
    setSwipingId(orderId);
    startXRef.current = e.clientX;
    currentXRef.current = e.clientX;
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!swipingId) return;
    currentXRef.current = e.clientX;
    const offset = currentXRef.current - startXRef.current;
    setSwipeOffset(offset);
  };

  const handleMouseUp = (order: Order) => {
    if (!swipingId) return;

    const swipeThreshold = 100;
    if (swipeOffset > swipeThreshold) {
      onApprove(order);
    } else if (swipeOffset < -swipeThreshold) {
      onReject(order);
    }

    setSwipingId(null);
    setSwipeOffset(0);
  };

  const recommendations = ordersWithMetrics.map(({ order, metrics }) => {
    const roiColor = getROIColor(metrics.roi);

    let recommendation = "";
    let icon = Sparkles;

    if (metrics.roi < 0) {
      recommendation = "Reject - This order will result in a loss";
      icon = TrendingDown;
    } else if (metrics.roi < 20) {
      recommendation = "Reconsider - Low ROI, try to negotiate better terms";
      icon = AlertCircle;
    } else if (metrics.roi < 40) {
      recommendation = "Accept with caution - Moderate returns";
      icon = AlertCircle;
    } else {
      recommendation = "Strongly recommend - Excellent returns";
      icon = CheckCircle2;
    }

    return {
      order,
      metrics,
      recommendation,
      icon,
      roiColor,
    };
  });

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Decision Assistant</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsChatOpen(true)}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Chat with AI Assistant
            </Button>
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            Swipe right or click <ThumbsUp className="inline h-3 w-3" /> to
            approve • Swipe left or click <ThumbsDown className="inline h-3 w-3" />
            to reject
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {recommendations.length === 0 ? (
            <p className="text-muted-foreground text-center py-4">
              No pending orders to evaluate
            </p>
          ) : (
            recommendations.map(
              ({ order, metrics, recommendation, icon: Icon, roiColor }) => {
                const isActive = swipingId === order.id;
                const offset = isActive ? swipeOffset : 0;
                const approveOpacity = Math.max(0, Math.min(1, offset / 100));
                const rejectOpacity = Math.max(0, Math.min(1, -offset / 100));

                return (
                  <div key={order.id} className="relative">
                    {/* Swipe feedback backgrounds */}
                    <div
                      className="absolute inset-0 rounded-lg flex items-center justify-start pl-8 pointer-events-none z-0"
                      style={{
                        backgroundColor: `hsl(var(--roi-excellent))`,
                        opacity: approveOpacity * 0.3,
                      }}
                    >
                      <ThumbsUp
                        className="h-8 w-8"
                        style={{ color: "hsl(var(--roi-excellent))" }}
                      />
                    </div>
                    <div
                      className="absolute inset-0 rounded-lg flex items-center justify-end pr-8 pointer-events-none z-0"
                      style={{
                        backgroundColor: `hsl(var(--roi-critical))`,
                        opacity: rejectOpacity * 0.3,
                      }}
                    >
                      <ThumbsDown
                        className="h-8 w-8"
                        style={{ color: "hsl(var(--roi-critical))" }}
                      />
                    </div>

                    <Alert
                      className="border-2 relative overflow-hidden cursor-grab active:cursor-grabbing transition-transform select-none"
                      style={{
                        borderColor: roiColor,
                        transform: `translateX(${offset}px)`,
                        background: `linear-gradient(135deg, ${roiColor}15, ${roiColor}05)`,
                      }}
                      onTouchStart={(e) => handleTouchStart(e, order.id)}
                      onTouchMove={handleTouchMove}
                      onTouchEnd={() => handleTouchEnd(order)}
                      onMouseDown={(e) => handleMouseDown(e, order.id)}
                      onMouseMove={handleMouseMove}
                      onMouseUp={() => handleMouseUp(order)}
                      onMouseLeave={() => {
                        if (swipingId === order.id) {
                          handleMouseUp(order);
                        }
                      }}
                    >
                      <Icon
                        className="h-4 w-4 relative z-10"
                        style={{ color: roiColor }}
                      />
                      <AlertDescription className="relative z-10">
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <p className="font-semibold">{order.name}</p>
                            <span
                              className="text-sm font-semibold"
                              style={{ color: roiColor }}
                            >
                              {getROILabel(metrics.roi)} ({formatSmart(metrics.roi)}%)
                            </span>
                          </div>
                          <p className="text-sm">{recommendation}</p>
                          <div className="grid grid-cols-3 gap-2 text-xs pt-2">
                            <div>
                              <p className="text-muted-foreground">Profit</p>
                              <p className="font-medium">
                                ${formatSmart(metrics.profit)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">
                                Profit/Hour
                              </p>
                              <p className="font-medium">
                                ${formatSmart(metrics.profitPerHour)}
                              </p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Channel</p>
                              <p className="font-medium capitalize">
                                {order.channel}
                              </p>
                            </div>
                          </div>

                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() => onApprove(order)}
                              size="sm"
                              className="flex-1 bg-accent hover:bg-accent/90 text-white dark:text-white"
                            >
                              <ThumbsUp className="h-4 w-4 mr-2" />
                              Approve
                            </Button>
                            <Button
                              onClick={() => onReject(order)}
                              size="sm"
                              variant="outline"
                              className="flex-1 border-[hsl(var(--roi-critical))] text-[hsl(var(--roi-critical))] hover:bg-[hsl(var(--roi-critical))]/10 bg-background"
                            >
                              <ThumbsDown className="h-4 w-4 mr-2" />
                              Reject
                            </Button>
                          </div>
                        </div>
                      </AlertDescription>
                    </Alert>
                  </div>
                );
              }
            )
          )}
        </CardContent>
      </Card>
      {isChatOpen && (
        <Draggable handle=".handle">
          <Card className="fixed bottom-10 right-10 w-96 bg-background z-50">
            <CardHeader className="handle cursor-move flex flex-row items-center justify-between py-2 px-4 border-b">
              <CardTitle className="text-lg">AI Assistant</CardTitle>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsChatOpen(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="h-96 flex flex-col">
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {chatMessages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${
                        message.role === "user"
                          ? "justify-end"
                          : "justify-start"
                      }`}
                    >
                      {message.content && (
                        <div
                          className={`p-2 rounded-lg ${
                            message.role === "user"
                              ? "bg-primary text-primary-foreground"
                              : "bg-muted"
                          }`}
                        >
                          {message.content}
                        </div>
                      )}
                    </div>
                  ))}
                  {isAssistantThinking && (
                    <div className="flex justify-start">
                      <div className="p-2 rounded-lg bg-muted">Thinking...</div>
                    </div>
                  )}
                </div>
                <form onSubmit={handleSendMessage} className="p-4 border-t">
                  <Input
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    placeholder="Ask about orders..."
                    disabled={isAssistantThinking}
                  />
                </form>
              </div>
            </CardContent>
          </Card>
        </Draggable>
      )}
    </>
  );
}