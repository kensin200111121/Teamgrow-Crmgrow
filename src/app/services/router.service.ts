import { Location } from '@angular/common';
import { Injectable } from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';

interface RouteHistoryItem {
  url: string;
  id?: string;
  title?: string;
  length?: number; // duplicated path length
  winHistoryLength?: number; // browser history length
}

@Injectable({
  providedIn: 'root'
})
export class RouterService {
  public histories: RouteHistoryItem[] = [];

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private location: Location
  ) {}

  startSaveHistory(): void {
    this.router.events
      .pipe(filter((rs): rs is NavigationEnd => rs instanceof NavigationEnd))
      .subscribe((event) => {
        if (event.url === event.urlAfterRedirects) {
          // get the current activated route state
          let child = this.activatedRoute.firstChild;
          let id = child?.snapshot?.data?.id;
          let title = child?.snapshot?.data?.title;
          while (child.firstChild) {
            child = child.firstChild;
            id = child?.snapshot?.data?.id || id;
            title = child?.snapshot?.data?.title || title;
          }
          // PUSH & UPDATE THE HISTORY ITEM
          const lastHistoryItem = this.histories[this.histories.length - 1];
          const winHistoryLength = window.history.length;

          // Update History Item
          if (lastHistoryItem?.id && lastHistoryItem?.id === id) {
            if (winHistoryLength !== lastHistoryItem?.winHistoryLength) {
              // ReplaceUrl case
              lastHistoryItem.length++;
            }
            lastHistoryItem.url = event.urlAfterRedirects;
            lastHistoryItem.winHistoryLength = winHistoryLength;
            return;
          }

          // Because location.back() and historyGo() is catched by this event handler, so we should add last same path checking logic
          if (
            lastHistoryItem &&
            event.urlAfterRedirects === lastHistoryItem.url
          ) {
            lastHistoryItem.winHistoryLength = winHistoryLength;
            return;
          }

          // Push New History Item
          if (
            winHistoryLength === lastHistoryItem?.winHistoryLength &&
            lastHistoryItem?.id
          ) {
            // ReplaceUrl case
            this.histories.pop();
          }

          this.histories.push({
            url: event.urlAfterRedirects,
            id,
            title,
            length: 1,
            winHistoryLength
          });
        }
      });
  }

  goBack(): void {
    const lastHistoryItem = this.histories[this.histories.length - 1];
    if (!lastHistoryItem) {
      this.location.back();
      return;
    }

    this.histories.pop();
    if (lastHistoryItem.length === 1) {
      this.location.back();
    } else if (lastHistoryItem.length > 1) {
      this.location.historyGo(-1 * lastHistoryItem.length);
    } else {
      this.location.back();
    }
  }

  get previousUrl(): string {
    if (this.histories.length > 1) {
      return this.histories[this.histories.length - 2].url;
    } else {
      return '';
    }
  }

  get currentUrl(): string {
    if (this.histories.length > 0) {
      return this.histories[this.histories.length - 1].url;
    } else {
      return '';
    }
  }
}
