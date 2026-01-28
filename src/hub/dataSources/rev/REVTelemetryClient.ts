import Log from "../../../shared/log/Log";

export class REVTelemetryClient {
  log: Log;
  onMessage: () => void;
  private socket: WebSocket | null = null;
  private reconnectTimeout: number | null = null;
  private reconnectDelay = 1000; // ms
  private address: string | null = null;
  private port: number | null = null;
  private intentionallyClosed = false;

  constructor(log: Log, onMessage: () => void) {
    this.log = log;
    this.onMessage = onMessage;
  }

  connect(address: string, port: number) {
    this.address = address;
    this.port = port;
    this.intentionallyClosed = false;
    this._connect();
  }

  private _connect() {
    if (!this.address || this.port == null) return;
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    const socket = new WebSocket(`ws://${this.address}:${this.port}/v1/ws/status`);
    this.socket = socket;

    socket.addEventListener("open", event => {
      let key = window.preferences?.revTelemetryKey ?? crypto.randomUUID();
      console.log(key);

      socket.send(JSON.stringify({ key: key }));
    });

    socket.addEventListener("message", event => {
      let statusData = JSON.parse(event.data);

      if(statusData !== undefined && statusData !== null) {
        this.handleStatusFrame(statusData);
      }
    });

    socket.addEventListener("close", event => {
      if (!this.intentionallyClosed) {
        this._scheduleReconnect();
      }
    });

    socket.addEventListener("error", event => {
      // Close and trigger reconnect on error
      if (this.socket) {
        this.socket.close();
      }
    });
  }

  private _scheduleReconnect() {
    if (this.reconnectTimeout != null) return; // Already scheduled
    this.reconnectTimeout = window.setTimeout(() => {
      this.reconnectTimeout = null;
      this._connect();
    }, this.reconnectDelay);
  }

  disconnect() {
    this.intentionallyClosed = true;
    if (this.reconnectTimeout != null) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
  }

  handleStatusFrame(frameData: any) {
    this.onMessage();
    let timestamp = frameData.timestamp;
    let name = frameData.name;

    for(let statusFrameKey in frameData.data) {
      let statusFrame = frameData.data[statusFrameKey];

      if(statusFrame === undefined || statusFrame === null) {
        continue;
      }

      if(typeof statusFrame !== "object") {
        continue;
      }

      for(let fieldKey in statusFrame) {
        let value = statusFrame[fieldKey];
        let fieldName = `${name}/${statusFrameKey}/${fieldKey}`;

        if(value !== undefined && value !== null) {
          switch(typeof value) {
            case "number":
              this.log.putNumber(fieldName, timestamp, value);
              break;
            case "boolean":
              this.log.putBoolean(fieldName, timestamp, value);
              break;
          }
        }
      }
    }
  }
}
