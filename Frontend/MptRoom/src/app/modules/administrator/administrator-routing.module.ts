import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { AdministratorUsersPageComponent } from './pages/administrator-users-page/administrator-users-page.component';

const routes: Routes = [
  { path: 'users', component: AdministratorUsersPageComponent },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class AdministratorRoutingModule {}
