import { EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { DocumentManager } from './document-manager';
import { moveLineUp, moveLineDown } from './keymap-extensions';

// ダークモード検出
export const isDarkMode = () => {
  return true; // 常にダークモード（カーソルを水色に）
};

// エディタの設定と初期化
export function setupEditor(documentManager: DocumentManager) {
  console.log('エディタを水色カーソルで初期化します');
  
  // 水色カーソルのスタイル拡張
  const waterCursorTheme = EditorView.theme({
    ".cm-cursor": {
      borderLeft: "2px solid #38bdf8",
      borderLeftColor: "#38bdf8", 
      boxShadow: "0 0 3px #38bdf8",
      marginLeft: "-1px"
    },
    ".cm-selectionBackground": {
      backgroundColor: "rgba(56, 189, 248, 0.3)"
    },
    ".cm-content": {
      caretColor: "#38bdf8"
    }
  });
  
  // エディタの背景とテキスト色
  const darkTheme = EditorView.theme({
    "&": {
      height: "100%",
      fontSize: "14px",
      backgroundColor: "#121212",
      color: "#ffffff"
    },
    ".cm-content": {
      fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace",
      color: "#ffffff"
    },
    ".cm-line": {
      padding: "0 4px",
      lineHeight: "1.6",
      color: "#ffffff"
    },
    ".cm-gutters": {
      backgroundColor: "#1e1e1e",
      color: "#9ca3af",
      border: "none"
    },
    ".cm-activeLineGutter, .cm-activeLine": {
      backgroundColor: "rgba(55, 65, 81, 0.5)"
    }
  });
  
  // エディタの拡張機能
  const extensions: Extension[] = [
    lineNumbers(),
    highlightActiveLineGutter(),
    history(),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      // カスタムキーマップを追加
      { key: "Alt-ArrowUp", run: moveLineUp },
      { key: "Alt-ArrowDown", run: moveLineDown }
    ]),
    EditorView.updateListener.of(update => {
      if (update.docChanged) {
        // ドキュメントが変更されたら保存
        const content = update.state.doc.toString();
        documentManager.saveCurrentDocument(content);
        
        // ミニマップを更新
        try {
          const event = new CustomEvent('editor-content-changed', { detail: { view: update.view } });
          document.dispatchEvent(event);
        } catch (error) {
          console.error('ミニマップの更新中にエラーが発生しました:', error);
        }
      }
    }),
    // スムーススクロール設定
    EditorView.theme({
      "&": {
        scrollBehavior: "smooth", // スムーススクロールを有効化
        scrollbarWidth: "thin"    // スクロールバーを細くする
      },
      ".cm-scroller": {
        overflow: "auto",
        scrollbarWidth: "thin",
        scrollBehavior: "smooth"
      }
    }),
    darkTheme,
    waterCursorTheme,
    EditorView.contentAttributes.of({style: "caret-color: #38bdf8;"}),
    // iPad/タブレット向けのタッチ操作最適化
    EditorView.domEventHandlers({
      touchstart(event, view) {
        console.log('エディタのタッチイベント開始');
        return false; // イベントを伝搬させる
      },
      touchmove(event, view) {
        // タッチデバイスでのスクロールを改善
        if (event.touches && event.touches.length === 1) {
          // ミニマップ更新のためのカスタムイベントを発火
          try {
            const customEvent = new CustomEvent('editor-scroll-update', { 
              detail: { view: view } 
            });
            document.dispatchEvent(customEvent);
          } catch (error) {
            console.error('タッチスクロール中のイベント発火エラー:', error);
          }
        }
        return false; // イベントを伝搬させる
      }
    }),
  ];

  // エディタの初期状態
  const state = EditorState.create({
    doc: "",
    extensions
  });

  // エディタビューの作成
  const view = new EditorView({
    state,
    parent: document.getElementById("editor") as HTMLElement
  });

  // ダークモード変更を検出してエディタを更新
  const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
  mediaQuery.addEventListener('change', (e) => {
    if (e.matches) {
      document.documentElement.classList.add('dark');
      document.body.classList.add('dark-mode');
    } else {
      document.documentElement.classList.remove('dark');
      document.body.classList.remove('dark-mode');
    }
  });

  // エディタのコンテンツを更新する関数
  const updateContent = (content: string) => {
    view.dispatch({
      changes: {
        from: 0,
        to: view.state.doc.length,
        insert: content
      }
    });
  };

  return {
    editor: {
      updateContent
    },
    view
  };
}
