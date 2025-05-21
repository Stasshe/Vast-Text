'use client';

import { Document } from '@/lib/db';
import { updateDocument } from '@/lib/documents';
import { useState, useEffect } from 'react';

interface ToolbarProps {
  document: Document | null;
  onDocumentUpdate: (doc: Document) => void;
  onRefresh: () => void;
}

export default function Toolbar({ document: activeDocument, onDocumentUpdate, onRefresh }: ToolbarProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [title, setTitle] = useState(activeDocument?.title || '');
  const [darkMode, setDarkMode] = useState(false);

  // ダークモードの初期状態を設定
  useEffect(() => {
    const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    setDarkMode(isDark);
  }, []);

  // ダークモード切り替え
  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    
    // HTMLのクラスを変更してテーマを切り替え
    if (newMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  // タイトル編集モードを開始
  const startEditing = () => {
    setTitle(activeDocument?.title || '');
    setIsEditing(true);
  };

  // タイトルを保存
  const saveTitle = async () => {
    if (activeDocument && title.trim() !== '') {
      const updatedDoc = await updateDocument(activeDocument.id, { title: title.trim() });
      if (updatedDoc) {
        onDocumentUpdate(updatedDoc);
      }
    }
    setIsEditing(false);
  };

  // エクスポート機能
  const exportDocument = () => {
    if (!activeDocument) return;
    
    // ファイル名の生成
    const filename = `${activeDocument.title.replace(/\s+/g, '_')}.txt`;
    
    // Blobの作成
    const blob = new Blob([activeDocument.content], { type: 'text/plain' });
    
    // ダウンロードリンクの作成
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    
    // リンクをクリックしてダウンロード開始
    document.body.appendChild(a);
    a.click();
    
    // クリーンアップ
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-12 border-b border-gray-200 flex items-center justify-between px-4">
      <div className="flex items-center">
        {isEditing ? (
          <div className="flex items-center">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') saveTitle();
                if (e.key === 'Escape') setIsEditing(false);
              }}
              className="border border-gray-300 rounded px-2 py-1 mr-2 w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <button
              onClick={saveTitle}
              className="text-blue-600 hover:text-blue-800"
            >
              保存
            </button>
            <button
              onClick={() => setIsEditing(false)}
              className="ml-2 text-gray-600 hover:text-gray-800"
            >
              キャンセル
            </button>
          </div>
        ) : (
          <div 
            className="font-medium text-lg cursor-pointer hover:underline"
            onClick={startEditing}
          >
            {activeDocument?.title || '無題のドキュメント'}
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-4">
        {/* ダークモード切り替えボタン */}
        <button
          onClick={toggleDarkMode}
          className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"
          title={darkMode ? "ライトモードに切り替え" : "ダークモードに切り替え"}
        >
          {darkMode ? (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="5"></circle>
              <line x1="12" y1="1" x2="12" y2="3"></line>
              <line x1="12" y1="21" x2="12" y2="23"></line>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
              <line x1="1" y1="12" x2="3" y2="12"></line>
              <line x1="21" y1="12" x2="23" y2="12"></line>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
            </svg>
          ) : (
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
            </svg>
          )}
        </button>

        <button
          onClick={exportDocument}
          disabled={!activeDocument}
          className={`p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700 ${!activeDocument ? 'opacity-50 cursor-not-allowed' : ''}`}
          title="エクスポート"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </button>

        <div className="text-sm text-gray-500">
          {activeDocument && (
            <span>
              最終更新: {new Date(activeDocument.lastModified).toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
