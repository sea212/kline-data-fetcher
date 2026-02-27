interface KlineDiscoveryOptions {
  symbol: string;
  interval: string;
  market?: 'spot' | 'futures/um' | 'futures/cm';
  dataType?: 'monthly' | 'daily';
}

type KlineFileUrlResult = string[];

export { KlineDiscoveryOptions, KlineFileUrlResult };
