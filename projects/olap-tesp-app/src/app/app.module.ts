import { BrowserModule } from '@angular/platform-browser';
import { LOCALE_ID, NgModule } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';

import { AppComponent } from './app.component';
import { OlapModule } from '../../../olap/src';
import { MatButtonModule } from '@angular/material/button';
import {
	DateAdapter,
	MAT_DATE_FORMATS,
	MAT_DATE_LOCALE
} from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import {
	MAT_MOMENT_DATE_ADAPTER_OPTIONS,
	MAT_MOMENT_DATE_FORMATS,
	MatMomentDateModule,
	MomentDateAdapter
} from '@angular/material-moment-adapter';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { registerLocaleData } from '@angular/common';
import localeRu from '@angular/common/locales/ru';
import extraLocaleRu from '@angular/common/locales/extra/ru';

registerLocaleData(localeRu, 'ru-RU', extraLocaleRu);
@NgModule({
	declarations: [AppComponent],
	imports: [
		BrowserModule,
		BrowserAnimationsModule,
		OlapModule.forRoot({
			serverUrl: 'http://reportsfrs-sandbox01.isolutions.io'
		}),
		ReactiveFormsModule,
		MatDatepickerModule,
		MatMomentDateModule,
		MatButtonModule
	],
	providers: [
		{ provide: LOCALE_ID, useValue: 'ru-RU' },
		{ provide: MAT_MOMENT_DATE_ADAPTER_OPTIONS, useValue: { useUtc: true } },
		{
			provide: DateAdapter,
			useClass: MomentDateAdapter,
			deps: [MAT_DATE_LOCALE, MAT_MOMENT_DATE_ADAPTER_OPTIONS]
		},
		{ provide: MAT_DATE_FORMATS, useValue: MAT_MOMENT_DATE_FORMATS }
	],
	bootstrap: [AppComponent]
})
export class AppModule {}
