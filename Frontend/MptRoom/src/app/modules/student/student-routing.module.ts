// import { NgModule } from '@angular/core';
// import { RouterModule, Routes } from '@angular/router';
// import { StudentGuard } from '../../guards/student.guard';
// import { AuthGuard } from '../../guards/auth.guard';
// import { TimeTableCardComponent } from './components/time-table-card/time-table-card.component';

// const routes: Routes = [
//   {
//     path: '',
//     loadChildren: () =>
//       import('../student/student.module').then((m) => m.StudentModule), // Verify path
//     canActivate: [AuthGuard, StudentGuard],
//   },
// ];

// @NgModule({
//   imports: [RouterModule.forChild(routes)],
//   exports: [RouterModule],
// })
// export class StudentRoutingModule {}
