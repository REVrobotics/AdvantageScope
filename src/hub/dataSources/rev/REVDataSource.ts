import { LiveDataSource, LiveDataSourceStatus } from "../LiveDataSource";
import Log from "../../../shared/log/Log";
import { REVTelemetryClient } from "./REVTelemetryClient";

export default class REVDataSource extends LiveDataSource {
  client: REVTelemetryClient | undefined;

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
    this.status = LiveDataSourceStatus.Active;
  }
}
