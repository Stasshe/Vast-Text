import { EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { DocumentManager } from './document-manager';
import { moveLineUp, moveLineDown } from './keymap-extensions';

// ダークモード検出
export const isDarkMode = () => {
  return (
    window.matchMedia('(prefers-color-scheme: dark)').matches || 
    document.documentElement.classList.contains('dark') || 
    document.body.classList.contains('dark-mode')
  );
};

// エディタの設定と初期化
export function setupEditor(documentManager: DocumentManager) {
  // ダークモードを初期検出
  const darkMode = isDarkMode();
  
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
    EditorView.theme({
      "&": {
        height: "100%",
        fontSize: "14px",
        backgroundColor: darkMode ? "#1f2937" : "#fff",
        color: darkMode ? "#e5e7eb" : "#000"
      },
      ".cm-content": {
        fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace"
      },
      ".cm-line": {
        padding: "0 4px",
        lineHeight: "1.6"
      },
      ".cm-cursor": {
        borderLeftColor: darkMode ? "#38bdf8" : "#000",
        borderLeftWidth: darkMode ? "1.5px" : "1.2px",
        boxShadow: darkMode ? "0 0 2px #38bdf8" : "none"
      },
      "&.cm-focused .cm-cursor": {
        visibility: "visible !important"
      },
      ".cm-activeLine": {
        backgroundColor: darkMode ? "rgba(55, 65, 81, 0.5)" : "rgba(240, 240, 240, 0.8)"
      },
      ".cm-gutters": {
        backgroundColor: darkMode ? "#111827" : "#f5f5f5",
        color: darkMode ? "#9ca3af" : "#6b7280",
        border: "none"
      },
      ".cm-activeLineGutter": {
        backgroundColor: darkMode ? "rgba(17, 24, 39, 0.7)" : "rgba(240, 240, 240, 0.8)"
      }
    })
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
  mediaQuery.addEventListener('change', () => {
    // システム設定の変更時にテーマを更新（ユーザー設定がない場合のみ）
    if (!localStorage.getItem('theme')) {
      // 現在のテーマが変更されたら、エディタ要素のスタイルを直接更新
      const newDarkMode = isDarkMode();
      updateEditorStyles(newDarkMode);
    }
  });

  // エディタスタイルを更新する関数（テーマ切り替えボタンからも呼び出せるようにする）
  function updateEditorStyles(darkMode: boolean) {
    const editorElement = document.getElementById("editor");
    
    if (editorElement) {
      if (darkMode) {
        editorElement.style.backgroundColor = "#1f2937";
        editorElement.style.color = "#e5e7eb";
      } else {
        editorElement.style.backgroundColor = "#fff";
        editorElement.style.color = "#000";
      }
    }
    
    // カーソルスタイルも更新
    const cursorElements = document.querySelectorAll(".cm-cursor");
    cursorElements.forEach(cursorEl => {
      if (cursorEl instanceof HTMLElement) {
        if (darkMode) {
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

    // ガター（行番号）のスタイル更新
    const gutterElements = document.querySelectorAll(".cm-gutters");
    gutterElements.forEach(gutterEl => {
      if (gutterEl instanceof HTMLElement) {
        if (darkMode) {
          gutterEl.style.backgroundColor = "#111827";
          gutterEl.style.color = "#9ca3af";
        } else {
          gutterEl.style.backgroundColor = "#f5f5f5";
          gutterEl.style.color = "#6b7280";
        }
      }
    });
    
    // アクティブライン（現在行）のスタイル更新
    const activeLineElements = document.querySelectorAll(".cm-activeLine");
    activeLineElements.forEach(lineEl => {
      if (lineEl instanceof HTMLElement) {
        if (darkMode) {
          lineEl.style.backgroundColor = "rgba(55, 65, 81, 0.5)";
        } else {
          lineEl.style.backgroundColor = "rgba(240, 240, 240, 0.8)";
        }
      }
    });
  }

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
      updateContent,
      updateEditorStyles
    },
    view
  };
}
