import { Injectable } from '@angular/core';
import io from 'socket.io-client';
import { environment } from '@environments/environment';
import { BehaviorSubject } from 'rxjs';
import { UserService } from '@services/user.service';

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket = null;

  isConnected = false;
  isJoined = false;
  notification: BehaviorSubject<any> = new BehaviorSubject(null);
  notification$ = this.notification.asObservable();
  messageStatus: BehaviorSubject<any> = new BehaviorSubject(null);
  messageStatus$ = this.messageStatus.asObservable();
  command: BehaviorSubject<any> = new BehaviorSubject(null);
  command$ = this.command.asObservable();

  constructor(private userService: UserService) {
    this.setup();
    this.socket.on('connected', () => {
      this.isConnected = true;

      const profile = this.userService.profile.getValue();
      if (profile && profile._id) {
        this.connect();
      }
    });

    this.socket.on('joined', () => {
      console.log('socket: joined');
      this.isJoined = true;
    });

    this.socket.on('notification', (data) => {
      this.notification.next(data);
    });

    this.socket.on('messageStatus', (data) => {
      console.log(data, 'message Status');
      this.messageStatus.next(data);
    });

    this.socket.on('notification_created', (data) => {
      const profile = this.userService.profile.getValue();
      if (profile && profile._id) {
        profile.notification_info.lastId = data;
        this.userService.profile.next(profile);
      }
    });

    this.socket.on('command', (data) => {
      console.log('here');
      this.command.next({ command: data });
    });

    this.socket.on('load_notification', (data) => {
      console.log('socket command', data);
      this.command.next({ command: 'load_notification', query: data });
    });

    this.socket.on('disconnect', () => {
      console.log('socket: disconnect from socket');
      this.isConnected = false;
      this.isJoined = false;
    });
  }

  setup(): void {
    if (typeof window !== 'undefined' && (window as any).crmSocket) {
      this.socket = (window as any).crmSocket;
    } else {
      this.socket = io(environment.server + '/application');
    }
  }

  connect(): void {
    if (this.isJoined) {
      return;
    }
    const token = localStorage.getCrmItem('token');
    if (token) {
      console.log('socket: join request');
      this.socket.emit('join', { token });
    }
  }

  disconnect(): void {
    const token = localStorage.getCrmItem('token');
    if (token) {
      this.socket.emit('leave', { token });
      this.isJoined = false;
    }
  }

  clear$(): void {
    this.disconnect();
    this.notification.next(null);
    this.command.next(null);
  }
}
