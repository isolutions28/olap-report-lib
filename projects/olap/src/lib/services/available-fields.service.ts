import DevExpress from 'devextreme/bundles/dx.all';
import PivotGridDataSource from 'devextreme/ui/pivot_grid/data_source';
import * as R from 'ramda';
import {BehaviorSubject, Observable} from 'rxjs';

import {Injectable} from '@angular/core';

import PivotGridDataSourceField = DevExpress.data.PivotGridDataSourceField;

@Injectable({
  providedIn: 'root',
})
export class AvailableFieldsService {
  private availableRowsSubject = new BehaviorSubject<PivotGridDataSourceField[]>([]);
  private availableColumnsSubject = new BehaviorSubject<PivotGridDataSourceField[]>([]);

  setFieldsBy(pivotGridDataSource: PivotGridDataSource): void {
    const isChanged = R.complement(R.equals);

    const currentRows = this.getAvailableFieldsBy(pivotGridDataSource, 'row');
    const currentColumns = this.getAvailableFieldsBy(pivotGridDataSource, 'column');
    const rowsChanged = isChanged(currentRows, this.availableRowsSubject.getValue());
    const columnsChanged = isChanged(currentColumns, this.availableColumnsSubject.getValue());

    if (rowsChanged) {
      this.availableRowsSubject.next(currentRows);
    }
    if (columnsChanged) {
      this.availableColumnsSubject.next(currentColumns);
    }
  }

  getAvailableRows(): Observable<PivotGridDataSourceField[]> {
    return this.availableRowsSubject.asObservable();
  }

  getAvailableColumns(): Observable<PivotGridDataSourceField[]> {
    return this.availableColumnsSubject.asObservable();
  }

  clear(): void {
    this.availableRowsSubject.next([]);
    this.availableColumnsSubject.next([]);
  }

  private getAvailableFieldsBy(
    pivotGridDataSource: PivotGridDataSource,
    fieldAspect: 'row' | 'column',
  ): PivotGridDataSourceField[] {
    return pivotGridDataSource.getAreaFields(fieldAspect, false).sort(this.sortByDepth());
  }

  private sortByDepth(): (a: PivotGridDataSourceField, b: PivotGridDataSourceField) => number {
    return (a, b) =>
      a.areaIndex - b.areaIndex === 0 ? a.groupIndex - b.groupIndex : a.areaIndex - b.areaIndex;
  }
}
