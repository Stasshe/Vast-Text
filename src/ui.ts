import { EditorView } from '@codemirror/view';
import { DocumentManager } from './document-manager';

// UIイベントリスナーのセットアップ
export function setupUIListeners(
  documentManager: DocumentManager, 
  editor: { updateContent: (content: string) => void }, 
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

  // サイドバー切り替えボタンのイベント
  const toggleSidebarBtn = document.getElementById('toggle-sidebar-btn');
  const sidebar = document.getElementById('sidebar');
  if (toggleSidebarBtn && sidebar) {
    toggleSidebarBtn.addEventListener('click', () => {
      sidebar.classList.toggle('hidden');
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
}
