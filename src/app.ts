import { setupEditor } from './editor';
import { DocumentManager } from './document-manager';
import { setupUIListeners } from './ui';
import { setupMinimap } from './minimap';

// ダークモード検出とスクロール固定
function setupAppEnvironment() {
  // スクロール固定
  document.body.classList.add('fix-scroll');
  
  // ローカルストレージからテーマ設定を読み込む
  const savedTheme = localStorage.getItem('theme');
  
  if (savedTheme === 'dark') {
    // 保存されたテーマがダークモードの場合
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark-mode');
  } else if (savedTheme === 'light') {
    // 保存されたテーマがライトモードの場合
    document.documentElement.classList.remove('dark');
    document.body.classList.remove('dark-mode');
  } else {
    // 保存された設定がない場合はシステム設定に従う
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    }
  }
  
  // ダークモード変更検出（システム設定変更時）
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    // ユーザーが明示的に設定していない場合のみシステム設定に従う
    if (!localStorage.getItem('theme')) {
      if (e.matches) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark-mode');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark-mode');
      }
    }
  });
}

// アプリケーションの初期化
async function initApp() {
  console.log('アプリケーションを初期化しています...');
  
  // 環境設定
  setupAppEnvironment();
  
  // ドキュメント管理機能の初期化
  const documentManager = new DocumentManager();
  await documentManager.initialize();
  
  // エディタのセットアップ
  const { editor, view } = setupEditor(documentManager);
  
  // ミニマップのセットアップ
  setupMinimap(view);
  
  // UIイベントリスナーのセットアップ
  setupUIListeners(documentManager, editor, view);
  
  // 最後に開いていたドキュメントを読み込む
  const lastDocId = localStorage.getItem('last-document-id');
  if (lastDocId) {
    documentManager.loadDocument(lastDocId);
  } else {
    // デフォルトのドキュメントを作成
    documentManager.createNewDocument('新しいドキュメント');
  }
  
  // ドキュメントリストを更新
  documentManager.updateDocumentList();
}

// DOMの読み込みが完了したらアプリを初期化
document.addEventListener('DOMContentLoaded', () => {
  initApp().catch(err => console.error('アプリの初期化中にエラーが発生しました:', err));
});

// サービスワーカー登録（PWA対応）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch(err => {
      console.log('サービスワーカーの登録に失敗しました:', err);
    });
  });
}
