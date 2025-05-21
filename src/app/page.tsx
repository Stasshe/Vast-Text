'use client';

import { useEffect, useState } from 'react';
import { Document, getAllSorted } from '@/lib/db';
import { updateDocument } from '@/lib/documents';
import Sidebar from '@/components/Sidebar';
import CodeEditor from '@/components/CodeEditor';
import Toolbar from '@/components/Toolbar';

export default function Home() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocument, setActiveDocument] = useState<Document | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // ドキュメント一覧を読み込む
  const loadDocuments = async () => {
    try {
      const docs = await getAllSorted();
      setDocuments(docs);
      
      // 最初のドキュメントがあれば選択
      if (docs.length > 0 && !activeDocument) {
        setActiveDocument(docs[0]);
      }
      
      setIsLoaded(true);
    } catch (error) {
      console.error('Error loading documents:', error);
      setIsLoaded(true);
    }
  };

  // 初回読み込み
  useEffect(() => {
    loadDocuments();
  }, []);

  // ドキュメント内容の変更を処理
  const handleDocumentChange = async (content: string) => {
    if (!activeDocument) return;
    
    // 内容を更新（更新間隔を制限することも可能）
    const updatedDoc = await updateDocument(activeDocument.id, { content });
    if (updatedDoc) {
      setActiveDocument(updatedDoc);
      
      // ドキュメント一覧も更新
      setDocuments(docs => 
        docs.map(doc => doc.id === updatedDoc.id ? updatedDoc : doc)
      );
    }
  };

  // ドキュメントが選択されたときの処理
  const handleDocumentSelect = (document: Document) => {
    setActiveDocument(document);
  };

  // ドキュメントが更新されたときの処理
  const handleDocumentUpdate = (document: Document) => {
    setActiveDocument(document);
    setDocuments(docs => 
      docs.map(doc => doc.id === document.id ? document : doc)
    );
  };

  if (!isLoaded) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <main className="flex flex-col h-screen">
      <Toolbar 
        document={activeDocument} 
        onDocumentUpdate={handleDocumentUpdate}
        onRefresh={loadDocuments}
      />
      
      <div className="flex flex-1 overflow-hidden">
        {isSidebarOpen && (
          <Sidebar
            documents={documents}
            activeDocument={activeDocument}
            onDocumentSelect={handleDocumentSelect}
            onRefresh={loadDocuments}
          />
        )}
        
        <div className="flex-1 h-full flex flex-col">
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="absolute top-16 left-2 p-2 rounded-full hover:bg-gray-100 z-10"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
          )}
          
          {activeDocument ? (
            <div className="h-full">
              <CodeEditor 
                document={activeDocument}
                onChange={handleDocumentChange}
              />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-500">
              <div className="text-center">
                <p className="mb-4">ドキュメントが選択されていません</p>
                <button
                  onClick={() => loadDocuments()}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  ドキュメント一覧を表示
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
