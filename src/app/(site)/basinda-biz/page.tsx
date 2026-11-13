import type { Metadata } from "next";
import { PressCards } from "@/components/site/press-cards";
import { getPressItems } from "@/server/services/repositories";

/**
 * BASINDA BİZ (14.11.2026): Blog kaldırıldı; yerine NOF Digital hakkında
 * çıkan basın haberleri paylaşıılır. Her kart admin > Basında Biz'den yönetilir:
 * haber URL'si + görsel + açıklama + kaynak adı. Görsel/kart tıklanınca
 * ziyaretçi orijinal haber kaynağına gider (yeni sekme).
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Basında Biz — NOF DIGITAL",
  description: "NOF Digital hakkında basında yayımlanan haberler; orijinal kaynağına bağlantıyla.",
};

export default async function PressPage() {
  const items = await getPressItems();
  return (
    <div className="pg" id="v-press">
      <div className="pgsec">
        <div className="wrap">
          <span className="eyb">Basında Biz</span>
          <h1 className="bt1">
            Bizi yazanlar, <em>kaynağından</em> okuyun.
          </h1>
          <p className="lead">
            NOF Digital'ın projeleri ve çalışmaları basında yer aldıkça burada paylaşıyoruz; her haber orijinal
            kaynağına bağlantıyla açılır.
          </p>
          {items.length > 0 ? (
            <PressCards items={items} />
          ) : (
            <div className="pr-empty" data-r>
              <svg className="i">
                <use href="#i-ck" />
              </svg>
              <div>
                <h2>Yakında buradayız</h2>
                <p>
                  NOF Digital hakkında yayımlanan ilk basın haberleri burada listelenecek. Ajans ve projelerimiz hakkında
                  bilgi almak için <a href="/#iletisim">bize ulaşın</a>.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
