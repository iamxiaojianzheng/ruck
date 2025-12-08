/**
 * Runner 单例
 * 确保整个应用只有一个 runner 实例
 */

import runner from './runner';

// 创建单例实例
const runnerInstance = runner();

export default runnerInstance;
