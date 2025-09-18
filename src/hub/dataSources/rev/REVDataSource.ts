import { LiveDataSource, LiveDataSourceStatus } from "../LiveDataSource";
import Log from "../../../shared/log/Log";
import { REVTelemetryClient } from "./REVTelemetryClient";

export default class REVDataSource extends LiveDataSource {
  client: REVTelemetryClient | undefined;
  liveZeroTime: number | undefined;

  override connect(
    address: string,
    statusCallback: (status: LiveDataSourceStatus) => void,
    outputCallback: (log: Log, timeSupplier: () => number) => void
  ) {
    super.connect(address, statusCallback, outputCallback, false);
    this.log = new Log();
    this.client = new REVTelemetryClient(this.log, this.onMessage.bind(this));
    this.client.connect();
  }

  onMessage() {
    this.setStatus(LiveDataSourceStatus.Active);

    if (this.liveZeroTime === undefined) {
      this.liveZeroTime = new Date().getTime() / 1000;
    }

    if (this.log === null) {
      return;
    }

    // Run output callback
    if (this.outputCallback !== null) {
      this.outputCallback(this.log, () => {
        if (this.log && this.liveZeroTime !== undefined) {
          return new Date().getTime() / 1000 - this.liveZeroTime + this.log.getTimestampRange()[0];
        } else {
          return 0;
        }
      });
    }
  }
}
