export type Status = 'success' | 'failure' | 'cancelled';

export function parse (status: string): Status {
  status = status.toLowerCase();
  switch (status) {
    case 'success':
    case 'failure':
    case 'cancelled':
      return status;
    default:
      throw Error(`Invalid parameter. status=${status}.`);
  }
}
