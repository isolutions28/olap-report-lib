import {DxPivotGridComponent} from 'devextreme-angular/ui/pivot-grid';

import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class TotalVisibilityService {
  show(pivotGridComponent: DxPivotGridComponent, aspect: 'row' | 'column'): void {
    this.changeTotalState(pivotGridComponent, aspect, true);
  }

  hide(pivotGridComponent: DxPivotGridComponent, aspect: 'row' | 'column'): void {
    this.changeTotalState(pivotGridComponent, aspect, false);
  }

  private changeTotalState(
    pivotGridComponent: DxPivotGridComponent,
    aspect: 'row' | 'column',
    value: boolean,
  ): void {
    if (aspect === 'row') {
      pivotGridComponent.showRowTotals = value;
      pivotGridComponent.showRowGrandTotals = value;
    } else if (aspect === 'column') {
      pivotGridComponent.showColumnTotals = value;
      pivotGridComponent.showColumnGrandTotals = value;
    }
  }
}
