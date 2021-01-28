import { ReportViewName } from '../../../services/types';
import { extractFilterValues, cellInfoFactory } from './sheet.utils';
import PivotGridDataSource from 'devextreme/ui/pivot_grid/data_source';
import { CellInfo, ReportTitleHolder, SheetCoordinates } from './types';
import { Style } from 'exceljs';

const ROW_OFFSET_BETWEEN_TITLE_AND_DATA = 2;
const TITLE_CELL_STYLE: Partial<Style> = {
	font: { bold: true },
	alignment: { horizontal: 'center' }
};

export const {
	VW_FINANCED_ORDERS,
	MULTIPLE_FINANCED_ORDERS,
	VW_PLAN_SALARY,
	VW_PLAN_SALARY_MULTIPLE_CURRENCY,
	VW_BUDGET_CONSTRUCTION_OBJECT,
	MULTIPLE_BUDGET_CONSTRUCTION_OBJECT,
	VW_PLAN_FACT,
	MULTIPLE_PLAN_FACT_CONSTRUCTION_OBJECT_BUDGET_CASH_ORDER,
	PLAN_FACT_CONSTRUCTION_OBJECT_BUDGET_CASH_ORDER,
	MULTIPLE_PLAN_FACT_CONSTRUCTION_OBJECT_PAYMENT_REGISTRY,
	PLAN_FACT_CONSTRUCTION_OBJECT_PAYMENT_REGISTRY,
	PLAN_FACT_SALARY_BUDGET_CASH_ORDER,
	MULTIPLE_PLAN_FACT_SALARY_BUDGET_CASH_ORDER,
	PLAN_FACT_SALARY_BUDGET_PAYMENT_REGISTRY,
	MULTIPLE_PLAN_FACT_SALARY_BUDGET_PAYMENT_REGISTRY,
	MULTIPLE_PLAN_FACT,
	MULTIPLE_BUDGET_QUARTER,
	VW_DDS_TEST_MULTIPLE_BUDGET_QUARTER,
	VW_USER_INFO,
	MULTIPLE_PLAN_FACT_SALARY_BUDGET_CASH_ORDER_SALARY,
	PLAN_FACT_SALARY_BUDGET_PAYMENT_REGISTRY_SALARY,
	MULTIPLE_PLAN_FACT_SALARY_BUDGET_PAYMENT_REGISTRY_SALARY,
	PLAN_FACT_SALARY_BUDGET_CASH_ORDER_SALARY,
	LIMIT_VW,
	SOURCE
} = ReportViewName;

export const reportTitleHeader: Record<ReportViewName | string, string> = {
	[VW_DDS_TEST_MULTIPLE_BUDGET_QUARTER]:
		'Квартальный план по проекту с ЦФО, USD',
	[MULTIPLE_BUDGET_QUARTER]: 'Квартальный план по проекту с ЦФО, USD',
	[MULTIPLE_BUDGET_CONSTRUCTION_OBJECT]: 'Отчет по обьектам строительства',
	[MULTIPLE_PLAN_FACT_CONSTRUCTION_OBJECT_PAYMENT_REGISTRY]:
		'Отчет план-факт по бюджету объекта строительства и реестру',
	[VW_PLAN_FACT]: 'Отчет План Факт финансирования бюджетов, USD',
	[LIMIT_VW]: 'Отчет по лимитам',
	[MULTIPLE_PLAN_FACT_SALARY_BUDGET_CASH_ORDER_SALARY]:
		'Отчет план-факт выплаты зарплаты по ордеру',
	[SOURCE]: 'Отчет по источникам',
	[PLAN_FACT_SALARY_BUDGET_CASH_ORDER]:
		'Отчет план-факт по зарплатному бюджету и ордеру, USD',
	[MULTIPLE_PLAN_FACT_SALARY_BUDGET_PAYMENT_REGISTRY]:
		'Отчет план-факт по зарплатному бюджету и реестру',
	[MULTIPLE_PLAN_FACT_SALARY_BUDGET_PAYMENT_REGISTRY_SALARY]:
		'Отчет план-факт выплаты зарплаты по реестру',
	[VW_BUDGET_CONSTRUCTION_OBJECT]: 'Отчет по обьектам строительства , USD',
	[VW_USER_INFO]: 'Отчёт по пользователям',
	[MULTIPLE_BUDGET_QUARTER]: 'Отчет по квартальним бюджетам',
	[VW_DDS_TEST_MULTIPLE_BUDGET_QUARTER]: 'Квартальный бюджет',
	[MULTIPLE_PLAN_FACT_CONSTRUCTION_OBJECT_BUDGET_CASH_ORDER]:
		'Отчет план-факт по бюджету объекта строительства и ордеру',
	[MULTIPLE_PLAN_FACT_SALARY_BUDGET_CASH_ORDER]:
		'Отчет план-факт по зарплатному бюджету и ордеру',
	[PLAN_FACT_CONSTRUCTION_OBJECT_PAYMENT_REGISTRY]:
		'Отчет план-факт по бюджету объекта строительства и реестру, USD',
	[PLAN_FACT_CONSTRUCTION_OBJECT_BUDGET_CASH_ORDER]:
		'Отчет план-факт по бюджету объекта строительства и ордеру, USD',
	[VW_FINANCED_ORDERS]: 'Отчет по профинансированым ордерам, USD',
	[PLAN_FACT_SALARY_BUDGET_PAYMENT_REGISTRY_SALARY]:
		'Отчет план-факт выплаты зарплаты по  реестру, USD',
	[VW_PLAN_SALARY_MULTIPLE_CURRENCY]: 'Отчет по заработной плате',
	[MULTIPLE_PLAN_FACT]: 'Отчет план факт финансирования бюджетов',
	[VW_PLAN_SALARY]: 'Отчет по заработной плате, USD',
	[PLAN_FACT_SALARY_BUDGET_PAYMENT_REGISTRY]:
		'Отчет план-факт по зарплатному бюджету и реестру, USD',
	[MULTIPLE_FINANCED_ORDERS]: 'Отчет по профинансированым ордерам',
	[PLAN_FACT_SALARY_BUDGET_CASH_ORDER_SALARY]:
		'Отчет план-факт выплаты зарплаты проекта по ордеру, USD'
};

const titleFactory = (reportName: ReportViewName) => (
	dataSource: PivotGridDataSource
): {
	cellInfo: CellInfo;
	dataStartPosition: SheetCoordinates;
} => {
	const filterValues = extractFilterValues(dataSource);
	const cellInfo = cellInfoFactory();
	cellInfo.cellData['A1'] = {
		v: reportTitleHeader[reportName] || reportName,
		s: TITLE_CELL_STYLE
	};
	filterValues.forEach((value, index) => {
		cellInfo.cellData[`A${index + 2}`] = { v: value.name };
		cellInfo.cellData[`C${index + 2}`] = { v: value.values };
	});
	cellInfo.merges.push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });
	return {
		cellInfo: cellInfo,
		dataStartPosition: {
			c: 0,
			r: filterValues.length + ROW_OFFSET_BETWEEN_TITLE_AND_DATA
		}
	};
};

export const reportTitlesHolder: ReportTitleHolder = {
	[VW_DDS_TEST_MULTIPLE_BUDGET_QUARTER]: titleFactory(
		VW_DDS_TEST_MULTIPLE_BUDGET_QUARTER
	),
	[MULTIPLE_BUDGET_QUARTER]: titleFactory(MULTIPLE_BUDGET_QUARTER),
	[VW_FINANCED_ORDERS]: titleFactory(VW_FINANCED_ORDERS),
	[MULTIPLE_FINANCED_ORDERS]: titleFactory(MULTIPLE_FINANCED_ORDERS),
	[VW_PLAN_SALARY]: titleFactory(VW_PLAN_SALARY),
	[VW_PLAN_SALARY_MULTIPLE_CURRENCY]: titleFactory(
		VW_PLAN_SALARY_MULTIPLE_CURRENCY
	),
	[VW_BUDGET_CONSTRUCTION_OBJECT]: titleFactory(VW_BUDGET_CONSTRUCTION_OBJECT),
	[MULTIPLE_BUDGET_CONSTRUCTION_OBJECT]: titleFactory(
		MULTIPLE_BUDGET_CONSTRUCTION_OBJECT
	),
	[VW_PLAN_FACT]: titleFactory(VW_PLAN_FACT),
	[MULTIPLE_PLAN_FACT_CONSTRUCTION_OBJECT_BUDGET_CASH_ORDER]: titleFactory(
		MULTIPLE_PLAN_FACT_CONSTRUCTION_OBJECT_BUDGET_CASH_ORDER
	),
	[PLAN_FACT_CONSTRUCTION_OBJECT_BUDGET_CASH_ORDER]: titleFactory(
		PLAN_FACT_CONSTRUCTION_OBJECT_BUDGET_CASH_ORDER
	),
	[MULTIPLE_PLAN_FACT_CONSTRUCTION_OBJECT_PAYMENT_REGISTRY]: titleFactory(
		MULTIPLE_PLAN_FACT_CONSTRUCTION_OBJECT_PAYMENT_REGISTRY
	),
	[PLAN_FACT_CONSTRUCTION_OBJECT_PAYMENT_REGISTRY]: titleFactory(
		PLAN_FACT_CONSTRUCTION_OBJECT_PAYMENT_REGISTRY
	),
	[PLAN_FACT_SALARY_BUDGET_CASH_ORDER]: titleFactory(
		PLAN_FACT_SALARY_BUDGET_CASH_ORDER
	),
	[MULTIPLE_PLAN_FACT_SALARY_BUDGET_CASH_ORDER]: titleFactory(
		MULTIPLE_PLAN_FACT_SALARY_BUDGET_CASH_ORDER
	),
	[PLAN_FACT_SALARY_BUDGET_PAYMENT_REGISTRY]: titleFactory(
		PLAN_FACT_SALARY_BUDGET_PAYMENT_REGISTRY
	),
	[MULTIPLE_PLAN_FACT_SALARY_BUDGET_PAYMENT_REGISTRY]: titleFactory(
		MULTIPLE_PLAN_FACT_SALARY_BUDGET_PAYMENT_REGISTRY
	),
	[MULTIPLE_PLAN_FACT]: titleFactory(MULTIPLE_PLAN_FACT),
	[VW_USER_INFO]: titleFactory(VW_USER_INFO),
	[MULTIPLE_PLAN_FACT_SALARY_BUDGET_CASH_ORDER_SALARY]: titleFactory(
		MULTIPLE_PLAN_FACT_SALARY_BUDGET_CASH_ORDER_SALARY
	),
	[PLAN_FACT_SALARY_BUDGET_PAYMENT_REGISTRY_SALARY]: titleFactory(
		PLAN_FACT_SALARY_BUDGET_PAYMENT_REGISTRY_SALARY
	),
	[MULTIPLE_PLAN_FACT_SALARY_BUDGET_PAYMENT_REGISTRY_SALARY]: titleFactory(
		MULTIPLE_PLAN_FACT_SALARY_BUDGET_PAYMENT_REGISTRY_SALARY
	),
	[PLAN_FACT_SALARY_BUDGET_CASH_ORDER_SALARY]: titleFactory(
		PLAN_FACT_SALARY_BUDGET_CASH_ORDER_SALARY
	),
	[LIMIT_VW]: titleFactory(LIMIT_VW),
	[SOURCE]: titleFactory(SOURCE)
};
