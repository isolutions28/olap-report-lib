import { CellFormulaValue, Style } from 'exceljs';
import { GridData, GridMetadata } from '../olap-view.component';
import { ReportViewName } from '../../../..';
import PivotGridDataSource from 'devextreme/ui/pivot_grid/data_source';

export interface CellSize {
	width: number;
	height: number;
}

export type CellRange = {
	s: SheetCoordinates;
	e: SheetCoordinates;
};

export interface CellInfo {
	cellData: {
		[key: string]: {
			v: string | number | CellFormulaValue;
			s?: Partial<Style>;
		};
	};
	rangeStyles?: {
		range: CellRange;
		style: Partial<Style>;
	}[];
	merges?: CellRange[];
}

export interface SheetCoordinates {
	r: number;
	c: number;
}

export interface GridDataDescriptor {
	data: GridData;
	metadata: GridMetadata;
}

export enum Direction {
	HORIZONTAL = 'HORIZONTAL',
	VERTICAL = 'VERTICAL'
}

export type ReportTitleHolder = Record<
	ReportViewName | string,
	(
		dataSource: PivotGridDataSource
	) => { cellInfo: CellInfo; dataStartPosition: SheetCoordinates }
>;

export interface ReportOptions {
	multiCurrency: boolean;
}
