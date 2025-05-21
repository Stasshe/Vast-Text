import { v4 as uuidv4 } from 'uuid';
import { Document, save, remove, getById } from '@/lib/db';

// 新しいドキュメントを作成
export const createDocument = async (title: string = '無題のドキュメント'): Promise<Document> => {
  const now = new Date();
  const document: Document = {
    id: uuidv4(),
    title,
    content: '',
    created: now,
    lastModified: now
  };
  
  await save(document);
  return document;
};

// ドキュメントを更新
export const updateDocument = async (
  id: string, 
  updates: Partial<Pick<Document, 'title' | 'content'>>
): Promise<Document | null> => {
  const doc = await getById(id);
  
  if (!doc) return null;
  
  const updatedDoc: Document = {
    ...doc,
    ...updates,
    lastModified: new Date()
  };
  
  await save(updatedDoc);
  return updatedDoc;
};

// ドキュメントを削除
export const deleteDocument = async (id: string): Promise<boolean> => {
  try {
    await remove(id);
    return true;
  } catch (error) {
    console.error('Error deleting document:', error);
    return false;
  }
};

// ドキュメントの内容をエクスポート
export const exportDocument = (document: Document): string => {
  return document.content;
};

// プレーンテキストからドキュメントをインポート
export const importFromText = async (
  title: string,
  content: string
): Promise<Document> => {
  return await createDocument(title).then(doc => 
    updateDocument(doc.id, { content }) as Promise<Document>
  );
};
