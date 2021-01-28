import { Component, forwardRef, Input, OnDestroy } from '@angular/core';
import { Moment } from 'moment';
import {
	ControlValueAccessor,
	FormBuilder,
	NG_VALUE_ACCESSOR
} from '@angular/forms';
import { Subscription } from 'rxjs';
import { DateRange, MatDateRangePicker } from '@angular/material/datepicker';

export enum DateUnit {
	YEAR = 'year',
	QUARTER = 'quarter',
	MONTH = 'month',
	DAY = 'day'
}

@Component({
	selector: 'isol-date-range-picker',
	templateUrl: 'date-range-picker.component.html',
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			useExisting: forwardRef(() => DateRangePickerComponent),
			multi: true
		}
	]
})
export class DateRangePickerComponent
	implements ControlValueAccessor, OnDestroy {
	@Input() dateRange: DateUnit = DateUnit.DAY;

	dateControl = this.formBuilder.group({
		start: [],
		end: []
	});

	onChange: (data: any) => void;
	onTouched: () => void;

	dateSubscription: Subscription;

	private _startDate: Moment;
	private _endDate: Moment;

	constructor(private formBuilder: FormBuilder) {}

	registerOnChange(fn: any): void {
		if (this.dateSubscription) {
			this.dateSubscription.unsubscribe();
		}
		this.onChange = fn;
		this.dateSubscription = this.dateControl.valueChanges.subscribe(date => {
			this.onChange(date);
		});
	}

	registerOnTouched(fn: any): void {
		this.onTouched = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		isDisabled ? this.dateControl.disable() : this.dateControl.enable();
	}

	writeValue(obj: DateRange<Moment>): void {
		this.dateControl.setValue(obj ?? { start: null, end: null });
	}

	yearSelected(date: Moment, picker: MatDateRangePicker<any>) {
		this.internalSelect(date, picker, DateUnit.YEAR);
	}

	monthSelected(date: Moment, picker: MatDateRangePicker<any>) {
		this.internalSelect(date, picker, DateUnit.MONTH);
	}

	private internalSelect(
		date: Moment,
		picker: MatDateRangePicker<Moment>,
		range: DateUnit
	) {
		if (this.dateRange !== range) {
			return;
		}
		if (!this._startDate) {
			this._startDate = date;
			this.closeAndThenOpenPicker(picker);
			return;
		}
		this._endDate = date;
		picker.close();
		this.emitSelectedRange();
	}

	private closeAndThenOpenPicker(picker: MatDateRangePicker<Moment>) {
		picker.close();
		setTimeout(() => picker.open(), 0);
	}

	emitSelectedRange() {
		this.dateControl.setValue({
			start: this._startDate,
			end: this.formatEndDateForRange(this.dateRange)
		});
		this._startDate = null;
		this._endDate = null;
	}

	private formatEndDateForRange(range: DateUnit): Moment {
		return this._endDate.endOf(range);
	}

	ngOnDestroy(): void {
		this.dateSubscription.unsubscribe();
	}
}
