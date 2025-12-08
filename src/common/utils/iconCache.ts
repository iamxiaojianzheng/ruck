/**
 * 文件图标 LRU 缓存
 *
 * 使用 Least Recently Used (最近最少使用) 策略缓存文件图标，
 * 减少重复的图标获取操作，提升性能。
 *
 * @module iconCache
 */

/**
 * LRU 缓存类
 *
 * @template K 键类型
 * @template V 值类型
 */
class LRUCache<K, V> {
  private cache: Map<K, V>;
  private maxSize: number;
  private hits = 0;
  private misses = 0;

  /**
   * 创建 LRU 缓存实例
   *
   * @param maxSize 最大缓存数量，默认 100
   */
  constructor(maxSize = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * 获取缓存项
   *
   * @param key 缓存键
   * @returns 缓存值，不存在则返回 undefined
   */
  get(key: K): V | undefined {
    if (!this.cache.has(key)) {
      this.misses++;
      return undefined;
    }

    this.hits++;

    // 更新访问顺序：删除后重新插入到末尾
    const value = this.cache.get(key)!;
    this.cache.delete(key);
    this.cache.set(key, value);
    return value;
  }

  /**
   * 设置缓存项
   *
   * @param key 缓存键
   * @param value 缓存值
   */
  set(key: K, value: V): void {
    // 如果已存在，先删除（更新顺序）
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // 如果超过大小限制，删除最旧的项（Map 的第一项）
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      this.cache.delete(firstKey);
    }

    // 插入新项
    this.cache.set(key, value);
  }

  /**
   * 检查缓存项是否存在
   *
   * @param key 缓存键
   * @returns 是否存在
   */
  has(key: K): boolean {
    return this.cache.has(key);
  }

  /**
   * 清除所有缓存
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * 获取当前缓存大小
   */
  get size(): number {
    return this.cache.size;
  }

  /**
   * 获取缓存统计信息
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      size: this.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      hitRate: hitRate.toFixed(2) + '%',
    };
  }
}

// 图标缓存实例
// 缓存大小：100 个图标（约 1-3MB 内存）
const iconCache = new LRUCache<string, string>(100);

export default iconCache;
