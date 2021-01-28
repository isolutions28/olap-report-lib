import moment, {Moment as MomentType, Moment} from 'moment';
import {ReplaySubject} from 'rxjs';
import {tap} from 'rxjs/operators';
import DevExpress from 'devextreme/bundles/dx.all';

import {ViewCashFlowConfig, ViewDescription, ViewStructure} from '../../services/types';
import { DateUnit } from '../date-range-picker/date-range-picker.component';
import {getParentName} from '../../utils/utils';

import PivotGridDataSourceField = DevExpress.data.PivotGridDataSourceField;
import dxPivotGridSummaryCell = DevExpress.ui.dxPivotGridSummaryCell;

export const dateFieldsByRange = (
  field: PivotGridDataSourceField,
  dateRange: DateUnit,
): PivotGridDataSourceField[] => {
  const yearField: PivotGridDataSourceField = {
    groupInterval: 'year',
    groupIndex: 0,
  };

  const quarterField: PivotGridDataSourceField = {
    groupInterval: 'quarter',
    groupIndex: 1,
  };
  const monthField: PivotGridDataSourceField = {
    groupInterval: 'month',
    groupIndex: 2,
  };
  const dayField = {
    groupInterval: 'day',
    groupIndex: 3,
  };

  let dateFields = [];
  if (dateRange === DateUnit.YEAR) {
    dateFields = [yearField];
  }

  if (dateRange === DateUnit.MONTH) {
    dateFields = [yearField, quarterField, monthField];
  }

  return dateFields
    .map(addFieldTextCustomization)
    .map((dateField) => ({...dateField, groupName: field.dataField}));
};

export const addFieldTextCustomization = (
  field: PivotGridDataSourceField,
): PivotGridDataSourceField => {
  switch (field.groupInterval) {
    case 'quarter':
      return {
        ...field,
        customizeText: customizeQuarter,
      };

    case 'month':
      return {
        ...field,
        customizeText: customizeMonth,
      };

    default:
      return field;
  }
};

const customizeQuarter = function(cellInfo: {
  value?: string | number | Date;
  valueText?: string;
}): string {
  return 'Квартал ' + cellInfo.value;
};

const customizeMonth = function(cellInfo: {
	value?: string | number | Date;
	valueText?: string;
}): string {
	const monthIndex = Number(cellInfo.value) - 1;
	const localeMonth = moment()
		.locale('ru')
		.localeData()
		.months()[monthIndex];

	return localeMonth;
};

export const isCurrencyExpanded = (
  e: dxPivotGridSummaryCell,
  selectedView: ViewDescription,
): boolean => {
  const description = e['_descriptions'] as {
    rows: PivotGridDataSourceField[];
    columns: PivotGridDataSourceField[];
  };
  const rowIndex = description.rows.findIndex(
    (value) => value.dataField === selectedView.currencyField,
  );
  const columnIndex = description.columns.findIndex(
    (value) => value.dataField === selectedView.currencyField,
  );

  const currencyFieldDescription = {
    area: rowIndex !== -1 ? '_rowPath' : columnIndex !== -1 ? '_columnPath' : null,
    fieldIndex: rowIndex !== -1 ? rowIndex : columnIndex !== -1 ? columnIndex : null,
  };
  if (currencyFieldDescription.area) {
    const pathArray = e[currencyFieldDescription.area] as any[];
    return currencyFieldDescription.fieldIndex
      ? pathArray.length - 1 > currencyFieldDescription.fieldIndex
      : true;
  }
  return true;
};

export const generateGroups = (
  viewCashFlowConfig: ViewCashFlowConfig,
  groupName: string = 'hierarchy',
  viewStructure: PivotGridDataSourceField[],
): PivotGridDataSourceField[] => {
  if (viewCashFlowConfig) {
    const groupDepth = viewCashFlowConfig.maxDepth;
    const groups = [];
    for (let i = 1; i <= groupDepth; i++) {
      groups.push({
        groupName: groupName,
        groupIndex: i,
        caption: `${i} уровень ДДС`,
        selector: (value: any) =>
          getParentName(viewCashFlowConfig.values, value, i, viewCashFlowConfig),
      });
    }
    return [...viewStructure, ...groups];
  }
  return [...viewStructure];
};

export const completeTap = (subject: ReplaySubject<any>): any => {
  return tap({
    error: () => {
      subject.next(true);
      subject.complete();
    },
    complete: () => {
      subject.next(true);
      subject.complete();
    },
  });
};

export const momentToArrayMapper = (dateRange: DateUnit) => (
	date: Moment
): [number, number?, number?, number?] => {
	switch (dateRange) {
		case DateUnit.YEAR:
			return [date.year()];
		case DateUnit.MONTH:
			return [date.year(), date.quarter(), date.month() + 1];
		default:
			return [date.year(), date.quarter(), date.month() + 1, date.date()];
	}
};

export const dateSearchMapFn = (dateRange: DateUnit) => ([
	year,
	quarter,
	month,
	day
]: any[]) => {
	if (dateRange === DateUnit.YEAR) {
		return [['date.Year', '=', year]];
	}
	if (dateRange === DateUnit.MONTH) {
		return [
			['date.Year', '=', year],
			'and',
			['date.Quarter', '=', quarter],
			'and',
			['date.Month', '=', month]
		];
	}

  return [
    ['date.Year', '=', year],
    'and',
    ['date.Month', '=', month],
    'and',
    ['date.Day', '=', day],
  ];
};

export const dateRangeToBetweenMapFn = (dateRange: DateUnit) => (
	date: { start: MomentType, end: MomentType }
) => {
	const [startYear, startQuarter, startMonth, startDay] = momentToArrayMapper(dateRange)(
		date.start,
	);
	const [endYear, endQuarter, endMonth, endDay] = momentToArrayMapper(dateRange)(date.end);
	if (dateRange === DateUnit.YEAR) {
		return [
			['date.Year', '>=', formatDate([startYear])],
			'and',
			['date.Year', '<=', formatDate([endYear])],
		];
	}
	if (dateRange === DateUnit.MONTH) {
		return [
			[
				['date.Year', '>=', formatDate([startYear])],
				'and',
				['date.Month', '>=', formatDate([startYear, startMonth])],
			],
			'and',
			[
				['date.Year', '<=', formatDate([endYear])],
				'and',
				['date.Month', '<=', formatDate([endYear, endMonth])],
			],
		];
	}

	return [
		[
			['date.Year', '>=', formatDate([startYear])],
			'and',
			['date.Month', '>=', formatDate([startYear, startMonth])],
			'and',
			['date.Day', '>=', formatDate([startYear, startMonth, startDay])],
		],
		'and',
		[
			['date.Year', '<=', formatDate([endYear])],
			'and',
			['date.Month', '<=', formatDate([endYear, endMonth])],
			'and',
			['date.Day', '<=', formatDate([endYear, endMonth, endDay])],
		],
	];
};

export const formatDate = (date: [number, number?, number?]): string => {
  return date.join('/');
};

export const mapToViewStructure = (data: PivotGridDataSourceField): ViewStructure =>
  new ViewStructure(data);

export const addTotalCalculation = (remoteOperations: boolean, _selectedView: ViewDescription) => (
  field: PivotGridDataSourceField,
): PivotGridDataSourceField => {
  if (
    field.area === 'data' &&
    !remoteOperations &&
    field.summaryType === 'sum' &&
    _selectedView.isMultiCurrency &&
    field.dataField === _selectedView.amountField
  ) {
    return addTotalCalculationForLocal(field, _selectedView);
  }

  return field;
};

const addTotalCalculationForLocal = (
  field: PivotGridDataSourceField,
  _selectedView: ViewDescription,
): PivotGridDataSourceField => ({
  ...field,
  calculateSummaryValue: (e: dxPivotGridSummaryCell): number =>
    isCurrencyExpanded(e, _selectedView) ? e.value() : e.value(_selectedView.amountUsdField),
});

export const formatDateFieldValue = ({ value }) =>
	value
		.split('/')
		.reverse()
		.join('.');
