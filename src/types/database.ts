/**
 * 数据库相关类型定义
 */

type RevisionId = string;

/** 数据库文档 */
export interface DBDocument<T = any> {
    /** 文档唯一ID */
    _id: string;
    /** 文档版本号 */
    _rev?: RevisionId;
    /** 文档数据 */
    data: T;
    /** 附件 */
    _attachments?: any;
}

/** 数据库操作结果 */
export interface DBResult {
    /** 文档ID */
    id: string;
    /** 操作是否成功 */
    ok: boolean;
    /** 新版本号 */
    rev: RevisionId;
    /** 文档ID（别名） */
    _id: string;
    /** 版本号（别名） */
    _rev: string;
    /** 数据 */
    data?: any;
}

/** 数据库错误 */
export interface DBError {
    /** HTTP 状态码 */
    status?: number;
    /** 错误名称 */
    name?: string;
    /** 错误消息 */
    message?: string;
    /** 错误原因 */
    reason?: string;
    /** 错误标识 */
    error?: string | boolean;
    /** 文档ID */
    id?: string;
    /** 版本号 */
    rev?: RevisionId;
}

/** 查询所有文档选项 */
export interface AllDocsOptions {
    /** 是否包含文档内容 */
    include_docs?: boolean;
    /** 起始键 */
    startkey?: string;
    /** 结束键 */
    endkey?: string;
    /** 指定键列表 */
    keys?: string[];
}

/** 数据库文档（通用格式） */
export interface Doc<T> {
    _id: string;
    data: T;
    _rev?: RevisionId;
    _attachments?: any;
}

/** 文档响应 */
export interface DocRes {
    id: string;
    ok: boolean;
    rev: RevisionId;
    _id: string;
    _rev: string;
    data?: any;
}
