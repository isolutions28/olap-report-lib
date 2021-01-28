import { Component, OnInit, ViewChild } from '@angular/core';

import { FormBuilder, FormControl } from '@angular/forms';
import {
	ViewConfig,
	OlapViewComponent,
	ViewDescription,
	IdName,
	IsolOlapReportService,
	ViewSettingFields
} from '../../../olap/src';

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
	private _view: OlapViewComponent;
	@ViewChild('olapView')
	set view(view: OlapViewComponent) {
		this._view = view;
	}

	viewsList: ViewDescription[] = [];
	savedConfigList: IdName[] = [];
	config: ViewConfig;
	userId = '1';
	dbRole = 'postgres';

	selectedView: FormControl;
	selectedConfig: FormControl;
	nameField = this.fb.control(null);

	constructor(
		private isolOlapReportService: IsolOlapReportService,
		private fb: FormBuilder
	) {}

	ngOnInit(): void {
		this.isolOlapReportService.userIdSubject.next(this.userId);
		this.isolOlapReportService.dbRoleSubject.next(this.dbRole);
		this.isolOlapReportService.authTokenSubject.next(
			'eyJhbGciOiJIUzUxMiJ9.eyJzdWIiOiJjNTM0MWEzZGQ1ZDc0NDljYjcyNjQ5NTlhYjMyOTU3YSJ9.wYJYFt_4f1D0utIemq0SsOhl3TYv8eClzJBr_49sHl04gIspN9UM_EXxcclSztY3g27XcQDpR3KdqxHFHGtBkA'
		);
		this.selectedView = this.fb.control(null);
		this.selectedConfig = this.fb.control(null);
		this.isolOlapReportService.getAllViews().subscribe(resp => {
			this.viewsList = resp;
		});
		this.selectedView.valueChanges.subscribe((value: ViewDescription) => {
			this.selectedConfig.setValue(null);
			this.config = null;
			this.isolOlapReportService
				.getAllSettingNames(value.viewName)
				.subscribe(value => {
					this.savedConfigList = value;
				});
		});
		this.selectedConfig.valueChanges.subscribe(
			(setting: ViewDescription | any) => {
				if (!!setting && setting !== 'null') {
					this.isolOlapReportService
						.getSettingById(setting.id)
						.subscribe(resp => {
							this.config = {
								selectedView: this.selectedView.value,
								...(resp[ViewSettingFields.VALUE]
									? {
											viewParameters: JSON.parse(resp[ViewSettingFields.VALUE])
									  }
									: {}),
								isCustomSetting: true
							};
						});
				} else {
					this.config = {
						selectedView: this.selectedView.value,
						isCustomSetting: false
					};
				}
			}
		);
	}

	createConfig() {
		this.isolOlapReportService
			.createSetting({
				name: this.nameField.value,
				userId: this.isolOlapReportService.userIdSubject.getValue(),
				value: JSON.stringify(this._view.currentConfig),
				view: this.selectedView.value.id
			})
			.subscribe(console.log);
	}
}
