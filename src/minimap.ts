import { EditorView } from '@codemirror/view';

// エディタビューを指定の位置までスクロールするヘルパー関数
function scrollEditorView(view: EditorView, scrollTop: number) {
  if (!view) return;
  
  // CodeMirror 6のDOM構造を考慮してスクロール
  const scroller = view.scrollDOM;
  if (scroller) {
    // スクロール位置を設定（より安定した方法）
    try {
      // 直接DOMの値を設定
      scroller.scrollTop = scrollTop;
      
      // スクロールイベントを発火させて他のコンポーネントに通知
      scroller.dispatchEvent(new Event('scroll'));
      
      // ビューの状態を更新（重要）- エディタビューの再描画をトリガー
      view.requestMeasure();
      
      // 二重確認としてコンテンツ要素も確認
      const contentEl = scroller.querySelector('.cm-content');
      if (contentEl) {
        contentEl.dispatchEvent(new Event('scroll'));
      }
      
      console.log('CodeMirror DOM スクロール設定:', scrollTop);
    } catch (error) {
      console.error('CodeMirror スクロールエラー:', error);
    }
  }
  
  // 直接DOMも同期させる（バックアップ方法）
  const editorEl = document.getElementById('editor');
  if (editorEl) {
    try {
      editorEl.scrollTop = scrollTop;
      console.log('直接DOM要素スクロール設定:', scrollTop);
    } catch (error) {
      console.error('DOM要素スクロールエラー:', error);
    }
  }
}

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
  
  // ミニマップクリック/タップでエディタをその位置にスクロール
  const handleMinimapTap = (clientY: number) => {
    if (!editorEl) return;
    
    const minimapRect = minimapEl.getBoundingClientRect();
    const minimapHeight = minimapRect.height;
    const editorHeight = editorEl.scrollHeight;
    
    // クリック/タップ位置を計算
    const clickY = clientY - minimapRect.top;
    const ratio = Math.max(0, Math.min(1, clickY / minimapHeight));
    
    // ターゲットスクロール位置を計算して設定
    const maxScrollTop = editorHeight - editorEl.clientHeight;
    const targetScrollTop = ratio * maxScrollTop;
    
    // エディタをスクロール - DOM要素とEditorViewの両方をスクロール
    editorEl.scrollTop = targetScrollTop;
    scrollEditorView(editorInstance, targetScrollTop);
    
    console.log('ミニマップタップ/クリック位置:', clickY, '比率:', ratio, 'スクロール位置:', targetScrollTop);
  };
  
  // マウスクリックイベント
  minimapEl.addEventListener('click', (e) => {
    handleMinimapTap(e.clientY);
    // イベントを処理したことを示す
    e.preventDefault();
    e.stopPropagation();
  });
  
  // タッチイベント - iPadなどのタッチデバイス用
  minimapEl.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length > 0) {
      const touch = e.touches[0];
      handleMinimapTap(touch.clientY);
      // イベントを処理したことを示す
      e.preventDefault();
    }
  });
  
  // ミニマップドラッグでスクロール
  let isDragging = false;
  let lastY = 0;
  
  minimapEl.addEventListener('mousedown', (e) => {
    isDragging = true;
    lastY = e.clientY;
    handleMinimapDrag(e);
    
    // デフォルトのセレクション動作を防止
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (isDragging) {
      // ドラッグ中は継続してスクロール位置を更新
      handleMinimapDrag(e);
      lastY = e.clientY;
      
      // デフォルトのドラッグ動作を防止
      e.preventDefault();
    }
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      // ドラッグ終了時に状態をリセット
      isDragging = false;
      
      // 最終的な位置でミニマップハイライトを更新
      updateMinimapHighlight(editorInstance);
    }
  });
  
  // タッチスクロール用のイベント - iPadなどのタッチデバイス用
  let touchIsDragging = false;
  let touchLastY = 0;
  let touchDebounceTimer: ReturnType<typeof setTimeout> | undefined = undefined;
  
  // タッチ開始
  minimapEl.addEventListener('touchstart', (e) => {
    if (e.touches && e.touches.length > 0) {
      touchIsDragging = true;
      touchLastY = e.touches[0].clientY;
      
      // タッチ開始位置でスクロール初期化
      handleMinimapTouch(e);
      e.preventDefault();
    }
  });
  
  // タッチ移動
  document.addEventListener('touchmove', (e) => {
    if (touchIsDragging && e.touches && e.touches.length > 0) {
      handleMinimapTouch(e);
      e.preventDefault();
      
      // デバウンス処理 - 高頻度の更新を避ける
      if (touchDebounceTimer) clearTimeout(touchDebounceTimer);
      touchDebounceTimer = setTimeout(() => {
        requestAnimationFrame(() => {
          // 位置を最終調整
          updateMinimapHighlight(editorInstance);
        });
      }, 16); // ～60fpsに相当
    }
  }, { passive: false });
  
  // タッチ終了
  document.addEventListener('touchend', (e) => {
    if (touchIsDragging) {
      touchIsDragging = false;
      
      // 最終位置でミニマップ更新
      updateMinimapHighlight(editorInstance);
      e.preventDefault();
    }
  });
  
  // タッチスクロールイベントリスナー（エディタからのイベント）
  document.addEventListener('editor-scroll-update', ((e: CustomEvent) => {
    updateMinimapHighlight(e.detail.view);
  }) as EventListener);
  
  function handleMinimapDrag(e: MouseEvent) {
    if (!editorEl) return;
    
    const minimapRect = minimapEl!.getBoundingClientRect();
    const minimapHeight = minimapRect.height;
    const editorHeight = editorEl.scrollHeight;
    
    // ドラッグ位置の計算方法を改善
    // 現在のマウス位置を取得し、前回位置からの移動量を計算
    const currentY = e.clientY;
    const deltaY = currentY - lastY;
    lastY = currentY;
    
    // カーソル要素を取得
    const cursor = minimapEl!.querySelector('.minimap-cursor') as HTMLElement;
    if (!cursor) return;
    
    // 現在のカーソル位置を取得し、数値化（NaNを防止）
    const cursorTopStr = cursor.style.top || '0';
    const cursorTop = parseFloat(cursorTopStr.replace('px', '')) || 0;
    const cursorHeightStr = cursor.style.height || '30px';
    const cursorHeight = parseFloat(cursorHeightStr.replace('px', '')) || 30;
    
    // ドラッグによる相対移動を適用（高速スクロール用の係数を適用）
    // ミニマップは小さいため、移動量を増幅する係数を使用
    const factor = 1.5; // 移動速度調整係数（大きくすると感度が上がる）
    const newCursorTop = Math.max(
      0,
      Math.min(
        minimapHeight - cursorHeight, // 最大値（下端）
        cursorTop + deltaY * factor   // 新しい位置
      )
    );
    
    console.log('ドラッグ処理: 現在位置=' + cursorTop + ', 新位置=' + newCursorTop + ', 移動量=' + deltaY);
    
    // カーソル位置からスクロール比率を計算し直す（エディタの高さを考慮）
    // 分母が0になるのを防止（エッジケース）
    const denominator = minimapHeight - cursorHeight;
    const ratio = denominator > 0 ? newCursorTop / denominator : 0;
    
    // ターゲットスクロール位置を計算して設定
    const maxScrollTop = editorHeight - editorEl.clientHeight;
    const targetScrollTop = Math.max(0, Math.min(maxScrollTop, ratio * maxScrollTop));
    
    // カーソル位置を直接更新（アニメーションフレームを待たずに）
    cursor.style.top = `${newCursorTop}px`;
    
    // エディタビューを直接スクロール（EditorViewのAPIを使用）
    scrollEditorView(editorInstance, targetScrollTop);
    
    // 完全なミニマップ更新は次のフレームで（非同期で処理してパフォーマンス確保）
    requestAnimationFrame(() => {
      updateMinimapHighlight(editorInstance);
    });
    
    // イベントを処理したことを示す
    e.preventDefault();
    e.stopPropagation();
  }
  
  function handleMinimapTouch(e: TouchEvent) {
    if (!editorEl || !minimapEl || !e.touches || e.touches.length === 0) return;
    
    const touch = e.touches[0];
    const currentY = touch.clientY;
    
    // iPadの場合はダイレクトタップ位置も考慮
    const minimapRect = minimapEl.getBoundingClientRect();
    if (Math.abs(currentY - touchLastY) < 10) {
      // ほぼ同じ位置（移動量が小さい）ならタップとして処理
      const tapY = currentY - minimapRect.top;
      const minimapHeight = minimapRect.height;
      
      // タップ位置から比率を計算（0～1の範囲）
      const ratio = Math.max(0, Math.min(1, tapY / minimapHeight));
      
      // ターゲットスクロール位置を計算して直接設定
      const editorHeight = editorEl.scrollHeight;
      const maxScrollTop = editorHeight - editorEl.clientHeight;
      const targetScrollTop = Math.round(ratio * maxScrollTop);
      
      // エディタをスクロール（より正確な実装）
      scrollEditorView(editorInstance, targetScrollTop);
      
      // ハイライト更新は非同期で
      requestAnimationFrame(() => {
        updateMinimapHighlight(editorInstance);
      });
      
      console.log('ミニマップタップで直接移動:', ratio, 'スクロール位置:', targetScrollTop);
      return;
    }
    
    // 通常のドラッグ処理
    const deltaY = currentY - touchLastY;
    touchLastY = currentY;
    
    // カーソル要素を取得（既にnullチェック済み）
    const cursor = minimapEl.querySelector('.minimap-cursor') as HTMLElement;
    if (!cursor) return;
    
    const minimapHeight = minimapRect.height;
    const editorHeight = editorEl.scrollHeight;
    
    // 現在のカーソル位置を取得（より安全な変換）
    const cursorTopStr = cursor.style.top || '0';
    const cursorTop = parseFloat(cursorTopStr.replace('px', '')) || 0;
    const cursorHeightStr = cursor.style.height || '30px';
    const cursorHeight = parseFloat(cursorHeightStr.replace('px', '')) || 30;
    
    // タッチによる相対移動を適用（高速スクロール用の係数を適用）
    const factor = 1.5; // タッチ移動速度調整係数（大きくするとより速くスクロール）
    const newCursorTop = Math.max(
      0,
      Math.min(
        minimapHeight - cursorHeight, // 最大値（下端）
        cursorTop + deltaY * factor   // 新しい位置
      )
    );
    
    // カーソル位置からスクロール比率を計算し直す（ゼロ除算防止）
    const denominator = minimapHeight - cursorHeight;
    const ratio = denominator > 0 ? newCursorTop / denominator : 0;
    
    // ターゲットスクロール位置を計算して設定
    const maxScrollTop = editorHeight - editorEl.clientHeight;
    const targetScrollTop = Math.round(Math.max(0, Math.min(maxScrollTop, ratio * maxScrollTop)));
    
    // エディタビューを直接スクロール（繰り返し呼び出し最適化）
    if (Math.abs(targetScrollTop - editorEl.scrollTop) > 2) {
      scrollEditorView(editorInstance, targetScrollTop);
    }
    
    // カーソル位置を直接更新
    cursor.style.top = `${newCursorTop}px`;
    
    console.log('タッチドラッグ移動量:', deltaY, '新カーソル位置:', newCursorTop, 'スクロール位置:', targetScrollTop);
    
    // 完全なミニマップ更新は次のフレームで（パフォーマンス向上）
    requestAnimationFrame(() => {
      updateMinimapHighlight(editorInstance);
    });
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
  
  if (!editorEl || !minimapEl || !view) return;
  
  // カーソル要素を取得または作成
  let cursor = minimapEl.querySelector('.minimap-cursor');
  if (!cursor) {
    cursor = document.createElement('div');
    cursor.className = 'minimap-cursor';
    minimapEl.appendChild(cursor);
  }
  
  // スクロール位置の取得 - CodeMirrorのDOM構造からより正確に取得
  let scrollTop = 0;
  
  // 優先順位1: EditorViewのスクローラー（最も正確）
  if (view.scrollDOM) {
    scrollTop = view.scrollDOM.scrollTop;
  } 
  // 優先順位2: エディタのDOM要素
  else if (editorEl) {
    scrollTop = editorEl.scrollTop;
  }
  
  // スクロール関連のメトリクス計算
  const scrollHeight = editorEl.scrollHeight;
  const containerHeight = editorEl.clientHeight;
  
  // エッジケースの処理（スクロール可能なドキュメントが非常に短い場合）
  if (scrollHeight <= containerHeight) {
    // スクロールの必要がない場合は全体表示
    const cursorEl = cursor as HTMLElement;
    cursorEl.style.height = `${minimapEl.clientHeight}px`;
    cursorEl.style.top = '0px';
    return;
  }
  
  // スクロール比率の計算（0〜1の範囲、スクロールヘッドの位置）
  // 分母が0にならないように保護
  const scrollMax = Math.max(1, scrollHeight - containerHeight);
  const scrollRatio = Math.max(0, Math.min(1, scrollTop / scrollMax));
  
  // ミニマップでの表示可能エリアの比率
  const minimapHeight = minimapEl.clientHeight;
  
  // 表示エリアの比率（エディタに表示されている部分の割合）
  const visibleRatio = Math.min(1, containerHeight / scrollHeight);
  
  // カーソルの高さと位置を設定（最小値と計算値の大きい方を使用）
  // 極小にならないようにする
  const cursorHeight = Math.max(30, Math.round(minimapHeight * visibleRatio));
  
  // 高さを考慮した正確なカーソル位置計算
  // カーソルが最下部に到達するとき、実際のカーソル高さを考慮して調整
  let cursorTop = 0;
  
  if (scrollRatio >= 0.9999) {
    // 最下部に到達した場合、カーソルが見切れないよう調整
    cursorTop = minimapHeight - cursorHeight;
  } else {
    // 通常のスクロール位置計算（カーソルの高さを考慮）
    // より正確な位置計算（丸め誤差を防ぐため整数値に丸める）
    cursorTop = Math.round(Math.min(
      minimapHeight - cursorHeight,  // 最大値（下端）
      (minimapHeight - cursorHeight) * scrollRatio  // 比例計算
    ));
  }
  
  // スタイルを適用（値が必ず整数になるようにして位置のずれを防止）
  const cursorEl = cursor as HTMLElement;
  cursorEl.style.height = `${cursorHeight}px`;
  cursorEl.style.top = `${cursorTop}px`;
  
  // デバッグを簡単にするためのデータ属性
  cursorEl.setAttribute('data-scroll-ratio', scrollRatio.toFixed(4));
  cursorEl.setAttribute('data-editor-height', scrollHeight.toString());
  cursorEl.setAttribute('data-visible-ratio', visibleRatio.toFixed(4));
  
  // 位置情報をコンソールに出力（デバッグ用）
  if (scrollRatio === 0 || scrollRatio === 1 || scrollRatio % 0.1 < 0.01) {
    console.log(`ミニマップハイライト更新: 比率=${scrollRatio.toFixed(2)}, 位置=${cursorTop}px, 高さ=${cursorHeight}px`);
  }
}
