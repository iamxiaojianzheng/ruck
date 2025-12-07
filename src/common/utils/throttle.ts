// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export interface ThrottleOptions {
  leading?: boolean;
  trailing?: boolean;
}

export default function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: ThrottleOptions = {}
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let context: any, args: any, result: ReturnType<T> | undefined;
  let timeout: ReturnType<typeof setTimeout> | null = null;
  let previous = 0;

  const later = function () {
    previous = options.leading === false ? 0 : Date.now();
    timeout = null;
    result = func.apply(context, args);
    if (!timeout) context = args = null;
  };

  return function (this: any, ...ea: Parameters<T>) {
    const now = Date.now();
    if (!previous && options.leading === false) previous = now;
    // 计算剩余时间
    const remaining = wait - (now - previous);
    context = this;
    args = ea;
    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }
      previous = now;
      result = func.apply(context, args);
      if (!timeout) context = args = null;
    } else if (!timeout && options.trailing !== false) {
      timeout = setTimeout(later, remaining);
    }
    return result;
  };
}
