import { Client } from "@stomp/stompjs";
import { authStorage } from "./auth";

class StompService {
  private client: Client | null = null;
  private subscription: any = null;

  connect(onMessageReceived: (payload: any) => void) {
    if (this.client?.active) {
      return;
    }

    // اگر کلایت قبلی غیرفعال شده بود، ریست شود
    if (this.client) {
      this.client = null;
    }

    const token = authStorage.getToken();
    const currentUserId = authStorage.getUserUuid() || authStorage.getUserId();

    if (!token || !currentUserId) {
      console.warn("[STOMP] Missing token or currentUserId");
      return;
    }

    //const brokerURL = "wss://api.mresalat.ir/messenger/websocket";
    // در محیط لوکال/توسعه به سرور Vite وصل شود، در پروداکشن به سرور اصلی
    const isDev =
      window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1";
    const wsProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";

    const brokerURL = isDev
      ? `${wsProtocol}//${window.location.host}/messenger/websocket`
      : "wss://api.mresalat.ir/messenger/websocket";

    this.client = new Client({
      brokerURL,
      connectHeaders: {
        Authorization: token.startsWith("Bearer ") ? token : `Bearer ${token}`,
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      debug: (str) => {
        console.log("[STOMP Debug]:", str);
      },
      onConnect: () => {
        console.log("[STOMP] Connected successfully");
        const userTopic = `user.${currentUserId}`;

        this.subscription = this.client?.subscribe(userTopic, (message) => {
          try {
            const parsed = JSON.parse(message.body);
            onMessageReceived(parsed);
          } catch (err) {
            console.error("[STOMP] Failed to parse message body:", err);
          }
        });
      },
      onStompError: (frame) => {
        console.error(
          "[STOMP] Broker error:",
          frame.headers["message"],
          frame.body,
        );
      },
      onWebSocketClose: () => {
        console.log("[STOMP] WebSocket closed");
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
      const activeClient = this.client;
      this.client = null;
      activeClient.deactivate();
    }
  }

  isConnected(): boolean {
    return !!this.client?.active;
  }
  sendMessage(destination: string, payload: any): boolean {
    if (!this.client || !this.client.active) {
      console.warn("STOMP client is not active/connected");
      return false;
    }

    try {
      this.client.publish({
        destination,
        body: JSON.stringify(payload),
      });
      return true;
    } catch (err) {
      console.error("Error publishing STOMP message:", err);
      return false;
    }
  }
}

export const stompService = new StompService();
