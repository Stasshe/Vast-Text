import Dexie, { Table } from 'dexie';

// 仕様書に基づいたDocumentインターフェース
export interface Document {
  id: string;
  title: string;
  content: string;
  lastModified: Date;
  created: Date;
}

// Dexie.jsを使用したデータベースクラス
class DocumentDatabase extends Dexie {
  documents!: Table<Document, string>;

  constructor() {
    super('vastTextDB');
    
    // DBのスキーマを定義
    this.version(1).stores({
      documents: 'id, title, lastModified, created'
    });
  }
}

// データベースのシングルトンインスタンス
export const db = new DocumentDatabase();

// ユーティリティ関数
export const getAll = async (): Promise<Document[]> => {
  return await db.documents.toArray();
};

export const getById = async (id: string): Promise<Document | undefined> => {
  return await db.documents.get(id);
};

export const save = async (document: Document): Promise<string> => {
  return await db.documents.put(document);
};

export const remove = async (id: string): Promise<void> => {
  await db.documents.delete(id);
};

export const getAllSorted = async (): Promise<Document[]> => {
  return await db.documents.orderBy('lastModified').reverse().toArray();
};
