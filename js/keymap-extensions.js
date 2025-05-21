// 行を上に移動するコマンド
export const moveLineUp = (view) => {
    const { state, dispatch } = view;
    const changes = [];
    const { doc } = state;
    // 選択範囲がない場合は現在の行を対象にする
    let { from, to } = state.selection.main;
    // 選択範囲の開始位置と終了位置を行の境界に調整
    const fromLine = doc.lineAt(from);
    const toLine = doc.lineAt(to);
    from = fromLine.from;
    to = toLine.to;
    // 最初の行なら何もしない
    if (fromLine.number === 1)
        return false;
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
export const moveLineDown = (view) => {
    const { state, dispatch } = view;
    const changes = [];
    const { doc } = state;
    // 選択範囲がない場合は現在の行を対象にする
    let { from, to } = state.selection.main;
    // 選択範囲の開始位置と終了位置を行の境界に調整
    const fromLine = doc.lineAt(from);
    const toLine = doc.lineAt(to);
    from = fromLine.from;
    to = toLine.to;
    // 最後の行なら何もしない
    if (toLine.number === doc.lines)
        return false;
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
