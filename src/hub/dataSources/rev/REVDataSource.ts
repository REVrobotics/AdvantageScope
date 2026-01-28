import { LiveDataSource, LiveDataSourceStatus } from "../LiveDataSource";
import Log from "../../../shared/log/Log";
import { REVTelemetryClient } from "./REVTelemetryClient";

/*
 * The REV DataSource is a WebSocket hosted by an external server.
 * The server will be running either on the user's desktop, or a
 * SystemCore.
 *
 * The server listens for a message in the format:
 * ```
 * {
 *     "key": "an arbitrary key"
 * }
 * ```
 *
 * where the key identifies this AdvantageScope instance.
 * The server then registers this key, which is used to manage
 * the status frames and devices that are exposed to advantage scope.
 *
 * Once a key is registered, and any frames are enabled on the server,
 * messages of the form:
 *
 * ```
 * {
 *     "name": "NameOfDevice",
 *     "descriptor": "technical descriptor used by server to identify the device",
 *     "timestamp": 1.23,
 *     "data": {
 *         "status0": {
 *             "isPoweredOn": true,
 *             "position": 123.456,
 *         },
 *         "status1": {
 *             "aField": 7
 *         }
 *     }
 * }
 * ```
 *
 * are sent by the server asynchronously. This data source
 * will receive these messages, and create fields named
 * `${frame.name}.${frame.data.<name>}.${field.name}`,
 * such as `NameOfDevice.status0.isPoweredOn` in the previous frame example.
 *
 * Fields can have type of number or boolean.
 *
 * Currently, the data structure enforces that there must be two
 * layers of indirection from the data object (such that data.foo.bar is valid,
 * and data.bar or data.foo.baz.bar are both invalid).
 *
 * Any fields that are null will not be updated or removed, instead keeping the
 * last value, and the timestamp will not be updated.
 *
 * No assumptions are made about the format of name, or data fields, meaning
 * they can have any value. Specifically, data fields do not need to be named
 * status<index>, but it is a good convention.
 */

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
    let port = window.preferences?.revTelemetryPort ?? 8080;
    this.client.connect(address, port);
  }

  override stop() {
    super.stop();

    if (this.client) {
      this.client.disconnect();
    }
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
