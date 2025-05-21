// ミニマップのセットアップと機能実装
export function setupMinimap(editorView) {
    const minimapEl = document.getElementById('minimap');
    if (!minimapEl)
        return;
    // 初期化時にミニマップを更新
    updateMinimap(editorView);
    // エディタの内容が変更されたらミニマップを更新
    document.addEventListener('editor-content-changed', ((e) => {
        updateMinimap(e.detail.view);
    }));
    // エディタのスクロールイベントでミニマップのハイライト位置を更新
    const editorEl = document.getElementById('editor');
    if (editorEl) {
        editorEl.addEventListener('scroll', () => {
            updateMinimapHighlight(editorView);
        });
    }
    // ミニマップクリックでエディタをその位置にスクロール
    minimapEl.addEventListener('click', (e) => {
        if (!editorEl)
            return;
        const minimapHeight = minimapEl.clientHeight;
        const editorHeight = editorEl.scrollHeight;
        const clickY = e.clientY - minimapEl.getBoundingClientRect().top;
        const ratio = clickY / minimapHeight;
        const targetScrollTop = ratio * editorHeight;
        editorEl.scrollTop = targetScrollTop;
    });
}
// ミニマップの内容を更新
function updateMinimap(view) {
    const minimapEl = document.getElementById('minimap');
    if (!minimapEl)
        return;
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
        }
        else if (line.includes('#') || line.includes('function') || line.includes('class')) {
            lineEl.style.backgroundColor = 'rgba(129, 140, 248, 0.6)';
        }
        else {
            lineEl.style.backgroundColor = 'rgba(209, 213, 219, 0.3)';
        }
        fragment.appendChild(lineEl);
    });
    minimapEl.appendChild(fragment);
    // 現在の表示位置を反映
    updateMinimapHighlight(view);
}
// ミニマップのハイライトカーソルを更新
function updateMinimapHighlight(view) {
    const editorEl = document.getElementById('editor');
    const minimapEl = document.getElementById('minimap');
    if (!editorEl || !minimapEl)
        return;
    // カーソル要素を取得または作成
    let cursor = minimapEl.querySelector('.minimap-cursor');
    if (!cursor) {
        cursor = document.createElement('div');
        cursor.className = 'minimap-cursor';
        minimapEl.appendChild(cursor);
    }
    // スクロール位置に応じてカーソル位置を更新
    const scrollRatio = editorEl.scrollTop / (editorEl.scrollHeight - editorEl.clientHeight);
    const minimapScrollableHeight = minimapEl.scrollHeight - minimapEl.clientHeight;
    const minimapHeight = minimapEl.clientHeight;
    const visibleRatio = editorEl.clientHeight / editorEl.scrollHeight;
    // カーソルの高さと位置を設定
    cursor.style.height = `${minimapHeight * visibleRatio}px`;
    cursor.style.top = `${scrollRatio * minimapScrollableHeight}px`;
}
