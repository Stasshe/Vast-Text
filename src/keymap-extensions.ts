import { EditorView } from '@codemirror/view';
import { EditorState, Transaction, ChangeSpec } from '@codemirror/state';
import { openSearchPanel, SearchQuery } from '@codemirror/search';

// 行を上に移動するコマンド
export const moveLineUp = (view: EditorView): boolean => {
  const { state, dispatch } = view;
  const changes: ChangeSpec[] = [];
  const { doc } = state;
  
  // 選択範囲がない場合は現在の行を対象にする
  let { from, to } = state.selection.main;
  
  // 選択範囲の開始位置と終了位置を行の境界に調整
  const fromLine = doc.lineAt(from);
  const toLine = doc.lineAt(to);
  
  from = fromLine.from;
  to = toLine.to;
  
  // 最初の行なら何もしない
  if (fromLine.number === 1) return false;
  
  // 上の行の情報を取得
  const prevLine = doc.line(fromLine.number - 1);
  
  // 行を交換する変更を作成
  changes.push({
    from: prevLine.from,
    to: to,
    insert: doc.slice(from, to) + state.lineBreak + doc.slice(prevLine.from, prevLine.to)
  });
  
  // 変更を適用
  dispatch(state.update({
    changes,
    selection: { 
      anchor: from - (prevLine.to - prevLine.from + 1), 
      head: to - (prevLine.to - prevLine.from + 1) 
    },
    scrollIntoView: true
  }));
  
  return true;
};

// 行を下に移動するコマンド
export const moveLineDown = (view: EditorView): boolean => {
  const { state, dispatch } = view;
  const changes: ChangeSpec[] = [];
  const { doc } = state;
  
  // 選択範囲がない場合は現在の行を対象にする
  let { from, to } = state.selection.main;
  
  // 選択範囲の開始位置と終了位置を行の境界に調整
  const fromLine = doc.lineAt(from);
  const toLine = doc.lineAt(to);
  
  from = fromLine.from;
  to = toLine.to;
  
  // 最後の行なら何もしない
  if (toLine.number === doc.lines) return false;
  
  // 下の行の情報を取得
  const nextLine = doc.line(toLine.number + 1);
  
  // 行を交換する変更を作成
  changes.push({
    from: from,
    to: nextLine.to,
    insert: doc.slice(nextLine.from, nextLine.to) + state.lineBreak + doc.slice(from, to)
  });
  
  // 変更を適用
  dispatch(state.update({
    changes,
    selection: { 
      anchor: from + (nextLine.to - nextLine.from + 1), 
      head: to + (nextLine.to - nextLine.from + 1) 
    },
    scrollIntoView: true
  }));
  
  return true;
};

// 検索・置換パネルを開くコマンド
export const openReplacePanel = (view: EditorView): boolean => {
  // 現在のスクロール位置を保存
  const scrollPos = view.scrollDOM.scrollTop;
  
  // 検索パネルを開く
  openSearchPanel(view);
  
  // DOM更新後に実行
  setTimeout(() => {
    // スクロール位置を復元
    view.scrollDOM.scrollTop = scrollPos;
    
    // 置換パネルを表示して位置とスタイルを調整
    const searchPanel = view.dom.querySelector(".cm-search");
    if (searchPanel) {
      // 置換パネルを表示
      const replaceButton = searchPanel.querySelector(".cm-button[name=replace]");
      if (replaceButton instanceof HTMLElement) {
        replaceButton.click();
      }
      
      // クラスを追加してスタイルを適用
      searchPanel.classList.add('float-panel-adjusted');
      
      // 明示的に位置を設定
      if (searchPanel instanceof HTMLElement) {
        searchPanel.style.top = '50px';
        searchPanel.style.position = 'fixed';
        searchPanel.style.backgroundColor = 'white';
        searchPanel.style.color = '#333';
        searchPanel.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
        searchPanel.style.border = '1px solid #ccc';
        
        // すべての子要素に白背景を適用
        const elements = searchPanel.querySelectorAll('*');
        elements.forEach(el => {
          if (el instanceof HTMLElement) {
            if (el.tagName === 'BUTTON') {
              el.style.backgroundColor = '#f0f0f0';
              el.style.color = '#333';
            } else if (el.tagName === 'INPUT' || el.tagName === 'SELECT') {
              el.style.backgroundColor = 'white';
              el.style.color = '#333';
              el.style.border = '1px solid #ccc';
            } else {
              el.style.backgroundColor = 'white';
              el.style.color = '#333';
            }
          }
        });
        
        // 閉じるボタンの機能を追加
        const closeBtn = document.createElement('div');
        closeBtn.className = 'search-panel-close-btn';
        closeBtn.textContent = '×';
        closeBtn.style.position = 'absolute';
        closeBtn.style.top = '5px';
        closeBtn.style.right = '10px';
        closeBtn.style.fontSize = '18px';
        closeBtn.style.color = '#666';
        closeBtn.style.cursor = 'pointer';
        closeBtn.style.width = '20px';
        closeBtn.style.height = '20px';
        closeBtn.style.textAlign = 'center';
        closeBtn.style.lineHeight = '20px';
        closeBtn.style.borderRadius = '50%';
        
        closeBtn.addEventListener('click', () => {
          // 検索パネルを閉じる
          const closeButton = searchPanel.querySelector(".cm-button[name=close]");
          if (closeButton instanceof HTMLElement) {
            closeButton.click();
          } else {
            // バックアップ：検索パネルを非表示にする
            searchPanel.style.display = 'none';
          }
        });
        
        // hover効果を追加
        closeBtn.addEventListener('mouseover', () => {
          closeBtn.style.backgroundColor = '#eee';
        });
        
        closeBtn.addEventListener('mouseout', () => {
          closeBtn.style.backgroundColor = 'transparent';
        });
        
        searchPanel.appendChild(closeBtn);
      }
    }
  }, 10);
  
  return true;
};
