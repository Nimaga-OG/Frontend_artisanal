import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'truncate',
  standalone: true, // important si tu es en standalone components
})
export class TruncatePipe implements PipeTransform {
  transform(value: string, limit = 50, trail = '...'): string {
    if (!value) return '';
    return value.length > limit ? value.substring(0, limit) + trail : value;
  }
}
