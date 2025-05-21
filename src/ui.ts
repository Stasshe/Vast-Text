import { EditorView } from '@codemirror/view';
import { DocumentManager } from './document-manager';
import { selectDocument } from './app'; // selectDocument関数をインポート

// UIイベントリスナーのセットアップ
export function setupUIListeners(
  documentManager: DocumentManager, 
  editor: { 
    updateContent: (content: string) => void,
    updateEditorStyles?: (darkMode: boolean) => void
  }, 
  view: EditorView
): void {
  // 新規ドキュメントボタンのイベント
  const newDocBtn = document.getElementById('new-doc-btn');
  if (newDocBtn) {
    newDocBtn.addEventListener('click', () => {
      const title = prompt('新しいドキュメントのタイトルを入力してください:', '新しいドキュメント');
      if (title) {
        documentManager.createNewDocument(title);
      }
    });
  }
  
  // 名前を付けて保存ボタンのイベント
  const saveAsBtn = document.getElementById('save-as-btn');
  if (saveAsBtn) {
    saveAsBtn.addEventListener('click', () => {
      // 現在のドキュメントのタイトルを取得
      const currentDoc = documentManager.getCurrentDocument();
      const defaultFilename = currentDoc ? currentDoc.title : '新しいドキュメント';
      
      // ファイル名の入力プロンプトを表示
      const filename = prompt('保存するファイル名を入力してください (拡張子を含めることができます):', defaultFilename);
      
      if (filename) {
        // エディタの内容を取得
        const content = view.state.doc.toString();
        
        // ファイルとして保存
        documentManager.saveAsFile(content, filename);
      }
    });
  }

  // サイドバー切り替えボタンのイベント
  const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
  const sidebar = document.getElementById('sidebar');
  if (toggleSidebarBtn && sidebar) {
    toggleSidebarBtn.addEventListener('click', () => {
      sidebar.classList.toggle('hidden');
    });
  }

  // エディタのテーマを更新する関数
  function updateEditorTheme(isDarkMode: boolean, view: EditorView): void {
    if (editor.updateEditorStyles) {
      // エディタ側の実装を使用する
      editor.updateEditorStyles(isDarkMode);
    } else {
      // フォールバック実装（エディタ側の実装がない場合）
      const editorElement = document.getElementById("editor");
      
      if (editorElement) {
        if (isDarkMode) {
          editorElement.style.backgroundColor = "#1f2937";
          editorElement.style.color = "#e5e7eb";
        } else {
          editorElement.style.backgroundColor = "#fff";
          editorElement.style.color = "#000";
        }
      }
      
      // カーソルスタイルの更新
      const cursorElements = document.querySelectorAll(".cm-cursor");
      cursorElements.forEach(cursorEl => {
        if (cursorEl instanceof HTMLElement) {
          if (isDarkMode) {
            cursorEl.style.borderLeftColor = "#38bdf8";
            cursorEl.style.borderLeftWidth = "1.5px";
            cursorEl.style.boxShadow = "0 0 2px #38bdf8";
          } else {
            cursorEl.style.borderLeftColor = "#000";
            cursorEl.style.borderLeftWidth = "1.2px";
            cursorEl.style.boxShadow = "none";
          }
        }
      });
    }
  }

  // テーマ切り替えボタンのイベント
  const toggleThemeBtn = document.getElementById('toggle-theme-btn');
  if (toggleThemeBtn) {
    toggleThemeBtn.addEventListener('click', () => {
      console.log('テーマ切り替えボタンがクリックされました');
      const isDarkMode = document.documentElement.classList.contains('dark');
      
      if (isDarkMode) {
        // ライトモードに切り替え
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark-mode');
        localStorage.setItem('theme', 'light');
        console.log('ライトモードに切り替えました');
      } else {
        // ダークモードに切り替え
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark-mode');
        localStorage.setItem('theme', 'dark');
        console.log('ダークモードに切り替えました');
      }
      
      // 直接DOMを操作してエディターのスタイルを更新
      const editorElement = document.getElementById("editor");
      const newDarkMode = !isDarkMode;
      
      if (editorElement) {
        console.log('エディター要素を見つけました、スタイルを更新します');
        if (newDarkMode) {
          editorElement.style.backgroundColor = "#1f2937";
          document.querySelectorAll('.cm-content').forEach(el => {
            (el as HTMLElement).style.color = "#e5e7eb";
          });
        } else {
          editorElement.style.backgroundColor = "#fff";
          document.querySelectorAll('.cm-content').forEach(el => {
            (el as HTMLElement).style.color = "#000";
          });
        }
      } else {
        console.log('エディター要素が見つかりません');
      }
      
      // カーソルスタイルを強制的に更新
      document.querySelectorAll(".cm-cursor").forEach(cursorEl => {
        if (cursorEl instanceof HTMLElement) {
          if (newDarkMode) {
            cursorEl.style.borderLeftColor = "#38bdf8";
            cursorEl.style.borderLeftWidth = "1.5px";
            cursorEl.style.boxShadow = "0 0 2px #38bdf8";
          } else {
            cursorEl.style.borderLeftColor = "#000";
            cursorEl.style.borderLeftWidth = "1.2px";
            cursorEl.style.boxShadow = "none";
          }
        }
      });
      
      // ガター（行番号）のスタイルを強制的に更新
      document.querySelectorAll(".cm-gutters").forEach(gutterEl => {
        if (gutterEl instanceof HTMLElement) {
          if (newDarkMode) {
            gutterEl.style.backgroundColor = "#111827";
            gutterEl.style.color = "#9ca3af";
          } else {
            gutterEl.style.backgroundColor = "#f5f5f5";
            gutterEl.style.color = "#6b7280";
          }
        }
      });
    });
  }

  // ドキュメント内容更新イベント
  document.addEventListener('document-content-changed', ((e: CustomEvent) => {
    const { content } = e.detail;
    editor.updateContent(content);
  }) as EventListener);

  // ドキュメントタイトルのダブルクリックによる編集
  document.addEventListener('dblclick', (e) => {
    const target = e.target as HTMLElement;
    if (target.classList.contains('document-title')) {
      const docItem = target.closest('.document-item') as HTMLElement;
      if (docItem && docItem.dataset.id) {
        const currentTitle = target.textContent || '';
        const newTitle = prompt('ドキュメント名を編集:', currentTitle);
        if (newTitle && newTitle !== currentTitle) {
          documentManager.updateDocumentTitle(docItem.dataset.id, newTitle);
        }
      }
    }
  });

  // キーボードショートカット
  document.addEventListener('keydown', (e) => {
    // Ctrl/Cmd+Sで保存（デフォルト動作を防止）
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      const content = view.state.doc.toString();
      documentManager.saveCurrentDocument(content);
    }
    
    // Ctrl/Cmd+Nで新規ドキュメント
    if ((e.ctrlKey || e.metaKey) && e.key === 'n' && !e.shiftKey) {
      e.preventDefault();
      const title = prompt('新しいドキュメントのタイトルを入力してください:', '新しいドキュメント');
      if (title) {
        documentManager.createNewDocument(title);
      }
    }
  });
  
  // ドキュメント選択時の処理
  function selectDocument(id: string) {
    // ...existing code...
    
    // 文字数カウンターを更新
    const document_editor = documentManager.getDocument(id);
    if (document) {
      const content = document_editor!.content || '';
      const charCounter = document.getElementById('chars-count');
      if (charCounter) {
        charCounter.textContent = content.length.toLocaleString();
        
        // カウンターを表示
        const counterContainer = document.getElementById('character-counter');
        if (counterContainer) {
          counterContainer.classList.remove('minimized');
          
          
        }
      }
    }
  }
  
  // ドキュメントリストのクリックイベント
  const documentList = document.getElementById('document-list');
  if (documentList) {
    documentList.addEventListener('click', (e) => {
      const target = e.target as HTMLElement;
      const documentItem = target.closest('.document-item');
      
      if (documentItem) {
        const docId = documentItem.getAttribute('data-id');
        if (docId) {
          // app.ts のselectDocument関数を呼び出し
          selectDocument(docId);
        }
      }
    });
  }
}
