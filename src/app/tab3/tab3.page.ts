import { Component, OnInit } from '@angular/core';
import {
  IonicModule,
  AlertController,
  LoadingController,
} from '@ionic/angular';
import { CommonModule } from '@angular/common';
import { ApiService, Siswa, Transaction } from '../service/api.service';

@Component({
  selector: 'app-tab3',
  templateUrl: 'tab3.page.html',
  styleUrls: ['tab3.page.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule],
})
export class Tab3Page implements OnInit {
  siswaList: Siswa[] = [];
  transactions: Transaction[] = [];

  constructor(
    private alertCtrl: AlertController,
    private loadingCtrl: LoadingController,
    private apiService: ApiService
  ) { }

  ngOnInit() {
    this.loadData();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  // ================= LOAD DATA =================
  async loadData() {
    const loading = await this.loadingCtrl.create({
      message: 'Memuat data...',
    });
    await loading.present();

    // Load siswa
    this.apiService.getAllSiswa().subscribe({
      next: (data) => {
        this.siswaList = data;
      },
      error: (error) => {
        console.error('Error loading siswa:', error);
      },
    });

    // Load transactions
    this.apiService.getAllTransactions().subscribe({
      next: (data) => {
        this.transactions = data;
        loading.dismiss();
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
        loading.dismiss();
      },
    });
  }

  // ================= STATISTIK =================
  getTotalSaldo(): number {
    return this.siswaList.reduce(
      (total, siswa) => total + Number(siswa.saldoTabungan || 0),
      0
    );
  }

  getStatistik() {
    const total = this.siswaList.length;
    const lakiLaki = this.siswaList.filter(
      (s) => s.jenisKelamin === 'Laki-laki'
    ).length;
    const perempuan = this.siswaList.filter(
      (s) => s.jenisKelamin === 'Perempuan'
    ).length;
    const totalSaldo = this.getTotalSaldo();
    const rataRataSaldo = total > 0 ? totalSaldo / total : 0;

    return { total, lakiLaki, perempuan, totalSaldo, rataRataSaldo };
  }

  // ================= TRANSAKSI =================
  getRecentTransactions(): Transaction[] {
    return this.transactions.slice().reverse();
  }

  // ================= HAPUS TRANSAKSI =================
  async konfirmasiHapus(trans: Transaction) {
    const alert = await this.alertCtrl.create({
      header: 'Hapus Transaksi',
      message: `Yakin ingin menghapus transaksi ${trans.namaSiswa}?`,
      buttons: [
        {
          text: 'Batal',
          role: 'cancel',
        },
        {
          text: 'Hapus',
          role: 'destructive',
          handler: () => {
            this.hapusTransaksi(trans.id!);
          },
        },
      ],
    });

    await alert.present();
  }

  async hapusTransaksi(id: string | number) {
    const loading = await this.loadingCtrl.create({
      message: 'Menghapus transaksi...',
    });
    await loading.present();

    this.apiService.deleteTransaction(id).subscribe({
      next: async () => {
        loading.dismiss();
        const alert = await this.alertCtrl.create({
          header: 'Berhasil',
          message: 'Transaksi berhasil dihapus',
          buttons: ['OK'],
        });
        await alert.present();
        this.loadData();
      },
      error: async (error) => {
        console.error('Error deleting transaction:', error);
        loading.dismiss();
        const alert = await this.alertCtrl.create({
          header: 'Error',
          message: 'Gagal menghapus transaksi',
          buttons: ['OK'],
        });
        await alert.present();
      },
    });
  }

  // ================= FORMAT =================
  formatRupiah(angka: number): string {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(angka);
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}

