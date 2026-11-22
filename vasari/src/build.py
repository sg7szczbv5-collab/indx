"""Build index.html (English) and ar.html (Arabic, RTL) from src/index.src.html."""
import pathlib, re
ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = (ROOT / "src/index.src.html").read_text(encoding="utf-8")
BASE = (ROOT / "src/fonts/base.css").read_text(encoding="utf-8")
ARAB = (ROOT / "src/fonts/arabic.css").read_text(encoding="utf-8")

def rep(html, pairs):
    for old, new in pairs:
        if html.count(old) < 1:
            raise SystemExit(f"pattern not found: {old[:70]!r}")
        html = html.replace(old, new)
    return html

(ROOT / "index.html").write_text(SRC.replace("/*FONTS*/", BASE), encoding="utf-8")

AR_FILMS = [
 ("The Silent Valley","الوادي الصامت","Drama","دراما","A schoolteacher returns to the mountain village that exiled her father, and finds the valley has kept every one of its secrets.","معلّمة تعود إلى القرية الجبلية التي نفت أباها، فتجد أن الوادي قد احتفظ بكل واحد من أسراره."),
 ("The Blue Hour","الساعة الزرقاء","Romance","رومانسي","Over one long evening in a harbour town, a widow and a stranger trade small lies until the light runs out.","خلال أمسية طويلة في بلدة مرفئية، تتبادل أرملة وغريب أكاذيب صغيرة حتى ينفد الضوء."),
 ("River of Salt","نهر الملح","Drama","دراما","Two brothers drag a salt barge downriver to a city that no longer wants anything they carry.","شقيقان يجرّان مركب ملح مع مجرى النهر إلى مدينة لم تعد تريد شيئًا مما يحملانه."),
 ("The Last Summer","الصيف الأخير","Drama","دراما","The summer before the dam floods their village, three friends set fire to everything they cannot take with them.","في الصيف الذي يسبق إغراق السدّ لقريتهم، يُضرم ثلاثة أصدقاء النار في كل ما لا يستطيعون أخذه معهم."),
 ("The Green Road","الطريق الأخضر","Mystery","غموض","A surveyor mapping a forest road keeps finding the same footprints, always one day ahead of him.","مسّاح يرسم خريطة طريق في الغابة يظلّ يجد آثار الأقدام نفسها، تسبقه دائمًا بيوم واحد."),
 ("Noon in Ashes","ظهيرة في الرماد","Western","ويسترن","A rider crosses a white desert to settle an old debt, and learns too late who sent him.","فارس يعبر صحراء بيضاء ليسدّد دَينًا قديمًا، ويعرف بعد فوات الأوان من الذي أرسله."),
 ("The Observer","المراقِب","Thriller","إثارة","A night watchman begins to suspect that the building he guards has started watching him back.","حارس ليلي يبدأ بالشكّ في أن المبنى الذي يحرسه قد بدأ يراقبه بدوره."),
 ("The Fallen Birds","الطيور الساقطة","Drama","دراما","When the birds stop singing over a frontier town, the mayor’s daughter is the only one who goes looking for the reason.","حين تكفّ الطيور عن الغناء فوق بلدة حدودية، تكون ابنة العمدة الوحيدة التي تبحث عن السبب."),
 ("Light in the Storm","ضوء في العاصفة","Drama","دراما","A lighthouse keeper and his son wait out a three-day storm with a shipwrecked sailor who will not give his name.","حارس منارة وابنه ينتظران انقضاء عاصفة تدوم ثلاثة أيام مع بحّار ناجٍ من الغرق يرفض أن يذكر اسمه."),
 ("The Long Tide","المدّ الطويل","Drama","دراما","A fisherman’s wife counts the tides on the harbour wall while her husband’s boat fails to come home.","زوجة صيّاد تعدّ موجات المدّ على جدار المرفأ بينما لا يعود قارب زوجها إلى البيت."),
 ("A Quiet War","حرب هادئة","Comedy","كوميديا","Two neighbours fight a silent war over a garden wall for thirty years, and neither will say how it began.","جاران يخوضان حربًا صامتة حول جدار حديقة طوال ثلاثين عامًا، ولا يقول أيّ منهما كيف بدأت."),
 ("Red Door","الباب الأحمر","Thriller","إثارة","A projectionist follows a reel of unknown film through the corridors of a cinema on its final night.","عامل عرض يتتبّع بكرة فيلم مجهول عبر ممرات صالة سينما في ليلتها الأخيرة."),
]

ar = SRC
pairs = [
 ('<html lang="en">', '<html lang="ar" dir="rtl">'),
 ('<title>Leon Vasari — Film Archive</title>', '<title>ليون فاساري — أرشيف الأفلام</title>'),
 ('--sans:"Inter Tight","Noto Sans JP",system-ui,sans-serif;', '--sans:"IBM Plex Sans Arabic","Inter Tight","Noto Sans JP",system-ui,sans-serif;'),
 ('--serif:"Newsreader",Georgia,serif;', '--serif:"Noto Naskh Arabic","Newsreader",Georgia,serif;'),
 # Arabic must not be letter-spaced (it breaks the joins); sizes nudged up for legibility
 ('.box{', '[lang=ar] .lbl{font-size:12px;letter-spacing:0;line-height:1.2}\n[lang=ar] .c-sub{font-size:10px;letter-spacing:.18em}\n[lang=ar] .c-title,[lang=ar] .d-title{letter-spacing:0;line-height:1.3}\n[lang=ar] .c-year{font-size:12px;letter-spacing:0}\n[lang=ar] .d-syn{font-size:18px;line-height:1.8}\n[lang=ar] .d-credit{font-style:normal;font-size:15px}\n[lang=ar] .cursor .clabel{letter-spacing:0;font-size:11px}\n[lang=ar] .d-close{left:auto;right:36px}\n[lang=ar] .d-brand{right:auto;left:36px}\n@media (max-width:767px){[lang=ar] .d-close{right:16px}[lang=ar] .d-brand{left:16px}}\n.box{'),
 # shelf, arrows and timeline keep a left-to-right time axis
 ('<section class="shelf" aria-label="Film shelf">', '<section class="shelf" dir="ltr" aria-label="رفّ الأفلام">'),
 ('<div class="tl">', '<div class="tl" dir="ltr">'),
 ('<span class="lbl">Leon Vasari</span><i class="ln"></i><span class="lbl">Film Archive</span>', '<span class="lbl">ليون فاساري</span><i class="ln"></i><span class="lbl">أرشيف الأفلام</span>'),
 ('<a class="lbl" href="#" data-btn>Films</a>', '<a class="lbl" href="#" data-btn>الأفلام</a>'),
 ('<a class="lbl" href="#" data-btn>About</a>', '<a class="lbl" href="#" data-btn>نبذة</a>'),
 ('<a class="lbl" href="#" data-btn>Journal</a>', '<a class="lbl" href="#" data-btn>اليوميات</a>'),
 ('aria-label="Menu"', 'aria-label="القائمة"'),
 ('aria-label="Play"', 'aria-label="تشغيل"'),
 ('aria-label="Previous film"', 'aria-label="الفيلم السابق"'),
 ('aria-label="Next film"', 'aria-label="الفيلم التالي"'),
 ('<span class="lbl">© Leon Vasari. All rights reserved.</span>', '<span class="lbl">© ليون فاساري. جميع الحقوق محفوظة.</span>'),
 ('<span class="lbl soc">', '<span class="lbl soc" dir="ltr">'),
 ('aria-label="Film detail"', 'aria-label="تفاصيل الفيلم"'),
 ('>Close / 閉じる<', '>إغلاق / 閉じる<'),
 ('<span class="lbl">Leon Vasari</span><i style="display:block;width:40px;height:1px;background:currentColor"></i><span class="lbl">Film Archive</span>', '<span class="lbl">ليون فاساري</span><i style="display:block;width:40px;height:1px;background:currentColor"></i><span class="lbl">أرشيف الأفلام</span>'),
 ('>Written and directed by Leon Vasari. 監督作品<', '>تأليف وإخراج ليون فاساري. 監督作品<'),
 ('>Watch the film / 映画を見る<', '>شاهد الفيلم / 映画を見る<'),
 ('OPEN<br>開く', 'افتح<br>開く'),
 ('${f.year} — ${f.genre.toUpperCase()}', '${f.year} — ${f.genre}'),
 ('${f.year} / ${f.genre} / ${f.min} min', '${f.year} / ${f.genre} / ${f.min} دقيقة'),
]
for en_t, ar_t, en_g, ar_g, en_s, ar_s in AR_FILMS:
    pairs.append((f'"{en_t}","', f'"{ar_t}","'))
    pairs.append((f'"{en_s}"', f'"{ar_s}"'))
ar = rep(ar, pairs)
# genres live in the film rows as ,"Drama", etc.
for en_g, ar_g in {"Drama":"دراما","Romance":"رومانسي","Mystery":"غموض","Western":"ويسترن","Thriller":"إثارة","Comedy":"كوميديا"}.items():
    ar = re.sub(rf'(,\d{{4}},)"{en_g}"', rf'\1"{ar_g}"', ar)
ar = ar.replace("/*FONTS*/", BASE + "\n" + ARAB)
(ROOT / "ar.html").write_text(ar, encoding="utf-8")
print("built index.html and ar.html")
