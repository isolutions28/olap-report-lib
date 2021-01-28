import DevExpress from 'devextreme/bundles/dx.all';

import {Injectable} from '@angular/core';

import PivotGridDataSourceField = DevExpress.data.PivotGridDataSourceField;

@Injectable({
  providedIn: 'root',
})
export class SearcherService {
  getFieldBy(fields: PivotGridDataSourceField[], key: string): PivotGridDataSourceField {
    return fields.find((field) => field.dataField === key);
  }
}
