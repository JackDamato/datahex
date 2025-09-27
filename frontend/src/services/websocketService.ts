/**
 * WebSocket Service for Real-time Communication
 * 
 * This service handles WebSocket connections to the backend for streaming
 * partial results from data analysis operations like correlation analysis.
 */

export interface WebSocketMessage {
  type: 'status' | 'progress' | 'complete' | 'error' | 'correlation_analysis_complete' | 'visualization_complete';
  message: string;
  progress?: number;
  data?: any;
  timestamp?: string;
}

export interface WebSocketCallbacks {
  onStatus?: (message: string, progress: number) => void;
  onProgress?: (message: string, progress: number, data: any) => void;
  onComplete?: (data: any) => void;
  onError?: (error: string) => void;
  onCorrelationComplete?: (data: any) => void;
  onVisualizationComplete?: (data: any) => void;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private projectId: string | null = null;
  private callbacks: WebSocketCallbacks = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000; // Start with 1 second
  private isConnecting = false;
  private shouldReconnect = true;

  constructor() {
    this.url = this.getWebSocketUrl();
  }

  private getWebSocketUrl(): string {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = process.env.NODE_ENV === 'production' ? '' : ':3001';
    return `${protocol}//${host}${port}/ws`;
  }

  /**
   * Connect to WebSocket server
   */
  connect(projectId: string, callbacks: WebSocketCallbacks): Promise<void> {
    return new Promise((resolve, reject) => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        console.log('🔗 WebSocket already connected');
        resolve();
        return;
      }

      if (this.isConnecting) {
        console.log('🔗 WebSocket connection already in progress');
        resolve();
        return;
      }

      this.projectId = projectId;
      this.callbacks = callbacks;
      this.isConnecting = true;
      this.shouldReconnect = true;

      const wsUrl = `${this.url}?projectId=${encodeURIComponent(projectId)}`;
      console.log(`🔗 Connecting to WebSocket: ${wsUrl}`);

      try {
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
          console.log('✅ WebSocket connected successfully');
          this.isConnecting = false;
          this.reconnectAttempts = 0;
          this.reconnectDelay = 1000;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: WebSocketMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
          }
        };

        this.ws.onclose = (event) => {
          console.log('🔌 WebSocket connection closed:', event.code, event.reason);
          this.isConnecting = false;
          this.ws = null;

          if (this.shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.scheduleReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error('❌ WebSocket error:', error);
          this.isConnecting = false;
          reject(new Error('WebSocket connection failed'));
        };

      } catch (error) {
        console.error('❌ Error creating WebSocket connection:', error);
        this.isConnecting = false;
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect(): void {
    console.log('🔌 Disconnecting WebSocket');
    this.shouldReconnect = false;
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnecting');
      this.ws = null;
    }
  }

  /**
   * Send message to WebSocket server
   */
  send(message: any): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('⚠️ WebSocket not connected, cannot send message');
    }
  }

  /**
   * Check if WebSocket is connected
   */
  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  /**
   * Get connection status
   */
  getConnectionStatus(): 'disconnected' | 'connecting' | 'connected' | 'error' {
    if (!this.ws) return 'disconnected';
    if (this.isConnecting) return 'connecting';
    if (this.ws.readyState === WebSocket.OPEN) return 'connected';
    return 'error';
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(message: WebSocketMessage): void {
    console.log('📨 WebSocket message received:', message.type, message.message);

    switch (message.type) {
      case 'status':
        this.callbacks.onStatus?.(message.message, message.progress || 0);
        break;

      case 'progress':
        this.callbacks.onProgress?.(message.message, message.progress || 0, message.data);
        break;

      case 'complete':
        this.callbacks.onComplete?.(message.data);
        break;

      case 'error':
        this.callbacks.onError?.(message.message);
        break;

      case 'correlation_analysis_complete':
        this.callbacks.onCorrelationComplete?.(message.data);
        break;

      case 'visualization_complete':
        this.callbacks.onVisualizationComplete?.(message.data);
        break;

      default:
        console.warn('⚠️ Unknown WebSocket message type:', message.type);
    }
  }

  /**
   * Schedule reconnection attempt
   */
  private scheduleReconnect(): void {
    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    console.log(`🔄 Scheduling reconnection attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts} in ${delay}ms`);
    
    setTimeout(() => {
      if (this.shouldReconnect && this.projectId) {
        this.connect(this.projectId, this.callbacks).catch(console.error);
      }
    }, delay);
  }

  /**
   * Update callbacks without reconnecting
   */
  updateCallbacks(callbacks: WebSocketCallbacks): void {
    this.callbacks = { ...this.callbacks, ...callbacks };
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();
export default websocketService;
