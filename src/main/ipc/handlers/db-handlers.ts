/**
 * 数据库相关的 IPC 处理器
 */

import type { IPCHandler } from '@/types/ipc';
import DBInstance from '@/main/common/db';

// 创建数据库实例
const dbInstance = new DBInstance();

/**
 * 存储数据
 */
export const dbPut: IPCHandler<'db:put'> = async (event, { data }) => {
    const result = await dbInstance.dbPut({ data });
    return result as any;
};

/**
 * 获取数据
 */
export const dbGet: IPCHandler<'db:get'> = async (event, { id }) => {
    return await dbInstance.dbGet({ data: { id } });
};

/**
 * 删除数据
 */
export const dbRemove: IPCHandler<'db:remove'> = async (event, { doc }) => {
    const result = await dbInstance.dbRemove({ data: { doc } });
    return result as any;
};

/**
 * 批量操作
 */
export const dbBulkDocs: IPCHandler<'db:bulkDocs'> = async (event, { docs }) => {
    const result = await dbInstance.dbBulkDocs({ data: { docs } });
    return result as any;
};

/**
 * 获取所有文档
 */
export const dbAllDocs: IPCHandler<'db:allDocs'> = async (event, { key }) => {
    const result = await dbInstance.dbAllDocs({ data: { key } });
    return result as any;
};

/**
 * 导出数据库
 */
export const dbDump: IPCHandler<'db:dump'> = async (event, { target }) => {
    return await dbInstance.dbDump({ data: { target } });
};

/**
 * 导入数据库
 */
export const dbImport: IPCHandler<'db:import'> = async (event, { target }) => {
    return await dbInstance.dbImport({ data: { target } });
};

/**
 * 添加附件
 */
export const dbPostAttachment: IPCHandler<'db:postAttachment'> = async (event, { docId, attachment, type }) => {
    return await dbInstance.dbPostAttachment({ data: { docId, attachment, type } });
};

/**
 * 获取附件
 */
export const dbGetAttachment: IPCHandler<'db:getAttachment'> = async (event, { docId }) => {
    return await dbInstance.dbGetAttachment({ data: { docId } });
};

/**
 * 获取附件类型
 */
export const dbGetAttachmentType: IPCHandler<'db:getAttachmentType'> = async (event, { docId }) => {
    return await dbInstance.dbGetAttachmentType({ data: { docId } });
};
