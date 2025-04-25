interface IPreventionConfig {
  message: string;
  isSoftPrevention: boolean;
  duration?: number;
  urlWhitelist?: (string | RegExp)[];
}
interface ApiUi {
  getWavvPromise(): Promise<void>;
  enableNavigationPrevention(params: IPreventionConfig): void;
  disableNavigationPrevention(): void;
}

declare const apiUi: ApiUi;

export = apiUi;
