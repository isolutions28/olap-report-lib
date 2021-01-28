import {DxPivotGridComponent} from 'devextreme-angular/ui/pivot-grid';
import DevExpress from 'devextreme/bundles/dx.all';
import CustomStore from 'devextreme/data/custom_store';
import {LoadOptions} from 'devextreme/data/load_options';
import PivotGridDataSource from 'devextreme/ui/pivot_grid/data_source';
import Moment from 'moment';
import {extendMoment} from 'moment-range';
import * as R from 'ramda';
import {
  asyncScheduler,
  BehaviorSubject,
  combineLatest,
  Observable,
  Subject,
} from 'rxjs';
import {first, map, observeOn, takeUntil} from 'rxjs/operators';

import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  Output,
  ViewChild,
} from '@angular/core';

import {GroupInfoPayload, IsolOlapReportService} from '../../services/isol-olap-report.service';
import {CURRENCY_KEY, ViewCashFlowConfig, ViewConfig, ViewDescription} from '../../services/types';
import {DateUnit} from '../date-range-picker/date-range-picker.component';
import {
  addFieldTextCustomization,
  addTotalCalculation,
  dateFieldsByRange,
  dateSearchMapFn,
  generateGroups,
  mapToViewStructure,
  momentToArrayMapper,
} from './olap-view.commons';
import {TotalVisibilityService} from '../../services/total-visibility.service';
import {CheckerService} from '../../services/checker.service';
import {SearcherService} from '../../services/searcher.service';
import {ValidatorService} from '../../services/validator.service';
import {SummaryService} from '../../services/summary.service';
import {FieldsExpanderService} from '../../services/fields-expander.service';
import {AvailableFieldsService} from '../../services/available-fields.service';
import {SelectedFieldsService} from '../../services/selected-fields.service';

import PivotGridDataSourceField = DevExpress.data.PivotGridDataSourceField;
import { generateXlsxFile } from './xlsx-generation/sheet-generator';
import { MatExpansionPanel } from '@angular/material/expansion';
import { FormBuilder } from "@angular/forms";

const moment = extendMoment(Moment);

export interface DataDescriptor {
	index: number;
	value: string;
	text: string;
	children?: DataDescriptor[];
}

export interface GridData {
	rows: DataDescriptor[];
	columns: DataDescriptor[];
	values: Array<Array<Array<any>>>;
	grandTotalColumnIndex: number;
	grandTotalRowIndex: number;
}

export interface GridMetadata {
	columns: DevExpress.data.PivotGridDataSourceField[];
	rows: DevExpress.data.PivotGridDataSourceField[];
	values: DevExpress.data.PivotGridDataSourceField[];
	filter: any[];
}

const pivotGridTexts = {
  collapseAll: 'Свернуть всё',
  dataNotAvailable: 'Данные не доступны',
  expandAll: 'Развернуть всё',
  exportToExcel: 'Експортировать в Excel',
  grandTotal: 'Итого',
  noData: 'Нету данных',
  removeAllSorting: 'Убрать сортировку',
  showFieldChooser: 'Выбрать поля',
  sortColumnBySummary: 'Сортировать по {0}',
  sortRowBySummary: 'Сортировать по {0}',
  total: '{0} Итого',
};

const fieldChooserTexts = {
  allFields: 'Все поля',
  columnFields: 'Столбцы',
  dataFields: 'Данные',
  filterFields: 'Фильтры',
  rowFields: 'Строки',
};

@Component({
  selector: 'isol-olap-view',
  templateUrl: './olap-view.component.html',
  styleUrls: ['./olap-view.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OlapViewComponent implements OnDestroy {
  @ViewChild(MatExpansionPanel)
  filterPanel: MatExpansionPanel;

  @ViewChild(DxPivotGridComponent) set pivotGridComponent(grid: DxPivotGridComponent) {
    this._pivotGridComponentSubject.next(grid);
  }

  private _pivotGridComponentSubject = new BehaviorSubject<DxPivotGridComponent>(null);
  private _selectedView: ViewDescription;
  private _viewStructure: PivotGridDataSourceField[] = [];
  private _config: ViewConfig;
  private _viewCashFlowConfig: ViewCashFlowConfig;
  private _destroyed$ = new Subject();

  private readonly HIERARCHY = 'hierarchy';

  pivotGridDataSource: PivotGridDataSource;
  state: any;

  localizedTexts = pivotGridTexts;
  localizedFieldChooserTexts = fieldChooserTexts;

  date = this.formBuilder.control(null);
  dateRange = DateUnit.DAY;

  isCustomSetting = false;
  areFieldsLoading = false;

  constructor(
    private formBuilder: FormBuilder,
    private olapService: IsolOlapReportService,
    private changeRef: ChangeDetectorRef,
    private totalVisibilityService: TotalVisibilityService,
    private checkerService: CheckerService,
    private searcherService: SearcherService,
    private validatorService: ValidatorService,
    private summaryService: SummaryService,
    private fieldsExpanderService: FieldsExpanderService,
    public availableFieldsService: AvailableFieldsService,
    private selectedFieldsService: SelectedFieldsService,
  ) {}

  @Output() validate = new EventEmitter<string>();
  @Input() sendStructure = false;

  @Input()
  set config(config: ViewConfig) {
    this.areFieldsLoading = true;
    this.isCustomSetting = config.isCustomSetting;
    this.clearComponent();

    if (!config.isCustomSetting) {
      this.openFilterPanel();
    }

    if (config) {
      this._config = config;
      this._selectedView = config.selectedView;
      this.initializeByConfig(config);
    }
  }

  @Input()
  set dbRole(dbRole: string) {
    if (dbRole && dbRole.length > 0) {
      this.olapService.dbRoleSubject.next(dbRole);
    }
  }

  ngOnDestroy(): void {
    if (this.pivotGridDataSource) {
      this.pivotGridDataSource.dispose();
    }
    this._destroyed$.next();
    this._destroyed$.complete();
  }

  expandRowsAndClosePanel({itemData}, availableRows: PivotGridDataSourceField[]): void {
    this.fieldsExpanderService.expandFields(this.pivotGridDataSource, itemData, availableRows);
    this.closeFilterPanel();
    this.selectedFieldsService.selectRow(itemData);
  }

  expandColumnsAndClosePanel({itemData}, availableColumns: PivotGridDataSourceField[]): void {
    this.fieldsExpanderService.expandFields(this.pivotGridDataSource, itemData, availableColumns);
    this.closeFilterPanel();
    this.selectedFieldsService.selectColumn(itemData);
  }

  formatCaption(field: PivotGridDataSourceField) {
    const caption = R.propOr(null, 'caption')(field);
    switch (true) {
      case caption === 'Date Year':
        return 'Год';

      case caption === 'Date Quarter':
        return 'Квартал';

      case caption === 'Date Month':
        return 'Месяц';

      default:
        return caption;
    }
  }

	onExporting(event: any) {
		event.cancel = true;
		const data = event.component._dataController._dataSource._data as GridData;
		const metadata = event.component._dataController._dataSource
			._descriptions as GridMetadata;
		generateXlsxFile(
			data,
			metadata,
			this.selectedView,
			this.pivotGridDataSource
		);
	}

  setDateRange(shouldLoad = true): void {
    if (this.date.value) {
      this.setDateFilter();
    } else {
      this.clearDateFilter();
    }
    if (shouldLoad) {
      this.loadReportWithDate();
    }
  }

  applyFilterAndClosePanel(): void {
    const validationResult = this.validatorService.validate(this.getFieldsBy(true));

    if (!validationResult.isValid) {
      this.validate.emit(validationResult.messageKey);
      return;
    }

    this.assignCurrentStateToPivotState();
    this.availableFieldsService.setFieldsBy(this.pivotGridDataSource);
    this.closeFilterPanel();
  }

  onInitialized(): void {
    if (this._config.state) {
      this.setOptionsByConfigState();
    }
  }

  handleTotalVisibilityState(): void {
    const currencyField = this.searcherService.getFieldBy(this.getFieldsBy(false), CURRENCY_KEY);
    const pivotGridComponent = this.getPivotGridComponent();

    if (this.checkerService.isFiltered(currencyField)) {
      if (this.checkerService.isRow(currencyField)) {
        this.totalVisibilityService.show(pivotGridComponent, 'column');
        this.totalVisibilityService.hide(pivotGridComponent, 'row');
      }
      if (this.checkerService.isColumn(currencyField)) {
        this.totalVisibilityService.show(pivotGridComponent, 'row');
        this.totalVisibilityService.hide(pivotGridComponent, 'column');
      }
    } else {
      this.totalVisibilityService.show(pivotGridComponent, 'row');
      this.totalVisibilityService.show(pivotGridComponent, 'column');
    }
  }

  getExpandData(): Observable<{
    availableRows: PivotGridDataSourceField[];
    availableColumns: PivotGridDataSourceField[];
    selectedRow: any;
    selectedColumn: any;
  }> {
    return combineLatest([
      this.availableFieldsService.getAvailableRows(),
      this.availableFieldsService.getAvailableColumns(),
      this.selectedFieldsService.getSelectedRow(),
      this.selectedFieldsService.getSelectedColumn(),
    ]).pipe(
      map(([availableRows, availableColumns, selectedRow, selectedColumn]) => ({
        availableRows,
        availableColumns,
        selectedRow,
        selectedColumn,
      })),
    );
  }

  get selectedView(): ViewDescription {
    return this._selectedView;
  }

  get dataFieldPresent(): boolean {
    return !!this._selectedView.dateField;
  }

  private setOptionsByConfigState(): void {
    this.pivotGridDataSource.fields(
      this._config.state.fields
        .map(addFieldTextCustomization)
        .map(addTotalCalculation(this.remoteOperations, this._selectedView)),
    );
    this.setStateByConfigState();
    this.selectedFieldsService.selectRow(this._config.state.selectedRow);
    this.selectedFieldsService.selectColumn(this._config.state.selectedColumn);
  }

  private setStateByConfigState(): void {
    if (this._config.state.date) {
      this.date.setValue(this._config.state.date);
      this.setDateRange(false);
    }
    this.pivotGridDataSource.state({
      ...this.pivotGridDataSource.state(),
      columnExpandedPaths: !this.remoteOperations ? [] : this._config.state.columnExpandedPaths,
      rowExpandedPaths: !this.remoteOperations ? [] : this._config.state.rowExpandedPaths,
    });
  }

  private generateDataSource() {
    this.pivotGridDataSource = new PivotGridDataSource({
      onFieldsPrepared: () => {
        this.availableFieldsService.setFieldsBy(this.pivotGridDataSource);
        if (this._config.state && !this.remoteOperations) {
          this.setStateByConfigState();
        }
      },
      onChanged: () => this.availableFieldsService.setFieldsBy(this.pivotGridDataSource),
      remoteOperations: this.remoteOperations,
      store: new CustomStore({
        key: 'id',
				load: (loadOptions: LoadOptions) => {
					if (
						(loadOptions.take && loadOptions.skip === 0) ||
						!this.remoteOperations
					) {
						return this.olapService
							.getViewInstance(
								this.selectedView.viewName,
								!this.remoteOperations
							)
							.toPromise();
					}
					return this.olapService.getGroupInfo(
						this.getGroupInfoPayload(loadOptions)
					).then((data) => this.summaryService.recalculate(data),
					);
				}
      }),
    });
    this.initializePivotGridFields();
  }

  private getGroupInfoPayload(loadOptions: LoadOptions): GroupInfoPayload {
    return {
      loadOptions: loadOptions,
      structure: this.sendStructure ? this.currentConfig.map(mapToViewStructure) : [],
      viewName: this.selectedView.viewName,
    };
  }

  private clearComponent() {
    this._selectedView = null;
    this._config = null;
    this.clearViewStructure();
    this.pivotGridDataSource = null;
    this.availableFieldsService.clear();
    this.selectedFieldsService.clear();
  }

  private clearViewStructure() {
    this._viewStructure = [];
  }

	private loadDefaultViewConfig(viewName: string) {
		this.olapService
			.getViewStructure(viewName)
			.pipe(takeUntil(this._destroyed$))
			.subscribe(resp => (this.viewStructure = resp.data));
	}

  private initializeByConfig(config: ViewConfig) {
    if (config.selectedView.remoteOperations) {
      this.initViewStructure(config);
    } else {
      this.olapService
        .getCashFlowFolders(config.selectedView.viewName)
        .pipe(takeUntil(this._destroyed$))
        .subscribe((resp) => {
          this._viewCashFlowConfig = resp;
          this.initViewStructure(config);
        });
    }
  }

  private initViewStructure(config: ViewConfig) {
    if (config.viewParameters) {
      this.viewStructure = config.viewParameters;
    } else {
      this.loadDefaultViewConfig(config.selectedView.viewName);
    }
  }

  private updateLocalDateFilter(data: any[]): void {
    const dateField = this.pivotGridDataSource.field(this._selectedView.dateField);
    dateField.filterValues = data;
  }

  private assignCurrentStateToPivotState(): void {
    if (this.pivotGridDataSource) {
      this.pivotGridDataSource.state(this.state);
    }
  }

  private openFilterPanel(): void {
    if (this.filterPanel) {
			this.filterPanel.open();
		}
	}

  private closeFilterPanel(): void {
    this.filterPanel.close();
  }

  private preparePivotGridFields(): void {
    if (this.pivotGridDataSource) {
      this.pivotGridDataSource.dispose();
      this.pivotGridDataSource.fields([]);
    }
  }

  private initializePivotGridFields(): void {
    if (this._config.state) {
      this.setOptionsByConfigState();
      this.areFieldsLoading = false;
      this.changeRef.markForCheck();
      return;
    }
    if (this.isCustomSetting) {
      this.pivotGridDataSource.fields(this._viewStructure);
      this.areFieldsLoading = false;
    } else {
      this.preparePivotGridFields();
      this._pivotGridComponentSubject
        .asObservable()
        .pipe(
          first((grid) => !!grid),
          observeOn(asyncScheduler),
          takeUntil(this._destroyed$),
        )
        .subscribe(() => {
          this.pivotGridDataSource.fields(this._viewStructure);
          this.state = this.pivotGridDataSource.state();
          this.areFieldsLoading = false;
          this.changeRef.markForCheck();
        });
    }
  }

  public get currentConfig(): PivotGridDataSourceField[] {
    return this.pivotGridDataSource.fields();
  }

  private set viewStructure(config: PivotGridDataSourceField[]) {
    this.clearViewStructure();
    if (config) {
      this._viewStructure = config
        .map((field) => {
          let resultField: any = field;
          if (
            ['row', 'column'].includes(field.area) &&
            this._viewCashFlowConfig &&
            this._viewCashFlowConfig.groupByField === field.dataField
          ) {
            resultField = {...resultField, groupName: this.HIERARCHY};
          }
          if (
            this._selectedView.dateField &&
            field.dataField === this._selectedView.dateField &&
            field.dataType === 'date'
          ) {
            this.dateRange = !!(field as any).dateRange ? (field as any).dateRange : DateUnit.DAY;
            resultField = [
              {
                ...resultField,
                ...(this.dateRange === DateUnit.DAY
                  ? {dataType: 'string', sortBy: 'none'}
                  : {
                      groupName: resultField.dataField,
                      displayFolder: '',
                    }),
              },
              ...dateFieldsByRange(resultField, this.dateRange),
            ];
          }
          return resultField;
        })
        .reduce((prev, acc) => prev.concat(acc), [])
        .map(addTotalCalculation(this.remoteOperations, this._selectedView));
      this._viewStructure = generateGroups(
        this._viewCashFlowConfig,
        this.HIERARCHY,
        this._viewStructure,
      );
      this.generateDataSource();
    }
    this.changeRef.markForCheck();
  }

  private setDateFilter(): void {
    const range = moment.range(this.date.value.start, this.date.value.end);
    const array = Array.from(range.by(this.dateRange));
    const normalizedArray = array.map(momentToArrayMapper(this.dateRange));
    if (!this.remoteOperations) {
      this.updateLocalDateFilter(normalizedArray);
    } else {
      const mappedArray = normalizedArray.map(dateSearchMapFn(this.dateRange));
      const resultArray = mappedArray
        .map((e, i) => (i < mappedArray.length - 1 ? [e, 'or'] : [e]))
        .reduce((a, b) => a.concat(b));
      this.pivotGridDataSource.filter(resultArray);
    }
  }

  private clearDateFilter(): void {
    if (!this.remoteOperations) {
      this.updateLocalDateFilter(null);
    } else {
      this.pivotGridDataSource.filter(null);
    }
  }

  private loadReportWithDate(): void {
    if (this.remoteOperations) {
      this.pivotGridDataSource.reload();
    } else {
      this.pivotGridDataSource.state(this.pivotGridDataSource.state());
    }
  }

  private getPivotGridComponent(): DxPivotGridComponent {
    return this._pivotGridComponentSubject.getValue();
  }

  private getFieldsBy(state: boolean): PivotGridDataSourceField[] {
    return state ? this.state.fields : this.pivotGridDataSource.fields();
  }

  private get remoteOperations(): boolean {
    return this._config.selectedView.remoteOperations !== undefined
      ? this._config.selectedView.remoteOperations
      : true;
  }
}
