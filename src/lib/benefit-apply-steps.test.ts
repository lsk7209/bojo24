import assert from 'node:assert/strict';
import test from 'node:test';
import { optimizeBenefitContent, parseApplySteps } from './benefitContentOptimizer';
import { buildHowToJsonLd } from '../app/benefit/[category]/[id]/schema';
import type { BenefitRecord } from '../types/benefit';

test('keeps government destination and instruction together', () => {
  const source = "고용24(www.work24.go.kr) '정부지원 일자리 채용관'에서 신청";
  assert.deepEqual(parseApplySteps(source), [source]);
});
test('numbered lines retain dates, amounts, phone numbers and short instructions', () => {
  assert.deepEqual(parseApplySteps('1. 2026.09.30까지 신청\n2) 1350 문의\n3. 제출'),
    ['2026.09.30까지 신청', '1350 문의', '제출']);
});
test('circled steps and all lines remain; no arbitrary five-step truncation', () => {
  assert.deepEqual(parseApplySteps('① 확인\n② 신청'), ['확인', '신청']);
  assert.equal(parseApplySteps('가\n나\n다\n라\n마\n바').length, 6);
});
test('unstructured sentences, decimals and URL query remain lossless', () => {
  const source = '지원율 3.5%. https://example.go.kr/apply?v=1.2 에서 확인 후 신청합니다.';
  assert.deepEqual(parseApplySteps(source), [source]);
  assert.deepEqual(parseApplySteps(' \r\n '), []);
});

test('actual optimizer preserves source method and complete destination in application FAQ', async () => {
  const source = "고용24(www.work24.go.kr) '정부지원 일자리 채용관'에서 신청";
  const input = { detail: { 신청방법: source } };
  const before = JSON.stringify(input);
  // No benefitId: external enhancement branches are not entered.
  const result = await optimizeBenefitContent('검증용 정책', '일자리', '검증용 기관', input);
  assert.equal(result.sections.apply.method, source);
  assert.deepEqual(result.sections.apply.steps, [source]);
  assert.ok(result.faqs.find(item => item.question.includes('어떻게 신청'))?.answer.includes(source));
  assert.equal(JSON.stringify(input), before);
});

test('HowTo uses identical source steps and never fabricates duration or fee', () => {
  const source = '1. 고용24(www.work24.go.kr)에서 신청\n2. 2026.09.30까지 1350 문의';
  const record: BenefitRecord = { id:'fixture', name:'검증용 정책', category:'기타', governing_org:'기관', last_updated_at:'2026-09-07', detail_json:{detail:{'신청 방법':source}} };
  const json = JSON.parse(buildHowToJsonLd(record)!);
  assert.deepEqual(json.step.map((step: {text:string}) => step.text), parseApplySteps(source));
  assert.equal(json.totalTime, undefined);
  assert.equal(json.estimatedCost, undefined);
});

test('missing method never becomes an instruction or HowTo', async () => {
  for (const source of ['', ' ', '정보 없음', ' 정보 없음 ']) {
    assert.deepEqual(parseApplySteps(source), []);
    assert.equal(buildHowToJsonLd({id:'fixture',name:'검증용',category:'기타',governing_org:'기관',last_updated_at:'2026-09-07',detail_json:{detail:{신청방법:source}}}), null);
  }
  const result = await optimizeBenefitContent('검증용', '기타', '기관', {});
  assert.deepEqual(result.sections.apply.steps, []);
});
