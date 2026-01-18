import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Siswa {
  id?: number | string;
  nama: string;
  noHp: string;
  jenisKelamin: string;
  alamat: string;
  email: string;
  kelas: string;
  saldoTabungan: number;
  metodePembayaran?: string;
  nomorReferensi?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id?: number | string;
  siswaId: number | string;
  namaSiswa: string;
  type: 'setor' | 'tarik';
  amount: number;
  saldoSebelum: number;
  saldoSesudah: number;
  timestamp?: string;
}

export interface Statistik {
  total: number;
  lakiLaki: number;
  perempuan: number;
  totalSaldo: number;
  rataRataSaldo: number;
  totalTransaksi: number;
  totalSetor: number;
  totalTarik: number;
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = 'http://localhost/api-tabungan';

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json',
    }),
  };

  constructor(private http: HttpClient) { }

  // ===== SISWA =====

  getAllSiswa(): Observable<Siswa[]> {
    return this.http
      .get<ApiResponse<Siswa[]>>(`${this.apiUrl}/siswa.php`)
      .pipe(map((response) => response.data || []));
  }

  getSiswaById(id: number | string): Observable<Siswa> {
    return this.http
      .get<ApiResponse<Siswa>>(`${this.apiUrl}/siswa.php?id=${id}`)
      .pipe(map((response) => response.data!));
  }

  addSiswa(siswa: Siswa): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/siswa.php`,
      siswa,
      this.httpOptions
    );
  }

  updateSiswa(siswa: Siswa): Observable<any> {
    return this.http.put<ApiResponse<any>>(
      `${this.apiUrl}/siswa.php`,
      siswa,
      this.httpOptions
    );
  }

  deleteSiswa(id: number | string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/siswa.php?id=${id}`
    );
  }

  // ===== TRANSAKSI =====

  getAllTransactions(): Observable<Transaction[]> {
    return this.http
      .get<ApiResponse<Transaction[]>>(`${this.apiUrl}/transaksi.php`)
      .pipe(map((response) => response.data || []));
  }

  getTransactionsBySiswa(siswaId: number | string): Observable<Transaction[]> {
    return this.http
      .get<ApiResponse<Transaction[]>>(
        `${this.apiUrl}/transaksi.php?siswa_id=${siswaId}`
      )
      .pipe(map((response) => response.data || []));
  }

  saveTransaction(transaction: {
    siswaId: number | string;
    type: 'setor' | 'tarik';
    amount: number;
  }): Observable<any> {
    return this.http.post<ApiResponse<any>>(
      `${this.apiUrl}/transaksi.php`,
      transaction,
      this.httpOptions
    );
  }

  deleteTransaction(id: number | string): Observable<any> {
    return this.http.delete<ApiResponse<any>>(
      `${this.apiUrl}/transaksi.php?id=${id}`
    );
  }

  // ===== STATISTIK =====

  getStatistik(): Observable<Statistik> {
    return this.http
      .get<ApiResponse<Statistik>>(`${this.apiUrl}/statistik.php`)
      .pipe(map((response) => response.data!));
  }
}
