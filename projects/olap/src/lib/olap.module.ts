import { ModuleWithProviders, NgModule } from '@angular/core';
import { DxButtonModule } from 'devextreme-angular/ui/button';
import { DxDropDownButtonModule } from 'devextreme-angular/ui/drop-down-button';
import { DxLoadPanelModule } from 'devextreme-angular/ui/load-panel';
import { DxPivotGridModule } from 'devextreme-angular/ui/pivot-grid';
import { DxPivotGridFieldChooserModule } from 'devextreme-angular/ui/pivot-grid-field-chooser';
import { DxTagBoxModule } from 'devextreme-angular/ui/tag-box';
import { loadMessages, locale } from 'devextreme/localization';

import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';

import {
	IsolOlapReportService,
	OlapServiceConfig,
	OLAP_SERVICE_CONFIG
} from './services/isol-olap-report.service';
import { OlapViewComponent } from './components/olap-view/olap-view.component';
import { MatMomentDateModule } from '@angular/material-moment-adapter';

import ruMessages from 'devextreme/localization/messages/ru.json';
import { DateRangePickerComponent } from './components/date-range-picker/date-range-picker.component';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatButtonModule } from '@angular/material/button';

const defaultConfig: OlapServiceConfig = { serverUrl: 'http://localhost:8081' };

loadMessages(ruMessages);
locale('ru');

@NgModule({
	declarations: [OlapViewComponent, DateRangePickerComponent],
	imports: [
		CommonModule,
		HttpClientModule,
		FormsModule,
		ReactiveFormsModule,
		MatInputModule,
		DxDropDownButtonModule,
		MatDatepickerModule,
		MatMomentDateModule,
		MatButtonModule,
		DxPivotGridModule,
		DxDropDownButtonModule,
		DxPivotGridFieldChooserModule,
		DxButtonModule,
		DxTagBoxModule,
		MatExpansionModule,
		DxLoadPanelModule
	],
	exports: [OlapViewComponent]
})
export class OlapModule {
	static forRoot(config?: OlapServiceConfig): ModuleWithProviders<OlapModule> {
		return {
			ngModule: OlapModule,
			providers: [
				IsolOlapReportService,
				{ provide: OLAP_SERVICE_CONFIG, useValue: config || defaultConfig }
			]
		};
	}
}
