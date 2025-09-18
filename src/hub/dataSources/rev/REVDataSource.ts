import { LiveDataSource, LiveDataSourceStatus } from "../LiveDataSource";
import Log from "../../../shared/log/Log";

export default class REVDataSource extends LiveDataSource {
  override connect(
    address: string,
    statusCallback: (status: LiveDataSourceStatus) => void,
    outputCallback: (log: Log, timeSupplier: () => number) => void,
  ) {
    super.connect(address, statusCallback, outputCallback, false);
    this.log = new Log();

  }
}
