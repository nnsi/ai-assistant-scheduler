/**
 * AI出力パーサー
 *
 * AIモデルからの出力（JSON埋め込みマークダウン等）をパースする共通ユーティリティ
 */

import { type ZodType } from "zod";
import { logger } from "./logger";

export type ParseResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

/**
 * JSON配列を括弧のバランスを追跡して抽出する
 */
export const extractJsonArray = (
  text: string,
  startIndex: number
): string | undefined => {
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

/**
 * JSONオブジェクトを括弧のバランスを追跡して抽出する
 */
export const extractJsonObject = (
  text: string,
  startIndex: number
): string | undefined => {
  if (text[startIndex] !== "{") return undefined;

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

/**
 * テキストからJSONオブジェクトを抽出してパースする
 */
export function parseJsonObject<T>(
  text: string,
  schema: ZodType<T>,
  options?: { logContext?: string }
): ParseResult<T> {
  const context = options?.logContext ?? "ai";

  // パターン1: ```json ... ``` ブロック内のオブジェクト
  const jsonBlockMatch = text.match(/```json\s*/);
  if (jsonBlockMatch && jsonBlockMatch.index !== undefined) {
    const contentStart = jsonBlockMatch.index + jsonBlockMatch[0].length;
    const endMatch = text.slice(contentStart).indexOf("```");
    if (endMatch !== -1) {
      const blockContent = text.slice(contentStart, contentStart + endMatch).trim();
      if (blockContent.startsWith("{")) {
        try {
          const parsed = JSON.parse(blockContent);
          const result = schema.safeParse(parsed);
          if (result.success) {
            return { success: true, data: result.data };
          }
          logger.warn("Schema validation failed for JSON block", {
            category: context,
            error: result.error.message,
          });
        } catch (e) {
          logger.warn("Failed to parse JSON block", {
            category: context,
            error: e instanceof Error ? e.message : String(e),
          });
        }
      }
    }
  }

  // パターン2: テキスト内の最初の {...} オブジェクト
  const firstBrace = text.indexOf("{");
  if (firstBrace !== -1) {
    const extracted = extractJsonObject(text, firstBrace);
    if (extracted) {
      try {
        const parsed = JSON.parse(extracted);
        const result = schema.safeParse(parsed);
        if (result.success) {
          return { success: true, data: result.data };
        }
        logger.warn("Schema validation failed for extracted object", {
          category: context,
          error: result.error.message,
        });
      } catch (e) {
        logger.warn("Failed to parse extracted object", {
          category: context,
          error: e instanceof Error ? e.message : String(e),
        });
      }
    }
  }

  return {
    success: false,
    error: "No valid JSON object found in AI output",
  };
}

/**
 * テキストからJSON配列を抽出してパースする
 */
export function parseJsonArray<T>(
  text: string,
  schema: ZodType<T>,
  options?: { logContext?: string; codeBlockLabel?: string }
): ParseResult<T> {
  const context = options?.logContext ?? "ai";
  const label = options?.codeBlockLabel;

  // パターン1: ```json:label ... ``` ブロック
  if (label) {
    const labeledMatch = text.match(new RegExp(`\`\`\`json:${label}\\s*`));
    if (labeledMatch && labeledMatch.index !== undefined) {
      const contentStart = labeledMatch.index + labeledMatch[0].length;
      const endMatch = text.slice(contentStart).indexOf("```");
      if (endMatch !== -1) {
        const blockContent = text.slice(contentStart, contentStart + endMatch).trim();
        const result = tryParseAndValidate(blockContent, schema, context);
        if (result.success) return result;
      }
    }

    // パターン2: ```json: label ... ``` ブロック（スペース入り）
    const spacedLabelMatch = text.match(new RegExp(`\`\`\`json:\\s*${label}\\s*`));
    if (spacedLabelMatch && spacedLabelMatch.index !== undefined) {
      const contentStart = spacedLabelMatch.index + spacedLabelMatch[0].length;
      const endMatch = text.slice(contentStart).indexOf("```");
      if (endMatch !== -1) {
        const blockContent = text.slice(contentStart, contentStart + endMatch).trim();
        const result = tryParseAndValidate(blockContent, schema, context);
        if (result.success) return result;
      }
    }
  }

  // パターン3: ```json ... ``` ブロック内のJSON配列
  const jsonBlockMatch = text.match(/```json\s*/);
  if (jsonBlockMatch && jsonBlockMatch.index !== undefined) {
    const contentStart = jsonBlockMatch.index + jsonBlockMatch[0].length;
    const endMatch = text.slice(contentStart).indexOf("```");
    if (endMatch !== -1) {
      const blockContent = text.slice(contentStart, contentStart + endMatch).trim();
      if (blockContent.startsWith("[")) {
        const result = tryParseAndValidate(blockContent, schema, context);
        if (result.success) return result;
      }
    }
  }

  // パターン4: Markdown後の末尾JSON配列（括弧バランスで抽出）
  const lastBracket = text.lastIndexOf("\n[");
  if (lastBracket !== -1) {
    const extracted = extractJsonArray(text, lastBracket + 1);
    if (extracted) {
      const afterJson = text.slice(lastBracket + 1 + extracted.length).trim();
      if (afterJson.length < 10) {
        const result = tryParseAndValidate(extracted, schema, context);
        if (result.success) return result;
      }
    }
  }

  // パターン5: 最初の [ を探す
  const firstBracket = text.indexOf("[");
  if (firstBracket !== -1) {
    const extracted = extractJsonArray(text, firstBracket);
    if (extracted) {
      const result = tryParseAndValidate(extracted, schema, context);
      if (result.success) return result;
    }
  }

  logger.info("No JSON array found in AI output", {
    category: context,
    textLength: text.length,
    lastChars: text.slice(-200),
  });

  return {
    success: false,
    error: "No valid JSON array found in AI output",
  };
}

/**
 * JSONをパースしてスキーマで検証する内部ヘルパー
 */
function tryParseAndValidate<T>(
  jsonContent: string,
  schema: ZodType<T>,
  context: string
): ParseResult<T> {
  try {
    const parsed = JSON.parse(jsonContent);
    const result = schema.safeParse(parsed);
    if (result.success) {
      logger.info("Successfully parsed AI output", {
        category: context,
        preview: jsonContent.slice(0, 100),
      });
      return { success: true, data: result.data };
    }
    logger.warn("Schema validation failed", {
      category: context,
      error: result.error.message,
    });
    return { success: false, error: result.error.message };
  } catch (e) {
    logger.warn("Failed to parse JSON", {
      category: context,
      error: e instanceof Error ? e.message : String(e),
      jsonPreview: jsonContent.slice(0, 200),
    });
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

/**
 * Markdown出力からJSONブロックを除去する
 */
export function removeJsonBlocks(
  text: string,
  options?: { codeBlockLabel?: string }
): string {
  let result = text;
  const label = options?.codeBlockLabel;

  // ラベル付きブロックを除去
  if (label) {
    result = result.replace(new RegExp(`\`\`\`json:?\\s*${label}[\\s\\S]*?\`\`\``, "g"), "");
  }

  // ```json ブロック（配列を含む場合）を除去
  const jsonBlockMatch = result.match(/```json\s*/);
  if (jsonBlockMatch && jsonBlockMatch.index !== undefined) {
    const contentStart = jsonBlockMatch.index + jsonBlockMatch[0].length;
    const endMatch = result.slice(contentStart).indexOf("```");
    if (endMatch !== -1) {
      const blockContent = result.slice(contentStart, contentStart + endMatch).trim();
      if (blockContent.startsWith("[") || blockContent.startsWith("{")) {
        result =
          result.slice(0, jsonBlockMatch.index) +
          result.slice(contentStart + endMatch + 3);
      }
    }
  }

  // 末尾のJSON配列を除去（括弧バランスで検出）
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
}

/**
 * 文字列の末尾がパターンの先頭部分と一致する長さを返す
 * ストリーミング時の部分マッチ検出用
 */
export const findPartialMatch = (text: string, pattern: string): number => {
  for (let len = Math.min(text.length, pattern.length - 1); len > 0; len--) {
    if (text.slice(-len) === pattern.slice(0, len)) {
      return len;
    }
  }
  return 0;
};
