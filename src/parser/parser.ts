import CSVWorker from "worker-loader!./csv.ts";

export function parser(file: File): void {
  const worker = new CSVWorker();
  worker.postMessage(file);
}
