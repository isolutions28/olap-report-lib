import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { Inject, Injectable, InjectionToken } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { map} from 'rxjs/operators';
import { LoadOptions } from 'devextreme/data/load_options';
import jQuery from 'jquery-deferred';

import {
  ApiResponse,
  ApiResponseStatus,
  FilterGroup,
  IdName,
  ViewCashFlowConfig,
  ViewDescription,
  ViewSetting,
  ViewStructure,
  ViewStructureResponse,
} from './types';

export interface OlapServiceConfig {
  serverUrl: string;
}

export interface GroupInfoPayload {
  loadOptions: LoadOptions;
  viewName: string;
  structure: ViewStructure[];
}

export const OLAP_SERVICE_CONFIG = new InjectionToken<OlapServiceConfig>('OlapServiceConfig');

@Injectable({providedIn: 'root'})
export class IsolOlapReportService {
  private readonly REPORT_URL = '/report';
  private readonly VIEWS_URL = `${this.REPORT_URL}/views`;
  private readonly VIEW_STRUCTURE_URL = `${this.REPORT_URL}/structure`;
  private readonly VIEW_INSTANCE_URL = `${this.REPORT_URL}/instance`;
  private readonly SETTING_URL = '/setting';
  private readonly SETTING_NAMES_URL = `${this.SETTING_URL}/names`;
  private readonly CREATE_SETTING_URL = `${this.SETTING_URL}/create`;
  private readonly DELETE_SETTING_URL = `${this.SETTING_URL}/delete`;
  private readonly CASH_FLOW_FOLDERS_URL = `${this.REPORT_URL}/group`;

  dbRoleSubject = new BehaviorSubject<string>(null);
  userIdSubject = new BehaviorSubject<string>(null);
  authTokenSubject = new BehaviorSubject<string>(null);
  private _errorsSubject = new Subject<ApiResponse<any>>();

  constructor(
    private httpClient: HttpClient,
    @Inject(OLAP_SERVICE_CONFIG) private config: OlapServiceConfig,
  ) {}

  getAllViews(): Observable<ViewDescription[]> {
    const options = {
      ...this.addHeaders(),
      params: new HttpParams({
        fromObject: {
          ...(this.dbRoleSubject.getValue() ? {dbRole: this.dbRoleSubject.getValue()} : {}),
        },
      }),
    };
    return this.httpClient
      .get<ApiResponse<{viewNames: ViewDescription[]}>>(this.buildUrl(this.VIEWS_URL), options)
      .pipe(
        this.extractMap,
        map((resp) => resp.viewNames),
      );
  }

  getViewStructure(viewName: string): Observable<ViewStructureResponse> {
    const options = {
      ...this.addHeaders(),
      params: new HttpParams({
        fromObject: {
          view: viewName,
          ...(this.dbRoleSubject.getValue() ? {dbRole: this.dbRoleSubject.getValue()} : {}),
        },
      }),
    };
    return this.httpClient
      .get<ApiResponse<ViewStructureResponse>>(this.buildUrl(this.VIEW_STRUCTURE_URL), options)
      .pipe(this.extractMap);
  }

	getGroupInfo({
		loadOptions,
		viewName,
		structure = []
	}: GroupInfoPayload): Promise<any> {
		const sendObject: { [key: string]: string | any } = {};
		sendObject['view'] = viewName;
		if (loadOptions.group) {
			sendObject['group'] = JSON.stringify(loadOptions.group);
		}
		if (loadOptions.groupSummary) {
			sendObject['groupSummary'] = JSON.stringify(loadOptions.groupSummary);
		}
		if (loadOptions.filter) {
			sendObject['filter'] = JSON.stringify(
				new FilterGroup(loadOptions.filter)
			);
		}
		if (structure.length) {
			sendObject['structure'] = JSON.stringify(structure);
		}
		if (this.dbRoleSubject.getValue()) {
			sendObject['dbRole'] = this.dbRoleSubject.getValue();
		}
		const options = {
			...this.addHeaders()
		};
		const d = jQuery.Deferred();
		if (!loadOptions.group) {
			d.resolve();
		} else {
			this.httpClient
				.post(this.buildUrl(this.REPORT_URL), sendObject, options)
				.pipe(this.extractMap)
				.subscribe(
					resp => {
						d.resolve(resp.data, {
							totalCount: resp.totalCount,
							summary: resp.summary
						});
					},
					error => d.reject(error)
				);
		}
		return d.promise();
	}

  getViewInstance(viewName: string, loadAll: boolean = false): Observable<any> {
    const options = {
      ...this.addHeaders(),
      params: new HttpParams({
        fromObject: {
          view: viewName,
          skip: '0',
          ...(loadAll ? {} : {take: '1'}),
          ...(this.dbRoleSubject.getValue() ? {dbRole: this.dbRoleSubject.getValue()} : {}),
        },
      }),
    };
    return this.httpClient.get(this.buildUrl(this.VIEW_INSTANCE_URL), options).pipe(
      this.extractMap,
      map((resp) => resp.map((value) => value.entry)),
    );
  }

  getAllSettingNames(viewName: string): Observable<IdName[]> {
    const options = {
      ...this.addHeaders(),
      params: new HttpParams({
        fromObject: {
          ...(this.userIdSubject.getValue() ? {userId: this.userIdSubject.getValue()} : {}),
          viewName,
        },
      }),
    };
    return this.httpClient
      .get<ApiResponse<IdName[]>>(this.buildUrl(this.SETTING_NAMES_URL), options)
      .pipe(this.extractMap);
  }

  createSetting(setting: ViewSetting): Observable<ViewSetting> {
    return this.httpClient
      .post<ApiResponse<ViewSetting>>(
        this.buildUrl(this.CREATE_SETTING_URL),
        setting,
        this.addHeaders(),
      )
      .pipe(this.extractMap);
  }

  getSettingById(id: string): Observable<ViewSetting> {
    const options = {
      ...this.addHeaders(),
      params: new HttpParams({
        fromObject: {id},
      }),
    };
    return this.httpClient
      .get<ApiResponse<ViewSetting>>(this.buildUrl(this.SETTING_URL), options)
      .pipe(this.extractMap);
  }

  getCashFlowFolders(viewName: string): Observable<ViewCashFlowConfig> {
    const options = {
      ...this.addHeaders(),
      params: new HttpParams({
        fromObject: {viewName},
      }),
    };
    return this.httpClient
      .get<ApiResponse<ViewCashFlowConfig>>(this.buildUrl(this.CASH_FLOW_FOLDERS_URL), options)
      .pipe(
        this.extractMap,
        map((value) => new ViewCashFlowConfig(value)),
      );
  }

  deleteSetting(id: number): Observable<{value: boolean}> {
    const options = {
      ...this.addHeaders(),
      params: new HttpParams({
        fromObject: {id: String(id)},
      }),
    };
    return this.httpClient
      .put<ApiResponse<{value: boolean}>>(this.buildUrl(this.DELETE_SETTING_URL), null, options)
      .pipe(this.extractMap);
  }

  get errorResponses(): Observable<ApiResponse<any>> {
    return this._errorsSubject.asObservable();
  }

  private buildUrl(url: string): string {
    return `${this.config.serverUrl}${url}`;
  }

  private extractResponse = (response: ApiResponse<any>): any => {
    switch (response.status) {
      case ApiResponseStatus.ERROR:
        this._errorsSubject.next(response);
        console.error(response.message);
        throw new Error(response.message);
      default:
        return response.body;
    }
  };

  private extractMap = map(this.extractResponse);

  private extractData = map((resp: any) => resp.data);

  private addHeaders() {
    return this.authTokenSubject.getValue()
      ? {
          headers: new HttpHeaders({
            Authorization: this.authTokenSubject.getValue(),
          }),
        }
      : {};
  }
}
