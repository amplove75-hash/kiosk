# 키오스크 연습장 — 「키오스크야! 내 주문을 받아줘!」

시니어·디지털 취약계층용 키오스크 체험 웹사이트. 설계 문서는 `HARNESS.md`.

## 실행
```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # dist/ → HTTPS 정적 호스팅(Netlify, Vercel, GitHub Pages 등)에 올리기
```
카메라 바코드 인식은 **HTTPS 주소 또는 localhost**에서만 동작합니다.
같은 와이파이의 태블릿으로 열 때는 `npx vite --host`로는 카메라가 안 켜지니(https 아님) 정적 호스팅에 올려 쓰세요.

## 테스트
```bash
npm run build && npx vite preview --port 4173 &
CHROME=/path/to/chrome node tests/e2e.mjs            # 따라하기·혼자 해보기 완주
CHROME=/path/to/chrome node tests/make-fake-cams.mjs # 인쇄 카드 → 가짜 카메라 영상(.y4m) 만들기
CHROME=/path/to/chrome node tests/camera.mjs         # 가짜 카메라로 실제 바코드 인식 시험
```

## 진행 상황
- [x] P1 프로젝트 뼈대, 홈, 글자 크기·선명하게·음성 안내
- [x] P2 카페 키오스크(CAFE NINE) — 따라하기 18단계 / 혼자 해보기 / 직원 호출 / 카드 투입구·영수증 출구
- [x] P3 카메라 바코드 인식(내장 인식기 → ZXing 폴백, 사진 인식, 카메라 없을 때 연습 버튼)
      + 연습용 카드 인쇄(#/print) + 카메라 점검(#/camera-test)
      + 카페: 카드 스캔 결제·잔액 부족 오류·멤버십 스탬프·쿠폰 할인
- [ ] P4 미션 모드 + 채점
- [x] P5-1 마트 셀프계산대(나인마트) — 상품 바코드 스캔(카메라 또는 기계 아래 장바구니), 수량 ±·빼기,
      봉투 선택, 회원 포인트 적립(1%), 카드 결제, 영수증 / 따라하기 19단계(우유 1개·라면 2개)
- [x] 패스트푸드(나인버거) — 단품/세트/라지세트, 사이드·음료 변경, 픽업 번호 / 따라하기(불고기버거 세트, 사이다로 변경)
- [x] 식당 테이블 오더(나인식당) — 가로형 태블릿, 테이블 번호, 담기·주문(추가 주문), 직원 호출(물·앞접시 등), 주문내역, 계산 요청
- [ ] 주차 / 기차·병원·관공서 / OX퀴즈·실전모드 / 점검

## 새 키오스크 추가
결제(결제방식 → 카드 → 영수증) 화면과 따라하기 단계는 `src/kiosks/shared/`에 공통으로 있어요.
`src/kiosks/<id>/`에 화면 컴포넌트와 `guide.ts`를 만들고 `src/kiosks/registry.ts`에 등록합니다.
버튼에 `data-guide="이름"`을 달면 따라하기 단계에서 그 버튼을 주황 상자로 강조할 수 있습니다.
