/* Тогтмол өгөгдөл, туслах функцууд */
export const L = (mn, en, zh) => ({ mn, en, zh });

// Зураг: Unsplash id ("photo-…") эсвэл URL ("/uploads/…", "https://…")
const FALL = ['#14213d,#ffa500', '#2d4a7a,#ffc65c', '#14213d,#e08e00', '#3d5a80,#ffa500'];
export const imgUrl = (src, w = 1400) => !src ? '' : src.startsWith('photo-')
  ? `https://images.unsplash.com/${src}?auto=format&fit=crop&w=${w}&q=70` : src;
export const pic = (src, i = 0, w) => `${src ? `url(${imgUrl(src, w)}), ` : ''}linear-gradient(135deg,${FALL[i % 4]})`;

export const P = {
  beach: 'photo-1507525428034-b723cf961d3e', wall: 'photo-1508804185872-d7badad00f7d',
  city: 'photo-1474181487882-5abf3f0ba6c2', cruise: 'photo-1548574505-5e239809ee19',
  japan: 'photo-1540959733332-eab4deabeeaf', korea: 'photo-1538485399081-7191377e8241',
  dubai: 'photo-1512453979798-5ea266f8880c', thai: 'photo-1528181304800-259b08848526',
  viet: 'photo-1528127269322-539801943592', turkey: 'photo-1524231757912-21f4fe3a7200',
  mount: 'photo-1501785888041-af3ef285b470', people: 'photo-1469854523086-cc02fe5d8800',
  uni: 'photo-1523050854058-8df90110c9f1', lake: 'photo-1476514525535-07fb3b4ae5f1',
  factory: 'photo-1565043666747-69f6646db940'
};

// Цомгийн зураг: хуучин хэлбэр (зөвхөн холбоос) эсвэл { src, cap }
export const galItem = g => typeof g === 'string' ? { src: g, cap: '' } : { src: g?.src || '', cap: g?.cap || '' };

export const TYPES = ['all', 'leisure', 'cruise', 'health', 'business', 'free'];
export const PRICE_KEYS = ['p', 'adult', 'kid', 's4', 's5'];

/* ---------- Сайтын анхдагч агуулга (админаас өөрчилнө) ---------- */
export const DEFAULT_SITE = {
  phones: ['7210-0248', '9906-5453'],
  email: 'tourdaam@gmail.com',
  facebook: 'https://www.facebook.com/profile.php?id=61553919472117',
  facebookName: 'DA.am World Study&Travel',
  website: 'https://daamworld.net',
  heroImgs: [P.beach, P.wall],
  aboutImg: P.people,
  gallery: [
    { src: P.cruise, cap: L('Круйз аялал', 'Cruise', '邮轮') },
    { src: P.beach, cap: L('Хайнан', 'Hainan', '海南') },
    { src: P.mount, cap: L('Жанжиажэ', 'Zhangjiajie', '张家界') },
    { src: P.wall, cap: L('Цагаан хэрэм', 'The Great Wall', '长城') },
    { src: P.city, cap: L('Шанхай', 'Shanghai', '上海') },
    { src: P.korea, cap: L('Сөүл', 'Seoul', '首尔') },
    { src: P.dubai, cap: L('Дубай', 'Dubai', '迪拜') },
    { src: P.japan, cap: L('Япон', 'Japan', '日本') },
    { src: P.thai, cap: L('Тайланд', 'Thailand', '泰国') },
    { src: P.turkey, cap: L('Турк', 'Türkiye', '土耳其') }
  ],
  stats: [
    { n: '7', label: L('улс руу аялал', 'countries', '个国家') },
    { n: '90', label: L('оюутныг дадлагад хүргэсэн', 'students on a study trip', '名学生参加实习考察') },
    { n: '100%', label: L('тэтгэлэгт хөтөлбөр', 'funded scholarships', '全额奖学金') }
  ],
  countries: [
    { c: 'cn', name: L('Хятад', 'China', '中国'), img: P.wall, note: L('Бээжин, Шанхай, Хайнан, Хөх хот, Жанжиажэ', 'Beijing, Shanghai, Hainan, Hohhot, Zhangjiajie', '北京、上海、海南、呼和浩特、张家界') },
    { c: 'kr', name: L('Солонгос', 'South Korea', '韩国'), img: P.korea, note: L('Чэжү, Инчон. Круйзээр', 'Jeju and Incheon, by cruise', '济州、仁川（邮轮）') },
    { c: 'jp', name: L('Япон', 'Japan', '日本'), img: P.japan, note: L('Фукуока, Нагасаки, Сасебо. Круйзээр', 'Fukuoka, Nagasaki, Sasebo, by cruise', '福冈、长崎、佐世保（邮轮）') },
    { c: 'ae', name: L('АНЭУ', 'UAE', '阿联酋'), img: P.dubai, note: L('Дубай', 'Dubai', '迪拜') },
    { c: 'vn', name: L('Вьетнам', 'Vietnam', '越南'), img: P.viet, note: L('Чөлөөт аялал', 'Independent travel', '自由行') },
    { c: 'th', name: L('Тайланд', 'Thailand', '泰国'), img: P.thai, note: L('Чөлөөт аялал', 'Independent travel', '自由行') },
    { c: 'tr', name: L('Турк', 'Türkiye', '土耳其'), img: P.turkey, note: L('Чөлөөт аялал', 'Independent travel', '自由行') }
  ],
  typical: [L('4–5 одтой буудал', '4–5 star hotel', '四至五星级酒店'), L('Хөтөч', 'Guide', '导游'), L('Орчуулагч', 'Interpreter', '翻译'), L('Даатгал', 'Insurance', '保险'), L('Автобус', 'Coach', '大巴')],
  faq: [
    { q: L('Аяллын үнэд юу багтдаг вэ?', 'What does the price include?', '价格包含哪些？'), a: L('Ихэвчлэн 4–5 одтой буудал, хөтөч, орчуулагч, даатгал, автобус багтдаг. Аялал бүрт ялгаатай тул дэлгэрэнгүйг утсаар лавлана уу.',
     'Usually a 4–5 star hotel, a guide, an interpreter, insurance and coach transport. It varies by tour, so please call us for details.',
     '通常包含四至五星级酒店、导游、翻译、保险和大巴。各线路不同，详情请致电咨询。') },
    { q: L('Хөнгөлөлт байдаг уу?', 'Are there discounts?', '有优惠吗？'), a: L('Гэр бүл эсвэл хамт олон 5-аас дээш хүнтэй бол үнэ хямдарна. Canton Fair бизнес аялалд баг бүрдвэл хямдралтай.',
     'Families and groups of five or more get a lower price. The Canton Fair business trip is also discounted for groups.',
     '家庭或5人以上团体享受优惠价。广交会商务考察组团另有优惠。') },
    { q: L('Хүүхдийн үнэ тусдаа юу?', 'Is there a child price?', '儿童有单独价格吗？'), a: L('Олон аялалд хүүхдийн үнэ тусдаа байдаг. Жишээ нь Шанхайн аялалд том хүн 3,490,000₮, хүүхэд 2,990,000₮.',
     'Many tours have a separate child price. For example, the Shanghai tour is 3,490,000₮ for adults and 2,990,000₮ for children.',
     '许多线路设有儿童价。例如上海线路成人3,490,000₮，儿童2,990,000₮。') },
    { q: L('Круйз аялал гэж юу вэ?', 'How do the cruises work?', '邮轮旅游是怎样的？'), a: L('Хятадын Тяньжин боомтоос хөлөг онгоцоор гарч Япон, Солонгосын хотуудаар аялдаг. 3 улсын круйз нь Тяньжин – Фукуока – Чэжү чиглэлд 15 давхар хөлгөөр явдаг.',
     'You sail from Tianjin in China and visit cities in Japan and South Korea. The 3-country cruise runs Tianjin – Fukuoka – Jeju on a 15-deck ship.',
     '从中国天津港登船，前往日本和韩国的城市。三国邮轮航线为天津—福冈—济州，乘坐15层邮轮。') },
    { q: L('Аялал хэр олон гардаг вэ?', 'How often do tours depart?', '多久出发一次？'), a: L('2024 оны зун Хятадын аяллууд долоо хоног бүрийн лхагва, ням гарагт гардаг байсан. Одоогийн хуваарийг утсаар лавлана уу.',
     'In summer 2024 our China tours left every Wednesday and Sunday. Call us for the current schedule.',
     '2024年夏季，中国线路每周三、周日出发。最新安排请致电咨询。') },
    { q: L('Тэтгэлгийн талаар хаанаас мэдэх вэ?', 'Where can I learn about scholarships?', '如何了解奖学金？'), a: L('Бакалавр, магистрын 100% тэтгэлэгт хөтөлбөрийн мэдээллийг daamworld.net сайтаас эсвэл утсаар лавлана уу.',
     'Details of the fully funded bachelor’s and master’s programmes are on daamworld.net, or call us.',
     '本科、硕士全额奖学金详情请访问 daamworld.net 或致电咨询。') }
  ],
  text: {}
};

/* ---------- Огноо ---------- */
export const todayUB = () => {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ulaanbaatar' }).format(new Date()); }
  catch (e) { return new Date().toISOString().slice(0, 10); }
};
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const fmtDate = (iso, lang) => {
  const [, m, d] = iso.split('-').map(Number);
  return lang === 'en' ? `${d} ${MON[m - 1]}` : lang === 'zh' ? `${m}月${d}日` : `${m} сарын ${d}`;
};
export const fmtMonth = (ym, lang) => {
  const [y, m] = ym.split('-').map(Number);
  return lang === 'en' ? `${MON[m - 1]} ${y}` : lang === 'zh' ? `${y}年${m}月` : `${y} оны ${m}-р сар`;
};

/* ---------- Аяллын төлөв ---------- */
// Ирээдүйд гарах өдрүүд (эсвэл аялал үргэлжилж байгаа бол эхний өдөр)
export function liveDepartures(tour, today = todayUB()) {
  const deps = [...(tour.departures || [])].filter(Boolean).sort();
  const future = deps.filter(d => d >= today);
  if (future.length) return future;
  if (tour.end && tour.end >= today && deps.length) return [deps[deps.length - 1]];
  return [];
}
export const isUpcoming = tour => liveDepartures(tour).length > 0;
export const seatsLeft = tour => tour.seats ? Math.max(0, tour.seats - (tour.booked || 0)) : null;
