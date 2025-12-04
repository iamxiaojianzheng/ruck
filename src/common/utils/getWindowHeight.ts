const WINDOW_MAX_HEIGHT = 620;
const WINDOW_MIN_HEIGHT = 60;
const PRE_ITEM_HEIGHT = 70;
const HISTORY_ITEM_HEIGHT = 70; // 每个历史记录项的高度
const HISTORY_ITEMS_PER_ROW = 8; // 每排最多显示8个（24列/3=8）
const MAX_HISTORY_ROWS = 3; // 最多显示3排

export default (searchList: Array<any>, historyList): number => {
  // 计算历史记录需要的高度
  let historyHeight = 0;
  if (historyList.length > 0) {
    // 计算需要多少行（向上取整）
    const rowsNeeded = Math.ceil(historyList.length / HISTORY_ITEMS_PER_ROW);
    // 最多显示3行
    const actualRows = Math.min(rowsNeeded, MAX_HISTORY_ROWS);
    historyHeight = actualRows * HISTORY_ITEM_HEIGHT;
  }

  // 如果没有搜索列表，返回最大高度或最小高度 + 历史高度
  if (!searchList) return WINDOW_MAX_HEIGHT + historyHeight;
  if (!searchList.length) return WINDOW_MIN_HEIGHT + historyHeight;

  // 有搜索结果时，计算搜索结果高度，但不包含历史高度（搜索时历史会隐藏）
  const searchHeight = searchList.length * PRE_ITEM_HEIGHT + WINDOW_MIN_HEIGHT;
  return searchHeight > WINDOW_MAX_HEIGHT ? WINDOW_MAX_HEIGHT : searchHeight;
};
