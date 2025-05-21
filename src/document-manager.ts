import Dexie from 'dexie';

// ドキュメントのインターフェース（仕様書と同じ）
interface Document {
  id: string;
  title: string;
  content: string;
  lastModified: Date;
  created: Date;
}

// Dexieを使用したIndexedDBラッパー
class DocumentDatabase extends Dexie {
  documents: Dexie.Table<Document, string>;

  constructor() {
    super('VastTextDatabase');
    this.version(1).stores({
      documents: 'id, title, lastModified, created'
    });
    this.documents = this.table('documents');
  }
}

// ドキュメント管理クラス
export class DocumentManager {
  private db: DocumentDatabase;
  private currentDocumentId: string | null = null;
  private documents: Array<{ id: string, title: string, content: string }> = [];

  constructor() {
    this.db = new DocumentDatabase();
  }

  // データベースの初期化
  async initialize(): Promise<void> {
    try {
      // データベース接続を確認
      await this.db.open();
      console.log('データベースに接続しました');
      
      // ドキュメント数を確認
      const count = await this.db.documents.count();
      console.log(`${count}件のドキュメントが存在します`);
      
      if (count === 0) {
        console.log('初期ドキュメントを作成します');
        await this.createNewDocument('ようこそ', 'Vast-Text Editorへようこそ！\n\nこのエディタは大量のテキストをスムーズに編集できるように設計されています。\n\n特徴：\n- 軽量かつ高速\n- インライン行ナビゲーター\n- ローカルストレージでのデータ保存\n\n左側のサイドバーから新しいドキュメントを作成したり、既存のドキュメントを開いたりできます。');
      }
    } catch (error) {
      console.error('データベースの初期化中にエラーが発生しました:', error);
      throw error;
    }
  }

  // 新しいドキュメントの作成
  async createNewDocument(title: string = '新しいドキュメント', content: string = ''): Promise<string> {
    const id = `doc_${Date.now()}`;
    const now = new Date();
    
    const newDoc: Document = {
      id,
      title,
      content,
      created: now,
      lastModified: now
    };
    
    try {
      await this.db.documents.add(newDoc);
      this.currentDocumentId = id;
      this.updateDocumentList();
      
      // エディタに内容を反映
      this.notifyContentChanged(content);
      
      // 最後に開いたドキュメントIDを保存
      localStorage.setItem('last-document-id', id);
      
      return id;
    } catch (error) {
      console.error('ドキュメントの作成に失敗しました:', error);
      throw error;
    }
  }

  // ドキュメントの読み込み
  async loadDocument(id: string): Promise<void> {
    try {
      const doc = await this.db.documents.get(id);
      if (doc) {
        this.currentDocumentId = id;
        
        // エディタに内容を反映
        this.notifyContentChanged(doc.content);
        
        // 最後に開いたドキュメントIDを保存
        localStorage.setItem('last-document-id', id);
        
        // UIを更新
        this.highlightCurrentDocument();
      } else {
        console.warn(`ドキュメントが見つかりません: ${id}`);
      }
    } catch (error) {
      console.error('ドキュメントの読み込み中にエラーが発生しました:', error);
    }
  }

  // 現在のドキュメントの保存
  async saveCurrentDocument(content: string): Promise<void> {
    if (!this.currentDocumentId) return;
    
    try {
      await this.db.documents.update(this.currentDocumentId, {
        content,
        lastModified: new Date()
      });
      
      // UIの最終更新日時を更新
      this.updateLastModifiedUI();
    } catch (error) {
      console.error('ドキュメントの保存中にエラーが発生しました:', error);
    }
  }
  
  // 指定した名前でファイルをダウンロード保存
  saveAsFile(content: string, filename: string): void {
    // 拡張子がない場合は .txt を追加
    if (!filename.includes('.')) {
      filename = `${filename}.txt`;
    }
    
    // Blobオブジェクトを作成
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    
    // ダウンロードリンクを作成
    const downloadLink = document.createElement('a');
    downloadLink.href = URL.createObjectURL(blob);
    downloadLink.download = filename;
    
    // 非表示でDOMに追加
    document.body.appendChild(downloadLink);
    
    // リンクをクリック（ダウンロードを開始）
    downloadLink.click();
    
    // 不要になったらDOMから削除
    document.body.removeChild(downloadLink);
    
    // BlobオブジェクトのURLを解放
    URL.revokeObjectURL(downloadLink.href);
  }

  // ドキュメントの削除
  async deleteDocument(id: string): Promise<void> {
    try {
      await this.db.documents.delete(id);
      
      // 現在開いているドキュメントが削除された場合
      if (id === this.currentDocumentId) {
        // 別のドキュメントを開く
        const firstDoc = await this.db.documents.orderBy('lastModified').reverse().first();
        if (firstDoc) {
          this.loadDocument(firstDoc.id);
        } else {
          // ドキュメントがない場合は新規作成
          this.createNewDocument();
        }
      }
      
      // ドキュメントリストを更新
      this.updateDocumentList();
    } catch (error) {
      console.error('ドキュメントの削除中にエラーが発生しました:', error);
    }
  }

  // ドキュメントのタイトル変更
  async updateDocumentTitle(id: string, newTitle: string): Promise<void> {
    try {
      await this.db.documents.update(id, { title: newTitle });
      this.updateDocumentList();
    } catch (error) {
      console.error('ドキュメントタイトルの更新中にエラーが発生しました:', error);
    }
  }

  // ドキュメントリストの更新
  async updateDocumentList(): Promise<void> {
    try {
      const docs = await this.db.documents.orderBy('lastModified').reverse().toArray();
      const listEl = document.getElementById('document-list');
      
      if (!listEl) return;
      
      // リストをクリア
      listEl.innerHTML = '';
      
      // ドキュメント項目を作成
      docs.forEach(doc => {
        const item = document.createElement('div');
        item.className = `document-item ${doc.id === this.currentDocumentId ? 'active' : ''}`;
        item.dataset.id = doc.id;
        item.innerHTML = `
          <div class="flex justify-between items-center">
            <span class="document-title">${doc.title}</span>
            <button class="delete-doc-btn text-red-500 hover:text-red-700">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
          <div class="text-xs text-gray-500">
            ${new Date(doc.lastModified).toLocaleString()}
          </div>
        `;
        
        // クリックイベントを設定
        item.addEventListener('click', (e) => {
          // 削除ボタンがクリックされた場合は伝播しない
          if ((e.target as HTMLElement).closest('.delete-doc-btn')) {
            e.stopPropagation();
            return;
          }
          
          this.loadDocument(doc.id);
        });
        
        // 削除ボタンにイベントを設定
        const deleteBtn = item.querySelector('.delete-doc-btn');
        if (deleteBtn) {
          deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (confirm(`"${doc.title}" を削除してもよろしいですか？`)) {
              this.deleteDocument(doc.id);
            }
          });
        }
        
        listEl.appendChild(item);
      });
    } catch (error) {
      console.error('ドキュメントリストの更新中にエラーが発生しました:', error);
    }
  }

  // 現在のドキュメントをハイライト
  private highlightCurrentDocument(): void {
    const items = document.querySelectorAll('.document-item');
    items.forEach(item => {
      if (item instanceof HTMLElement) {
        if (item.dataset.id === this.currentDocumentId) {
          item.classList.add('active');
        } else {
          item.classList.remove('active');
        }
      }
    });
  }

  // 最終更新日時UIの更新
  private updateLastModifiedUI(): void {
    if (!this.currentDocumentId) return;
    
    const items = document.querySelectorAll('.document-item');
    items.forEach(async item => {
      if (item instanceof HTMLElement && item.dataset.id === this.currentDocumentId) {
        const timeEl = item.querySelector('.text-gray-500');
        if (timeEl) {
          const doc = await this.db.documents.get(this.currentDocumentId);
          if (doc) {
            timeEl.textContent = new Date(doc.lastModified).toLocaleString();
          }
        }
      }
    });
  }

  // エディタの内容変更を通知
  private notifyContentChanged(content: string): void {
    const event = new CustomEvent('document-content-changed', { 
      detail: { content } 
    });
    document.dispatchEvent(event);
  }

  // 特定のIDのドキュメントを取得するメソッド
  getDocument(id: string) {
    return this.documents.find(doc => doc.id === id);
  }
  
  // 現在のドキュメントを取得するメソッド
  getCurrentDocument() {
    if (!this.currentDocumentId) return null;
    return this.documents.find(doc => doc.id === this.currentDocumentId);
  }
}
