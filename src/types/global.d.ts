interface FileInfo {
  /** 是否为文件 */
  isFile: boolean;
  /** 是否为文件夹 */
  isDirectory: boolean;
  /** 文件名（含后缀） */
  name: string;
  /** 文件绝对路径 */
  path: string;
}

interface Cmd {
  label: string;
  type?: 'text' | 'img' | 'over' | 'file' | 'files' | 'regex';
  fileType: string;
  match: CmdMatch;
}

interface CmdMatch {
  app: string[];
  class: string[];
}

interface Feature {
  code: string;
  explain: string;
  cmds: Array<Cmd | string>;
}

interface Option {
  name: string;
  value: string;
  icon: string;
  desc: string;
  type: string;
  match: [number, number] | false;
  zIndex: number;
  click: () => void;
  keyWords?: string[];
}

// declare global {
//   var LOCAL_PLUGINS: any;
//   var OP_CONFIG: any;
// }
//
// export {};
