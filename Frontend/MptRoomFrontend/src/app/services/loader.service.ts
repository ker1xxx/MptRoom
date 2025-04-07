import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError, switchMap, tap } from 'rxjs/operators';

@Injectable({ providedIn: 'root' })
export class LoaderService {
  /**
   * Универсальная функция загрузки данных с кэшированием и пушем в BehaviorSubject
   *
   * @param fetchFn - функция, возвращающая Observable
   * @param subject - BehaviorSubject, куда пушим данные
   * @param mapperFn - функция трансформации данных (необязательно)
   * @param forceRefresh - сброс кэша (по умолчанию false)
   */
  loadAndSet$<T, R = T>(
    fetchFn: () => Observable<T>,
    subject: BehaviorSubject<R[]>,
    mapperFn?: (data: T) => R[],
    forceRefresh: boolean = false
  ): void {
    const currentValue = subject.getValue();
    if (!forceRefresh && currentValue && currentValue.length > 0) {
      console.log('[LoaderService] Используем кэш');
      return;
    }

    fetchFn()
      .pipe(
        tap((data) => console.log('[LoaderService] Загружены данные:', data)),
        switchMap((data: T) => {
          const result = mapperFn ? mapperFn(data) : (data as unknown as R[]);
          return of(result);
        }),
        catchError((err) => {
          console.error('[LoaderService] Ошибка загрузки:', err);
          return of([] as R[]);
        })
      )
      .subscribe((mapped) => subject.next(mapped));
  }

  loadWithCache<T>(
    cache$: BehaviorSubject<T>,
    apiCall: () => Observable<T>
  ): void {
    const cacheData = cache$.getValue();

    if (
      cacheData &&
      (Array.isArray(cacheData)
        ? cacheData.length > 0
        : Object.keys(cacheData).length > 0)
    ) {
      console.log('Данные загружены из кеша');
      console.log('cache data:', cacheData);
      return; // Используем кэшированные данные, если они уже есть
    }

    apiCall()
      .pipe(
        catchError((error) => {
          console.error('Ошибка при загрузке данных:', error);
          return of(null); // Return null or an empty value to avoid breaking the flow
        })
      )
      .subscribe({
        next: (data) => {
          if (data) {
            cache$.next(data); // Кэшируем данные
          } else {
            console.warn('Данные не получены или пустые');
          }
        },
        error: (err) => {
          console.error('Ошибка при получении данных из API:', err);
        },
      });
  }
}
