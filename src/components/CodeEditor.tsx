'use client';

import { useEffect, useRef, useState } from 'react';
import { EditorState, Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, ViewUpdate } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';
import { Document } from '@/lib/db';

interface CodeEditorProps {
  document: Document;
  onChange: (content: string) => void;
}

export default function CodeEditor({ document, onChange }: CodeEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const [editorHeight, setEditorHeight] = useState<number>(0);
  
  // ミニマップが表示する内容
  const [minimap, setMinimap] = useState<string[]>([]);

  useEffect(() => {
    // ウィンドウリサイズ時にエディタの高さを調整
    const handleResize = () => {
      if (editorRef.current) {
        // 画面の高さの90%をエディタの高さとして設定
        setEditorHeight(window.innerHeight * 0.9);
      }
    };
    
    window.addEventListener('resize', handleResize);
    handleResize();
    
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!editorRef.current) return;
    
    // すでにエディタビューが存在する場合は破棄
    if (viewRef.current) {
      viewRef.current.destroy();
    }
    
    // エディタの初期状態と拡張機能を設定
    const extensions: Extension[] = [
      lineNumbers(),
      history(),
      keymap.of([
        ...defaultKeymap,
        ...historyKeymap,
        // 行の上下移動カスタムキーマップ
        {
          key: 'Alt-ArrowUp',
          run: (view) => {
            // 現在の行を選択して上に移動するロジック
            // 実際の実装はもっと複雑になります
            return true;
          }
        },
        {
          key: 'Alt-ArrowDown',
          run: (view) => {
            // 現在の行を選択して下に移動するロジック
            return true;
          }
        }
      ]),
      EditorView.updateListener.of((update: ViewUpdate) => {
        if (update.docChanged) {
          // ドキュメントが変更されたら親コンポーネントに通知
          const content = update.state.doc.toString();
          onChange(content);
          
          // ミニマップを更新
          updateMinimap(content);
        }
      }),
      EditorView.theme({
        '&': {
          height: `${editorHeight}px`,
          fontFamily: 'var(--font-geist-mono)',
          fontSize: '14px',
        },
        '.cm-content': {
          padding: '10px 0',
        },
        '.cm-line': {
          padding: '0 10px',
        },
        '.cm-activeLineGutter': {
          backgroundColor: 'rgba(0, 0, 0, 0.1)',
        },
        '.cm-activeLine': {
          backgroundColor: 'rgba(0, 0, 0, 0.05)',
        },
      }),
    ];

    // エディタの初期状態を作成
    const state = EditorState.create({
      doc: document.content,
      extensions,
    });

    // エディタビューを作成してDOMに追加
    const view = new EditorView({
      state,
      parent: editorRef.current,
    });

    viewRef.current = view;
    
    // 初期ミニマップを作成
    updateMinimap(document.content);

    return () => {
      if (viewRef.current) {
        viewRef.current.destroy();
      }
    };
  }, [document.content, editorHeight, onChange]);

  // ミニマップを更新する関数
  const updateMinimap = (content: string) => {
    // 行ごとに分割
    const lines = content.split('\n');
    
    // 最大100行までのミニマップを作成（パフォーマンスのため）
    const maxLines = 100;
    const step = lines.length > maxLines ? Math.floor(lines.length / maxLines) : 1;
    
    const minimapLines = [];
    for (let i = 0; i < lines.length; i += step) {
      // 各行を短縮して表示（長すぎる行の場合）
      const line = lines[i];
      minimapLines.push(line.length > 50 ? line.substring(0, 50) + '...' : line);
      
      if (minimapLines.length >= maxLines) break;
    }
    
    setMinimap(minimapLines);
  };

  return (
    <div className="flex h-full w-full">
      {/* メインエディタ */}
      <div 
        ref={editorRef} 
        className="w-full h-full overflow-auto"
      />
      
      {/* ミニマップ */}
      <div className="w-20 h-full overflow-hidden text-xs text-gray-400 bg-gray-50 hidden sm:block">
        {minimap.map((line, index) => (
          <div 
            key={index}
            className="truncate px-1 text-[8px] cursor-pointer hover:bg-gray-200"
            onClick={() => {
              // クリックした行に移動する
              if (viewRef.current) {
                // 実際の行番号を計算（ミニマップがドキュメント全体の縮小版のため）
                const lineCount = document.content.split('\n').length;
                const actualLine = Math.floor((index / minimap.length) * lineCount);
                
                // エディタの対応する行にスクロール
                const position = viewRef.current.state.doc.line(actualLine + 1).from;
                viewRef.current.dispatch({
                  effects: EditorView.scrollIntoView(position, { y: 'center' })
                });
              }
            }}
          >
            {line || ' '}
          </div>
        ))}
      </div>
    </div>
  );
}
