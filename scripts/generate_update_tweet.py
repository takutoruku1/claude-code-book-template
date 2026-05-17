#!/usr/bin/env python3
"""
コミットログをもとに「バズったー」の開発アップデートツイートを生成し、
GITHUB_OUTPUT に書き出す。
"""

import os
import subprocess
import sys
from datetime import datetime, timedelta

import anthropic
import tweepy

GAME_URL = "https://takutoruku1.github.io/claude-code-book-template/buzzutter_v2.html"
HASHTAGS = "#バズったー #インディーゲーム #ゲーム制作"


def get_recent_commits(days: int = 4) -> str:
    since = (datetime.now() - timedelta(days=days)).strftime("%Y-%m-%dT%H:%M:%S")
    result = subprocess.run(
        ["git", "log", f"--since={since}", "--pretty=format:%s", "--no-merges"],
        capture_output=True,
        text=True,
        check=True,
    )
    return result.stdout.strip()


def generate_tweet_fallback(commits: str) -> str:
    """API不使用のフォールバック: 最初のコミットメッセージを使ってテンプレートからツイートを作成する。"""
    first_commit = commits.splitlines()[0][:40]
    body = f"【開発日誌】{first_commit} など、バズったーをアップデートしました！"
    tweet = f"{body}\n{GAME_URL}\n{HASHTAGS}"
    if len(tweet) > 280:
        body = body[:60] + "…"
        tweet = f"{body}\n{GAME_URL}\n{HASHTAGS}"
    return tweet


def generate_tweet(commits: str) -> str:
    try:
        client = anthropic.Anthropic()
        message = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=400,
            messages=[
                {
                    "role": "user",
                    "content": f"""あなたはインディーゲーム「バズったー」（SNSコンサルタントを主人公にしたナラティブゲーム）の開発者です。
以下のgitコミットログをもとに、Xに投稿する開発アップデートツイートを日本語で作成してください。

コミットログ:
{commits}

要件:
- 全体で140文字以内（ハッシュタグ・URL含む）
- ゲームのURLを末尾に含める: {GAME_URL}
- ハッシュタグ: {HASHTAGS}
- 更新内容を1〜2点、具体的かつ簡潔に
- 宣伝口調より「開発日誌」風のトーン
- URLとハッシュタグ以外の本文は80文字程度に収める

ツイート本文のみ出力してください（説明文・前置きは不要）。""",
                }
            ],
        )
        return message.content[0].text.strip()
    except anthropic.BadRequestError as e:
        print(f"Anthropic API エラー（フォールバックへ）: {e}", file=sys.stderr)
        return generate_tweet_fallback(commits)
    except anthropic.AuthenticationError as e:
        print(f"Anthropic API 認証エラー（フォールバックへ）: {e}", file=sys.stderr)
        return generate_tweet_fallback(commits)
    except Exception as e:
        print(f"Anthropic API 予期せぬエラー（フォールバックへ）: {e}", file=sys.stderr)
        return generate_tweet_fallback(commits)


def post_tweet(tweet: str) -> None:
    client = tweepy.Client(
        consumer_key=os.environ["TWITTER_CONSUMER_KEY"],
        consumer_secret=os.environ["TWITTER_CONSUMER_SECRET"],
        access_token=os.environ["TWITTER_ACCESS_TOKEN"],
        access_token_secret=os.environ["TWITTER_ACCESS_TOKEN_SECRET"],
    )
    response = client.create_tweet(text=tweet)
    print(f"投稿完了: tweet_id={response.data['id']}", file=sys.stderr)



def main() -> None:
    commits = get_recent_commits(days=4)

    if not commits:
        print("直近4日間のコミットなし。投稿をスキップします。", file=sys.stderr)
        return

    print(f"コミットログ:\n{commits}\n", file=sys.stderr)

    tweet = generate_tweet(commits)
    char_count = len(tweet)
    print(f"生成ツイート ({char_count}文字):\n{tweet}\n", file=sys.stderr)

    if char_count > 280:
        print(f"警告: {char_count}文字で上限超え。スキップします。", file=sys.stderr)
        return

    post_tweet(tweet)


if __name__ == "__main__":
    main()
