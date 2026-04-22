import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StorageService {
  private readonly FIRST_LAUNCH_KEY = 'app_first_launch';

  isFirstLaunch(): boolean {
    return !localStorage.getItem(this.FIRST_LAUNCH_KEY);
  }

  setFirstLaunchCompleted(): void {
    localStorage.setItem(this.FIRST_LAUNCH_KEY, 'completed');
  }

  resetFirstLaunch(): void {
    localStorage.removeItem(this.FIRST_LAUNCH_KEY);
  }
}