import Log from "../../../shared/log/Log";

export class REVTelemetryClient {
  log: Log;
  onMessage: () => void;

  constructor(log: Log, onMessage: () => void) {
    this.log = log;
    this.onMessage = onMessage;
  }

  connect(address: string, port: number) {
    let socket = new WebSocket(`ws://${address}:${port}/v1/ws/status`);

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
        let fieldName = `${name}.${statusFrameKey}.${fieldKey}`;

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
