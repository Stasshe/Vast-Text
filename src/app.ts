import { setupEditor } from './editor';
import { DocumentManager } from './document-manager';
import { setupUIListeners } from './ui';
import { setupMinimap } from './minimap';

// ドキュメントマネージャーのグローバル参照
let documentManager: DocumentManager;

// ダークモード検出とスクロール固定
function setupAppEnvironment() {
  // スクロール固定
  document.body.classList.add('fix-scroll');
  
  // 強制的にダークモードを適用
  document.documentElement.classList.add('dark');
  document.body.classList.add('dark-mode');
  console.log('強制的にダークモードを適用しました');

  // テーマ変更のリスナー (常にダークモードを維持)
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
    // 常にダークモードを維持
    document.documentElement.classList.add('dark');
    document.body.classList.add('dark-mode');
  });
}

// アプリケーションの初期化
async function initApp() {
  console.log('アプリケーションを初期化しています...');
  
  // 環境設定
  setupAppEnvironment();
  
  // ドキュメント管理機能の初期化
  documentManager = new DocumentManager();
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
  
  // 文字数カウンターの初期化
  setupCharacterCounter();
}

// 文字数カウンターの初期化
function setupCharacterCounter() {
  const counterContainer = document.getElementById('character-counter');
  if (!counterContainer) return;
  
  // クリックで最小化/最大化を切り替え
  counterContainer.addEventListener('click', () => {
    counterContainer.classList.toggle('minimized');
  });
  
  // 初期状態では3秒後に最小化
  setTimeout(() => {
    counterContainer.classList.add('minimized');
  }, 3000);
  
  // 初期文字数を表示
  updateCharacterCount();
}

// 文字数カウンターを更新する関数
function updateCharacterCount() {
  if (!documentManager) return;
  
  const currentDoc = documentManager.getCurrentDocument();
  if (!currentDoc) return;
  
  const content = currentDoc.content || '';
  const charCounter = document.getElementById('chars-count');
  
  if (charCounter) {
    charCounter.textContent = content.length.toLocaleString();
    
    // カウンターを表示
    const counterContainer = document.getElementById('character-counter');
    if (counterContainer) {
      counterContainer.classList.remove('minimized');
      
      // 3秒後に最小化
      setTimeout(() => {
        counterContainer.classList.add('minimized');
      }, 3000);
    }
  }
}

// ドキュメント選択時の処理 - 元のコードを削除し、UIから呼び出される関数として再定義
export function selectDocument(id: string) {
  if (!documentManager) {
    console.error('ドキュメントマネージャーが初期化されていません');
    return;
  }
  
  // ドキュメントを選択
  documentManager.loadDocument(id);
  
  // 文字数カウンターを更新
  updateCharacterCount();
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
