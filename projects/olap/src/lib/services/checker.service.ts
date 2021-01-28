import DevExpress from 'devextreme/bundles/dx.all';

import {Injectable} from '@angular/core';

import PivotGridDataSourceField = DevExpress.data.PivotGridDataSourceField;

@Injectable({
  providedIn: 'root',
})
export class CheckerService {
  isFiltered(field: PivotGridDataSourceField): boolean {
    return !!(field && field.filterValues && field.filterValues.length);
  }

  isTopLevel(field: PivotGridDataSourceField): boolean {
    return field.areaIndex === 0;
  }

  isRow(field: PivotGridDataSourceField): boolean {
    return field.area === 'row';
  }

  isColumn(field: PivotGridDataSourceField): boolean {
    return field.area === 'column';
  }

  isData(field: PivotGridDataSourceField): boolean {
    return field.area === 'data';
  }

  isFilter(field: PivotGridDataSourceField): boolean {
    return field.area === 'filter';
  }
}
