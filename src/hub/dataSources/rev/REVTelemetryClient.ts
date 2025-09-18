import Log from "../../../shared/log/Log";

export class REVTelemetryClient {
  log: Log;

  constructor(log: Log) {
    this.log = log;
  }

  connect() {
    let socket = new WebSocket("ws://127.0.0.1:59977/v1/ws/status");

    socket.addEventListener("open", event => {
      let key = crypto.randomUUID();
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
    let descriptor = frameData.descriptor;
    let timestamp = Date.now();

    for(let statusFrameKey in frameData) {
      let statusFrame = frameData[statusFrameKey];

      if(statusFrame === undefined || statusFrame === null) {
        continue;
      }

      if(typeof statusFrame !== "object") {
        continue;
      }

      for(let fieldKey in statusFrame) {
        let value = statusFrame[fieldKey];
        let fieldName = `${descriptor}.${statusFrameKey}.${fieldKey}`;

        if(value !== undefined && value !== null) {
          console.log(`Status: ${fieldName}: ${value}`);

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
