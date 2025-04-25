import _ from 'lodash';
import { DealGroup } from '@utils/data.types';

/**
 *
 * @param dealIdGroups deal id group
 * @param originDeals deals array
 * @returns DealGroup[]
 */
export function groupRelativeDeals(
  dealIdGroups: any[],
  originDeals: any[]
): DealGroup[] {
  const dealGroups: DealGroup[] = [];
  let mergedDealGroups = dealIdGroups.map((e) => e);
  dealIdGroups.forEach((group) => {
    mergedDealGroups.forEach((mGroup) => {
      const diff = _.difference(group, mGroup);
      if (diff.length > 0) {
        const match = _.intersection(group, mGroup);
        if (match.length > 0) {
          mGroup.push(...group);
          mGroup = _.uniq(mGroup);
          mergedDealGroups = mergedDealGroups.filter((e) => {
            const diff = _.difference(e, group);
            return diff.length > 0;
          });
        }
      }
    });
  });
  mergedDealGroups.forEach((group) => {
    const deals = originDeals.filter((e) => group.indexOf(e.id) > -1);
    const contacts = [];
    deals.forEach((deal) => {
      contacts.push(...deal.contacts);
    });
    const unique_contacts = _.uniqBy(contacts, '_id');
    const dealGroup: DealGroup = {
      deals: deals,
      selection: [],
      unique_contacts: unique_contacts,
      saving: false,
      completed: false
    };
    dealGroups.push(dealGroup);
  });

  return dealGroups;
}
