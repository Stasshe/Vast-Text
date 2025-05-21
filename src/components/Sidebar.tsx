'use client';

import { useState } from 'react';
import { Document } from '@/lib/db';
import { createDocument, deleteDocument } from '@/lib/documents';

interface SidebarProps {
  documents: Document[];
  activeDocument: Document | null;
  onDocumentSelect: (document: Document) => void;
  onRefresh: () => void;
}

export default function Sidebar({ 
  documents, 
  activeDocument, 
  onDocumentSelect, 
  onRefresh 
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  const handleCreateDocument = async () => {
    const newDoc = await createDocument();
    onRefresh();
    onDocumentSelect(newDoc);
  };

  const handleDeleteDocument = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('このドキュメントを削除してもよろしいですか？')) {
      await deleteDocument(id);
      onRefresh();
    }
  };

  if (isCollapsed) {
    return (
      <div className="w-12 h-full border-r border-gray-200 dark:border-gray-800 flex flex-col items-center py-4 bg-sidebar-bg dark:bg-gray-900">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="15 18 9 12 15 6"></polyline>
          </svg>
        </button>
        <button
          onClick={handleCreateDocument}
          className="p-2 mt-4 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="w-64 h-full border-r border-gray-200 dark:border-gray-800 flex flex-col bg-sidebar-bg dark:bg-gray-900">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800">
        <h2 className="font-semibold text-lg">ドキュメント</h2>
        <div className="flex space-x-2">
          <button
            onClick={() => setIsCollapsed(true)}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
          <button
            onClick={handleCreateDocument}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        {documents.length === 0 ? (
          <div className="text-center text-gray-500 dark:text-gray-400 mt-8">
            <p>ドキュメントがありません</p>
            <button
              onClick={handleCreateDocument}
              className="mt-2 text-blue-500 hover:underline"
            >
              新規作成
            </button>
          </div>
        ) : (
          <ul className="space-y-1">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className={`p-2 rounded cursor-pointer flex justify-between items-center ${
                  activeDocument?.id === doc.id
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                onClick={() => onDocumentSelect(doc)}
              >
                <div className="truncate flex-1">
                  <div className="font-medium truncate">{doc.title}</div>
                  <div className="text-xs text-gray-500">
                    {new Date(doc.lastModified).toLocaleString()}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteDocument(doc.id, e)}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-200 rounded"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
