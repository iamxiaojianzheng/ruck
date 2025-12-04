import { WINDOW_HEIGHT_CONFIG } from '../constants/window';

export default (searchList: Array<any>, historyList: any[]): number => {
  // 计算历史记录需要的高度
  let historyHeight = 0;
  if (historyList.length > 0) {
    // 计算需要多少行（向上取整）
    const rowsNeeded = Math.ceil(historyList.length / WINDOW_HEIGHT_CONFIG.HISTORY_ITEMS_PER_ROW);
    // 最多显示3行
    const actualRows = Math.min(rowsNeeded, WINDOW_HEIGHT_CONFIG.MAX_HISTORY_ROWS);
    historyHeight = actualRows * WINDOW_HEIGHT_CONFIG.HISTORY_ITEM;
  }

  // 如果没有搜索列表，返回最大高度或最小高度 + 历史高度
  if (!searchList) return WINDOW_HEIGHT_CONFIG.MAX + historyHeight;
  if (!searchList.length) return WINDOW_HEIGHT_CONFIG.MIN + historyHeight;

  // 有搜索结果时，计算搜索结果高度，但不包含历史高度（搜索时历史会隐藏）
  const searchHeight = searchList.length * WINDOW_HEIGHT_CONFIG.PER_ITEM + WINDOW_HEIGHT_CONFIG.MIN;
  return searchHeight > WINDOW_HEIGHT_CONFIG.MAX ? WINDOW_HEIGHT_CONFIG.MAX : searchHeight;
};
