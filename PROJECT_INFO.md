# Project: music-converter

## Thông tin chung
- Name: music-converter
- Version: 0.0.0
- Type: module (ESM)

## Scripts (package.json)
- `dev`: chạy Vite dev server
- `build`: `tsc -b && vite build` (build TypeScript + Vite)
- `lint`: `eslint .`
- `preview`: `npm run build && wrangler dev`
- `test`: `vitest run`
- `test:watch`: `vitest`
- `e2e`: `node e2e-smoke.mjs`
- `deploy`: `npm run build && wrangler deploy`

## Dependencies (runtime)
- @spotify/basic-pitch
- @tonejs/midi
- react, react-dom
- soundfont-player
- verovio
- youtubei.js

## DevDependencies (high level)
- vite, @vitejs/plugin-react
- typescript
- vitest
- eslint + plugins
- playwright
- wrangler (Cloudflare)

## Dự án & cấu trúc quan trọng
- `src/` : mã nguồn React + TS
- `public/` : `soundfonts/`, `model/` (model.json)
- `worker/` : worker code (Cloudflare/function)
- `vite.config.ts`, `vitest.config.ts`, `tsconfig.*`
- `e2e-smoke.mjs` : script e2e smoke
- `wrangler.jsonc` : cấu hình deploy Cloudflare

## Cách chạy nhanh (local)
1. Cài dependencies:
```bash
npm install
```
2. Chạy dev server:
```bash
npm run dev
```
3. Build sản phẩm:
```bash
npm run build
```
4. Chạy tests:
```bash
npm run test
```

## Ghi chú
- Project là Vite + React + TypeScript; có hỗ trợ transcribe/notation (verovio) và soundfonts trong `public/`.
- Có cả e2e script và cấu hình để deploy lên Cloudflare Workers via `wrangler`.
- Nếu cần, tôi có thể chạy `npm install` + `npm run test`/`npm run lint` để kiểm tra trạng thái hiện tại.
