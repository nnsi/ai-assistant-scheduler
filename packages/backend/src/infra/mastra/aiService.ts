import type { Agent } from "@mastra/core/agent";
import type { AgentType, Shop } from "@ai-scheduler/shared";
import { shopListSchema } from "@ai-scheduler/shared";
import type { AiService, UserConditions, SearchResult, StreamEvent } from "../../domain/infra/aiService";
import { logger } from "../../shared/logger";

// JSON配列を括弧のバランスを追跡して抽出する
const extractJsonArray = (text: string, startIndex: number): string | undefined => {
  if (text[startIndex] !== "[") return undefined;

  let depth = 0;
  let inString = false;
  let escapeNext = false;

  for (let i = startIndex; i < text.length; i++) {
    const char = text[i];

    if (escapeNext) {
      escapeNext = false;
      continue;
    }

    if (char === "\\") {
      escapeNext = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "[" || char === "{") {
      depth++;
    } else if (char === "]" || char === "}") {
      depth--;
      if (depth === 0) {
        return text.slice(startIndex, i + 1);
      }
    }
  }

  return undefined;
};

// SearchAgentの出力からJSONブロックをパースする
const parseShopCandidates = (text: string): Shop[] | undefined => {
  let jsonContent: string | undefined;

  // パターン1: ```json:shops ... ``` ブロック
  const jsonShopsMatch = text.match(/```json:shops\s*/);
  if (jsonShopsMatch && jsonShopsMatch.index !== undefined) {
    const contentStart = jsonShopsMatch.index + jsonShopsMatch[0].length;
    const endMatch = text.slice(contentStart).indexOf("```");
    if (endMatch !== -1) {
      jsonContent = text.slice(contentStart, contentStart + endMatch).trim();
    }
  }

  // パターン2: ```json: shops ... ``` ブロック（スペース入り）
  if (!jsonContent) {
    const jsonSpaceShopsMatch = text.match(/```json:\s*shops\s*/);
    if (jsonSpaceShopsMatch && jsonSpaceShopsMatch.index !== undefined) {
      const contentStart = jsonSpaceShopsMatch.index + jsonSpaceShopsMatch[0].length;
      const endMatch = text.slice(contentStart).indexOf("```");
      if (endMatch !== -1) {
        jsonContent = text.slice(contentStart, contentStart + endMatch).trim();
      }
    }
  }

  // パターン3: ```json ... ``` ブロック内のJSON配列
  if (!jsonContent) {
    const jsonBlockMatch = text.match(/```json\s*/);
    if (jsonBlockMatch && jsonBlockMatch.index !== undefined) {
      const contentStart = jsonBlockMatch.index + jsonBlockMatch[0].length;
      const endMatch = text.slice(contentStart).indexOf("```");
      if (endMatch !== -1) {
        const blockContent = text.slice(contentStart, contentStart + endMatch).trim();
        // 配列で始まっているか確認
        if (blockContent.startsWith("[")) {
          jsonContent = blockContent;
        }
      }
    }
  }

  // パターン4: Markdown後の末尾JSON配列（括弧バランスで抽出）
  if (!jsonContent) {
    // 末尾から [ を探して、そこからJSON配列を抽出
    const lastBracket = text.lastIndexOf("\n[");
    if (lastBracket !== -1) {
      const extracted = extractJsonArray(text, lastBracket + 1);
      if (extracted) {
        // 末尾に近いか確認（余分な文字が少ない）
        const afterJson = text.slice(lastBracket + 1 + extracted.length).trim();
        if (afterJson.length < 10) { // 末尾の空白や改行を許容
          jsonContent = extracted;
        }
      }
    }
  }

  if (!jsonContent) {
    // デバッグ: JSONが見つからなかった場合、テキストの末尾を出力
    logger.info("No JSON content found in AI output", {
      category: "ai",
      textLength: text.length,
      lastChars: text.slice(-200),
    });
    return undefined;
  }

  logger.info("Found JSON content", {
    category: "ai",
    jsonLength: jsonContent.length,
    preview: jsonContent.slice(0, 100),
  });

  try {
    const parsed = JSON.parse(jsonContent);
    const result = shopListSchema.safeParse(parsed);
    if (result.success) {
      logger.info("Successfully parsed shop candidates", {
        category: "ai",
        count: result.data.length,
      });
      return result.data;
    }
    logger.warn("Failed to validate shop candidates", {
      category: "ai",
      error: result.error.message,
    });
    return undefined;
  } catch (e) {
    logger.warn("Failed to parse shop candidates JSON", {
      category: "ai",
      error: e instanceof Error ? e.message : String(e),
      jsonPreview: jsonContent.slice(0, 200),
    });
    return undefined;
  }
};

// Markdown出力からJSONブロックを除去する
const removeJsonBlock = (text: string): string => {
  let result = text;

  // パターン1&2: ```json:shops または ```json: shops ブロックを除去
  result = result.replace(/```json:?\s*shops[\s\S]*?```/g, "");

  // パターン3: ```json ブロック（配列を含む場合）を除去
  const jsonBlockMatch = result.match(/```json\s*/);
  if (jsonBlockMatch && jsonBlockMatch.index !== undefined) {
    const contentStart = jsonBlockMatch.index + jsonBlockMatch[0].length;
    const endMatch = result.slice(contentStart).indexOf("```");
    if (endMatch !== -1) {
      const blockContent = result.slice(contentStart, contentStart + endMatch).trim();
      if (blockContent.startsWith("[")) {
        result = result.slice(0, jsonBlockMatch.index) + result.slice(contentStart + endMatch + 3);
      }
    }
  }

  // パターン4: 末尾のJSON配列を除去（括弧バランスで検出）
  const lastBracket = result.lastIndexOf("\n[");
  if (lastBracket !== -1) {
    const extracted = extractJsonArray(result, lastBracket + 1);
    if (extracted) {
      const afterJson = result.slice(lastBracket + 1 + extracted.length).trim();
      if (afterJson.length < 10) {
        result = result.slice(0, lastBracket);
      }
    }
  }

  return result.trim();
};

// 文字列の末尾がパターンの先頭部分と一致する長さを返す
const findPartialMatch = (text: string, pattern: string): number => {
  for (let len = Math.min(text.length, pattern.length - 1); len > 0; len--) {
    if (text.slice(-len) === pattern.slice(0, len)) {
      return len;
    }
  }
  return 0;
};

// ユーザー条件からプロンプト用の文字列を生成（検索用）
const buildConditionsPrompt = (userConditions?: UserConditions): string => {
  if (!userConditions) return "";

  const parts: string[] = [];

  if (userConditions.required.trim()) {
    parts.push(
      `【必須条件（口コミで違反が見つかれば絶対に除外）】: ${userConditions.required}`
    );
  }

  if (userConditions.preferred.trim()) {
    parts.push(`【優先条件（該当する候補を優先表示）】: ${userConditions.preferred}`);
  }

  if (userConditions.subjective.trim()) {
    parts.push(`【重視するポイント（口コミで確認）】: ${userConditions.subjective}`);
  }

  if (parts.length === 0) return "";

  return `\n\nユーザーのこだわり条件:\n${parts.join("\n")}`;
};

// ユーザー条件から除外キーワードのプロンプトを生成（キーワード提案用）
const buildExclusionPrompt = (
  userConditions?: UserConditions,
  excludeKeywords?: string[]
): string => {
  const parts: string[] = [];

  // こだわり条件からの除外
  if (userConditions) {
    const allConditions = [
      userConditions.required,
      userConditions.preferred,
      userConditions.subjective,
    ]
      .filter((c) => c.trim())
      .join("、");

    if (allConditions) {
      parts.push(
        `以下はユーザーが既に設定済みの「こだわり条件」なので、キーワードとして提案しないこと:\n${allConditions}`
      );
    }
  }

  // 前回提案済みキーワードからの除外（再生成時）
  if (excludeKeywords && excludeKeywords.length > 0) {
    parts.push(
      `以下は既に提案済みのキーワードなので、同じものや類似のものは提案しないこと:\n${excludeKeywords.join("、")}`
    );
  }

  if (parts.length === 0) return "";

  return `\n\n【除外】\n${parts.join("\n\n")}`;
};

// エージェントタイプに応じたセクションタイトル
const getAgentSectionTitle = (agentType: AgentType): string => {
  switch (agentType) {
    case "plan":
      return "プラン提案";
    case "search":
      return "店舗候補";
    case "area-info":
      return "周辺情報";
  }
};

// エージェントタイプの優先順位（plan → search → area-info）
const agentTypePriority: Record<AgentType, number> = {
  plan: 1,
  search: 2,
  "area-info": 3,
};

// 優先順位でソート
const sortAgentTypes = (types: AgentType[]): AgentType[] => {
  return [...types].sort(
    (a, b) => agentTypePriority[a] - agentTypePriority[b]
  );
};

type AgentMap = {
  search: Agent;
  plan: Agent;
  "area-info": Agent;
};

export const createAiService = (
  keywordAgent: Agent,
  agents: AgentMap
): AiService => ({
  suggestKeywords: async (title, startAt, userConditions, excludeKeywords) => {
    const exclusionPrompt = buildExclusionPrompt(userConditions, excludeKeywords);

    const result = await keywordAgent.generate([
      {
        role: "user",
        content: `タイトル: ${title}\n日時: ${startAt}${exclusionPrompt}`,
      },
    ]);

    try {
      // レスポンスからJSONオブジェクトを抽出
      const text = result.text.trim();
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        // 型の検証
        if (
          Array.isArray(parsed.keywords) &&
          Array.isArray(parsed.agentTypes) &&
          parsed.agentTypes.every((t: string) =>
            ["search", "plan", "area-info"].includes(t)
          )
        ) {
          return {
            keywords: parsed.keywords,
            agentTypes: parsed.agentTypes,
          };
        }
      }

      // 旧形式（配列のみ）との後方互換性
      const arrayMatch = text.match(/\[[\s\S]*\]/);
      if (arrayMatch) {
        return {
          keywords: JSON.parse(arrayMatch[0]),
          agentTypes: ["search"] as AgentType[],
        };
      }

      logger.warn("Failed to parse AI keywords response", {
        category: "ai",
        responseText: result.text,
      });
      return { keywords: [], agentTypes: ["search"] as AgentType[] };
    } catch {
      logger.warn("Failed to parse AI keywords response", {
        category: "ai",
        responseText: result.text,
      });
      return { keywords: [], agentTypes: ["search"] as AgentType[] };
    }
  },

  searchWithKeywords: async (
    title,
    startAt,
    keywords,
    agentTypes,
    userConditions
  ): Promise<SearchResult> => {
    const conditionsPrompt = buildConditionsPrompt(userConditions);

    // デフォルトは search
    const typesToUse =
      agentTypes.length > 0 ? sortAgentTypes(agentTypes) : ["search"] as AgentType[];

    // 各エージェントを順番に実行
    const results: { type: AgentType; content: string; shopCandidates?: Shop[] }[] = [];

    for (const agentType of typesToUse) {
      const agent = agents[agentType];
      if (!agent) continue;

      const result = await agent.generate([
        {
          role: "user",
          content: `以下の予定について、選択されたキーワードに関連する情報を検索してまとめてください。

タイトル: ${title}
日時: ${startAt}
調べたいこと: ${keywords.join(", ")}${conditionsPrompt}`,
        },
      ]);

      // SearchAgentの場合はJSONブロックをパース
      if (agentType === "search") {
        const shopCandidates = parseShopCandidates(result.text);
        const cleanedContent = removeJsonBlock(result.text);
        results.push({ type: agentType, content: cleanedContent, shopCandidates });
      } else {
        results.push({ type: agentType, content: result.text });
      }
    }

    // お店候補を収集（SearchAgentの結果から）
    const allShopCandidates = results
      .filter((r) => r.shopCandidates)
      .flatMap((r) => r.shopCandidates!);

    // 複数エージェントの結果をマージ
    if (results.length === 1) {
      return {
        result: results[0].content,
        shopCandidates: allShopCandidates.length > 0 ? allShopCandidates : undefined,
      };
    }

    // セクションタイトル付きでマージ
    const mergedResult = results
      .map(({ type, content }) => `## ${getAgentSectionTitle(type)}\n\n${content}`)
      .join("\n\n---\n\n");

    return {
      result: mergedResult,
      shopCandidates: allShopCandidates.length > 0 ? allShopCandidates : undefined,
    };
  },

  searchWithKeywordsStream: async function* (
    title,
    startAt,
    keywords,
    agentTypes,
    userConditions
  ): AsyncGenerator<StreamEvent> {
    const conditionsPrompt = buildConditionsPrompt(userConditions);

    // デフォルトは search
    const typesToUse =
      agentTypes.length > 0 ? sortAgentTypes(agentTypes) : ["search"] as AgentType[];

    let fullText = "";
    let allShopCandidates: Shop[] = [];

    for (let i = 0; i < typesToUse.length; i++) {
      const agentType = typesToUse[i];
      const agent = agents[agentType];
      if (!agent) continue;

      // 複数エージェントの場合はセクションヘッダーを出力
      if (typesToUse.length > 1) {
        const header = `## ${getAgentSectionTitle(agentType)}\n\n`;
        yield { type: "text", content: header };
        fullText += header;
      }

      try {
        const streamResult = await agent.stream([
          {
            role: "user",
            content: `以下の予定について、選択されたキーワードに関連する情報を検索してまとめてください。

タイトル: ${title}
日時: ${startAt}
調べたいこと: ${keywords.join(", ")}${conditionsPrompt}`,
          },
        ]);

        // ストリームからテキストを読み取る
        // JSONブロックをフィルタリングしながら出力
        let buffer = "";
        let inJsonBlock = false;
        let displayedText = "";
        let statusSent = false; // statusイベントは一度だけ送信

        // JSONブロック開始マーカーのパターン（検出用）
        const jsonBlockMarkers = ["```json:shops", "```json: shops", "```json"];
        const longestMarker = "```json:shops"; // 部分一致検出用

        for await (const chunk of streamResult.textStream) {
          fullText += chunk;
          buffer += chunk;

          // JSONブロックの開始を検知
          while (buffer.length > 0) {
            if (inJsonBlock) {
              // JSONブロック内：終端 ``` を探す
              const endIndex = buffer.indexOf("```");
              if (endIndex !== -1) {
                // JSONブロック終了
                inJsonBlock = false;
                buffer = buffer.slice(endIndex + 3);
              } else {
                // まだ終端が来ていない、バッファに保持
                break;
              }
            } else {
              // JSONブロック外：開始マーカーを探す
              let foundMarker: { index: number; length: number } | null = null;
              for (const marker of jsonBlockMarkers) {
                const idx = buffer.indexOf(marker);
                if (idx !== -1 && (foundMarker === null || idx < foundMarker.index)) {
                  foundMarker = { index: idx, length: marker.length };
                }
              }

              if (foundMarker !== null) {
                // JSONブロック開始前のテキストを出力
                if (foundMarker.index > 0) {
                  const textToYield = buffer.slice(0, foundMarker.index);
                  yield { type: "text", content: textToYield };
                  displayedText += textToYield;
                }
                inJsonBlock = true;
                buffer = buffer.slice(foundMarker.index + foundMarker.length);
                // JSONブロック開始時にステータスを通知（一度だけ）
                if (!statusSent) {
                  yield { type: "status", message: "店舗選択カードを作成中..." };
                  statusSent = true;
                }
              } else {
                // 開始マーカーの一部が含まれる可能性を考慮
                const partialMatch = findPartialMatch(buffer, longestMarker);
                if (partialMatch > 0) {
                  // 確定部分を出力
                  const textToYield = buffer.slice(0, buffer.length - partialMatch);
                  yield { type: "text", content: textToYield };
                  displayedText += textToYield;
                  buffer = buffer.slice(buffer.length - partialMatch);
                } else {
                  // 全て出力
                  yield { type: "text", content: buffer };
                  displayedText += buffer;
                  buffer = "";
                }
                break;
              }
            }
          }
        }

        // 残りのバッファを出力（JSONブロック外の場合のみ）
        if (!inJsonBlock && buffer.length > 0) {
          yield { type: "text", content: buffer };
          displayedText += buffer;
        }

        // SearchAgentの場合は完了後にJSONをパース
        if (agentType === "search") {
          const shopCandidates = parseShopCandidates(fullText);
          if (shopCandidates) {
            allShopCandidates = [...allShopCandidates, ...shopCandidates];
          }
        }

        // 複数エージェントの場合はセパレーター
        if (typesToUse.length > 1 && i < typesToUse.length - 1) {
          const separator = "\n\n---\n\n";
          yield { type: "text", content: separator };
          fullText += separator;
        }
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        logger.error("Stream error", { category: "ai", error: message });
        yield { type: "error", message };
        return;
      }
    }

    // 完了イベント
    yield {
      type: "done",
      shopCandidates: allShopCandidates.length > 0 ? allShopCandidates : undefined,
    };
  },
});
