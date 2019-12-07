import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { NavigationComponent } from './navigation/navigation.component';
import { MemoryCardListComponent } from './memory-card-list/memory-card-list.component';


const routes: Routes = [
  { path: '', component: MemoryCardListComponent },
  { path: 'saves', component: NavigationComponent },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
