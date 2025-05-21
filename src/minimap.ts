import { EditorView } from '@codemirror/view';

// ミニマップのセットアップと機能実装
export function setupMinimap(editorView: EditorView) {
  const minimapEl = document.getElementById('minimap');
  if (!minimapEl) return;
  
  let editorInstance: EditorView;
  
  // 初期化時にミニマップを更新
  editorInstance = editorView;
  updateMinimap(editorView);
  
  // エディタの内容が変更されたらミニマップを更新
  document.addEventListener('editor-content-changed', ((e: CustomEvent) => {
    updateMinimap(e.detail.view);
    editorInstance = e.detail.view;
  }) as EventListener);
  
  // エディタのスクロールイベントでミニマップのハイライト位置を更新
  const editorEl = document.getElementById('editor');
  if (editorEl) {
    editorEl.addEventListener('scroll', () => {
      updateMinimapHighlight(editorView);
    });
  }
  
  // ミニマップクリックでエディタをその位置にスクロール
  minimapEl.addEventListener('click', (e) => {
    if (!editorEl) return;
    
    const minimapRect = minimapEl.getBoundingClientRect();
    const minimapHeight = minimapRect.height;
    const editorHeight = editorEl.scrollHeight;
    
    // クリック位置を計算
    const clickY = e.clientY - minimapRect.top;
    const ratio = Math.max(0, Math.min(1, clickY / minimapHeight));
    
    // ターゲットスクロール位置を計算して設定
    const maxScrollTop = editorHeight - editorEl.clientHeight;
    const targetScrollTop = ratio * maxScrollTop;
    editorEl.scrollTop = targetScrollTop;
    
    // イベントを処理したことを示す
    e.preventDefault();
    e.stopPropagation();
  });
  
  // ミニマップドラッグでスクロール
  let isDragging = false;
  
  minimapEl.addEventListener('mousedown', (e) => {
    isDragging = true;
    handleMinimapDrag(e);
  });
  
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      handleMinimapDrag(e);
    }
  });
  
  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
  
  function handleMinimapDrag(e: MouseEvent) {
    if (!editorEl) return;
    
    const minimapRect = minimapEl!.getBoundingClientRect();
    const minimapHeight = minimapRect.height;
    const editorHeight = editorEl.scrollHeight;
    
    // ドラッグ位置を計算
    const dragY = Math.max(0, Math.min(minimapHeight, e.clientY - minimapRect.top));
    const ratio = dragY / minimapHeight;
    
    // ターゲットスクロール位置を計算して設定
    const maxScrollTop = editorHeight - editorEl.clientHeight;
    const targetScrollTop = ratio * maxScrollTop;
    editorEl.scrollTop = targetScrollTop;
    
    // ミニマップハイライトを更新
    updateMinimapHighlight(editorInstance);
    
    // イベントを処理したことを示す
    e.preventDefault();
    e.stopPropagation();
  }
}

// ミニマップの内容を更新
function updateMinimap(view: EditorView) {
  const minimapEl = document.getElementById('minimap');
  if (!minimapEl) return;
  
  // ドキュメント全体の内容を取得
  const content = view.state.doc.toString();
  
  // ミニマップの内容をクリア
  minimapEl.innerHTML = '';
  
  // 簡易的なミニマップを生成
  const lines = content.split('\n');
  const fragment = document.createDocumentFragment();
  
  lines.forEach(line => {
    const lineEl = document.createElement('div');
    lineEl.className = 'minimap-line';
    lineEl.style.height = '2px';
    
    // 行の内容に応じて色を変える（単純な実装）
    if (line.trim() === '') {
      lineEl.style.backgroundColor = 'transparent';
    } else if (line.includes('#') || line.includes('function') || line.includes('class')) {
      lineEl.style.backgroundColor = 'rgba(129, 140, 248, 0.6)';
    } else {
      lineEl.style.backgroundColor = 'rgba(209, 213, 219, 0.3)';
    }
    
    fragment.appendChild(lineEl);
  });
  
  minimapEl.appendChild(fragment);
  
  // 現在の表示位置を反映
  updateMinimapHighlight(view);
}

// ミニマップのハイライトカーソルを更新
function updateMinimapHighlight(view: EditorView) {
  const editorEl = document.getElementById('editor');
  const minimapEl = document.getElementById('minimap');
  
  if (!editorEl || !minimapEl) return;
  
  // カーソル要素を取得または作成
  let cursor = minimapEl.querySelector('.minimap-cursor');
  if (!cursor) {
    cursor = document.createElement('div');
    cursor.className = 'minimap-cursor';
    minimapEl.appendChild(cursor);
  }
  
  // スクロール位置の計算
  const scrollTop = editorEl.scrollTop;
  const scrollHeight = editorEl.scrollHeight;
  const containerHeight = editorEl.clientHeight;
  
  // スクロール比率の計算（0〜1の範囲）
  let scrollRatio = 0;
  if (scrollHeight > containerHeight) {
    scrollRatio = scrollTop / (scrollHeight - containerHeight);
  }
  
  // ミニマップでの表示可能エリアの比率
  const minimapHeight = minimapEl.clientHeight;
  const visibleRatio = Math.min(1, containerHeight / scrollHeight);
  
  // カーソルの高さと位置を設定
  const cursorHeight = Math.max(30, minimapHeight * visibleRatio);
  const cursorTop = (minimapHeight - cursorHeight) * scrollRatio;
  
  (cursor as HTMLElement).style.height = `${cursorHeight}px`;
  (cursor as HTMLElement).style.top = `${cursorTop}px`;
}
