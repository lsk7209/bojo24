# 사이트맵 & RSS 가이드

## 현재 기준

- 정규 도메인: `https://www.bojo24.kr`
- 사이트맵: `https://www.bojo24.kr/sitemap.xml`
- RSS: `https://www.bojo24.kr/rss.xml`
- robots.txt: `https://www.bojo24.kr/robots.txt`

`https://bojo24.kr` 요청은 실서비스에서 `https://www.bojo24.kr`로 리다이렉트됩니다. 검색엔진 제출과 문서 표기는 모두 `www` 기준으로 맞춥니다.

## 사이트맵 구성

사이트맵은 Next.js App Router의 [src/app/sitemap.ts](src/app/sitemap.ts)에서 자동 생성합니다.

포함 대상:

- `/`
- `/benefit`
- `/blog`
- `/about`
- `/contact`
- `/editorial-policy`
- `/privacy`
- `/terms`
- 공개 가능한 보조금 상세 페이지
- 공개 시간이 지난 블로그 글

예약 발행 글은 `published_at`이 현재 시각보다 미래이면 상세 페이지, sitemap, RSS에 노출하지 않습니다.

## RSS 구성

RSS는 [src/app/rss.xml/route.ts](src/app/rss.xml/route.ts)에서 생성합니다.

포함 대상:

- 최신 공개 블로그 글
- 최신 보조금 정보
- 정규 URL은 `https://www.bojo24.kr` 사용
- 캐시 기준은 라우트 설정을 따름

## 검색엔진 제출

### Google Search Console

- 권장 속성: `sc-domain:bojo24.kr` 또는 `https://www.bojo24.kr/`
- 현재 확인된 소유 속성: `https://bojo24.kr/`
- 제출 URL: `https://www.bojo24.kr/sitemap.xml`
- 일반 블로그 글은 Google Indexing API 직접 제출 대상이 아니므로 sitemap/GSC 기반으로 발견되게 둡니다.

### Naver Search Advisor

- 사이트: `https://www.bojo24.kr`
- 사이트맵: `https://www.bojo24.kr/sitemap.xml`
- RSS: `https://www.bojo24.kr/rss.xml`
- 신규 공개 글은 IndexNow로 Naver에도 제출합니다.

### Bing Webmaster Tools

- 사이트: `https://www.bojo24.kr`
- 사이트맵: `https://www.bojo24.kr/sitemap.xml`
- 신규 공개 글은 IndexNow로 Bing에도 제출합니다.

### Daum

- Daum 웹마스터도구에 사이트와 RSS를 수동 등록합니다.
- Daum은 현재 코드에서 직접 push 알림을 보내지 않고 sitemap/RSS 기반으로 노출을 유도합니다.

## 검증 명령

```bash
curl -I https://www.bojo24.kr/sitemap.xml
curl -I https://www.bojo24.kr/rss.xml
curl -I https://www.bojo24.kr/robots.txt
```

확인할 항목:

- `sitemap.xml` 응답 200
- `rss.xml` 응답 200
- robots.txt 안의 `Sitemap:`이 `https://www.bojo24.kr/sitemap.xml`
- 미래 예약 글 URL이 sitemap/RSS에 포함되지 않음

## 운영 메모

- 사이트맵 날짜는 페이지 데이터와 발행 시각을 기준으로 자동 갱신됩니다.
- 새 글 공개 후 Bing/Naver에는 IndexNow 알림을 보냅니다.
- Google은 sitemap과 Search Console 재크롤링으로 반영됩니다.
- Search Console에서 `www` URL-prefix 속성 소유권이 확인되면 해당 속성에도 사이트맵을 제출합니다.
