import { DataDescriptor, GridData, GridMetadata } from '../../../../index';
import PivotGridDataSource, {
	PivotGridDataSourceField
} from 'devextreme/ui/pivot_grid/data_source';
import { CellFormulaValue, Style, Worksheet } from 'exceljs';
import { formatDateFieldValue } from '../olap-view.commons';
import {
	CellInfo,
	CellRange,
	CellSize,
	Direction,
	GridDataDescriptor,
	SheetCoordinates
} from './types';

export const A_CHAT_OFFSET = 65;
export const ALPHABET_LENGTH = 26;
export const HEADER_CELL_STYLE: Partial<Style> = {
	alignment: { wrapText: true, vertical: 'middle' }
};
export const RGB_COLOR_STEP = 20;

export const cellInfoFactory = (): CellInfo => ({
	cellData: {},
	rangeStyles: [],
	merges: []
});

export const addMergesToWorksheet = (
	cellInfo: CellInfo,
	worksheet: Worksheet
) => {
	cellInfo.merges.forEach(value => {
		const startCoordinate = convertToExcelCoordinate({
			r: value.s.r,
			c: value.s.c
		});
		const endCoordinate = convertToExcelCoordinate({
			r: value.e.r,
			c: value.e.c
		});
		worksheet.mergeCells([startCoordinate, endCoordinate]);
	});
};

export const writeDataToWorksheet = (
	cellInfo: CellInfo,
	worksheet: Worksheet
) =>
	Object.entries(cellInfo.cellData).forEach(([key, value]) => {
		const cell = worksheet.getCell(key);
		cell.value = value.v;
		const style = value.s;
		if (style) {
			cell.style = style;
		}
	});

export const addBorderToDataTable = (
	worksheet: Worksheet,
	dataRange: CellRange
) => {
	worksheet.addConditionalFormatting({
		ref: `${convertToExcelCoordinate(dataRange.s)}:${convertToExcelCoordinate(
			dataRange.e
		)}`,
		rules: [
			{
				type: 'expression',
				priority: 1,
				formulae: [true],
				style: {
					border: {
						top: { style: 'thin' },
						left: { style: 'thin' },
						bottom: { style: 'thin' },
						right: { style: 'thin' }
					}
				}
			}
		]
	});
};

export const addRangeStyles = (cellInfo: CellInfo, worksheet: Worksheet) => {
	const { rangeStyles } = cellInfo;
	if (rangeStyles) {
		rangeStyles.forEach(({ range, style }) => {
			worksheet.addConditionalFormatting({
				ref: `${convertToExcelCoordinate(range.s)}:${convertToExcelCoordinate(
					range.e
				)}`,
				rules: [
					{
						type: 'expression',
						priority: 1,
						formulae: [true],
						style: style
					}
				]
			});
		});
	}
};

export const summarizeAllCellSizes = (cellSizes: CellSize[]): CellSize => ({
	width: cellSizes.reduce((acc, { width }) => acc + width, 0),
	height: cellSizes.reduce((acc, { height }) => acc + height, 0)
});

export const hasChilds = ({ children }: DataDescriptor): boolean =>
	children && children.length > 0;

export const reduceArrays = (acc: any[], val: any[]) => acc.concat(val);

export const mergeCellInfo = (c1: CellInfo, c2: CellInfo): CellInfo => ({
	cellData: { ...(c1.cellData || {}), ...(c2.cellData || {}) },
	rangeStyles: [...(c1.rangeStyles || []), ...(c2.rangeStyles || [])],
	merges: [...(c1.merges || []), ...(c2.merges || [])]
});

export const getCoordinatesNextTo = (
	startPosition: SheetCoordinates,
	cellSize: CellSize,
	direction: Direction
): SheetCoordinates => ({
	r:
		direction === Direction.HORIZONTAL
			? startPosition.r
			: startPosition.r + cellSize.height,
	c:
		direction === Direction.HORIZONTAL
			? startPosition.c + cellSize.width
			: startPosition.c
});

export const convertToExcelCoordinate = ({
	r,
	c
}: SheetCoordinates): string => {
	const groupCount = Math.floor(c / ALPHABET_LENGTH);
	const groupOffset = groupCount - 1 + A_CHAT_OFFSET;
	const charCode = (c % ALPHABET_LENGTH) + A_CHAT_OFFSET;
	const charPart =
		groupCount > 0
			? `${String.fromCharCode(groupOffset, charCode)}`
			: `${String.fromCharCode(charCode)}`;
	const numberPart = r + 1;
	return `${charPart}${numberPart}`;
};

export const calculateRowOffset = ({
	data: { columns },
	metadata: { values }
}: GridDataDescriptor) =>
	calculateHierarchyMaxDepth(columns) +
	(filterVisibleFields(values).length > 1 ? 1 : 0);

export const calculateColumnOffset = ({ rows }: GridData) =>
	calculateHierarchyMaxDepth(rows);

export const calculateDepth = ({ children }: DataDescriptor) =>
	children && children.length > 0
		? 1 + calculateHierarchyMaxDepth(children)
		: 1;

export const calculateHierarchyMaxDepth = (
	descriptions: DataDescriptor[]
): number => Math.max(...descriptions.map(calculateDepth)) || 0;

export const extractFilterValues = (
	dataSource: PivotGridDataSource
): { name: string; values: string }[] =>
	dataSource
		.fields()
		.filter(({ filterValues }) => filterValues && filterValues.length > 0)
		.map(({ caption, filterValues, dataType, customizeText }) => ({
			name: caption,
			values: filterValues
				.map(value =>
					dataType === 'date'
						? convertDateToText(value)
						: customizeText
						? formatDateFieldValue({ value })
						: value
				)
				.join(', ')
		}));

export const nextNeighborStep = (maxNeighborDepth: number) =>
	maxNeighborDepth > 0 ? maxNeighborDepth - 1 : maxNeighborDepth;

const rgbToHex = (r: number, g: number, b: number) =>
	[r, g, b]
		.map(x => {
			const hex = x.toString(16);
			return hex.length === 1 ? '0' + hex : hex;
		})
		.join('');

export const generateRowRangeStyle = (
	startPosition: SheetCoordinates,
	cellSize: CellSize,
	topHeaderWidth: number,
	level: number = 0
) => ({
	range: {
		s: startPosition,
		e: {
			...startPosition,
			c: startPosition.c + topHeaderWidth + cellSize.width - 1
		}
	},
	style: rowStyleFactory(level)
});

export const rowStyleFactory = (level: number = 0): Partial<Style> => ({
	fill: {
		type: 'pattern',
		pattern: 'solid',
		fgColor: {
			argb: rgbToHex(
				Math.abs(255 - level * (RGB_COLOR_STEP / 2)),
				Math.abs(255 - level * RGB_COLOR_STEP),
				level * RGB_COLOR_STEP
			)
		},
		bgColor: {
			argb: rgbToHex(
				Math.abs(255 - level * (RGB_COLOR_STEP / 2)),
				Math.abs(255 - level * RGB_COLOR_STEP),
				level * RGB_COLOR_STEP
			)
		}
	}
});

export const calculateCellSize = (
	descriptor: DataDescriptor,
	metadata: GridMetadata,
	direction: Direction,
	maxNeighborDepth: number = 0
): CellSize[] => {
	const { children } = descriptor;
	if (hasChilds(descriptor)) {
		const groupSummarySize = calculateGroupSummaryCellSize(
			descriptor,
			metadata,
			direction,
			maxNeighborDepth
		);
		const newNeighborStep = nextNeighborStep(maxNeighborDepth);
		const childrenSizes = children
			.map(child =>
				calculateCellSize(child, metadata, direction, newNeighborStep)
			)
			.reduce(reduceArrays, []);
		const width =
			direction === Direction.HORIZONTAL
				? summarizeAllCellSizes(childrenSizes).width
				: 1;
		const height =
			direction === Direction.HORIZONTAL
				? 1
				: summarizeAllCellSizes(childrenSizes).height;
		return [{ width: width, height: height }, groupSummarySize];
	}
	const width =
		direction === Direction.HORIZONTAL
			? filterVisibleFields(metadata.values).length || 1
			: maxNeighborDepth || 1;
	const height = direction === Direction.HORIZONTAL ? maxNeighborDepth || 1 : 1;
	return [{ width: width, height: height }];
};

export const calculateGroupSummaryCellSize = (
	descriptor: DataDescriptor,
	{ values }: GridMetadata,
	direction: Direction,
	maxNeighborDepth: number = 0
): CellSize => {
	const width =
		direction === Direction.HORIZONTAL
			? filterVisibleFields(values).length || 1
			: Math.max(calculateDepth(descriptor), maxNeighborDepth);
	const height =
		direction === Direction.HORIZONTAL
			? Math.max(calculateDepth(descriptor), maxNeighborDepth)
			: 1;
	return {
		width: width,
		height: height
	};
};

export const getFirstLevelChildsRowsNumbers = (
	startPosition: SheetCoordinates,
	row: DataDescriptor,
	metadata: GridMetadata,
	direction: Direction = Direction.VERTICAL
): number[] => {
	const result = [];
	if (hasChilds(row)) {
		let childsStartRow = startPosition.r + 1;
		const { children } = row;
		const childsHeight = children.map(
			(child, index) =>
				summarizeAllCellSizes(calculateCellSize(child, metadata, direction))
					.height
		);
		childsHeight.forEach((height, index) => {
			result.push(childsStartRow);
			childsStartRow += height;
		});
	}
	return result;
};

export const generateFormulaCell = (
	startPosition: SheetCoordinates,
	childsRowNumbers: number[]
): CellFormulaValue => {
	return {
		formula: childsRowNumbers
			.map(row => convertToExcelCoordinate({ r: row, c: startPosition.c }))
			.join('+'),
		date1904: false
	};
};

export const convertDateToText = ([year, quarter, month]: [
	number,
	number?,
	number?
]): string => {
	if (year && quarter && month) {
		return `${month} ${year}`;
	}
	if (year && quarter) {
		return `${quarter} квартал ${year}`;
	}
	return `${year}`;
};

export const filterVisibleFields = (
	fields: PivotGridDataSourceField[]
): PivotGridDataSourceField[] => fields.filter(field => field.visible);
