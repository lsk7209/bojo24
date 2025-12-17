# 사이트맵 & RSS 가이드

## 📋 현재 설정 상태

### 도메인
- **프로덕션 도메인**: `https://bojo24.kr`
- 모든 파일에서 도메인 통일 완료

## 🗺️ 사이트맵 (Sitemap)

### 접근 URL
- **메인 사이트맵**: `https://bojo24.kr/sitemap.xml`
- **자동 생성**: Next.js App Router의 `sitemap.ts` 사용

### 포함 내용

#### 1. 정적 페이지
- `/` (홈) - Priority: 1.0, Daily
- `/benefit` (보조금 목록) - Priority: 0.9, Daily
- `/blog` (블로그 목록) - Priority: 0.9, Daily
- `/privacy` (개인정보처리방침) - Priority: 0.3, Yearly
- `/terms` (이용약관) - Priority: 0.3, Yearly

#### 2. 보조금 상세 페이지
- **최대 10,000개** 포함
- URL 형식: `/benefit/{category}/{id}`
- Priority: 0.8, Weekly
- 최신 업데이트된 순서로 정렬

#### 3. 블로그 포스트
- 모든 게시된 블로그 포스트
- URL 형식: `/blog/{slug}`
- Priority: 0.7, Monthly

### 사이트맵 제한
- Google 제한: 최대 50,000 URL, 50MB
- 현재 설정: 최대 10,000개 보조금 + 블로그 포스트
- 필요 시 사이트맵 인덱스로 분할 가능

### robots.txt 연동
- `robots.txt`에 자동으로 사이트맵 URL 포함
- 접근: `https://bojo24.kr/robots.txt`

## 📡 RSS 피드

### 접근 URL
- **RSS 피드**: `https://bojo24.kr/rss.xml`
- **형식**: RSS 2.0

### 포함 내용

#### 1. 블로그 포스트
- 최신 20개 포스트
- 제목, 링크, 설명, 발행일 포함

#### 2. 최신 보조금
- 최신 업데이트된 보조금 10개
- 제목, 링크, 카테고리, 설명 포함

### RSS 메타데이터
- **제목**: 보조금24 - 정부 혜택 정보
- **설명**: 행정안전부 보조금24 정보를 AI로 요약하고 쉽게 찾을 수 있는 플랫폼입니다.
- **언어**: ko-KR
- **웹마스터**: contact@bojo24.kr
- **이미지**: 사이트 파비콘

### 캐싱
- **캐시 시간**: 1시간 (3600초)
- **Stale-while-revalidate**: 캐시 만료 후에도 이전 버전 제공

## 🔍 검색 엔진 등록

### Google Search Console
1. [Google Search Console](https://search.google.com/search-console) 접속
2. 속성 추가: `https://bojo24.kr`
3. 사이트맵 제출: `https://bojo24.kr/sitemap.xml`
4. RSS 피드도 제출 가능 (선택)

### 네이버 서치어드바이저
1. [네이버 서치어드바이저](https://searchadvisor.naver.com/) 접속
2. 사이트 등록: `https://bojo24.kr`
3. 사이트맵 제출: `https://bojo24.kr/sitemap.xml`

### Bing Webmaster Tools
1. [Bing Webmaster Tools](https://www.bing.com/webmasters) 접속
2. 사이트 추가: `https://bojo24.kr`
3. 사이트맵 제출: `https://bojo24.kr/sitemap.xml`

## ✅ 검증 방법

### 사이트맵 검증
```bash
# 브라우저에서 직접 확인
https://bojo24.kr/sitemap.xml

# Google Search Console에서 검증
# Search Console > Sitemaps > 사이트맵 제출 후 상태 확인
```

### RSS 피드 검증
```bash
# 브라우저에서 직접 확인
https://bojo24.kr/rss.xml

# RSS 검증 도구 사용
# https://validator.w3.org/feed/
```

### robots.txt 확인
```bash
# 브라우저에서 직접 확인
https://bojo24.kr/robots.txt

# 사이트맵 URL이 포함되어 있는지 확인
# Sitemap: https://bojo24.kr/sitemap.xml
```

## 🔄 자동 업데이트

### 사이트맵
- **자동 업데이트**: 데이터 변경 시 자동 반영
- **재생성 주기**: 페이지 요청 시마다 최신 데이터로 생성
- **캐싱**: Next.js 자동 캐싱

### RSS 피드
- **자동 업데이트**: 새 포스트/보조금 추가 시 자동 반영
- **캐시 시간**: 1시간
- **실시간 반영**: 캐시 만료 후 자동 갱신

## 📊 모니터링

### Google Search Console
- 사이트맵 상태 모니터링
- 인덱싱된 페이지 수 확인
- 오류 페이지 확인

### 로그 확인
- 개발 환경에서 사이트맵 생성 로그 확인
- 생성된 URL 수 확인

## 🛠️ 문제 해결

### 사이트맵이 너무 큰 경우
- 사이트맵 인덱스로 분할
- 보조금 페이지 제한 조정 (현재 10,000개)

### RSS 피드가 업데이트 안 되는 경우
- 캐시 시간 확인 (1시간)
- Supabase 데이터 확인
- 서버 재시작

### 검색 엔진에 노출 안 되는 경우
1. 사이트맵 제출 확인
2. robots.txt 확인
3. Search Console에서 크롤링 상태 확인
4. 인덱싱 요청

## 📝 참고 사항

### 사이트맵 우선순위
- 홈페이지: 1.0 (최우선)
- 주요 페이지: 0.9
- 보조금 상세: 0.8
- 블로그: 0.7
- 정책 페이지: 0.3

### 변경 빈도
- **Daily**: 홈, 목록 페이지
- **Weekly**: 보조금 상세 (데이터 업데이트 주기)
- **Monthly**: 블로그 포스트
- **Yearly**: 정책 페이지

---

**최종 업데이트**: 2025-01-27
**도메인**: https://bojo24.kr

