import {BehaviorSubject, Observable} from 'rxjs';

import {Injectable} from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class SelectedFieldsService {
  private selectedRowSubject = new BehaviorSubject<any>(null);
  private selectedColumnSubject = new BehaviorSubject<any>(null);

  selectRow(itemData: any): void {
    this.selectedRowSubject.next(itemData);
  }

  selectColumn(itemData: any): void {
    this.selectedColumnSubject.next(itemData);
  }

  getSelectedRow(): Observable<any> {
    return this.selectedRowSubject.asObservable();
  }

  getSelectedColumn(): Observable<any> {
    return this.selectedColumnSubject.asObservable();
  }

  getSelectedRowValue(): any {
    return this.selectedRowSubject.getValue();
  }

  getSelectedColumnValue(): any {
    return this.selectedColumnSubject.getValue();
  }

  clear(): void {
    this.selectedRowSubject.next(null);
    this.selectedColumnSubject.next(null);
  }
}
