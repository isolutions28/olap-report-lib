import DevExpress from 'devextreme/bundles/dx.all';
import PivotGridDataSource from 'devextreme/ui/pivot_grid/data_source';

import {Injectable} from '@angular/core';

import PivotGridDataSourceField = DevExpress.data.PivotGridDataSourceField;

@Injectable({
  providedIn: 'root',
})
export class FieldsExpanderService {
  expandFields(
    pivotGridDataSource: PivotGridDataSource,
    selectedField: PivotGridDataSourceField,
    availableFields: PivotGridDataSourceField[],
  ): void {
    const fieldsToExpand = this.getFieldsToExpand(availableFields, selectedField);
    const fieldsToCollapse = this.getFieldsToCollapse(availableFields, fieldsToExpand);

    this.collapseSelectedFields(fieldsToCollapse, pivotGridDataSource);
    this.expandSelectedFields(fieldsToExpand, pivotGridDataSource);
  }

  private expandSelectedFields(
    fieldsToExpand: PivotGridDataSourceField[],
    pivotGridDataSource: PivotGridDataSource,
  ): void {
    fieldsToExpand
      .filter((field) => !field.expanded)
      .forEach((field) => pivotGridDataSource.expandAll(field.caption));
  }

  private collapseSelectedFields(
    fieldsToCollapse: PivotGridDataSourceField[],
    pivotGridDataSource: PivotGridDataSource,
  ): void {
    fieldsToCollapse.forEach((fieldToCollapse) => {
      pivotGridDataSource.collapseAll(fieldToCollapse.caption);
    });
  }

  private getFieldsToCollapse(
    availableFields: PivotGridDataSourceField[],
    fieldsToExpand: PivotGridDataSourceField[],
  ): PivotGridDataSourceField[] {
    return availableFields.filter(
      (field) => !fieldsToExpand.find((fieldToExpand) => fieldToExpand.caption === field.caption),
    );
  }

  private getFieldsToExpand(
    availableFields: PivotGridDataSourceField[],
    selectedField: PivotGridDataSourceField,
  ): PivotGridDataSourceField[] {
    return availableFields.filter(
      (field) =>
        field.areaIndex < selectedField.areaIndex ||
        (field.areaIndex === selectedField.areaIndex &&
          field.groupIndex < selectedField.groupIndex),
    );
  }
}
