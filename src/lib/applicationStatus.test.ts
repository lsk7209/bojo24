/* eslint-disable no-console */
import { parseApplicationStatus } from "./applicationStatus";
import assert from "node:assert";

// 기준 테스트 일자: 2026-10-31
const refDate = new Date(2026, 9, 31, 12, 0, 0);

// 1. 상시 접수 테스트
const always1 = parseApplicationStatus("상시신청 가능", refDate);
assert.strictEqual(always1.status, "always");
assert.strictEqual(always1.label, "상시 접수");

const always2 = parseApplicationStatus("예산 소진 시까지", refDate);
assert.strictEqual(always2.status, "always");

// 2. 이미 마감된 과거 일정 테스트
const past = parseApplicationStatus("2026.03.01 ~ 2026.05.31", refDate);
assert.strictEqual(past.status, "closed");
assert.strictEqual(past.label, "접수 마감");

// 3. 마감 임박 (7일 이내)
const soon = parseApplicationStatus("2026-10-01 ~ 2026-11-03", refDate);
assert.strictEqual(soon.status, "closing_soon");
assert.ok(soon.label.includes("마감 임박"));

// 4. 여유 있는 접수중 (> 7일)
const open = parseApplicationStatus("2026.10.15 ~ 2026.12.31", refDate);
assert.strictEqual(open.status, "open");
assert.ok(open.label.includes("접수중"));

// 5. 날짜 정보 없는 경우
const unknown = parseApplicationStatus("각 주민센터 문의", refDate);
assert.strictEqual(unknown.status, "unknown");

console.log("All applicationStatus tests passed successfully!");
