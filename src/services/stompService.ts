// codes/src/services/stompService.ts
import { Client } from "@stomp/stompjs";
import type { StompSubscription } from "@stomp/stompjs";

class StompService {
  private client: Client | null = null;
  private subscription: StompSubscription | null = null;

  connect(
    token: string,
    currentUserId: number | string,
    onMessageReceived: (payload: any) => void,
  ) {
    // جلوگیری از اتصالات همزمان و تکراری
    if (this.client?.active) {
      this.disconnect();
    }

    // آدرس پایه وب‌سوکت
    const baseUrl = import.meta.env.VITE_BASE_URL || "https://www.mresalat.ir";
    const socketUrl = `${baseUrl.replace(/^http/, "ws")}/messenger/websocket`;

    this.client = new Client({
      brokerURL: socketUrl,
      connectHeaders: {
        Authorization: token, // توکن خام بدون Bearer
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        if (import.meta.env.DEV) {
          console.log("[STOMP Debug]:", str);
        }
      },
      onConnect: () => {
        console.log("✅ Connected to WebSocket STOMP!");

        const userTopic = `user.${currentUserId}`;

        if (this.client) {
          this.subscription = this.client.subscribe(userTopic, (message) => {
            if (message.body) {
              try {
                const parsed = JSON.parse(message.body);
                console.log("[WebSocket Payload Received]:", parsed);
                onMessageReceived(parsed);
              } catch (err) {
                console.error("Error parsing socket JSON:", err);
              }
            }
          });
        }
      },
      onStompError: (frame) => {
        console.error("STOMP Broker error:", frame.headers["message"]);
        console.error("Details:", frame.body);
      },
      onWebSocketClose: () => {
        console.warn("WebSocket Connection Closed");
      },
    });

    this.client.activate();
  }

  disconnect() {
    if (this.subscription) {
      this.subscription.unsubscribe();
      this.subscription = null;
    }
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      console.log("WebSocket Disconnected");
    }
  }

  isConnected(): boolean {
    return !!this.client?.active;
  }
}

export const stompService = new StompService();
export default stompService;
