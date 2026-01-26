import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

@Injectable()
export class PostProvider {
  server: string = 'http://tabungansiswa.rplbc-23.com/api-tabungan/';

  constructor(public http: HttpClient) {}

  postData(body: any, file: string): Observable<any> {
    let type = 'application/json; charset=utf-8';
    let headers = new HttpHeaders({ 'Content-Type': type });
    return this.http
      .post(this.server + file, JSON.stringify(body), {
        headers: headers,
      })
      .pipe(
        map((res: any) => {
          return res;
        }),
      );
  }
}
