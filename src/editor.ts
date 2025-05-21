import { EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { DocumentManager } from './document-manager';
import { moveLineUp, moveLineDown } from './keymap-extensions';

// エディタの設定と初期化
export function setupEditor(documentManager: DocumentManager) {
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
        updateMinimap(update.view);
      }
    }),
    EditorView.theme({
      "&": {
        height: "100%",
        fontSize: "14px"
      },
      ".cm-content": {
        fontFamily: "'Menlo', 'Monaco', 'Courier New', monospace"
      },
      ".cm-line": {
        padding: "0 4px",
        lineHeight: "1.6"
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

  // ミニマップの更新
  function updateMinimap(view: EditorView) {
    const minimapEl = document.getElementById("minimap");
    if (!minimapEl) return;
    
    // 実装はminimap.tsで行う
    const event = new CustomEvent('editor-content-changed', { detail: { view } });
    document.dispatchEvent(event);
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
      updateContent
    },
    view
  };
}
