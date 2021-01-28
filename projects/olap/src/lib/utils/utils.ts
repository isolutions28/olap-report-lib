import { CashFlow, ViewCashFlowConfig } from '../..';

export const getParentName = (
	folders: CashFlow[],
	value: any,
	level: number,
	config: ViewCashFlowConfig
): string => {
	if (!config.groupFieldPath) {
		console.error(config);
		throw Error('Config groupFieldPath is empty');
	}
	const path = value[config.groupFieldPath];
	const parentPath = getPathByLevel(path, level);
	const cashFlow = folders.find(elem => elem.path === parentPath);
	return cashFlow ? cashFlow.name : value[config.groupByField];
};

export const getPathByLevel = (path: string, level: number) =>
	path
		.split('.')
		.slice(0, level)
		.join('.');
