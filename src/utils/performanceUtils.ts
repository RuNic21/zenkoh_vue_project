// パフォーマンス最適化ユーティリティ
// 目的: メモ化、デバウンス、スロットルなどのパフォーマンス最適化機能を提供

import { ref, computed, watch, type Ref } from "vue";

// デバウンス関数（指定時間後に実行）
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout>;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

// スロットル関数（指定時間内に1回のみ実行）
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

// メモ化された計算プロパティ（依存関係が変更された時のみ再計算）
export function useMemoizedComputed<T>(
  getter: () => T,
  deps: Ref<unknown>[]
): Ref<T> {
  const result = ref<T>(getter()) as Ref<T>;
  
  watch(deps, () => {
    result.value = getter();
  }, { deep: true });
  
  return result;
}

// 仮想スクロール用のアイテム計算
export interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number; // 画面外のアイテム数
}

export function useVirtualScroll<T>(
  items: Ref<T[]>,
  options: VirtualScrollOptions
) {
  const scrollTop = ref(0);
  const { itemHeight, containerHeight, overscan = 5 } = options;
  
  const visibleItems = computed(() => {
    const start = Math.floor(scrollTop.value / itemHeight);
    const end = Math.min(
      start + Math.ceil(containerHeight / itemHeight) + overscan,
      items.value.length
    );
    
    return {
      items: items.value.slice(start, end),
      startIndex: start,
      endIndex: end,
      totalHeight: items.value.length * itemHeight,
      offsetY: start * itemHeight
    };
  });
  
  return {
    scrollTop,
    visibleItems
  };
}

// パフォーマンス測定用ユーティリティ
export class PerformanceMonitor {
  private static measurements: Map<string, number[]> = new Map();
  
  static start(name: string): () => void {
    const startTime = performance.now();
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime;
      
      if (!this.measurements.has(name)) {
        this.measurements.set(name, []);
      }
      this.measurements.get(name)!.push(duration);
    };
  }
  
  static getStats(name: string): {
    average: number;
    min: number;
    max: number;
    count: number;
  } | null {
    const measurements = this.measurements.get(name);
    if (!measurements || measurements.length === 0) {
      return null;
    }
    
    const sum = measurements.reduce((a, b) => a + b, 0);
    return {
      average: sum / measurements.length,
      min: Math.min(...measurements),
      max: Math.max(...measurements),
      count: measurements.length
    };
  }
  
  static clear(name?: string): void {
    if (name) {
      this.measurements.delete(name);
    } else {
      this.measurements.clear();
    }
  }
  
  static getAllStats(): Record<string, { average: number; min: number; max: number; count: number } | null> {
    const stats: Record<string, { average: number; min: number; max: number; count: number } | null> = {};
    for (const [name] of this.measurements) {
      stats[name] = this.getStats(name);
    }
    return stats;
  }
}

// リソースプール（オブジェクトの再利用）
export class ObjectPool<T> {
  private pool: T[] = [];
  private createFn: () => T;
  private resetFn?: (obj: T) => void;
  
  constructor(createFn: () => T, resetFn?: (obj: T) => void) {
    this.createFn = createFn;
    this.resetFn = resetFn;
  }
  
  acquire(): T {
    if (this.pool.length > 0) {
      return this.pool.pop()!;
    }
    return this.createFn();
  }
  
  release(obj: T): void {
    if (this.resetFn) {
      this.resetFn(obj);
    }
    this.pool.push(obj);
  }
  
  clear(): void {
    this.pool = [];
  }
  
  get size(): number {
    return this.pool.length;
  }
}

// キャッシュマネージャー
export class CacheManager<K, V> {
  private cache = new Map<K, { value: V; timestamp: number; ttl: number }>();
  private maxSize: number;
  
  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }
  
  set(key: K, value: V, ttl: number = 300000): void { // デフォルト5分
    // キャッシュサイズ制限
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }
    
    this.cache.set(key, {
      value,
      timestamp: Date.now(),
      ttl
    });
  }
  
  get(key: K): V | null {
    const item = this.cache.get(key);
    if (!item) {
      return null;
    }
    
    // TTLチェック
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }
  
  has(key: K): boolean {
    return this.get(key) !== null;
  }
  
  delete(key: K): boolean {
    return this.cache.delete(key);
  }
  
  clear(): void {
    this.cache.clear();
  }
  
  get size(): number {
    return this.cache.size;
  }
  
  // 期限切れアイテムのクリーンアップ
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }
}
