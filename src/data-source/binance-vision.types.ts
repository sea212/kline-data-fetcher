export interface KlineDiscoveryOptions {
  symbol: string;
  interval: string;
  market?: 'spot' | 'futures/um' | 'futures/cm';
  dataType?: 'monthly' | 'daily';
}

export type KlineFileUrlResult = string[];
