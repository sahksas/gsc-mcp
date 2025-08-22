# Google Search Console MCP Server

Google Search Console API を MCP (Model Context Protocol) サーバーとして提供します。

## 機能

- **サイト管理**: 登録サイトの一覧取得と詳細情報
- **検索分析**: クエリ、ページ、デバイス別のパフォーマンスデータ
- **サイトマップ管理**: 送信、削除、ステータス確認
- **URL検査**: インデックス状況、モバイルユーザビリティ、リッチリザルト

## セットアップ

### 1. Google Cloud Console 設定

#### 1-1. プロジェクトの作成
1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. Google アカウントでログイン
3. プロジェクトセレクター → 「新しいプロジェクト」をクリック
4. プロジェクト名を入力（例: `gsc-mcp-project`）
5. 「作成」をクリック

#### 1-2. Search Console API の有効化
1. 左メニュー → 「APIとサービス」→「ライブラリ」
2. 検索ボックスに「Search Console API」と入力
3. 「Google Search Console API」をクリック
4. 「有効にする」ボタンをクリック

#### 1-3. サービスアカウントの作成と認証情報のダウンロード
1. 左メニュー → 「APIとサービス」→「認証情報」
2. 上部の「+ 認証情報を作成」→「サービスアカウント」
3. サービスアカウントの詳細を入力:
   - サービスアカウント名: `gsc-mcp-service`
   - サービスアカウントID: 自動生成される
   - 「作成して続行」をクリック
4. ロールの選択: スキップして「続行」
5. 「完了」をクリック
6. 作成したサービスアカウントをクリック
7. 「キー」タブを選択
8. 「鍵を追加」→「新しい鍵を作成」
9. キーのタイプ: **JSON** を選択
10. 「作成」をクリック → **credentials.json が自動的にダウンロードされます**

#### 1-4. Search Console でアクセス権限を付与
1. [Google Search Console](https://search.google.com/search-console) にアクセス
2. 対象サイトを選択
3. 左メニュー → 「設定」
4. 「ユーザーと権限」
5. 「ユーザーを追加」をクリック
6. サービスアカウントのメールアドレスを入力:
   - 形式: `gsc-mcp-service@プロジェクトID.iam.gserviceaccount.com`
   - メールアドレスは JSON ファイル内の `client_email` フィールドに記載
7. 権限レベル: 「フル」または「制限付き」を選択
8. 「追加」をクリック

### 2. 認証設定

プロジェクトのルートに認証情報を配置：
```bash
cp /path/to/service-account-key.json ./credentials.json
```

> ⚠️ **重要**: `credentials.json` は `.gitignore` に登録済みのため、誤ってコミットされることはありません

### 3. 利用方法

#### 方法1: GitMCP 経由（推奨）

プロジェクトのルートに `.mcp.json` を作成：

```json
{
  "mcpServers": {
    "gsc-mcp": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "https://gitmcp.io/sahksas/gsc-mcp"
      ],
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "./credentials.json"
      }
    }
  }
}
```

#### 方法2: ローカル実行

このリポジトリをクローンした場合：

```json
{
  "mcpServers": {
    "gsc-mcp": {
      "command": "npx",
      "args": ["tsx", "/path/to/gsc-mcp/src/index.ts"],
      "cwd": "/path/to/gsc-mcp",
      "env": {
        "GOOGLE_APPLICATION_CREDENTIALS": "/path/to/credentials.json"
      }
    }
  }
}
```

> 💡 **注意**: `.mcp.json` を使用する場合、初回は Claude Code でプロンプトが表示されるので「承認」を選択してください

## 利用可能なツール

### 基本機能

| ツール | 説明 | パラメータ |
|-------|------|------------|
| `list_sites` | サイト一覧取得 | - |
| `get_site` | サイト情報取得 | `siteUrl` |
| `add_site` | サイト追加 | `siteUrl` |
| `delete_site` | サイト削除 | `siteUrl` |

### 検索分析

| ツール | 説明 | パラメータ |
|-------|------|------------|
| `query_search_analytics` | 基本的な検索分析 | `siteUrl`, `startDate`, `endDate`, `dimensions?`, `metrics?` |
| `query_search_analytics_advanced` | 高度な検索分析（フィルター、検索タイプ） | `siteUrl`, `startDate`, `endDate`, `searchType?`, `dataState?`, `filters?` |

### サイトマップ管理

| ツール | 説明 | パラメータ |
|-------|------|------------|
| `list_sitemaps` | サイトマップ一覧 | `siteUrl` |
| `get_sitemap` | サイトマップ情報 | `siteUrl`, `feedpath` |
| `submit_sitemap` | サイトマップ送信 | `siteUrl`, `feedpath` |
| `delete_sitemap` | サイトマップ削除 | `siteUrl`, `feedpath` |
| `check_sitemap_index_status` | サイトマップのインデックス状況確認 | `siteUrl`, `sitemapUrl` |

### URL検査

| ツール | 説明 | パラメータ |
|-------|------|------------|
| `inspect_url` | 単一URL検査 | `siteUrl`, `inspectionUrl` |
| `batch_inspect_urls` | 複数URL一括検査 | `siteUrl`, `urls[]` |
| `find_non_indexed_urls` | **インデックス未登録URL自動検出** | `siteUrl`, `useSitemaps?`, `sampleSize?`, `checkReasons?` |

### query_search_analytics パラメータ

**dimensions**: `query`, `page`, `country`, `device`, `searchAppearance`, `date`  
**metrics**: `clicks`, `impressions`, `ctr`, `position`

## 使用例

Claude で以下のようなリクエストができます：

### 基本的な使用例
```
「Search Console のサイト一覧を表示して」
「example.com を Search Console に追加して」
「example.com の過去7日間の検索パフォーマンスを分析して」
「example.com のサイトマップを確認して」
```

### 高度な使用例
```
「インデックスされていないURLとその原因を調査して」
→ find_non_indexed_urls が自動的に実行され、以下を行います：
  1. サイトマップのURL取得
  2. 検索分析でインデックス済みURL確認
  3. 差分検出と一括URL検査
  4. 原因別に分類した詳細レポート出力

「複数のURLのインデックス状況を一括で確認して」
「画像検索のパフォーマンスだけをフィルタリングして表示」
「特定のクエリを含む検索データを抽出」
「サイトマップに含まれるURLのインデックス状況を確認」
```

### 🎯 特徴的な機能

**`find_non_indexed_urls`** - インデックス未登録URLの自動検出
- 複数のツールを自動的に組み合わせて効率的に検出
- インデックスされていない原因を自動分析
- 原因別にグループ化された詳細レポート
- 改善提案を含む包括的な分析結果

## トラブルシューティング

- **認証エラー**: サービスアカウントが Search Console に追加されているか確認
- **接続エラー**: `npx mcp-remote` が利用可能か確認
- **パスエラー**: 認証情報のパスが正しいか確認

## ライセンス

MIT