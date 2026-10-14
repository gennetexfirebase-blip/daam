// Анхны өгөгдөл (Facebook-ийн постуудаас). server/data/tours.json байхгүй үед import-data.mjs ашиглана.
const L = (mn, en, zh) => ({ mn, en, zh });
const D = (d, n) => L(`${d} өдөр ${n} шөнө`, `${d} days, ${n} nights`, `${d}天${n}晚`);
const S24 = L('2024 зун', 'Summer 2024', '2024年夏季');
const FROM = v => L(v + '-с', 'from ' + v, v + '起');
const PL = {
  vn: L('Вьетнам', 'Vietnam', '越南'), th: L('Тайланд', 'Thailand', '泰国'), tr: L('Турк', 'Türkiye', '土耳其')
};
const city = {
  sha: L('Шанхай', 'Shanghai', '上海'), can: L('Гуанжоу', 'Guangzhou', '广州'), tsn: L('Тяньжин', 'Tianjin', '天津'),
  syx: L('Саньяа', 'Sanya', '三亚'), hai: L('Хайнан', 'Hainan', '海南'), dyg: L('Жанжиажэ', 'Zhangjiajie', '张家界'),
  bdh: L('Бэйдайхэ', 'Beidaihe', '北戴河'), zjk: L('Жанжиакоу', 'Zhangjiakou', '张家口'), pek: L('Бээжин', 'Beijing', '北京'),
  het: L('Хөх хот', 'Hohhot', '呼和浩特'), dat: L('Датон', 'Datong', '大同'), she: L('Шэньян', 'Shenyang', '沈阳'),
  dxb: L('Дубай', 'Dubai', '迪拜')
};
const P = {
  beach: 'photo-1507525428034-b723cf961d3e', wall: 'photo-1508804185872-d7badad00f7d',
  city: 'photo-1474181487882-5abf3f0ba6c2', cruise: 'photo-1548574505-5e239809ee19',
  korea: 'photo-1538485399081-7191377e8241', dubai: 'photo-1512453979798-5ea266f8880c',
  thai: 'photo-1528181304800-259b08848526', viet: 'photo-1528127269322-539801943592',
  turkey: 'photo-1524231757912-21f4fe3a7200', mount: 'photo-1501785888041-af3ef285b470',
  lake: 'photo-1476514525535-07fb3b4ae5f1', factory: 'photo-1565043666747-69f6646db940'
};
const PARTNER = ['8829-6044', '9900-1205'];

const UPCOMING = [
  {slug:'canton-fair-2026', code:'CAN', departures:['2026-10-15'], end:'2026-11-05', to:city.can, type:'business', countries:['cn'], img:P.factory,
   title:L('Canton Fair 2026 бизнес аялал','Canton Fair 2026 business trip','2026年广交会商务考察'),
   when:L('10.15 – 11.05, 3 үе','15 Oct – 5 Nov, in 3 phases','10月15日至11月5日，共三期'),
   prices:[['p', L('Баг бүрдвэл хямдралтай','Group discount available','组团优惠')]], phones:PARTNER,
   hl:[L('Гуанжоу хотод болох Canton Fair 2026','Canton Fair 2026 in Guangzhou','广州2026年广交会'), L('3 үе шаттай','Three phases','分三期')]},
  {slug:'shanghai-disneyland', code:'PVG', departures:['2026-10-30'], end:'2026-11-05', to:city.sha, type:'leisure', countries:['cn'], img:P.city,
   title:L('Шанхай — Disneyland аялал','Shanghai Disneyland tour','上海迪士尼之旅'),
   when:L('10 сарын 30, ганцхан удаа','30 October, one departure only','10月30日，仅此一期'), days:D(7,6),
   prices:[['adult','3,490,000₮'],['kid','2,990,000₮']],
   hl:[L('Shanghai Disneyland','Shanghai Disneyland','上海迪士尼乐园'), L('Аквариум','Aquarium','海洋水族馆'),
       L('Хуанпу мөрний круйз','Huangpu River cruise','黄浦江游船'), L('5 одтой буудал','5-star hotel','五星级酒店'), L('Шууд нислэг','Direct flight','直飞')]}
];

const PROGRAMS = [
  {slug:'cruise-3-countries', type:'cruise', countries:['cn','jp','kr'], to:city.tsn, img:P.cruise,
   title:L('3 улсын круйз','3-country cruise','三国邮轮'), sub:L('Тяньжин – Фукуока – Чэжү','Tianjin – Fukuoka – Jeju','天津—福冈—济州'),
   when:L('2024 зун, 2024.12, 2025.03–04, 2025.11–12','Summer 2024, Dec 2024, Mar–Apr 2025, Nov–Dec 2025','2024年夏季、2024年12月、2025年3–4月、2025年11–12月'), days:D(8,7),
   prices:[['p','2,390,000 – 2,990,000₮']],
   hl:[L('15 давхар хөлөг онгоц','15-deck cruise ship','15层邮轮'), L('Шууд нислэг','Direct flight','直飞'), L('Фукуока, Чэжү','Fukuoka and Jeju','福冈、济州')]},
  {slug:'cruise-2-countries', type:'cruise', countries:['cn','kr'], to:city.tsn, img:P.korea,
   title:L('2 улсын круйз','2-country cruise','两国邮轮'), sub:L('Тяньжин – Инчон – Чэжү','Tianjin – Incheon – Jeju','天津—仁川—济州'),
   when:L('2026.02','Feb 2026','2026年2月'), prices:[['p','2,190,000 – 3,690,000₮']],
   hl:[L('Инчон, Чэжү','Incheon and Jeju','仁川、济州')]},
  {slug:'hainan-sanya', type:'leisure', countries:['cn'], to:city.syx, img:P.beach,
   title:L('Хайнан – Саньяа','Hainan – Sanya','海南三亚'), sub:L('Атлантис усан парк','Atlantis water park','亚特兰蒂斯水世界'),
   when:L('2025.12 – 2026.02, долоо хоног бүр','Dec 2025 – Feb 2026, weekly','2025年12月至2026年2月，每周出发'),
   prices:[['s4','3,590,000₮'],['s5','3,990,000₮']],
   hl:[L('Шууд нислэг','Direct flight','直飞'), L('Атлантис усан парк','Atlantis water park','亚特兰蒂斯水世界')]},
  {slug:'hainan-island', type:'leisure', countries:['cn'], to:city.hai, img:P.lake,
   title:L('Хайнан арал','Hainan Island','海南岛'), sub:L('УБ-аас нислэгтэй','Flights from Ulaanbaatar','含乌兰巴托往返机票'),
   when:L('2024 зун, 2025.02–03','Summer 2024, Feb–Mar 2025','2024年夏季、2025年2–3月'), days:D(8,7),
   prices:[['adult','3,190,000₮'],['kid','2,790,000₮']],
   hl:[L('Улаанбаатараас нислэгтэй','Flights from Ulaanbaatar','含乌兰巴托往返机票'), L('2024 оны зун 2,550,000₮-с','Summer 2024: from 2,550,000₮','2024年夏季：2,550,000₮起')]},
  {slug:'hohhot-hainan', type:'leisure', countries:['cn'], to:city.hai, img:P.beach,
   title:L('Хөх хот – Хайнан','Hohhot – Hainan','呼和浩特—海南'), sub:L('Хосолсон аялал','Combined tour','联游线路'),
   when:L('2024.12 – 2025.01','Dec 2024 – Jan 2025','2024年12月至2025年1月'), prices:[['p','3,290,000₮']],
   hl:[L('Хөх хот, Хайнан','Hohhot and Hainan','呼和浩特、海南')]},
  {slug:'tianmen-mountain', type:'leisure', countries:['cn'], to:city.dyg, img:P.mount,
   title:L('Тэнгэрийн хаалга','Tianmen Mountain (Heaven’s Gate)','天门山'), sub:L('Жанжиажэ','Zhangjiajie','张家界'),
   when:L('2024 зун, 2025.05–06, долоо хоног бүр','Summer 2024, May–Jun 2025, weekly','2024年夏季、2025年5–6月，每周出发'),
   prices:[['p','2,990,000₮']],
   hl:[L('Шууд нислэг','Direct flight','直飞'), L('Шилэн гүүр','Glass bridge','玻璃桥'), L('Шар луугийн агуй','Yellow Dragon Cave','黄龙洞'), L('2024 оны зун 2,550,000₮-с','Summer 2024: from 2,550,000₮','2024年夏季：2,550,000₮起')]},
  {slug:'beijing-beidaihe', type:'leisure', countries:['cn'], to:city.bdh, img:P.beach,
   title:L('Бээжин – Бэйдайхэ','Beijing – Beidaihe','北京—北戴河'), sub:L('Усан парк, Universal','Water park and Universal Studios','水上乐园、环球影城'),
   when:L('2025.06 / 13, 16, 19','13, 16 and 19 Jun 2025','2025年6月13、16、19日'), days:D(6,5),
   prices:[['adult','2,650,000₮'],['kid','2,150,000₮']],
   hl:[L('Нислэгтэй','Flights included','含机票'), L('Усан парк','Water park','水上乐园'), L('Universal Studios','Universal Studios','北京环球影城')]},
  {slug:'beijing-jining-zhangjiakou', type:'leisure', countries:['cn'], to:city.zjk, img:P.wall,
   title:L('Бээжин – Жининь – Жанжиакоу','Beijing – Jining – Zhangjiakou','北京—集宁—张家口'), sub:L('Цагаан хэрэм, Universal Studio','Great Wall and Universal Studios','长城、环球影城'),
   when:L('Цагаан сар, 02/14','Tsagaan Sar (Lunar New Year), 14 Feb','白月节（蒙古新年），2月14日'),
   prices:[['adult','1,190,000₮'],['kid','990,000₮']],
   hl:[L('Цагаан хэрэм','Great Wall','长城'), L('Universal Studio','Universal Studios','北京环球影城')]},
  {slug:'beijing-jining', type:'leisure', countries:['cn'], to:city.pek, img:P.wall,
   title:L('Бээжин – Жининь','Beijing – Jining','北京—集宁'),
   when:L('2025.01','Jan 2025','2025年1月'), prices:[['adult','1,790,000₮'],['kid','1,490,000₮']],
   hl:[L('Бээжин, Жининь','Beijing and Jining','北京、集宁')]},
  {slug:'hohhot-jining-checkup', type:'health', countries:['cn'], to:city.het, img:P.mount,
   title:L('Хөх хот – Жининь – Мини Аватар','Hohhot – Jining – Mini Avatar','呼和浩特—集宁—Mini Avatar'),
   sub:L('Эмнэлгийн үзлэг, шинжилгээтэй','With a medical check-up','含医院体检'),
   when:L('02/01, 04/03','1 Feb, 3 Apr','2月1日、4月3日'), prices:[['adult','950,000₮'],['kid','750,000₮']],
   hl:[L('Эмнэлгийн үзлэг, шинжилгээ','Medical check-up and tests','医院体检和化验'), L('Мини Аватар','Mini Avatar','Mini Avatar')]},
  {slug:'hohhot-jining', type:'leisure', countries:['cn'], to:city.het, img:P.city,
   title:L('Хөх хот – Жининь','Hohhot – Jining','呼和浩特—集宁'),
   when:L('2025.01','Jan 2025','2025年1月'), prices:[['adult','890,000₮'],['kid','690,000₮']],
   hl:[L('Хөх хот, Жининь','Hohhot and Jining','呼和浩特、集宁')]},
  {slug:'zhangjiakou-beidaihe', type:'leisure', countries:['cn'], to:city.bdh, img:P.beach,
   title:L('Жанжиакоу – Бэйдайхэ','Zhangjiakou – Beidaihe','张家口—北戴河'), sub:L('Газраар','Overland','陆路出行'),
   when:L('8/10 – 15','10–15 Aug','8月10日至15日'), days:D(5,4), prices:[['p','990,000₮']], phones:PARTNER,
   hl:[L('Газрын тээврээр','Overland travel','陆路出行')]},
  {slug:'datong-mini-avatar', type:'leisure', countries:['cn'], to:city.dat, img:P.mount,
   title:L('Датон + Мини Аватар','Datong + Mini Avatar','大同 + Mini Avatar'),
   when:S24, prices:[['p','990,000₮']], hl:[L('Датон','Datong','大同'), L('Мини Аватар','Mini Avatar','Mini Avatar')]},
  {slug:'mini-avatar-mini-hainan', type:'leisure', countries:['cn'], to:city.het, img:P.lake,
   title:L('Мини Аватар + Мини Хайнан','Mini Avatar + Mini Hainan','Mini Avatar + Mini Hainan'),
   when:S24, prices:[['p','950,000₮']], hl:[L('Мини Аватар','Mini Avatar','Mini Avatar'), L('Мини Хайнан','Mini Hainan','Mini Hainan')]},
  {slug:'hohhot-routes', type:'leisure', countries:['cn'], to:city.het, img:P.city,
   title:L('Хөх хот, Жининь, Мини Аватар, Мини Хайнан','Hohhot, Jining, Mini Avatar, Mini Hainan','呼和浩特、集宁、Mini Avatar、Mini Hainan'),
   sub:L('Олон чиглэлтэй','Several routes','多条线路'), when:S24, prices:[['p',FROM('850,000₮')]],
   hl:[L('Хөх хот','Hohhot','呼和浩特'), L('Жининь','Jining','集宁'), L('Мини Аватар','Mini Avatar','Mini Avatar'), L('Мини Хайнан','Mini Hainan','Mini Hainan')]},
  {slug:'beijing-datong-tianjin', type:'leisure', countries:['cn'], to:city.tsn, img:P.wall,
   title:L('Бээжин – Датон, Бэйдайхэ – Тяньжин','Beijing – Datong, Beidaihe – Tianjin','北京—大同、北戴河—天津'),
   when:S24, prices:[['p',FROM('1,550,000₮')]], hl:[L('Бээжин, Датон, Бэйдайхэ, Тяньжин','Beijing, Datong, Beidaihe, Tianjin','北京、大同、北戴河、天津')]},
  {slug:'shenyang-benxi', type:'business', countries:['cn'], to:city.she, img:P.factory,
   title:L('Шэньян – Бэнши бизнес аялал','Shenyang – Benxi business trip','沈阳—本溪商务考察'), sub:L('AI, робот үйлдвэр, рашаан','AI and robotics factories, hot springs','AI与机器人工厂、温泉'),
   when:L('2026.08.18 – 25','18–25 Aug 2026','2026年8月18日至25日'), days:L('8 хоног','8 days','8天'), prices:[['p','1,290,000₮']], phones:PARTNER,
   hl:[L('AI, робот үйлдвэрүүдтэй танилцах','Visits to AI and robotics factories','参观AI与机器人工厂'), L('Рашаан','Hot springs','温泉')]},
  {slug:'beijing-dubai', type:'leisure', countries:['cn','ae'], to:city.dxb, img:P.dubai,
   title:L('Бээжин + Дубай','Beijing + Dubai','北京 + 迪拜'), sub:L('Хосолсон аялал','Combined tour','联游线路'),
   when:L('2024.11.08','8 Nov 2024','2024年11月8日'), hl:[L('Бээжин, Дубай','Beijing and Dubai','北京、迪拜')]},
  {slug:'dubai', type:'free', countries:['ae'], to:city.dxb, img:P.dubai, title:L('Дубайн чөлөөт аялал','Dubai independent trip','迪拜自由行')},
  {slug:'vietnam', type:'free', countries:['vn'], to:PL.vn, img:P.viet, title:L('Вьетнамын чөлөөт аялал','Vietnam independent trip','越南自由行'), when:L('2025.01–02','Jan–Feb 2025','2025年1–2月')},
  {slug:'thailand', type:'free', countries:['th'], to:PL.th, img:P.thai, title:L('Тайландын чөлөөт аялал','Thailand independent trip','泰国自由行'), when:L('2025.01–02','Jan–Feb 2025','2025年1–2月')},
  {slug:'turkiye', type:'free', countries:['tr'], to:PL.tr, img:P.turkey, title:L('Туркийн чөлөөт аялал','Türkiye independent trip','土耳其自由行'), when:L('2025.01–02','Jan–Feb 2025','2025年1–2月')}
];

// Нэг ижил бүтэцтэй болгох
export function normalizeTour(x, i = 0) {
  return {
    id: x.id || x.slug,
    slug: x.slug,
    active: x.active !== false,
    order: x.order ?? i,
    type: x.type || 'leisure',
    countries: x.countries || [],
    code: x.code || '',
    to: x.to || '',
    img: x.img || '',
    title: x.title || '',
    sub: x.sub || '',
    when: x.when || '',
    days: x.days || '',
    departures: x.departures || [],
    end: x.end || '',
    seats: x.seats ?? null,
    prices: (x.prices || []).map(p => Array.isArray(p) ? { k: p[0], v: p[1] } : p),
    phones: x.phones || [],
    hl: x.hl || [],
    program: x.program || [],
    included: x.included || [],
    excluded: x.excluded || [],
    suitable: x.suitable || [],
    gallery: x.gallery || []
  };
}

export const SEED = [...UPCOMING, ...PROGRAMS].map(normalizeTour);
