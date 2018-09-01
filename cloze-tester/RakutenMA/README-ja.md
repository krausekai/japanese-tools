# Rakuten MA

[English README (英語ドキュメント)](https://github.com/rakuten-nlp/rakutenma/blob/master/README.md)

## はじめに

Rakuten MA (mophological analyzer; 形態素解析器) は、100% JavaScript で書かれた、日本語・中国語用の形態素解析（単語の分かち書き＋品詞付与）ツールです。

注：分かち書き、品詞、原形付与を総称して形態素解析と呼ぶため、Rakuten MA は正確には形態素解析器ではありませんが、日本語圏における分かりやすさを優先してこの名称を使っています。

Rakuten MA には、以下のような特徴があります：
  - 100% JavaScript による実装。ほとんどのブラウザや Node.js 上で動きます。
  - 言語非依存の文字単位タグ付けモデルを採用。日本語・中国語の単語の分かち書きおよび品詞付与ができます。
  - オンライン機械学習  (Soft Confidence Weighted, Wang et al. ICML 2012) を使い、解析モデルの差分アップデートが可能。
  - 素性セットのカスタマイズが可能。
  - モデルサイズ削減のため、素性ハッシング、量子化、フィルタリングをサポート。
  - 一般分野のコーパス (BCCWJ [Maekawa 2008] と CTB [Xue et al. 2005]) およびネットショッピング分野のコーパスから学習したモデルを同梱。

## デモ

[こちらのページ](http://rakuten-nlp.github.io/rakutenma/) から、Rakuten MA のデモを試すことができます。 (読み込みに少し時間がかかります)

## 使い方

### ダウンロードとインストール

Rakuten MA は JavaScript のライブラリなため、インストールの必要はありません。以下のように、Git リポジトリをクローンするか、

    git clone https://github.com/rakuten-nlp/rakutenma.git

zip アーカイブを以下からダウンロードしてください。 https://github.com/rakuten-nlp/rakutenma/archive/master.zip

Node.js がインストールされていれば、以下のコマンドでデモを動かすことができます（内容は以下の使用例と同じです）

    node demo.js

### npm パッケージ

Rakuten MA を npm パッケージとして使うこともできます。以下のコマンドでインストールできます。

    npm install rakutenma

モデルファイルは、`node_modules/rakutenma/` に格納されています。

### Node.js における使用例

    // RakutenMA デモ

    // 必要なライブラリをロード
    var RakutenMA = require('./rakutenma');
    var fs = require('fs');

    // Rakuten MA のインスタンスを初期化
    // (空のモデルと、日本語のデフォルト素性セットを使用)
    var rma = new RakutenMA();
    rma.featset = RakutenMA.default_featset_ja;

    // サンプル文を解析 (from http://tatoeba.org/jpn/sentences/show/103809)
    // → モデルが空のため、文字がバラバラになってしまい、正確な分かち書きができない
    console.log(rma.tokenize("彼は新しい仕事できっと成功するだろう。"));

    // tatoeba.com から10文をモデルに与えて学習
    var tatoeba = JSON.parse(fs.readFileSync("tatoeba.json"));
    for (var i = 0; i < 10; i ++) {
        rma.train_one(tatoeba[i]);
    }

    // 再度解析 → 結果が少し改善
    console.log(rma.tokenize("彼は新しい仕事できっと成功するだろう。"));

    // Rakuten MA インスタンスを、学習済みモデルを使って初期化
    var model = JSON.parse(fs.readFileSync("model_ja.json"));
    rma = new RakutenMA(model, 1024, 0.007812);  // SCW のハイパーパラメータを指定
    rma.featset = RakutenMA.default_featset_ja;

    // 素性ハッシング関数 (15bit) を指定
    rma.hash_func = RakutenMA.create_hash_func(15);

    // サンプル文を解析
    console.log(rma.tokenize("うらにわにはにわにわとりがいる"));

    // 望む解析結果 ([トークン, 品詞タグ]の列) を与えて再学習
    var res = rma.train_one(
            [["うらにわ","N-nc"],
             ["に","P-k"],
             ["は","P-rj"],
             ["にわ","N-n"],
             ["にわとり","N-nc"],
             ["が","P-k"],
             ["いる","V-c"]]);
    // train_one() の戻り値のプロパティ：
    //   sys: 現在のモデルに基づくシステムの出力
    //   ans: ユーザの与えた正解
    //   update: モデルが更新されたかどうかのフラグ
    console.log(res);

    // 再度解析 → 今度は解析結果が完璧に！
    console.log(rma.tokenize("うらにわにはにわにわとりがいる"));

### ブラウザ上での使用例

以下のコードを、HTML の `<head>` の中に埋め込んでください。

    <script type="text/javascript" src="rakutenma.js" charset="UTF-8"></script>
    <script type="text/javascript" src="model_ja.js" charset="UTF-8"></script>
    <script type="text/javascript" src="hanzenkaku.js" charset="UTF-8"></script>
    <script type="text/javascript" charset="UTF-8">
      function Segment() {

        rma = new RakutenMA(model);
        rma.featset = RakutenMA.default_featset_ja;
        rma.hash_func = RakutenMA.create_hash_func(15);

        var textarea = document.getElementById("input");
        var result = document.getElementById("output");
        var tokens = rma.tokenize(HanZenKaku.hs2fs(HanZenKaku.hw2fw(HanZenKaku.h2z(textarea.value))));

        result.style.display = 'block';
        result.innerHTML = RakutenMA.tokens2string(tokens);
      }

    </script>

解析および結果を表示する部分は以下のようになります：

    <textarea id="input" cols="80" rows="5"></textarea>
    <input type="submit" value="Analyze" onclick="Segment()">
    <div id="output"></div>


### 学習済みモデルを使って日本語・中国語の文を解析

1. 以下のように、学習済みモデルをロード `model = JSON.parse(fs.readFileSync("model_file"));` し、 `rma = new RakutenMA(model);` もしくは `rma.set_model(model);` としてモデルをセットします。
2. `featset` を言語に応じて設定します (例：日本語の場合、`rma.featset = RakutenMA.default_featset_ja;` 中国語の場合、`rma.featset = RakutenMA.default_featset_zh;`)
3. 同梱モデル (`model_zh.json` や `model_ja.json`) を使用する場合、15ビットの素性ハッシング関数をセットすることを忘れずに (`rma.hash_func = RakutenMA.create_hash_func(15);`)
4. `rma.tokenize(input)` を使って、入力文を解析します。

### オリジナルの解析モデルの学習

1. 学習用コーパス ([トークン, 品詞タグ]の配列からなる学習用の文の配列) を準備します。
2. `new RakutenMA()` として Rakuten MA のインスタンスを初期化します。
3. `featset`を (必要に応じて、`ctype_func`, `hash_func`, 等も) セットします。
4. `train_one()` メソッドに、学習用の文を一つずつ与えます。
5. SCW は、通常１エポック（学習コーパスの文を最初から最後まで与えてモデルを学習する繰り返し１回分）後には収束します。ステップ4をさらにもう２，３エポック繰り返すことにより、さらに精度が上がる可能性があります。

オリジナルの解析モデルを学習する場合のサンプルが、`scripts/train_ja.js` (日本語) と `scripts/train_zh.js` (中国語) にありますので、ご参照ください。

### 学習済みモデルの再学習 (分野適応、エラー修正等)

1. 学習済みモデルをロードし、Rakuten MA のインスタンスを初期化します。(上記の「学習済みモデルを使って日本語・中国語の文を解析」を参照)
2. 学習用のデータを用意します。フォーマットは、上記「オリジナルの解析モデルの学習」にて用意した学習用コーパスと同じです。(コーパスのサイズはほんの数文でも構いません。必要なサイズは、再学習する対象や度合いによって変わってきます。)
3. `train_one()` メソッドに、学習用の文を一つずつ与えます。

### モデルサイズの削減

モデルのサイズは (素性ハッシングを使用したとしても) 再配布してクライアント側で使用するにはまだ大きすぎることがあります。
素性量子化を適用するスクリプト `scripts/minify.js` を使用して、学習したモデルのサイズを削減することができます
(詳細については、論文 [Hagiwara and Sekine COLING 2014] を参照してください。)

このスクリプトは、`node scripts/minify.js [入力モデルファイル] [出力モデルファイル]` として実行すると、minify されたモデルファイルを書き出します。*注意* このスクリプトは、学習された SCW の "sigma部" も削除してしまうため、一度 minify されたモデルを再学習することはできません。必要であれば、モデルを再学習した後、minify してください。

## API ドキュメント

| コンストラクタ                 | 説明                                        |
| ----------------------------| ------------------------------------------- |
| `RakutenMA(model, phi, c)`    | 新たな Rakuten MA のインスタンスを作成します。`model` (省略可) には、Rakuten MA のインスタンスを初期化する際にセットするモデルを指定します。`phi` と `c` (どちらも省略可) は、SCW のハイパーパラメータです。 (デフォルト値: `phi = 2048`, `c = 0.003906`).  |


| メソッド                     | 説明                                         |
| ----------------------------| ------------------------------------------- |
| `tokenize(input)`           | `input` (string) をトークナイズし、結果 ([トークン, 品詞タグ] の配列)を返します。 |
| `train_one(sent)`           | 現在のモデルを、与えられた正解 `sent` ([トークン, 品詞タグ] の配列) を用いて (必要に応じて) 更新します。返り値は、以下の３つのプロパティを持つオブジェクトです。`ans` は、与えられた正解で、`sent` と同一です。`sys` は、更新前のモデルを使って求められたシステムの出力です。`updated` は、`sys` と `ans` が異なるため、モデルが更新されたかどうかを示すブール値のフラグです。 |
| `set_model(model)`          | Rakuten MA のインスタンスのモデルを `model` にセットします。 |
| `set_tag_scheme(scheme)`    | 系列ラベリングのタグスキームを設定します。現在のところ、`"IOB2"` と `"SBIEO"` に対応しています。それ以外のスキームを設定すると例外が発生します。 |

| プロパティ                   | 説明                                 |
| ----------------------------| ------------------------------------------- |
| `featset`                   | 解析に使われる素性テンプレート(文字列型) の配列を設定します。日本語と中国語のデフォルト素性セットについては、それぞれ `RakutenMA.default_featset_ja` と `RakutenMA.default_featset_zh` を使うことができます。素性テンプレートの詳細については、以下 「対応している素性テンプレート」を参照してください。 |
| `ctype_func`                | 文字から文字種へと変換する関数を指定します。日本語のデフォルトの文字種関数は `RakutenMA.ctype_ja_default_func` です。もしくは、`RakutenMA.create_ctype_chardic_func(chardic)` を使い、文字種辞書 `chardic` を参照して文字種を返す関数を作成することができます。(例えば、`f = RakutenMA.create_ctype_chardic_func({"A": "type1"})` とすると、`f("A")` に対して `"type1"` を返し、それ以外には `[]` を返すような関数 `f` を作ることができます。)|
| `hash_func`                 | 素性ハッシングに使うハッシュ関数を指定します。デフォルト値は `undefined` (素性ハッシングを使用しない) です。`RakutenMA.create_hash_func(bit)` とすると、`bit` ビットのハッシュサイズを持つ素性ハッシング関数を作ることができます。|


## 利用規約・ライセンス

Rakuten MA は Apache License version 2.0 http://www.apache.org/licenses/LICENSE-2.0.html の元で公開されています。
本ライセンスに従う限り、Rakuten MA の再配布、変更、研究/商用利用は自由に行っていただいて構いません。

研究目的で Rakuten MA を使用する場合、Rakuten MA の論文 [Hagiwara and Sekine 2014] を引用してください。

## よくある質問

Q. 対応しているブラウザと Node.js のバージョンは？

 - A. Rakuten MA は、以下の環境で動作することを確認しています。
  - Internet Explorer 8 (バージョン 8.0.7601.17414 以上)
  - Google Chrome (バージョン 35.0.1916.153 以上)
  - Firefox (バージョン 16.0.2 以上)
  - Safari (バージョン 6.1.5 以上)
  - Node.js (バージョン 0.10.13 以上)

Q. 商用利用はできますか？
- A. 利用規約・ライセンスに従う限り、商用利用は許可されています。詳細については、上記「利用規約・ライセンス」を参照してください。

Q. バグ・解析誤り・etc. を見つけました。どこに報告すれば良いですか？
- A. Github issues https://github.com/rakuten-nlp/rakutenma/issues から issue を作成してください。
- もしくは、コードを修正し、pull request を作成してください。Rakuten MA には、Jasmine http://jasmine.github.io/ を使ったテストスイートが付随しています。pull request を出す前に、全てのテストが通る (`jasmine-node spec` を実行した時にエラーが出ない) ことを確認し、必要であれば、追加のテストを書いてください。
- それでも問題が解決しなければ、prj-rakutenma [at] mail.rakuten.com までお問い合わせください。

Q. 解析結果がおかしい (特に、１文字ごとにバラバラになってしまい、品詞タグが出力されない)
- A. 学習した時と同じ素性セット (`featset`) と素性ハッシング関数 (`hash_func`) を正しく設定しているか確認してください。同梱のモデル (`model_ja.json` と `model_zh.json`) を使う場合、15ビットの素性ハッシング関数を必ず設定してください (`rma.hash_func = RakutenMA.create_hash_func(15);`)。

Q. 中国語のどの字体 (簡体字/繁体字) に対応していますか？
- A. 現在、簡体字中国語のみに対応しています。

Q. JSON フォーマットの同じモデルファイルをブラウザ上でも使えますか？
- A. はい。ただし、ブラウザ上で使う場合は、代入 (例: `var model = [JSON 表現];`) を追加する必要があります。 `model_ja.json` (Node.js用) と `model_ja.js` (ブラウザ用) の違いが参考になると思います。このように変換するスクリプト `scripts/convert_for_browser.js` を用意しました。通常は、モデルの学習などは Node.js 上で行い、ブラウザ上で使用するためにminify・変換するのがオススメです。

## 付録

### 対応している素性テンプレート

| 素性テンプレート    | 説明                           |
| ---------------- | ----------------------------- |
| w7               | 文字ユニグラム (c-3)       |
| w8               | 文字ユニグラム (c-2)       |
| w9               | 文字ユニグラム (c-1)       |
| w0               | 文字ユニグラム (c0)        |
| w1               | 文字ユニグラム (c+1)       |
| w2               | 文字ユニグラム (c+2)       |
| w3               | 文字ユニグラム (c+3)       |
| c7               | 文字種ユニグラム (t-3)       |
| c8               | 文字種ユニグラム (t-2)       |
| c9               | 文字種ユニグラム (t-1)       |
| c0               | 文字種ユニグラム (t0)        |
| c1               | 文字種ユニグラム (t+1)       |
| c2               | 文字種ユニグラム (t+2)       |
| c3               | 文字種ユニグラム (t+3)       |
| b7               | 文字バイグラム (c-3 c-2)       |
| b8               | 文字バイグラム (c-2 c-1)       |
| b9               | 文字バイグラム (c-1 c0)       |
| b1               | 文字バイグラム (c0 c+1)       |
| b2               | 文字バイグラム (c+1 c+2)       |
| b3               | 文字バイグラム (c+2 c+3)       |
| d7               | 文字種バイグラム (t-3 t-2)       |
| d8               | 文字種バイグラム (t-2 t-1)       |
| d9               | 文字種バイグラム (t-1 t0)       |
| d1               | 文字種バイグラム (t0 t+1)       |
| d2               | 文字種バイグラム (t+1 t+2)       |
| d3               | 文字種バイグラム (t+2 t+3)       |
| その他            | `featset` の配列に文字列ではなく関数 `f` を含めた場合、その関数は各文字ごとに２つの引数、`_t` と `i` とともに呼ばれます。ここで、`_t` は、位置 `j` を与えるとその位置の文字オブジェクトを返す関数であり、`i` は現在の位置を表します。文字オブジェクトには、`c` (文字) と `t` (文字種) の２つのプロパティがあります。この関数 `f` の戻り値が、素性の値として使われます。(例えば、中身が `returns _t(i).t;` だけの関数 `f(_t, i)` を指定した場合、それは現在位置の文字種を返していることになり、素性テンプレート `c0` と同等になります。)|

### 中国語品詞リスト

説明については、Chinese Treebank の英語表記そのままです。

| タグ  | 説明      |
| ---  | ---------------- |
| AD   | Adverb           |
| AS   | Aspect Particle  |
| BA   | ba3 (in ba-construction) |
| CC   | Coordinating conjunction |
| CD   | Cardinal number  |
| CS   | Subordinating conjunction |
| DEC  | de5 (Complementizer/Nominalizer) |
| DEG  | de5 (Genitive/Associative) |
| DER  | de5 (Resultative) |
| DEV  | de5 (Manner) |
| DT   | Determiner |
| ETC  | Others |
| FW   | Foreign word |
| IJ   | Interjection |
| JJ   | Other noun-modifier |
| LB   | bei4 (in long bei-construction) |
| LC   | Localizer |
| M    | Measure word |
| MSP  | Other particle |
| NN   | Other noun |
| NN-SHORT | Other noun (abbrev.) |
| NR   | Proper noun |
| NR-SHORT | Proper noun (abbrev.) |
| NT   | Temporal noun |
| NT-SHORT | Temporal noun (abbrev.) |
| OD   | Ordinal number |
| ON   | Onomatopoeia |
| P    | Preposition |
| PN   | Pronoun |
| PU   | Punctuation |
| SB   | bei4 (in short bei-construction) |
| SP   | Sentence-final Particle |
| URL  | URL |
| VA   | Predicative adjective |
| VC   | Copula |
| VE   | you3 (Main verb) |
| VV   | Other verb |
| X    | Others |

### 日本語品詞リストと対応する BCCWJ の品詞名

| タグ  | 対応する BCCWJ 品詞名 |
| ---  | ---------------- |
| A-c  | 形容詞-一般       |
| A-dp | 形容詞-非自立可能  |
| C    | 接続詞            |
| D    | 代名詞            |
| E    | 英単語            |
| F    | 副詞              |
| I-c  | 感動詞-一般        |
| J-c  | 形状詞-一般        |
| J-tari | 形状詞-タリ      |
| J-xs | 形状詞-助動詞語幹   |
| M-aa | 補助記号-AA        |
| M-c  | 補助記号-一般      |
| M-cp | 補助記号-括弧閉    |
| M-op | 補助記号-括弧開    |
| M-p  | 補助記号-句点      |
| N-n  | 名詞-名詞的        |
| N-nc | 名詞-普通名詞      |
| N-pn | 名詞-固有名詞      |
| N-xs | 名詞-助動詞語幹    |
| O    | その他            |
| P    | 接頭辞             |
| P-fj | 助詞-副助詞        |
| P-jj | 助詞-準体助詞      |
| P-k  | 助詞-格助詞        |
| P-rj | 助詞-係助詞        |
| P-sj | 助詞-接続助詞      |
| Q-a  | 接尾辞-形容詞的    |
| Q-j  | 接尾辞-形状詞的    |
| Q-n  | 接尾辞-名詞的      |
| Q-v  | 接尾辞-動詞的      |
| R    | 連体詞            |
| S-c  | 記号-一般         |
| S-l  | 記号-文字         |
| U    | URL              |
| V-c  | 動詞-一般         |
| V-dp | 動詞-非自立可能    |
| W    | 空白              |
| X    | 助動詞            |

## 謝辞

本プロジェクトに対してご協力いただいた、関根 聡、丸元 聡子、吉本 陽一、新里 圭司、八重樫 恵太、益子 宗（敬称略）の各氏に感謝いたします。

## 参考文献

Masato Hagiwara and Satoshi Sekine. Lightweight Client-Side Chinese/Japanese Morphological Analyzer Based on Online Learning. COLING 2014 Demo Session, pages 39-43, 2014. [[PDF](http://anthology.aclweb.org/C/C14/C14-2009.pdf)]

Kikuo Maekawa. Compilation of the Kotonoha-BCCWJ corpus (in Japanese). Nihongo no kenkyu (Studies in Japanese), 4(1):82–95, 2008.

Jialei Wang, Peilin Zhao, and Steven C. Hoi. Exact soft confidence-weighted learning. In Proc. of ICML 2012, pages 121–128, 2012. [[PDF](http://icml.cc/2012/papers/86.pdf)]

Naiwen Xue, Fei Xia, Fu-dong Chiou, and Marta Palmer. The Penn Chinese treebank: Phrase structure
annotation of a large corpus. Natural Language Engineering, 11(2):207–238, 2005. [[PDF](http://verbs.colorado.edu/~mpalmer/papers/ctb.pdf)] [[Site](https://catalog.ldc.upenn.edu/LDC2010T07)]

---

&copy; 2014, 2015 Rakuten NLP Project. All Rights Reserved. / Sponsored by [Rakuten, Inc.](http://global.rakuten.com/corp/) and [Rakuten Institute of Technology](http://rit.rakuten.co.jp/).
