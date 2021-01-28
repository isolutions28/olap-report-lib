import * as R from 'ramda';

import {Injectable} from '@angular/core';

import {DataEntry} from './types';

@Injectable({
  providedIn: 'root',
})
export class SummaryService {
  recalculate(dataEntries: DataEntry[] = []): DataEntry[] {
    const keySummaryMap = this.getKeySummaryMap(dataEntries);
    let resultData = this.recalculateCurrentLevel(dataEntries, keySummaryMap);
    resultData = this.recalculateInnerLevels(resultData);

    return resultData;
  }

  private recalculateInnerLevels(resultData: DataEntry[]): DataEntry[] {
    return resultData.map((item) => {
      const items = item.items;

      if (items && items.length) {
        return {...item, items: this.recalculate(items)};
      }

      return item;
    });
  }

  private recalculateCurrentLevel(
    dataEntries: DataEntry[],
    keySummaryMap: Record<string, number[]>,
  ): DataEntry[] {
    const uniqData: DataEntry[] = R.uniqBy(R.prop('key'), dataEntries);

    return uniqData.map((dataItem) => ({
      ...dataItem,
      summary: [...keySummaryMap[dataItem.key]],
    }));
  }

  private getKeySummaryMap(dataEntries: DataEntry[]): Record<string, number[]> {
    return dataEntries.reduce((acc, dataEntry) => {
      const key = dataEntry.key;
      return {...acc, [key]: this.sumArrays(dataEntry.summary, acc[key] || [])};
    }, {});
  }

  private sumArrays(arr1: number[], arr2: number[]): number[] {
    return arr1.map((item, i) => item + (arr2[i] || 0));
  }
}
