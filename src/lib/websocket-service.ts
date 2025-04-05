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
  private maxReconnectAttempts = 3;

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) return;

    try {
      this.isConnecting = true;
      console.log("Attempting to connect to game server...");

      this.ws = new WebSocket("ws://localhost:8765");

      this.ws.onopen = () => {
        console.log("Connected to game server");
        this.isConnecting = false;
        this.reconnectAttempts = 0;
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
        console.warn(
          "WebSocket connection error - multiplayer features will be disabled"
        );
        this.isConnecting = false;
        this.ws = null;
      };

      this.ws.onclose = () => {
        console.log("Disconnected from game server");
        this.isConnecting = false;
        this.ws = null;

        // Try to reconnect if we haven't exceeded max attempts
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(
            `Reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`
          );
          setTimeout(() => this.connect(), 2000);
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
