import { Component, OnInit } from '@angular/core';
import { AlertController, LoadingController } from '@ionic/angular';
import { ApiService, Siswa, Transaction } from '../service/api.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: false,
})
export class Tab1Page implements OnInit {
  activeTab = 'daftar';
  siswaList: Siswa[] = [];
  transactions: Transaction[] = [];
  editMode = false;
  currentId: string | number | null = null;

  formData: Siswa = {
    nama: '',
    noHp: '',
    jenisKelamin: '',
    alamat: '',
    email: '',
    kelas: '',
    saldoTabungan: 0,
    metodePembayaran: '',
    nomorReferensi: '',
  };

  constructor(
    private alertController: AlertController,
    private loadingController: LoadingController,
    private apiService: ApiService
  ) { }

  ngOnInit() {
    this.loadData();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  async loadData() {
    const loading = await this.loadingController.create({
      message: 'Memuat data...',
    });
    await loading.present();

    this.apiService.getAllSiswa().subscribe({
      next: (data) => {
        this.siswaList = data;
        loading.dismiss();
      },
      error: async (error) => {
        console.error('Error loading siswa:', error);
        loading.dismiss();
        const alert = await this.alertController.create({
          header: 'Error',
          message:
            'Gagal memuat data siswa. Pastikan API server sudah berjalan.',
          buttons: ['OK'],
        });
        await alert.present();
      },
    });

    this.apiService.getAllTransactions().subscribe({
      next: (data) => {
        this.transactions = data;
      },
      error: (error) => {
        console.error('Error loading transactions:', error);
      },
    });
  }

  async handleSubmit() {
    if (
      !this.formData.nama ||
      !this.formData.noHp ||
      !this.formData.jenisKelamin ||
      !this.formData.email ||
      !this.formData.kelas ||
      !this.formData.alamat
    ) {
      const alert = await this.alertController.create({
        header: 'Peringatan',
        message: 'Mohon lengkapi semua field yang diperlukan!',
        buttons: ['OK'],
      });
      await alert.present();
      return;
    }

    const loading = await this.loadingController.create({
      message: this.editMode ? 'Mengupdate data...' : 'Menyimpan data...',
    });
    await loading.present();

    if (this.editMode && this.currentId) {
      // Update existing student
      this.apiService.updateSiswa({ ...this.formData, id: this.currentId }).subscribe({
        next: async () => {
          loading.dismiss();
          const alert = await this.alertController.create({
            header: 'Berhasil',
            message: 'Data siswa berhasil diupdate',
            buttons: ['OK'],
          });
          await alert.present();
          this.resetForm();
          this.activeTab = 'daftar';
          this.loadData();
        },
        error: async (error) => {
          console.error('Error updating siswa:', error);
          loading.dismiss();
          const alert = await this.alertController.create({
            header: 'Error',
            message: 'Gagal mengupdate data siswa',
            buttons: ['OK'],
          });
          await alert.present();
        },
      });
    } else {
      // Add new student
      this.apiService.addSiswa(this.formData).subscribe({
        next: async () => {
          loading.dismiss();
          const alert = await this.alertController.create({
            header: 'Berhasil',
            message: 'Data siswa berhasil ditambahkan',
            buttons: ['OK'],
          });
          await alert.present();
          this.resetForm();
          this.activeTab = 'daftar';
          this.loadData();
        },
        error: async (error) => {
          console.error('Error adding siswa:', error);
          loading.dismiss();
          const alert = await this.alertController.create({
            header: 'Error',
            message: 'Gagal menambahkan data siswa',
            buttons: ['OK'],
          });
          await alert.present();
        },
      });
    }
  }

  handleEdit(siswa: Siswa) {
    this.formData = { ...siswa };
    this.currentId = siswa.id!;
    this.editMode = true;
    this.activeTab = 'tambah';
  }

  async handleDelete(id: string | number) {
    const alert = await this.alertController.create({
      header: 'Konfirmasi',
      message: 'Yakin ingin menghapus data siswa ini?',
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Hapus',
          handler: async () => {
            const loading = await this.loadingController.create({
              message: 'Menghapus data...',
            });
            await loading.present();

            this.apiService.deleteSiswa(id).subscribe({
              next: async () => {
                loading.dismiss();
                const successAlert = await this.alertController.create({
                  header: 'Berhasil',
                  message: 'Data siswa berhasil dihapus',
                  buttons: ['OK'],
                });
                await successAlert.present();
                this.loadData();
              },
              error: async (error) => {
                console.error('Error deleting siswa:', error);
                loading.dismiss();
                const errorAlert = await this.alertController.create({
                  header: 'Error',
                  message: 'Gagal menghapus data siswa',
                  buttons: ['OK'],
                });
                await errorAlert.present();
              },
            });
          },
        },
      ],
    });
    await alert.present();
  }

  async handleTambahSaldo(siswa: Siswa) {
    const alert = await this.alertController.create({
      header: 'Setor Tabungan',
      message: 'Masukkan jumlah yang akan ditabung:',
      inputs: [{ name: 'jumlah', type: 'number', placeholder: '0' }],
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Setor',
          handler: async (data) => {
            const jumlah = parseFloat(data.jumlah);
            if (jumlah > 0) {
              const loading = await this.loadingController.create({
                message: 'Memproses transaksi...',
              });
              await loading.present();

              this.apiService
                .saveTransaction({
                  siswaId: siswa.id!,
                  type: 'setor',
                  amount: jumlah,
                })
                .subscribe({
                  next: async () => {
                    loading.dismiss();
                    const successAlert = await this.alertController.create({
                      header: 'Berhasil',
                      message: 'Setor tabungan berhasil',
                      buttons: ['OK'],
                    });
                    await successAlert.present();
                    this.loadData();
                  },
                  error: async (error) => {
                    console.error('Error setor:', error);
                    loading.dismiss();
                    const errorAlert = await this.alertController.create({
                      header: 'Error',
                      message: 'Gagal melakukan setor',
                      buttons: ['OK'],
                    });
                    await errorAlert.present();
                  },
                });
            }
          },
        },
      ],
    });
    await alert.present();
  }

  async handleTarikSaldo(siswa: Siswa) {
    const alert = await this.alertController.create({
      header: 'Tarik Tabungan',
      message: 'Masukkan jumlah yang akan ditarik:',
      inputs: [{ name: 'jumlah', type: 'number', placeholder: '0' }],
      buttons: [
        { text: 'Batal', role: 'cancel' },
        {
          text: 'Tarik',
          handler: async (data) => {
            const jumlah = parseFloat(data.jumlah);
            if (jumlah > 0) {
              const loading = await this.loadingController.create({
                message: 'Memproses transaksi...',
              });
              await loading.present();

              this.apiService
                .saveTransaction({
                  siswaId: siswa.id!,
                  type: 'tarik',
                  amount: jumlah,
                })
                .subscribe({
                  next: async () => {
                    loading.dismiss();
                    const successAlert = await this.alertController.create({
                      header: 'Berhasil',
                      message: 'Tarik tabungan berhasil',
                      buttons: ['OK'],
                    });
                    await successAlert.present();
                    this.loadData();
                  },
                  error: async (error) => {
                    console.error('Error tarik:', error);
                    loading.dismiss();
                    const errorAlert = await this.alertController.create({
                      header: 'Error',
                      message:
                        error.error?.message ||
                        'Gagal melakukan penarikan. Saldo mungkin tidak mencukupi.',
                      buttons: ['OK'],
                    });
                    await errorAlert.present();
                  },
                });
            }
          },
        },
      ],
    });
    await alert.present();
  }

  resetForm() {
    this.formData = {
      nama: '',
      noHp: '',
      jenisKelamin: '',
      alamat: '',
      email: '',
      kelas: '',
      saldoTabungan: 0,
      metodePembayaran: '',
      nomorReferensi: '',
    };
    this.editMode = false;
    this.currentId = null;
  }

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

  getStatistik() {
    const total = this.siswaList.length;
    const lakiLaki = this.siswaList.filter(
      (s) => s.jenisKelamin === 'Laki-laki'
    ).length;
    const perempuan = this.siswaList.filter(
      (s) => s.jenisKelamin === 'Perempuan'
    ).length;
    const totalSaldo = this.siswaList.reduce(
      (sum, s) => sum + (s.saldoTabungan || 0),
      0
    );
    const rataRataSaldo = total > 0 ? totalSaldo / total : 0;

    return { total, lakiLaki, perempuan, totalSaldo, rataRataSaldo };
  }

  getRecentTransactions() {
    return this.transactions.slice().reverse().slice(0, 20);
  }
}

