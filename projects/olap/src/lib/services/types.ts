import DevExpress from 'devextreme/bundles/dx.all';
import {isArray} from 'util';
import {Moment as MomentType} from 'moment';

import PivotGridDataSourceField = DevExpress.data.PivotGridDataSourceField;

export enum ApiResponseStatus {
  OK = 'OK',
  ERROR = 'ERROR',
  AUTH_ERROR = 'AUTH_ERROR',
  EMPTY_RESULT = 'EMPTY_RESULT',
}

export interface ApiResponse<T> {
  status: ApiResponseStatus;
  message: string;
  body: T;
}

export interface ViewsList {
  viewNames: {[key: string]: string};
}

export class ViewStructure {
  caption: string;
  dataField: string;
  dataType: 'date' | 'number' | 'string';
  visible: boolean;
  area: 'column' | 'data' | 'filter' | 'row' | undefined;
  areaIndex?: number;

  constructor(data: any = {}) {
    this.caption = data.caption;
    this.dataField = data.dataField;
    this.dataType = data.dataType;
    this.visible = data.visible;
    this.area = data.area;
    this.areaIndex = data.areaIndex;
  }
}

export interface ViewStructureResponse {
  data: ViewStructure[];
}

export interface DataEntry {
  key: string;
  count: number;
  summary: number[];
  items: DataEntry[];
}

export interface DataEntryResponse {
  data: DataEntry[];
  summary: number[];
  totalCount: number;
}

enum JoinOperator {
  AND = 'AND',
  OR = 'OR',
}

enum Operation {
  EQ = 'EQ',
  MORE = 'MORE',
  LESS = 'LESS',
  MORE_EQ = 'MORE_EQ',
  LESS_EQ = 'LESS_EQ',
  BETWEEN = 'BETWEEN',
}

enum Type {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
}

export class Filter {
  field: string;
  operation: Operation;
  value: any;
  type: Type;

  constructor(filter: any[]) {
    this.field = filter[0].replace('.', '->');
    this.operation = Filter.determinateOperator(filter[1]);
    this.value = filter[2];
    this.type = typeof filter[2] === 'number' ? Type.NUMBER : Type.STRING;
  }

  private static determinateOperator(operator: string): Operation {
    switch (operator) {
      case '=':
        return Operation.EQ;
      case '<':
        return Operation.LESS;
      case '>':
        return Operation.MORE;
      case '<=':
        return Operation.LESS_EQ;
      case '>=':
        return Operation.MORE_EQ;
      case '><':
        return Operation.BETWEEN;
      default:
        throw new Error(`Unknown Operator: ${operator}`);
    }
  }
}

export class FilterGroup {
  filterGroups: FilterGroup[] = [];
  filters: Filter[] = [];
  joinOperator: JoinOperator;

  constructor(filterGroup: any[]) {
    filterGroup.forEach((elem) => {
      if (FilterGroup.isFilter(elem)) {
        this.filters.push(new Filter(elem));
      } else if (FilterGroup.isFilterGroup(elem)) {
        this.filterGroups.push(new FilterGroup(elem));
      } else {
        this.joinOperator = FilterGroup.determinateJoinOperator(elem);
      }
    });
  }

  private static isFilterGroup(filterGroup: any[]): boolean {
    return isArray(filterGroup) && isArray(filterGroup[0]);
  }

  private static isFilter(filter: any[]): boolean {
    return isArray(filter) && !isArray(filter[0]);
  }

  private static determinateJoinOperator(operator: string): JoinOperator {
    switch (operator) {
      case 'and':
        return JoinOperator.AND;
      case 'or':
        return JoinOperator.OR;
      default:
        throw new Error(`Unknown JoinOperator: ${operator}`);
    }
  }
}

export interface IdName {
  id: number;
  name: string;
}

export interface ViewDescription {
  viewName: ReportViewName | string;
  label: string;
  remoteOperations: boolean;
  groupViewName: string;
  isMultiCurrency?: boolean;
  currencyField?: string;
  amountField?: string;
  amountUsdField?: string;
  dateField?: string;
}

export enum ViewSettingFields {
  ID = 'id',
  USER_ID = 'userId',
  NAME = 'name',
  VALUE = 'value',
  VIEW = 'view',
}

export interface ViewSetting {
  [ViewSettingFields.ID]?: number;
  [ViewSettingFields.USER_ID]: string;
  [ViewSettingFields.NAME]: string;
  [ViewSettingFields.VALUE]: string;
  [ViewSettingFields.VIEW]: string;
}

export interface GridFieldOptions {
  columnExpandedPaths: string[];
  rowExpandedPaths: string[];
  fields: PivotGridDataSourceField[];
  selectedRow: any;
  selectedColumn: any;
  date: { start: MomentType, end: MomentType };
}

export interface ViewConfig {
  selectedView: ViewDescription;
  viewParameters?: PivotGridDataSourceField[];
  state?: GridFieldOptions;
  isCustomSetting: boolean;
}

export class CashFlow {
  name: string;
  path: string;

  constructor(data: any = {}) {
    this.name = data.name;
    this.path = data.path;
  }
}

export class ViewCashFlowConfig {
  values: CashFlow[];
  maxDepth: number;
  groupByField: string;
  groupFieldPath: string;

  constructor(data: any = {}) {
    this.maxDepth = data.maxDepth;
    this.groupByField = data.groupByField;
    this.groupFieldPath = data.groupFieldPath;

    this.values = data.values ? data.values.map((elem) => new CashFlow(elem)) : [];
  }
}

export const CURRENCY_KEY = 'currency';

export interface ValidationResult {
  isValid: boolean;
  messageKey?: string;
}

export enum ReportViewName {
	VW_FINANCED_ORDERS = 'vw_financed_orders',
	MULTIPLE_FINANCED_ORDERS = 'multiple_financed_orders',
	VW_PLAN_SALARY = 'vw_plan_salary',
	VW_PLAN_SALARY_MULTIPLE_CURRENCY = 'vw_plan_salary_multiple_currency',
	VW_BUDGET_CONSTRUCTION_OBJECT = 'vw_budget_construction_object',
	MULTIPLE_BUDGET_CONSTRUCTION_OBJECT = 'multiple_budget_construction_object',
	VW_PLAN_FACT = 'vw_plan_fact',
  MULTIPLE_PLAN_FACT_QUARTER_PAYMENT_REGISTRY = 'multiple_plan_fact_quarter_payment_registry',
  VW_QUARTER_PAYMENT_REGISTRY_PLAN_FACT = 'vw_quarter_payment_registry_plan_fact',
	MULTIPLE_PLAN_FACT_CONSTRUCTION_OBJECT_BUDGET_CASH_ORDER = 'multiple_plan_fact_construction_object_budget_cash_order',
	PLAN_FACT_CONSTRUCTION_OBJECT_BUDGET_CASH_ORDER = 'plan_fact_construction_object_budget_cash_order',
	MULTIPLE_PLAN_FACT_CONSTRUCTION_OBJECT_PAYMENT_REGISTRY = 'multiple_plan_fact_const_object_payment_registry',
	PLAN_FACT_CONSTRUCTION_OBJECT_PAYMENT_REGISTRY = 'plan_fact_const_object_payment_registry',
	PLAN_FACT_SALARY_BUDGET_CASH_ORDER = 'plan_fact_salary_budget_cash_order',
	MULTIPLE_PLAN_FACT_SALARY_BUDGET_CASH_ORDER = 'multiple_plan_fact_salary_budget_cash_order',
	PLAN_FACT_SALARY_BUDGET_PAYMENT_REGISTRY = 'plan_fact_salary_budget_payment_registry',
	MULTIPLE_PLAN_FACT_SALARY_BUDGET_PAYMENT_REGISTRY = 'multiple_plan_fact_salary_budget_payment_registry',
	MULTIPLE_PLAN_FACT = 'multiple_plan_fact',
	MULTIPLE_BUDGET_QUARTER = 'multiple_budget_quarter',
	VW_DDS_TEST_MULTIPLE_BUDGET_QUARTER = 'vw_dds_test_multiple_budget_quarter',
	VW_USER_INFO = 'vw_user_info',
	MULTIPLE_PLAN_FACT_SALARY_BUDGET_CASH_ORDER_SALARY = 'multiple_plan_fact_salary_budget_cash_order_salary',
	PLAN_FACT_SALARY_BUDGET_PAYMENT_REGISTRY_SALARY = 'plan_fact_salary_budget_payment_registry_salary',
	MULTIPLE_PLAN_FACT_SALARY_BUDGET_PAYMENT_REGISTRY_SALARY = 'multiple_plan_fact_salary_budget_payment_registry_salary',
	PLAN_FACT_SALARY_BUDGET_CASH_ORDER_SALARY = 'plan_fact_salary_budget_cash_order_salary',
	LIMIT_VW = 'limit_vw',
	SOURCE = 'source'
}
