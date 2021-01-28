import DevExpress from 'devextreme/bundles/dx.all';

import {Injectable} from '@angular/core';

import {CheckerService} from './checker.service';
import {SearcherService} from './searcher.service';
import {CURRENCY_KEY, ValidationResult} from './types';

import PivotGridDataSourceField = DevExpress.data.PivotGridDataSourceField;

@Injectable({
  providedIn: 'root',
})
export class ValidatorService {
  constructor(private checkerService: CheckerService, private searcherService: SearcherService) {}

  validate(fields: PivotGridDataSourceField[]): ValidationResult {
    const currencyField = this.searcherService.getFieldBy(fields, CURRENCY_KEY);

    if (
      this.checkerService.isFiltered(currencyField) &&
      !this.checkerService.isTopLevel(currencyField)
    ) {
      return {isValid: false, messageKey: 'currencyFilterRestriction'};
    }

    return {isValid: true};
  }
}
