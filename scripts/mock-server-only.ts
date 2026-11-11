// Test amaçlı: "server-only" modülünü no-op yapar (sağlayıcı seçim birim testi için).
// @ts-expect-error — bun çalışma zamanı globali (tipe gerek yok)
Bun.plugin({
  name: "mock-server-only",
  setup(build) {
    build.module("server-only", () => ({ exports: {}, loader: "object" }));
  },
});
