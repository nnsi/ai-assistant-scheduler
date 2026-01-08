-- schedule_supplements に agent_types カラムを追加
-- keyword-agent が判定したエージェントタイプを保存（過去データ分析用）
ALTER TABLE schedule_supplements ADD COLUMN agent_types TEXT;
