import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  AlertController,
  IonicModule,
  LoadingController,
} from '@ionic/angular';
import { ApiService, Siswa } from '../service/api.service';

@Component({
  selector: 'app-tab2',
  templateUrl: 'tab2.page.html',
  styleUrls: ['tab2.page.scss'],
  imports: [IonicModule, CommonModule, FormsModule],
})
export class Tab2Page implements OnInit {
  // ====== STATE ======
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

  // ====== CONSTRUCTOR ======
  constructor(
    private router: Router,
    private alertController: AlertController,
    private loadingController: LoadingController,
    private apiService: ApiService
  ) { }

  // ====== LIFECYCLE ======
  ngOnInit() {
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras?.state) {
      const siswa = navigation.extras.state['siswa'];
      if (siswa) {
        this.loadEditData(siswa);
      }
    }
  }

  // ====== LOAD DATA EDIT ======
  loadEditData(siswa: any) {
    this.formData = {
      nama: siswa.nama,
      noHp: siswa.noHp,
      jenisKelamin: siswa.jenisKelamin,
      alamat: siswa.alamat,
      email: siswa.email,
      kelas: siswa.kelas,
      saldoTabungan: siswa.saldoTabungan,
      metodePembayaran: siswa.metodePembayaran || '',
      nomorReferensi: siswa.nomorReferensi || '',
    };
    this.currentId = siswa.id;
    this.editMode = true;
  }

  // ====== VALIDASI FORM ======
  validateForm(): boolean {
    if (
      !this.formData.nama ||
      !this.formData.noHp ||
      !this.formData.jenisKelamin ||
      !this.formData.email ||
      !this.formData.kelas ||
      !this.formData.alamat ||
      !this.formData.metodePembayaran
    ) {
      return false;
    }

    if (
      this.formData.metodePembayaran !== 'Tunai' &&
      !this.formData.nomorReferensi
    ) {
      return false;
    }

    return true;
  }

  // ====== SUBMIT ======
  async handleSubmit() {
    if (!this.validateForm()) {
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
      // Update mode
      this.apiService.updateSiswa({ ...this.formData, id: this.currentId }).subscribe({
        next: async () => {
          loading.dismiss();
          const alert = await this.alertController.create({
            header: 'Berhasil',
            message: 'Data siswa berhasil diupdate',
            buttons: ['OK'],
          });
          await alert.present();
          this.router.navigate(['/tabs/tab1']);
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
      // Create mode
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
          this.router.navigate(['/tabs/tab1']);
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

  // ====== HELPER ======
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
}

