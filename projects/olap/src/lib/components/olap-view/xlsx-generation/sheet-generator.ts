import { DataDescriptor, GridData, GridMetadata } from '../olap-view.component';
import * as Excel from 'exceljs';
import { saveAs } from 'file-saver';
import { reportTitlesHolder } from './report-titles';
import {
	addBorderToDataTable,
	addMergesToWorksheet,
	addRangeStyles,
	calculateCellSize,
	calculateColumnOffset,
	calculateHierarchyMaxDepth,
	calculateRowOffset,
	cellInfoFactory,
	convertToExcelCoordinate,
	filterVisibleFields,
	generateFormulaCell,
	generateRowRangeStyle,
	getCoordinatesNextTo,
	getFirstLevelChildsRowsNumbers,
	hasChilds,
	HEADER_CELL_STYLE,
	mergeCellInfo,
	nextNeighborStep,
	reduceArrays,
	summarizeAllCellSizes,
	writeDataToWorksheet
} from './sheet.utils';
import { ReportViewName, ViewDescription } from '../../../services/types';
import PivotGridDataSource from 'devextreme/ui/pivot_grid/data_source';
import {
	CellInfo,
	CellRange,
	CellSize,
	Direction,
	GridDataDescriptor,
	ReportOptions,
	SheetCoordinates
} from './types';

const EXCEL_TYPE =
	'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export async function generateXlsxFile(
	data: GridData,
	metadata: GridMetadata,
	{ viewName, label, isMultiCurrency }: ViewDescription,
	dataSource: PivotGridDataSource
) {
	const { cellInfo, dataRange } = generateSheetData(
		{ data, metadata },
		viewName,
		dataSource,
		{ multiCurrency: !!isMultiCurrency }
	);
	const workbook = new Excel.Workbook();
	const worksheet = workbook.addWorksheet(label);
	addMergesToWorksheet(cellInfo, worksheet);
	writeDataToWorksheet(cellInfo, worksheet);
	addBorderToDataTable(worksheet, dataRange);
	addRangeStyles(cellInfo, worksheet);
	const buffer = await workbook.xlsx.writeBuffer();
	saveAs(
		new Blob([buffer], {
			type: EXCEL_TYPE
		}),
		`${label}.xlsx`
	);
}

export const generateSheetData = (
	gridDataDescriptor: GridDataDescriptor,
	viewName: ReportViewName | string,
	dataSource: PivotGridDataSource,
	options?: Partial<ReportOptions>
): {
	cellInfo: CellInfo;
	dataRange: CellRange;
} => {
	let dataTableStartPosition: SheetCoordinates = { r: 0, c: 0 };
	const titleDataFn = reportTitlesHolder[viewName];
	const titleData = titleDataFn ? titleDataFn(dataSource) : null;
	if (titleData) {
		dataTableStartPosition = {
			r: dataTableStartPosition.r + titleData.dataStartPosition.r,
			c: dataTableStartPosition.c + titleData.dataStartPosition.c
		};
	}
	const rowOffset = calculateRowOffset(gridDataDescriptor);
	const columnOffset = calculateColumnOffset(gridDataDescriptor.data);
	const { data, metadata } = gridDataDescriptor;
	const { columns, rows } = data;
	const allRows = summarizeAllCellSizes(
		rows.map(row =>
			calculateCellSize(row, metadata, Direction.VERTICAL).reduce(
				(prev, curr) => ({ ...prev, height: prev.height + curr.height }),
				{ width: 0, height: 0 }
			)
		)
	);
	const allColumns = summarizeAllCellSizes(
		columns.map(column =>
			calculateCellSize(column, metadata, Direction.HORIZONTAL).reduce(
				(prev, curr) => ({ ...prev, width: prev.width + curr.width }),
				{ width: 0, height: 0 }
			)
		)
	);
	const lastCell = {
		r: allRows.height + rowOffset + dataTableStartPosition.r - 1,
		c: allColumns.width + columnOffset + dataTableStartPosition.c - 1
	};
	const header = generateDataHeader(gridDataDescriptor, {
		...dataTableStartPosition,
		c: dataTableStartPosition.c + columnOffset
	});
	const sideHeader = generateSideHeader(
		gridDataDescriptor,
		{
			...dataTableStartPosition,
			r: dataTableStartPosition.r + rowOffset
		},
		allColumns.width
	);
	const dataTableStartCoordinates = {
		c: dataTableStartPosition.c + columnOffset,
		r: dataTableStartPosition.r + rowOffset
	};
	const gridData = generateGridData(
		gridDataDescriptor,
		dataTableStartCoordinates,
		options
	);
	const cells = [
		titleData ? titleData.cellInfo : cellInfoFactory(),
		header,
		sideHeader,
		gridData
	].reduce((prev, curr) => mergeCellInfo(prev, curr), cellInfoFactory());
	mergeCellInfo(header, sideHeader);
	return {
		cellInfo: cells,
		dataRange: {
			s: dataTableStartPosition,
			e: lastCell
		}
	};
};

export const generateDataHeader = (
	{ data, metadata }: GridDataDescriptor,
	headerStartPosition: SheetCoordinates
): CellInfo => {
	let startPosition = { ...headerStartPosition };
	const { columns } = data;
	const maxNeighborDepth = calculateHierarchyMaxDepth(columns);
	return columns
		.map((column, index) => {
			if (index > 0) {
				startPosition = calculatePositionDependsOnPreviousCell(
					columns[index - 1],
					metadata,
					maxNeighborDepth,
					startPosition,
					Direction.HORIZONTAL
				);
			}
			return generateHeaderCell(
				startPosition,
				column,
				metadata,
				Direction.HORIZONTAL,
				maxNeighborDepth
			);
		})
		.reduce((acc, val) => mergeCellInfo(acc, val), {} as CellInfo);
};

export const generateSideHeader = (
	{ data, metadata }: GridDataDescriptor,
	headerStartPosition: SheetCoordinates,
	topHeaderWidth: number = 0
): CellInfo => {
	let startPosition = { ...headerStartPosition };
	const rows = data.rows;
	const maxNeighborDepth = calculateHierarchyMaxDepth(rows);
	return rows
		.map((row, index) => {
			if (index > 0) {
				startPosition = calculatePositionDependsOnPreviousCell(
					rows[index - 1],
					metadata,
					maxNeighborDepth,
					startPosition,
					Direction.VERTICAL
				);
			}
			return generateHeaderCell(
				startPosition,
				row,
				metadata,
				Direction.VERTICAL,
				maxNeighborDepth,
				topHeaderWidth,
				0
			);
		})
		.reduce((acc, val) => mergeCellInfo(acc, val), {} as CellInfo);
};

export const generateGridData = (
	{ data, metadata }: GridDataDescriptor,
	dataStartCoordinate: SheetCoordinates,
	options?: Partial<ReportOptions>
): CellInfo => {
	let startPosition = { ...dataStartCoordinate };
	const { columns, rows } = data;
	let generatedCells = cellInfoFactory();
	return rows
		.map((row, index) => {
			if (index > 0) {
				startPosition = calculateDataStartPositionDependsOnPreviousCell(
					rows[index - 1],
					metadata,
					startPosition,
					Direction.VERTICAL
				);
			}
			return generateRow(startPosition, row, columns, data, metadata, options);
		})
		.reduce((prev, curr) => mergeCellInfo(prev, curr), generatedCells);
};

export const calculatePositionDependsOnPreviousCell = (
	previousDescription: DataDescriptor,
	metadata: GridMetadata,
	maxNeighborDepth: number,
	startPosition: SheetCoordinates,
	direction: Direction
) => {
	let newPosition: SheetCoordinates;
	const childsSizesWithGroupSummary = calculateCellSizesWithGroupSummary(
		[previousDescription],
		metadata,
		direction,
		maxNeighborDepth
	);
	const [
		previousCellSize,
		previousGroupSummaryCellSize
	] = childsSizesWithGroupSummary;
	newPosition = getCoordinatesNextTo(
		startPosition,
		previousCellSize,
		direction
	);
	if (previousGroupSummaryCellSize) {
		newPosition = getCoordinatesNextTo(
			newPosition,
			previousGroupSummaryCellSize,
			direction
		);
	}
	return newPosition;
};

export const calculateDataStartPositionDependsOnPreviousCell = (
	previousDescription: DataDescriptor,
	metadata: GridMetadata,
	startPosition: SheetCoordinates,
	direction: Direction
): SheetCoordinates => {
	const cellSizes = calculateCellSizesWithGroupSummary(
		[previousDescription],
		metadata,
		direction
	);
	const sumSize = summarizeAllCellSizes(cellSizes);
	return {
		c:
			direction === Direction.HORIZONTAL
				? startPosition.c + sumSize.width
				: startPosition.c,
		r:
			direction === Direction.VERTICAL
				? startPosition.r + sumSize.height
				: startPosition.r
	};
};

export const generateHeaderCell = (
	startPosition: SheetCoordinates,
	descriptor: DataDescriptor,
	metadata: GridMetadata,
	direction: Direction,
	maxNeighborDepth: number = 0,
	topHeaderWidth: number = 0,
	level: number = 0
): CellInfo => {
	const childsSizesWithGroupSummary = calculateCellSizesWithGroupSummary(
		[descriptor],
		metadata,
		direction,
		maxNeighborDepth
	);
	let generatedCells = cellInfoFactory();
	const [cellSize, groupSummaryCellSize] = childsSizesWithGroupSummary;
	const cellStartPosition =
		direction === Direction.VERTICAL && groupSummaryCellSize
			? getCoordinatesNextTo(startPosition, groupSummaryCellSize, direction)
			: startPosition;

	const excelCoordinate = convertToExcelCoordinate(cellStartPosition);
	generatedCells.cellData[excelCoordinate] = {
		v:
			hasChilds(descriptor) && direction === Direction.VERTICAL
				? null
				: descriptor.text,
		s: HEADER_CELL_STYLE
	};
	if (direction === Direction.VERTICAL) {
		generatedCells.rangeStyles.push(
			generateRowRangeStyle(
				startPosition,
				groupSummaryCellSize ? groupSummaryCellSize : cellSize,
				topHeaderWidth,
				level
			)
		);
	}
	if (
		!hasChilds(descriptor) &&
		filterVisibleFields(metadata.values).length > 1 &&
		direction === Direction.HORIZONTAL
	) {
		const valueGroupCells = generateValueGroup(
			getCoordinatesNextTo(startPosition, cellSize, Direction.VERTICAL),
			metadata,
			direction
		);
		generatedCells = mergeCellInfo(generatedCells, valueGroupCells);
	}
	const merge = generateMerge(cellStartPosition, cellSize);
	if (merge) {
		generatedCells.merges.push(merge);
	}

	if (groupSummaryCellSize) {
		const groupSummaryCell = generateGroupSummaryCell(
			direction === Direction.HORIZONTAL
				? getCoordinatesNextTo(startPosition, cellSize, direction)
				: startPosition,
			descriptor,
			metadata,
			groupSummaryCellSize,
			direction,
			topHeaderWidth
		);
		generatedCells = mergeCellInfo(generatedCells, groupSummaryCell);
	}

	if (hasChilds(descriptor)) {
		const { children } = descriptor;
		let childStartCoordinates = getCoordinatesNextTo(
			cellStartPosition,
			cellSize,
			direction === Direction.HORIZONTAL
				? Direction.VERTICAL
				: Direction.HORIZONTAL
		);
		const newNeighborDepth = nextNeighborStep(maxNeighborDepth);
		const childLevel = level + 1;
		generatedCells = children
			.map((child, index) => {
				if (index > 0) {
					childStartCoordinates = calculatePositionDependsOnPreviousCell(
						children[index - 1],
						metadata,
						newNeighborDepth,
						childStartCoordinates,
						direction
					);
				}
				return generateHeaderCell(
					childStartCoordinates,
					child,
					metadata,
					direction,
					newNeighborDepth,
					topHeaderWidth,
					childLevel
				);
			})
			.reduce((acc, val) => mergeCellInfo(acc, val), generatedCells);
	}
	return generatedCells;
};

export const generateRow = (
	startPosition: SheetCoordinates,
	row: DataDescriptor,
	columns: DataDescriptor[],
	data: GridData,
	metadata: GridMetadata,
	options?: Partial<ReportOptions>
): CellInfo => {
	let generatedCells = generateRowByColumns(
		startPosition,
		row,
		columns,
		data,
		metadata,
		options
	);
	if (hasChilds(row)) {
		const { children } = row;
		let cellStartPosition = { ...startPosition, r: startPosition.r + 1 };
		generatedCells = children
			.map((rowChild, index) => {
				if (index > 0) {
					cellStartPosition = calculateDataStartPositionDependsOnPreviousCell(
						children[index - 1],
						metadata,
						cellStartPosition,
						Direction.VERTICAL
					);
				}
				return generateRow(
					cellStartPosition,
					rowChild,
					columns,
					data,
					metadata,
					options
				);
			})
			.reduce((prev, curr) => mergeCellInfo(prev, curr), generatedCells);
	}
	return generatedCells;
};

export const generateRowByColumns = (
	startPosition: SheetCoordinates,
	row: DataDescriptor,
	columns: DataDescriptor[],
	data: GridData,
	metadata: GridMetadata,
	options?: Partial<ReportOptions>
): CellInfo => {
	let cellStartPosition = { ...startPosition };
	let generatedCells = cellInfoFactory();
	return columns
		.map((column, index) => {
			if (index > 0) {
				cellStartPosition = calculateDataStartPositionDependsOnPreviousCell(
					columns[index - 1],
					metadata,
					cellStartPosition,
					Direction.HORIZONTAL
				);
			}
			const [cellSize] = calculateCellSize(
				column,
				metadata,
				Direction.HORIZONTAL
			);
			if (hasChilds(column)) {
				const summaryStartPosition = {
					...cellStartPosition,
					c: cellStartPosition.c + cellSize.width
				};

				generatedCells = generateDataCell(
					summaryStartPosition,
					row,
					column,
					data,
					metadata,
					options
				);
				let childStartPosition = { ...cellStartPosition };
				const { children } = column;
				return children
					.map((childColumn, index) => {
						if (index > 0) {
							childStartPosition = calculateDataStartPositionDependsOnPreviousCell(
								children[index - 1],
								metadata,
								childStartPosition,
								Direction.HORIZONTAL
							);
						}
						return generateRowByColumns(
							childStartPosition,
							row,
							[childColumn],
							data,
							metadata,
							options
						);
					})
					.reduce((prev, curr) => mergeCellInfo(prev, curr), generatedCells);
			} else {
				return generateDataCell(
					cellStartPosition,
					row,
					column,
					data,
					metadata,
					options
				);
			}
		})
		.reduce((prev, curr) => mergeCellInfo(prev, curr), generatedCells);
};

export const generateDataCell = (
	startPosition: SheetCoordinates,
	row: DataDescriptor,
	column: DataDescriptor,
	data: GridData,
	metadata: GridMetadata,
	options?: Partial<ReportOptions>
): CellInfo => {
	const formulaAllowed = !options?.multiCurrency ?? true;
	const generatedCells = cellInfoFactory();
	const values = (data.values[row.index][column.index] || []).filter(
		(val, index) => metadata.values[index].visible
	);
	const rowsNumbers = getFirstLevelChildsRowsNumbers(
		startPosition,
		row,
		metadata
	);
	values.forEach((value, index) => {
		const coordinate = {
			...startPosition,
			c: startPosition.c + index
		};
		generatedCells.cellData[convertToExcelCoordinate(coordinate)] = {
			v:
				rowsNumbers.length > 0 && formulaAllowed
					? generateFormulaCell(coordinate, rowsNumbers)
					: isNaN(value)
					? value
					: Number(value),
			...(!isNaN(value) ? { s: { numFmt: '#,###' } } : {})
		};
	});

	return generatedCells;
};

export const generateGroupSummaryCell = (
	startPosition: SheetCoordinates,
	descriptor: DataDescriptor,
	metaData: GridMetadata,
	cellSize: CellSize,
	direction: Direction,
	topHeaderWidth: number = 0,
	level: number = 0
): CellInfo => {
	let generatedCells = cellInfoFactory();
	const excelCoordinate = convertToExcelCoordinate(startPosition);
	if (
		filterVisibleFields(metaData.values).length > 1 &&
		direction === Direction.HORIZONTAL
	) {
		const valueGroupCells = generateValueGroup(
			getCoordinatesNextTo(startPosition, cellSize, Direction.VERTICAL),
			metaData,
			direction
		);
		generatedCells = mergeCellInfo(generatedCells, valueGroupCells);
	}
	generatedCells.cellData[excelCoordinate] = {
		v: `${descriptor.text} итоги`,
		s: HEADER_CELL_STYLE
	};
	if (direction === Direction.VERTICAL) {
		generatedCells.rangeStyles.push(
			generateRowRangeStyle(startPosition, cellSize, topHeaderWidth, level)
		);
	}
	const merge = generateMerge(startPosition, cellSize);
	if (merge) {
		generatedCells.merges.push(merge);
	}
	return generatedCells;
};

export const generateMerge = (
	startPosition: SheetCoordinates,
	cellSize: CellSize
): CellRange | null => {
	const { height, width } = cellSize;
	if (height === 1 && width === 1) {
		return null;
	}
	return {
		s: { r: startPosition.r, c: startPosition.c },
		e: {
			r: startPosition.r + cellSize.height - 1,
			c: startPosition.c + cellSize.width - 1
		}
	};
};

export const calculateCellSizesWithGroupSummary = (
	descriptors: DataDescriptor[],
	metadata: GridMetadata,
	direction: Direction,
	maxNeighborDepth: number = 0
): CellSize[] =>
	descriptors
		.map(descriptor =>
			calculateCellSize(descriptor, metadata, direction, maxNeighborDepth)
		)
		.reduce(reduceArrays, []);

export const generateValueGroup = (
	startPosition: SheetCoordinates,
	metaData: GridMetadata,
	direction: Direction
): CellInfo =>
	filterVisibleFields(metaData.values)
		.map((value, index) => {
			const currentPosition: SheetCoordinates = getCoordinatesNextTo(
				startPosition,
				{
					width: index,
					height: 1
				},
				direction
			);
			const generatedCell = cellInfoFactory();
			const excelCoordinate = convertToExcelCoordinate(currentPosition);
			generatedCell.cellData[excelCoordinate] = { v: value.caption };
			return generatedCell;
		})
		.reduce((acc, val) => mergeCellInfo(acc, val), {} as CellInfo);
