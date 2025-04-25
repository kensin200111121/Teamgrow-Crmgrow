export type ProspectOverview = {
  Total?: number;
  new?: number;
};

export type NewLeadsOverview = {
  Expired?: number;
  Cancelled?: number;
  Withdrawn?: number;
  OffMarket?: number;
  PreForeclosure?: number;
  Auction?: number;
  REO?: number;
  NoticeOfDefault?: number;
  REOSale?: number;
  FSBO?: number;
  FRBO?: number;
  Geo?: number;
  ThirdParty?: number;
};
