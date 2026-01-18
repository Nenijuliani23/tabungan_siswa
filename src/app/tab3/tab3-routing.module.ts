import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { Tab3Page } from './tab3.page';

const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./tab3.page').then((m) => m.Tab3Page),
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class Tab3PageRoutingModule {}
