import { EditorState, Extension, StateEffect } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLineGutter, scrollPastEnd } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { autocompletion, startCompletion, closeBrackets, completionKeymap } from '@codemirror/autocomplete';
import { javascript } from '@codemirror/lang-javascript';
import { indentOnInput, syntaxHighlighting, defaultHighlightStyle, bracketMatching, foldGutter, HighlightStyle } from '@codemirror/language';
import { search, searchKeymap } from '@codemirror/search';
import { DocumentManager } from './document-manager';
import { moveLineUp, moveLineDown, openReplacePanel } from './keymap-extensions';
import { tags } from '@lezer/highlight';

// ダークモード検出
export const isDarkMode = () => {
  return true; // 常にダークモード（カーソルを水色に）
};

// ダークモード向けのカスタムハイライトスタイルを定義
const darkHighlightStyle = HighlightStyle.define([
  { tag: tags.keyword, color: "#ff79c6" },
  { tag: tags.comment, color: "#6272a4", fontStyle: "italic" },
  { tag: tags.string, color: "#f1fa8c" },
  { tag: tags.function(tags.variableName), color: "#50fa7b" },
  { tag: tags.number, color: "#bd93f9" },
  { tag: tags.operator, color: "#ff79c6" },
  { tag: tags.className, color: "#8be9fd" },
  { tag: tags.propertyName, color: "#66d9ef" },
  { tag: tags.typeName, color: "#8be9fd" },
  { tag: tags.definition(tags.variableName), color: "#50fa7b" },
  { tag: tags.variableName, color: "#f8f8f2" },
  { tag: tags.angleBracket, color: "#ff79c6" },
  { tag: tags.tagName, color: "#ff79c6" },
  { tag: tags.attributeName, color: "#50fa7b" },
  { tag: tags.labelName, color: "#8be9fd" },
  { tag: tags.literal, color: "#bd93f9" },
  { tag: tags.meta, color: "#6272a4" },
  { tag: tags.documentMeta, color: "#6272a4", fontStyle: "italic" },
  { tag: tags.bool, color: "#bd93f9" },
  { tag: tags.null, color: "#bd93f9" },
  { tag: tags.special(tags.variableName), color: "#8be9fd" },
  { tag: tags.special(tags.string), color: "#f1fa8c" },
  { tag: tags.regexp, color: "#f1fa8c" },
  { tag: tags.escape, color: "#ff79c6" }
]);

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
  
  // ハイライト表示の状態を管理する変数
  let highlightEnabled = true;
  
  // シンタックスハイライトの拡張機能を格納する変数
  const syntaxHighlightExtension = syntaxHighlighting(darkHighlightStyle);
  
  // 文字数を更新する関数
  const updateCharacterCount = (content: string) => {
    const charCounter = document.getElementById('chars-count');
    if (charCounter) {
      // 改行を含めた文字数をカウント
      const count = content.length;
      charCounter.textContent = count.toLocaleString();
      
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
  };
  
  // エディタの拡張機能
  let extensions: Extension[] = [
    lineNumbers(),
    highlightActiveLineGutter(),
    history(),
    // 検索・置換機能を追加
    search(),
    // 自動補完の設定
    autocompletion({
      activateOnTyping: true, // タイプ中にアクティブ化
      maxRenderedOptions: 10, // 表示される最大オプション数
      override: [
        // カスタム補完ソース - 単語補完
        context => {
          // 現在のエディタ内容から単語を抽出して提案
          const word = context.matchBefore(/\w+/);
          if (!word && !context.explicit) return null;
          
          // エディタのテキスト全体から単語を抽出
          const text = context.state.doc.toString();
          const words = new Set<string>();
          
          // 文字列から単語を抽出（3文字以上の単語のみ）
          const wordRegex = /\w{3,}/g;
          let match;
          while ((match = wordRegex.exec(text)) !== null) {
            words.add(match[0]);
          }
          
          return {
            from: word ? word.from : context.pos,
            options: Array.from(words).map(label => ({
              label,
              type: "text"
            })),
            span: /\w*/
          };
        }
      ]
    }),
    // 閉じ括弧の自動挿入
    closeBrackets(),
    // 括弧のマッチング表示
    bracketMatching(),
    // インデント検出
    indentOnInput(),
    // シンタックスハイライト（ダークモード向けのカスタムスタイル）
    syntaxHighlightExtension,
    // コード折りたたみ
    foldGutter(),
    // 言語サポート（JavaScript構文）
    javascript(),
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      ...completionKeymap,
      ...searchKeymap,
      // カスタムキーマップを追加
      { key: "Alt-ArrowUp", run: moveLineUp },
      { key: "Alt-ArrowDown", run: moveLineDown },
      // 検索・置換パネルを開くキーバインド（Windows/Linux: Ctrl+Shift+F, Mac: Cmd+Shift+F）
      { key: "Mod-Shift-f", run: openReplacePanel },
      // 自動補完のキーマップも追加
      { key: "Ctrl-Space", run: startCompletion }
    ]),
    EditorView.updateListener.of(update => {
      if (update.docChanged) {
        // ドキュメントが変更されたら保存
        const content = update.state.doc.toString();
        documentManager.saveCurrentDocument(content);
        
        // 文字数カウンターを更新
        updateCharacterCount(content);
        
        // ミニマップを更新
        try {
          const event = new CustomEvent('editor-content-changed', { detail: { view: update.view } });
          document.dispatchEvent(event);
        } catch (error) {
          console.error('ミニマップの更新中にエラーが発生しました:', error);
        }
      }
      
      // 検索パネルを上部に調整
      setTimeout(() => {
        const searchPanel = document.querySelector('.cm-search');
        if (searchPanel && !searchPanel.classList.contains('float-panel-adjusted')) {
          searchPanel.classList.add('float-panel-adjusted');
          // 明示的に上部に配置と背景色を設定
          if (searchPanel instanceof HTMLElement) {
            searchPanel.style.top = '50px';
            searchPanel.style.position = 'fixed';
            searchPanel.style.backgroundColor = 'white';
            
            // すべての子要素にも白背景を適用
            const elements = searchPanel.querySelectorAll('*');
            elements.forEach(el => {
              if (el instanceof HTMLElement) {
                if (el.tagName === 'BUTTON') {
                  el.style.backgroundColor = '#f0f0f0';
                  el.style.color = '#333';
                } else {
                  el.style.backgroundColor = 'white';
                  el.style.color = '#333';
                }
              }
            });
          }
        }
        
        // ツールチップやポップアップメニューもフロート表示に調整
        const tooltips = document.querySelectorAll('.cm-tooltip');
        tooltips.forEach(tooltip => {
          if (!tooltip.classList.contains('float-tooltip-adjusted')) {
            tooltip.classList.add('float-tooltip-adjusted');
          }
        });
      }, 0);
    }),
    // スムーススクロール設定と横スクロール改善
    EditorView.theme({
      "&": {
        scrollBehavior: "smooth", // スムーススクロールを有効化
        scrollbarWidth: "thin",   // スクロールバーを細くする
        overscrollBehavior: "none" // オーバースクロールを無効化
      },
      ".cm-scroller": {
        overflow: "auto",
        scrollbarWidth: "thin",
        scrollBehavior: "smooth",
        overscrollBehavior: "none",
        touchAction: "pan-y pan-x", // 縦横両方のスクロールを許可
        willChange: "scroll-position", // スクロール性能の最適化
        "-webkit-overflow-scrolling": "touch" // iOSでのスムーススクロール
      },
      ".cm-content": {
        minWidth: "fit-content" // 長い行をスクロールできるよう確保
      }
    }),
    // 長い行の水平スクロールを安定させるためのスタイル設定
    EditorView.theme({
      "&": {
        maxWidth: "none", // エディタ自体の最大幅の制限をなくす
      },
      ".cm-line": {
        overflowX: "auto", // 長い行のスクロールを許可
        whiteSpace: "pre" // スペースと改行を保持
      }
    }),
    // スクロールパストエンド（ドキュメント末尾以降もスクロール可能に）
    scrollPastEnd(),
    darkTheme,
    waterCursorTheme,
    EditorView.contentAttributes.of({style: "caret-color: #38bdf8;"}),
    // iPad/タブレット向けのタッチ操作最適化
    EditorView.domEventHandlers({
      touchstart(event, view) {
        console.log('エディタのタッチイベント開始');
        // マルチタッチ操作の処理（ピンチズームなど）を防止
        if (event.touches.length > 1) {
          event.preventDefault();
        }
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
            
            // ビューの更新をリクエスト（スクロール処理を安定させる）
            view.requestMeasure();
          } catch (error) {
            console.error('タッチスクロール中のイベント発火エラー:', error);
          }
        }
        return false; // イベントを伝搬させる
      },
      // スクロールイベントの追加
      scroll(event, view) {
        // スクロール処理を安定させるため、ビューの更新をリクエスト
        view.requestMeasure();
        return false;
      },
      // 検索パネルの表示時にスクロールを防止
      focusin(event, view) {
        if (event.target instanceof HTMLElement && 
            (event.target.closest('.cm-search') || 
             event.target.closest('.cm-tooltip'))) {
          // フォーカス時のスクロールを防止
          setTimeout(() => {
            view.scrollDOM.scrollIntoView();
          }, 0);
        }
        return false;
      }
    }),
    // メニューを考慮した下部の余白を追加
    EditorView.theme({
      ".cm-scroller": {
        paddingBottom: "60px", // メニューの高さを考慮した余白
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

  // ハイライト切り替えボタンのイベントリスナーを設定
  document.addEventListener('DOMContentLoaded', () => {
    const toggleHighlightBtn = document.getElementById('toggle-highlight-btn');
    if (toggleHighlightBtn) {
      toggleHighlightBtn.classList.add('active');
      
      toggleHighlightBtn.addEventListener('click', () => {
        highlightEnabled = !highlightEnabled;
        
        // ボタンの外観を更新
        if (highlightEnabled) {
          toggleHighlightBtn.classList.add('active');
          toggleHighlightBtn.classList.remove('inactive');
        } else {
          toggleHighlightBtn.classList.add('inactive');
          toggleHighlightBtn.classList.remove('active');
        }
        
        // ハイライトスタイルを切り替え
        const currentExtensions = view.state.facet(EditorView.contentAttributes);
        
        if (highlightEnabled) {
          // ハイライトを有効化
          const transaction = view.state.update({
            effects: StateEffect.appendConfig.of(syntaxHighlighting(darkHighlightStyle))
          });
          view.dispatch(transaction);
        } else {
          // ハイライトを無効化 - 全ての設定を再構築
          const filteredExtensions = extensions.filter(ext => 
            ext !== syntaxHighlightExtension
          );
          
          const transaction = view.state.update({
            effects: StateEffect.reconfigure.of(filteredExtensions)
          });
          view.dispatch(transaction);
        }
      });
    }
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
    
    // 文字数カウンターも更新
    updateCharacterCount(content);
  };

  return {
    editor: {
      updateContent
    },
    view
  };
}
