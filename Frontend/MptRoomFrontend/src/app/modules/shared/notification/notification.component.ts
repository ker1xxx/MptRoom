import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../services/notification.service';
import { Observable, Subscription } from 'rxjs';
import { NotificationModel } from '../../../models/helpers/notification.model';

@Component({
  selector: 'app-notification',
  imports: [CommonModule],
  templateUrl: './notification.component.html',
  styleUrl: './notification.component.scss',
})
export class NotificationComponent implements OnInit, OnDestroy {
  message = '';
  type: 'success' | 'error' = 'success';
  visible = false;

  private sub?: Subscription;

  constructor(private notificationService: NotificationService) {}

  ngOnInit(): void {
    this.sub = this.notificationService.notification$.subscribe(
      (notification) => {
        if (notification) {
          this.message = notification.message;
          this.type = notification.type;
          this.visible = true;
        } else {
          this.visible = false;
        }
      }
    );
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }
}
