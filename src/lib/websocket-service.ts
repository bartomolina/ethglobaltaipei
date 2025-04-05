export interface PlayerState {
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    y: number;
  };
  face?: string;
  lastUpdate: string;
}

type GameState = {
  [clientId: string]: PlayerState;
};

class WebSocketService {
  private ws: WebSocket | null = null;
  private onUpdateCallback: ((state: GameState) => void) | null = null;
  private isConnecting = false;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;

  private getWebSocketUrl(): string {
    // Use environment variable with fallback for local development
    return process.env.NEXT_PUBLIC_WEBSOCKET_URL || "ws://localhost:8765";
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;

    try {
      this.isConnecting = true;
      const wsUrl = this.getWebSocketUrl();
      console.log(`Attempting to connect to game server at ${wsUrl}...`);

      this.ws = new WebSocket(wsUrl);

      this.ws.onopen = () => {
        console.log("Connected to game server");
        this.isConnecting = false;
        this.reconnectAttempts = 0;
        if (this.reconnectTimeout) {
          clearTimeout(this.reconnectTimeout);
          this.reconnectTimeout = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const gameState: GameState = JSON.parse(event.data);
          if (this.onUpdateCallback) {
            this.onUpdateCallback(gameState);
          }
        } catch (error) {
          console.warn("Error parsing game state:", error);
        }
      };

      this.ws.onerror = (error) => {
        console.warn("WebSocket connection error:", error);
        this.isConnecting = false;
      };

      this.ws.onclose = () => {
        console.log("Disconnected from game server");
        this.isConnecting = false;
        this.ws = null;

        // Try to reconnect with exponential backoff
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          const backoffTime = Math.min(
            1000 * Math.pow(2, this.reconnectAttempts),
            10000
          );
          console.log(
            `Reconnecting in ${backoffTime}ms (attempt ${
              this.reconnectAttempts + 1
            }/${this.maxReconnectAttempts})`
          );

          this.reconnectTimeout = setTimeout(() => {
            this.reconnectAttempts++;
            this.connect();
          }, backoffTime);
        } else {
          console.warn(
            "Max reconnection attempts reached - multiplayer features will be disabled"
          );
        }
      };
    } catch (error) {
      console.warn("Failed to create WebSocket connection:", error);
      this.isConnecting = false;
      this.ws = null;
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.isConnecting = false;
    this.reconnectAttempts = 0;
  }

  sendState(state: PlayerState) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      try {
        this.ws.send(JSON.stringify(state));
      } catch (error) {
        console.warn("Error sending state:", error);
      }
    }
  }

  onUpdate(callback: (state: GameState) => void) {
    this.onUpdateCallback = callback;
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}

// Export a singleton instance
export const webSocketService = new WebSocketService();
