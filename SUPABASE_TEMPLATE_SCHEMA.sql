-- 상세페이지 템플릿 시스템 스키마
-- 구글 고유 컨텐츠 인정을 위한 템플릿 관리

-- 1. content_templates 테이블 (템플릿 정의)
CREATE TABLE IF NOT EXISTS content_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE, -- 템플릿 이름 (예: "기본 상세페이지", "심화 분석형")
  description TEXT,
  template_type TEXT NOT NULL, -- 'detail_page', 'intro', 'analysis', 'guide'
  template_content JSONB NOT NULL, -- 템플릿 구조 (섹션, 변수 등)
  variables JSONB DEFAULT '{}', -- 사용 가능한 변수 정의
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. benefit_content 테이블 (각 보조금별 고유 컨텐츠)
CREATE TABLE IF NOT EXISTS benefit_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benefit_id TEXT NOT NULL REFERENCES benefits(id) ON DELETE CASCADE,
  template_id UUID REFERENCES content_templates(id),
  content_type TEXT NOT NULL, -- 'intro', 'analysis', 'guide', 'tips', 'comparison'
  
  -- 고유 컨텐츠 (AI 생성)
  intro_text TEXT, -- 인트로 (고유)
  analysis_text TEXT, -- 분석 (고유)
  guide_text TEXT, -- 가이드 (고유)
  tips_text TEXT, -- 팁 (고유)
  comparison_text TEXT, -- 비교 (고유)
  
  -- 메타데이터
  content_hash TEXT, -- 중복 검사용
  uniqueness_score REAL DEFAULT 0, -- 고유성 점수 (0-1)
  word_count INTEGER DEFAULT 0,
  
  -- 생성 정보
  generated_by TEXT DEFAULT 'ai', -- 'ai', 'manual', 'template'
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(benefit_id, content_type)
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_benefit_content_benefit_id ON benefit_content(benefit_id);
CREATE INDEX IF NOT EXISTS idx_benefit_content_type ON benefit_content(content_type);
CREATE INDEX IF NOT EXISTS idx_benefit_content_hash ON benefit_content(content_hash);
CREATE INDEX IF NOT EXISTS idx_benefit_content_uniqueness ON benefit_content(uniqueness_score DESC);

-- 3. content_sections 테이블 (섹션별 고유 컨텐츠)
CREATE TABLE IF NOT EXISTS content_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  benefit_content_id UUID NOT NULL REFERENCES benefit_content(id) ON DELETE CASCADE,
  section_type TEXT NOT NULL, -- 'target', 'benefit', 'apply', 'documents', 'timeline'
  section_order INTEGER DEFAULT 0,
  title TEXT,
  content TEXT NOT NULL,
  content_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_content_sections_benefit_content ON content_sections(benefit_content_id);
CREATE INDEX IF NOT EXISTS idx_content_sections_type ON content_sections(section_type);

-- 4. 템플릿 변수 정의 테이블
CREATE TABLE IF NOT EXISTS template_variables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID REFERENCES content_templates(id) ON DELETE CASCADE,
  variable_name TEXT NOT NULL, -- 변수명 (예: 'benefit_name', 'target_audience')
  variable_type TEXT NOT NULL, -- 'text', 'number', 'date', 'list', 'json'
  default_value TEXT,
  description TEXT,
  is_required BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_template_variables_template ON template_variables(template_id);

-- RLS 정책
ALTER TABLE content_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE benefit_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE content_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_variables ENABLE ROW LEVEL SECURITY;

-- 기존 정책 삭제 (중복 실행 방지)
DROP POLICY IF EXISTS "Public read templates" ON content_templates;
DROP POLICY IF EXISTS "Public read benefit_content" ON benefit_content;
DROP POLICY IF EXISTS "Public read content_sections" ON content_sections;
DROP POLICY IF EXISTS "Public read template_variables" ON template_variables;
DROP POLICY IF EXISTS "Admin full access templates" ON content_templates;
DROP POLICY IF EXISTS "Admin full access benefit_content" ON benefit_content;
DROP POLICY IF EXISTS "Admin full access content_sections" ON content_sections;
DROP POLICY IF EXISTS "Admin full access template_variables" ON template_variables;

-- 공개 읽기
CREATE POLICY "Public read templates" ON content_templates FOR SELECT USING (is_active = true);
CREATE POLICY "Public read benefit_content" ON benefit_content FOR SELECT USING (true);
CREATE POLICY "Public read content_sections" ON content_sections FOR SELECT USING (true);
CREATE POLICY "Public read template_variables" ON template_variables FOR SELECT USING (true);

-- 관리자 전용
CREATE POLICY "Admin full access templates" ON content_templates USING (true);
CREATE POLICY "Admin full access benefit_content" ON benefit_content USING (true);
CREATE POLICY "Admin full access content_sections" ON content_sections USING (true);
CREATE POLICY "Admin full access template_variables" ON template_variables USING (true);

-- 업데이트 트리거
CREATE TRIGGER update_content_templates_updated_at BEFORE UPDATE ON content_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_benefit_content_updated_at BEFORE UPDATE ON benefit_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_content_sections_updated_at BEFORE UPDATE ON content_sections
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 기본 템플릿 삽입
INSERT INTO content_templates (name, description, template_type, template_content, variables) VALUES
(
  '기본 상세페이지',
  '표준 보조금 상세페이지 템플릿',
  'detail_page',
  '{
    "sections": [
      {"type": "intro", "order": 1, "required": true},
      {"type": "target", "order": 2, "required": true},
      {"type": "benefit", "order": 3, "required": true},
      {"type": "apply", "order": 4, "required": true},
      {"type": "documents", "order": 5, "required": false},
      {"type": "timeline", "order": 6, "required": false},
      {"type": "tips", "order": 7, "required": false}
    ]
  }'::jsonb,
  '{
    "benefit_name": {"type": "text", "source": "benefit.name"},
    "category": {"type": "text", "source": "benefit.category"},
    "governing_org": {"type": "text", "source": "benefit.governing_org"},
    "target_audience": {"type": "text", "source": "detail.detail.지원대상"},
    "benefit_content": {"type": "text", "source": "detail.detail.지원내용"},
    "apply_method": {"type": "text", "source": "detail.detail.신청방법"},
    "contact": {"type": "text", "source": "detail.detail.문의처"}
  }'::jsonb
) ON CONFLICT (name) DO NOTHING;

