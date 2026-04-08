/**
 * Localization System - Повна підтримка всіх мов світу
 * Multi-language support for Universal No-Code CMS
 */

class LocalizationSystem {
  constructor() {
    this.supportedLocales = new Map();
    this.translations = new Map();
    this.currentLocale = 'uk';
    this.fallbackLocale = 'en';
    this.autoDetect = true;
    
    this.initAllLocales();
  }

  /**
   * Ініціалізація всіх підтримуваних мов
   */
  initAllLocales() {
    // Європейські мови
    this.registerLocale('uk', 'Українська', 'ua', 'Europe/Kiev');
    this.registerLocale('en', 'English', 'us', 'America/New_York');
    this.registerLocale('pl', 'Polski', 'pl', 'Europe/Warsaw');
    this.registerLocale('de', 'Deutsch', 'de', 'Europe/Berlin');
    this.registerLocale('fr', 'Français', 'fr', 'Europe/Paris');
    this.registerLocale('es', 'Español', 'es', 'Europe/Madrid');
    this.registerLocale('it', 'Italiano', 'it', 'Europe/Rome');
    this.registerLocale('pt', 'Português', 'pt', 'Europe/Lisbon');
    this.registerLocale('nl', 'Nederlands', 'nl', 'Europe/Amsterdam');
    this.registerLocale('be', 'Беларуская', 'by', 'Europe/Minsk');
    this.registerLocale('ru', 'Русский', 'ru', 'Europe/Moscow');
    this.registerLocale('cs', 'Čeština', 'cz', 'Europe/Prague');
    this.registerLocale('sk', 'Slovenčina', 'sk', 'Europe/Bratislava');
    this.registerLocale('ro', 'Română', 'ro', 'Europe/Bucharest');
    this.registerLocale('bg', 'Български', 'bg', 'Europe/Sofia');
    this.registerLocale('sr', 'Српски', 'rs', 'Europe/Belgrade');
    this.registerLocale('hr', 'Hrvatski', 'hr', 'Europe/Zagreb');
    this.registerLocale('sl', 'Slovenščina', 'si', 'Europe/Ljubljana');
    this.registerLocale('lt', 'Lietuvių', 'lt', 'Europe/Vilnius');
    this.registerLocale('lv', 'Latviešu', 'lv', 'Europe/Riga');
    this.registerLocale('et', 'Eesti', 'ee', 'Europe/Tallinn');
    this.registerLocale('fi', 'Suomi', 'fi', 'Europe/Helsinki');
    this.registerLocale('sv', 'Svenska', 'se', 'Europe/Stockholm');
    this.registerLocale('no', 'Norsk', 'no', 'Europe/Oslo');
    this.registerLocale('da', 'Dansk', 'dk', 'Europe/Copenhagen');
    this.registerLocale('is', 'Íslenska', 'is', 'Atlantic/Reykjavik');
    this.registerLocale('ga', 'Gaeilge', 'ie', 'Europe/Dublin');
    this.registerLocale('cy', 'Cymraeg', 'gb-wls', 'Europe/London');
    this.registerLocale('mt', 'Malti', 'mt', 'Europe/Malta');
    this.registerLocale('el', 'Ελληνικά', 'gr', 'Europe/Athens');
    this.registerLocale('hu', 'Magyar', 'hu', 'Europe/Budapest');
    this.registerLocale('sq', 'Shqip', 'al', 'Europe/Tirane');
    this.registerLocale('mk', 'Македонски', 'mk', 'Europe/Skopje');
    this.registerLocale('bs', 'Bosanski', 'ba', 'Europe/Sarajevo');
    this.registerLocale('me', 'Crnogorski', 'me', 'Europe/Podgorica');
    this.registerLocale('eu', 'Euskara', 'es-pv', 'Europe/Madrid');
    this.registerLocale('ca', 'Català', 'es-ct', 'Europe/Barcelona');
    this.registerLocale('gl', 'Galego', 'es-ga', 'Europe/Madrid');
    this.registerLocale('lb', 'Lëtzebuergesch', 'lu', 'Europe/Luxembourg');
    this.registerLocale('fo', 'Føroyskt', 'fo', 'Atlantic/Faroe');

    // Азійські мови
    this.registerLocale('zh', '中文', 'cn', 'Asia/Shanghai');
    this.registerLocale('zh-TW', '繁體中文', 'tw', 'Asia/Taipei');
    this.registerLocale('ja', '日本語', 'jp', 'Asia/Tokyo');
    this.registerLocale('ko', '한국어', 'kr', 'Asia/Seoul');
    this.registerLocale('vi', 'Tiếng Việt', 'vn', 'Asia/Ho_Chi_Minh');
    this.registerLocale('th', 'ไทย', 'th', 'Asia/Bangkok');
    this.registerLocale('id', 'Bahasa Indonesia', 'id', 'Asia/Jakarta');
    this.registerLocale('ms', 'Bahasa Melayu', 'my', 'Asia/Kuala_Lumpur');
    this.registerLocale('tl', 'Filipino', 'ph', 'Asia/Manila');
    this.registerLocale('hi', 'हिन्दी', 'in', 'Asia/Kolkata');
    this.registerLocale('bn', 'বাংলা', 'bd', 'Asia/Dhaka');
    this.registerLocale('ur', 'اردو', 'pk', 'Asia/Karachi');
    this.registerLocale('ta', 'தமிழ்', 'lk', 'Asia/Colombo');
    this.registerLocale('te', 'తెలుగు', 'in-ap', 'Asia/Kolkata');
    this.registerLocale('mr', 'मराठी', 'in-mh', 'Asia/Kolkata');
    this.registerLocale('gu', 'ગુજરાતી', 'in-gj', 'Asia/Kolkata');
    this.registerLocale('kn', 'ಕನ್ನಡ', 'in-ka', 'Asia/Kolkata');
    this.registerLocale('ml', 'മലയാളം', 'in-kl', 'Asia/Kolkata');
    this.registerLocale('pa', 'ਪੰਜਾਬੀ', 'in-pb', 'Asia/Kolkata');
    this.registerLocale('ne', 'नेपाली', 'np', 'Asia/Kathmandu');
    this.registerLocale('si', 'සිංහල', 'lk', 'Asia/Colombo');
    this.registerLocale('km', 'ខ្មែរ', 'kh', 'Asia/Phnom_Penh');
    this.registerLocale('lo', 'ລາວ', 'la', 'Asia/Vientiane');
    this.registerLocale('my', 'မြန်မာ', 'mm', 'Asia/Yangon');
    this.registerLocale('ka', 'ქართული', 'ge', 'Asia/Tbilisi');
    this.registerLocale('hy', 'Հայերեն', 'am', 'Asia/Yerevan');
    this.registerLocale('az', 'Azərbaycan', 'az', 'Asia/Baku');
    this.registerLocale('uz', 'Oʻzbekcha', 'uz', 'Asia/Tashkent');
    this.registerLocale('kk', 'Қазақша', 'kz', 'Asia/Almaty');
    this.registerLocale('ky', 'Кыргызча', 'kg', 'Asia/Bishkek');
    this.registerLocale('tg', 'Тоҷикӣ', 'tj', 'Asia/Dushanbe');
    this.registerLocale('mn', 'Монгол', 'mn', 'Asia/Ulaanbaatar');
    this.registerLocale('bo', 'བོད་སྐད་', 'tibet', 'Asia/Thimphu');
    this.registerLocale('dz', 'རྫོང་ཁ', 'bt', 'Asia/Thimphu');

    // Близькосхідні мови
    this.registerLocale('ar', 'العربية', 'sa', 'Asia/Riyadh');
    this.registerLocale('he', 'עברית', 'il', 'Asia/Jerusalem');
    this.registerLocale('fa', 'فارسی', 'ir', 'Asia/Tehran');
    this.registerLocale('tr', 'Türkçe', 'tr', 'Europe/Istanbul');
    this.registerLocale('ku', 'Kurdî', 'iq', 'Asia/Baghdad');
    this.registerLocale('ps', 'پښتو', 'af', 'Asia/Kabul');
    this.registerLocale('sd', 'سنڌي', 'pk', 'Asia/Karachi');

    // Африканські мови
    this.registerLocale('sw', 'Kiswahili', 'ke', 'Africa/Nairobi');
    this.registerLocale('zu', 'isiZulu', 'za', 'Africa/Johannesburg');
    this.registerLocale('xh', 'isiXhosa', 'za', 'Africa/Johannesburg');
    this.registerLocale('af', 'Afrikaans', 'za', 'Africa/Johannesburg');
    this.registerLocale('am', 'አማርኛ', 'et', 'Africa/Addis_Ababa');
    this.registerLocale('ti', 'ትግርኛ', 'er', 'Africa/Asmara');
    this.registerLocale('so', 'Soomaali', 'so', 'Africa/Mogadishu');
    this.registerLocale('ha', 'Hausa', 'ng', 'Africa/Lagos');
    this.registerLocale('yo', 'Yorùbá', 'ng', 'Africa/Lagos');
    this.registerLocale('ig', 'Igbo', 'ng', 'Africa/Lagos');
    this.registerLocale('mg', 'Malagasy', 'mg', 'Indian/Antananarivo');
    this.registerLocale('rw', 'Kinyarwanda', 'rw', 'Africa/Kigali');
    this.registerLocale('rn', 'Kirundi', 'bi', 'Africa/Bujumbura');
    this.registerLocale('lg', 'Luganda', 'ug', 'Africa/Kampala');
    this.registerLocale('ak', 'Akan', 'gh', 'Africa/Accra');
    this.registerLocale('tw', 'Twi', 'gh', 'Africa/Accra');
    this.registerLocale('sn', 'chiShona', 'zw', 'Africa/Harare');
    this.registerLocale('st', 'Sesotho', 'ls', 'Africa/Maseru');
    this.registerLocale('tn', 'Setswana', 'bw', 'Africa/Gaborone');
    this.registerLocale('ss', 'SiSwati', 'sz', 'Africa/Mbabane');
    this.registerLocale('ve', 'Tshivenda', 'za', 'Africa/Johannesburg');
    this.registerLocale('ts', 'Xitsonga', 'za', 'Africa/Johannesburg');
    this.registerLocale('nr', 'isiNdebele', 'za', 'Africa/Johannesburg');

    // Американські мови
    this.registerLocale('qu', 'Runasimi', 'pe', 'America/Lima');
    this.registerLocale('ay', 'Aymar', 'bo', 'America/La_Paz');
    this.registerLocale('gn', 'Avañe\'ẽ', 'py', 'America/Asuncion');

    // Океанія
    this.registerLocale('mi', 'Māori', 'nz', 'Pacific/Auckland');
    this.registerLocale('sm', 'Gagana Samoa', 'ws', 'Pacific/Apia');
    this.registerLocale('to', 'Lea Faka-Tonga', 'to', 'Pacific/Tongatapu');
    this.registerLocale('fj', 'Vosa Vakaviti', 'fj', 'Pacific/Fiji');
    this.registerLocale('haw', 'ʻŌlelo Hawaiʻi', 'us-hi', 'Pacific/Honolulu');

    // Штучні та спеціальні мови
    this.registerLocale('eo', 'Esperanto', 'world', 'UTC');
    this.registerLocale('ia', 'Interlingua', 'world', 'UTC');
    this.registerLocale('vo', 'Volapük', 'world', 'UTC');
    this.registerLocale('jbo', 'Lojban', 'world', 'UTC');
    this.registerLocale('lat', 'Latine', 'va', 'Europe/Vatican');
    this.registerLocale('grc', 'Ἀρχαία Ἑλληνική', 'gr', 'Europe/Athens');
    this.registerLocale('got', '𐌲𐌿𐍄𐌹𐍃𐌺', 'world', 'UTC');
    this.registerLocale('non', 'Norrœnt', 'is', 'Atlantic/Reykjavik');
    this.registerLocale('ang', 'Ænglisc', 'gb', 'Europe/London');

    // Мови програмування (для код-блоків)
    this.registerLocale('code-js', 'JavaScript', 'dev', 'UTC');
    this.registerLocale('code-py', 'Python', 'dev', 'UTC');
    this.registerLocale('code-java', 'Java', 'dev', 'UTC');
    this.registerLocale('code-cpp', 'C++', 'dev', 'UTC');
    this.registerLocale('code-cs', 'C#', 'dev', 'UTC');
    this.registerLocale('code-php', 'PHP', 'dev', 'UTC');
    this.registerLocale('code-rb', 'Ruby', 'dev', 'UTC');
    this.registerLocale('code-go', 'Go', 'dev', 'UTC');
    this.registerLocale('code-rs', 'Rust', 'dev', 'UTC');
    this.registerLocale('code-swift', 'Swift', 'dev', 'UTC');
    this.registerLocale('code-kt', 'Kotlin', 'dev', 'UTC');
    this.registerLocale('code-ts', 'TypeScript', 'dev', 'UTC');
    this.registerLocale('code-sql', 'SQL', 'dev', 'UTC');
    this.registerLocale('code-html', 'HTML', 'dev', 'UTC');
    this.registerLocale('code-css', 'CSS', 'dev', 'UTC');
    this.registerLocale('code-sh', 'Shell', 'dev', 'UTC');

    // Регіональні варіанти основних мов
    this.registerLocale('en-US', 'English (US)', 'us', 'America/New_York');
    this.registerLocale('en-GB', 'English (UK)', 'gb', 'Europe/London');
    this.registerLocale('en-AU', 'English (AU)', 'au', 'Australia/Sydney');
    this.registerLocale('en-CA', 'English (CA)', 'ca', 'America/Toronto');
    this.registerLocale('en-IN', 'English (IN)', 'in', 'Asia/Kolkata');
    this.registerLocale('en-ZA', 'English (ZA)', 'za', 'Africa/Johannesburg');
    this.registerLocale('en-NG', 'English (NG)', 'ng', 'Africa/Lagos');
    this.registerLocale('en-KE', 'English (KE)', 'ke', 'Africa/Nairobi');
    this.registerLocale('en-PH', 'English (PH)', 'ph', 'Asia/Manila');
    this.registerLocale('en-SG', 'English (SG)', 'sg', 'Asia/Singapore');
    
    this.registerLocale('es-ES', 'Español (España)', 'es', 'Europe/Madrid');
    this.registerLocale('es-MX', 'Español (México)', 'mx', 'America/Mexico_City');
    this.registerLocale('es-AR', 'Español (Argentina)', 'ar', 'America/Argentina/Buenos_Aires');
    this.registerLocale('es-CO', 'Español (Colombia)', 'co', 'America/Bogota');
    this.registerLocale('es-CL', 'Español (Chile)', 'cl', 'America/Santiago');
    this.registerLocale('es-PE', 'Español (Perú)', 'pe', 'America/Lima');
    this.registerLocale('es-VE', 'Español (Venezuela)', 've', 'America/Caracas');
    this.registerLocale('es-EC', 'Español (Ecuador)', 'ec', 'America/Guayaquil');
    this.registerLocale('es-GT', 'Español (Guatemala)', 'gt', 'America/Guatemala');
    this.registerLocale('es-CU', 'Español (Cuba)', 'cu', 'America/Havana');
    this.registerLocale('es-BO', 'Español (Bolivia)', 'bo', 'America/La_Paz');
    this.registerLocale('es-DO', 'Español (Rep. Dominicana)', 'do', 'America/Santo_Domingo');
    this.registerLocale('es-HN', 'Español (Honduras)', 'hn', 'America/Tegucigalpa');
    this.registerLocale('es-PY', 'Español (Paraguay)', 'py', 'America/Asuncion');
    this.registerLocale('es-SV', 'Español (El Salvador)', 'sv', 'America/El_Salvador');
    this.registerLocale('es-NI', 'Español (Nicaragua)', 'ni', 'America/Managua');
    this.registerLocale('es-CR', 'Español (Costa Rica)', 'cr', 'America/Costa_Rica');
    this.registerLocale('es-PA', 'Español (Panamá)', 'pa', 'America/Panama');
    this.registerLocale('es-UY', 'Español (Uruguay)', 'uy', 'America/Montevideo');
    this.registerLocale('es-PR', 'Español (Puerto Rico)', 'pr', 'America/Puerto_Rico');

    this.registerLocale('pt-PT', 'Português (Portugal)', 'pt', 'Europe/Lisbon');
    this.registerLocale('pt-BR', 'Português (Brasil)', 'br', 'America/Sao_Paulo');
    this.registerLocale('pt-AO', 'Português (Angola)', 'ao', 'Africa/Luanda');
    this.registerLocale('pt-MZ', 'Português (Moçambique)', 'mz', 'Africa/Maputo');
    this.registerLocale('pt-CV', 'Português (Cabo Verde)', 'cv', 'Atlantic/Cape_Verde');
    this.registerLocale('pt-GW', 'Português (Guiné-Bissau)', 'gw', 'Africa/Bissau');
    this.registerLocale('pt-ST', 'Português (São Tomé)', 'st', 'Africa/Sao_Tome');
    this.registerLocale('pt-TL', 'Português (Timor-Leste)', 'tl', 'Asia/Dili');

    this.registerLocale('fr-FR', 'Français (France)', 'fr', 'Europe/Paris');
    this.registerLocale('fr-CA', 'Français (Canada)', 'ca-qc', 'America/Montreal');
    this.registerLocale('fr-BE', 'Français (Belgique)', 'be-wa', 'Europe/Brussels');
    this.registerLocale('fr-CH', 'Français (Suisse)', 'ch', 'Europe/Zurich');
    this.registerLocale('fr-LU', 'Français (Luxembourg)', 'lu', 'Europe/Luxembourg');
    this.registerLocale('fr-MC', 'Français (Monaco)', 'mc', 'Europe/Monaco');
    this.registerLocale('fr-SN', 'Français (Sénégal)', 'sn', 'Africa/Dakar');
    this.registerLocale('fr-CI', 'Français (Côte d\'Ivoire)', 'ci', 'Africa/Abidjan');
    this.registerLocale('fr-ML', 'Français (Mali)', 'ml', 'Africa/Bamako');
    this.registerLocale('fr-BF', 'Français (Burkina Faso)', 'bf', 'Africa/Ouagadougou');
    this.registerLocale('fr-NE', 'Français (Niger)', 'ne', 'Africa/Niamey');
    this.registerLocale('fr-TD', 'Français (Tchad)', 'td', 'Africa/Ndjamena');
    this.registerLocale('fr-MG', 'Français (Madagascar)', 'mg', 'Indian/Antananarivo');
    this.registerLocale('fr-CM', 'Français (Cameroun)', 'cm', 'Africa/Douala');
    this.registerLocale('fr-CD', 'Français (RDC)', 'cd', 'Africa/Kinshasa');
    this.registerLocale('fr-CG', 'Français (Congo)', 'cg', 'Africa/Brazzaville');
    this.registerLocale('fr-GA', 'Français (Gabon)', 'ga', 'Africa/Libreville');
    this.registerLocale('fr-GN', 'Français (Guinée)', 'gn', 'Africa/Conakry');
    this.registerLocale('fr-HT', 'Français (Haïti)', 'ht', 'America/Port-au-Prince');

    this.registerLocale('de-DE', 'Deutsch (Deutschland)', 'de', 'Europe/Berlin');
    this.registerLocale('de-AT', 'Deutsch (Österreich)', 'at', 'Europe/Vienna');
    this.registerLocale('de-CH', 'Deutsch (Schweiz)', 'ch', 'Europe/Zurich');
    this.registerLocale('de-LI', 'Deutsch (Liechtenstein)', 'li', 'Europe/Vaduz');
    this.registerLocale('de-LU', 'Deutsch (Luxemburg)', 'lu', 'Europe/Luxembourg');
    this.registerLocale('de-BE', 'Deutsch (Belgien)', 'be-de', 'Europe/Brussels');

    this.registerLocale('ar-SA', 'العربية (السعودية)', 'sa', 'Asia/Riyadh');
    this.registerLocale('ar-EG', 'العربية (مصر)', 'eg', 'Africa/Cairo');
    this.registerLocale('ar-AE', 'العربية (الإمارات)', 'ae', 'Asia/Dubai');
    this.registerLocale('ar-LB', 'العربية (لبنان)', 'lb', 'Asia/Beirut');
    this.registerLocale('ar-JO', 'العربية (الأردن)', 'jo', 'Asia/Amman');
    this.registerLocale('ar-IQ', 'العربية (العراق)', 'iq', 'Asia/Baghdad');
    this.registerLocale('ar-KW', 'العربية (الكويت)', 'kw', 'Asia/Kuwait');
    this.registerLocale('ar-QA', 'العربية (قطر)', 'qa', 'Asia/Qatar');
    this.registerLocale('ar-BH', 'العربية (البحرين)', 'bh', 'Asia/Bahrain');
    this.registerLocale('ar-OM', 'العربية (عمان)', 'om', 'Asia/Muscat');
    this.registerLocale('ar-YE', 'العربية (اليمن)', 'ye', 'Asia/Aden');
    this.registerLocale('ar-SY', 'العربية (سوريا)', 'sy', 'Asia/Damascus');
    this.registerLocale('ar-PS', 'العربية (فلسطين)', 'ps', 'Asia/Gaza');
    this.registerLocale('ar-LY', 'العربية (ليبيا)', 'ly', 'Africa/Tripoli');
    this.registerLocale('ar-TN', 'العربية (تونس)', 'tn', 'Africa/Tunis');
    this.registerLocale('ar-DZ', 'العربية (الجزائر)', 'dz', 'Africa/Algiers');
    this.registerLocale('ar-MA', 'العربية (المغرب)', 'ma', 'Africa/Casablanca');
    this.registerLocale('ar-MR', 'العربية (موريتانيا)', 'mr', 'Africa/Nouakchott');
    this.registerLocale('ar-SD', 'العربية (السودان)', 'sd', 'Africa/Khartoum');
    this.registerLocale('ar-SO', 'العربية (الصومال)', 'so', 'Africa/Mogadishu');
    this.registerLocale('ar-DJ', 'العربية (جيبوتي)', 'dj', 'Africa/Djibouti');
    this.registerLocale('ar-KM', 'العربية (جزر القمر)', 'km', 'Indian/Comoro');

    this.registerLocale('zh-CN', '简体中文', 'cn', 'Asia/Shanghai');
    this.registerLocale('zh-HK', '繁體中文 (香港)', 'hk', 'Asia/Hong_Kong');
    this.registerLocale('zh-MO', '繁體中文 (澳門)', 'mo', 'Asia/Macau');

    this.registerLocale('sr-Cyrl', 'Српски (ћирилица)', 'rs', 'Europe/Belgrade');
    this.registerLocale('sr-Latn', 'Srpski (latinica)', 'rs', 'Europe/Belgrade');
    this.registerLocale('bs-Cyrl', 'Босански (ћирилица)', 'ba', 'Europe/Sarajevo');
    this.registerLocale('bs-Latn', 'Bosanski (latinica)', 'ba', 'Europe/Sarajevo');
    this.registerLocale('mn-Cyrl', 'Монгол (кирилл)', 'mn', 'Asia/Ulaanbaatar');
    this.registerLocale('mn-Mong', 'ᠮᠣᠩᠭᠣᠯ ᠬᠡᠯᠡ', 'mn', 'Asia/Ulaanbaatar');

    this.registerLocale('fa-AF', 'فارسی (افغانستان)', 'af', 'Asia/Kabul');
    this.registerLocale('fa-TJ', 'Тоҷикӣ (форсӣ)', 'tj', 'Asia/Dushanbe');

    this.registerLocale('uz-Latn', 'Oʻzbekcha (lotin)', 'uz', 'Asia/Tashkent');
    this.registerLocale('uz-Cyrl', 'Ўзбекча (кирилл)', 'uz', 'Asia/Tashkent');

    this.registerLocale('az-Latn', 'Azərbaycan (latın)', 'az', 'Asia/Baku');
    this.registerLocale('az-Cyrl', 'Азәрбајҹан (кирил)', 'az', 'Asia/Baku');

    this.registerLocale('tk', 'Türkmençe', 'tm', 'Asia/Ashgabat');
    this.registerLocale('crh', 'Qırımtatarca', 'ua-cr', 'Europe/Simferopol');

    // Діалекти та регіональні варіанти
    this.registerLocale('it-CH', 'Italiano (Svizzera)', 'ch', 'Europe/Zurich');
    this.registerLocale('rm', 'Rumantsch', 'ch-gr', 'Europe/Zurich');
    this.registerLocale('fur', 'Furlan', 'it-friuli', 'Europe/Rome');
    this.registerLocale('sc', 'Sardu', 'it-sardegna', 'Europe/Rome');
    this.registerLocale('co', 'Corsu', 'fr-corsica', 'Europe/Paris');
    this.registerLocale('oc', 'Occitan', 'fr-oc', 'Europe/Paris');
    this.registerLocale('br', 'Brezhoneg', 'fr-bretagne', 'Europe/Paris');
    this.registerLocale('gd', 'Gàidhlig', 'gb-sct', 'Europe/London');
    this.registerLocale('gv', 'Gaelg', 'im', 'Europe/Isle_of_Man');
    this.registerLocale('kw', 'Kernewek', 'gb-con', 'Europe/London');

    // Мови індії (додаткові)
    this.registerLocale('or', 'ଓଡ଼ିଆ', 'in-or', 'Asia/Kolkata');
    this.registerLocale('as', 'অসমীয়া', 'in-as', 'Asia/Kolkata');
    this.registerLocale('mai', 'मैथिली', 'in-br', 'Asia/Kolkata');
    this.registerLocale('bho', 'भोजपुरी', 'in-up', 'Asia/Kolkata');
    this.registerLocale('new', 'नेपाल भाषा', 'np', 'Asia/Kathmandu');
    this.registerLocale('pi', 'पाऴि', 'world', 'UTC');
    this.registerLocale('sa', 'संस्कृतम्', 'in', 'Asia/Kolkata');
    this.registerLocale('sd-Arab', 'سنڌي', 'pk', 'Asia/Karachi');
    this.registerLocale('sd-Deva', 'सिन्धी', 'in', 'Asia/Kolkata');

    // Інші важливі мови
    this.registerLocale('yi', 'ייִדיש', 'world', 'UTC');
    this.registerLocale('lad', 'Judeo-Español', 'world', 'UTC');
    this.registerLocale('jv', 'Basa Jawa', 'id-jt', 'Asia/Jakarta');
    this.registerLocale('su', 'Basa Sunda', 'id-jb', 'Asia/Jakarta');
    this.registerLocale('bjn', 'Bahasa Banjar', 'id-ks', 'Asia/Makassar');
    this.registerLocale('mad', 'Basa Madhurâ', 'id-ji', 'Asia/Jakarta');
    this.registerLocale('bug', 'ᨅᨔ ᨕᨘᨁᨗ', 'id-sn', 'Asia/Makassar');
    this.registerLocale('mak', 'ᨅᨔ ᨆᨀᨔᨑᨨ', 'id-sn', 'Asia/Makassar');
    this.registerLocale('ace', 'Bahsa Acèh', 'id-ac', 'Asia/Jakarta');
    this.registerLocale('ban', 'ᬪᬵᬱᬩᬮᬶ', 'id-ba', 'Asia/Makassar');
    this.registerLocale('min', 'Baso Minangkabau', 'id-sb', 'Asia/Jakarta');
    this.registerLocale('bbc', 'Batak Toba', 'id-su', 'Asia/Jakarta');
    this.registerLocale('bew', 'Betawi', 'id-jk', 'Asia/Jakarta');
    this.registerLocale('nij', 'Ngaju', 'id-kt', 'Asia/Pontianak');
    this.registerLocale('gay', 'Gayo', 'id-ac', 'Asia/Jakarta');
    this.registerLocale('rej', 'Rejang', 'id-be', 'Asia/Jakarta');
    this.registerLocale('sas', 'Basa Sasak', 'id-nb', 'Asia/Makassar');
    this.registerLocale('tor', 'Baso Toraja', 'id-sn', 'Asia/Makassar');
  }

  /**
   * Реєстрація локалі
   */
  registerLocale(code, name, country, timezone) {
    this.supportedLocales.set(code, {
      code,
      name,
      country,
      timezone,
      direction: this.getTextDirection(code),
      pluralRules: this.getPluralRules(code)
    });
    return this;
  }

  /**
   * Визначення напрямку тексту (LTR/RTL)
   */
  getTextDirection(locale) {
    const rtlLocales = ['ar', 'he', 'fa', 'ur', 'ps', 'sd', 'yi', 'lad'];
    const baseLocale = locale.split('-')[0];
    return rtlLocales.includes(baseLocale) ? 'rtl' : 'ltr';
  }

  /**
   * Правила множини для локалі
   */
  getPluralRules(locale) {
    // Спрощена реалізація, можна розширити
    const baseLocale = locale.split('-')[0];
    
    if (['zh', 'ja', 'ko', 'th', 'vi', 'id'].includes(baseLocale)) {
      return (n) => 0; // Немає множини
    }
    
    if (['ru', 'uk', 'be', 'sr', 'hr', 'bs', 'mk', 'bg'].includes(baseLocale)) {
      return (n) => {
        n = Math.abs(n);
        if (n % 10 === 1 && n % 100 !== 11) return 0; // однина
        if (n % 10 >= 2 && n % 10 <= 4 && (n % 100 < 10 || n % 100 >= 20)) return 1; // множина 1
        return 2; // множина 2
      };
    }
    
    // Стандартні правила для більшості мов
    return (n) => n === 1 ? 0 : 1;
  }

  /**
   * Встановлення поточної локалі
   */
  setLocale(locale) {
    if (!this.supportedLocales.has(locale)) {
      console.warn(`Locale "${locale}" not supported, falling back to "${this.fallbackLocale}"`);
      locale = this.fallbackLocale;
    }
    this.currentLocale = locale;
    return this;
  }

  /**
   * Отримання поточної локалі
   */
  getLocale() {
    return this.currentLocale;
  }

  /**
   * Отримання інформації про локаль
   */
  getLocaleInfo(locale) {
    return this.supportedLocales.get(locale) || null;
  }

  /**
   * Отримання всіх підтримуваних локалей
   */
  getAllLocales() {
    return Array.from(this.supportedLocales.values());
  }

  /**
   * Отримання назв мов рідною мовою
   */
  getNativeNames() {
    const result = {};
    this.supportedLocales.forEach((info, code) => {
      result[code] = info.name;
    });
    return result;
  }

  /**
   * Отримання назв мов англійською
   */
  getEnglishNames() {
    const englishNames = {
      'uk': 'Ukrainian',
      'en': 'English',
      'pl': 'Polish',
      'de': 'German',
      'fr': 'French',
      'es': 'Spanish',
      'it': 'Italian',
      'pt': 'Portuguese',
      'nl': 'Dutch',
      'be': 'Belarusian',
      'ru': 'Russian',
      'cs': 'Czech',
      'sk': 'Slovak',
      'ro': 'Romanian',
      'bg': 'Bulgarian',
      'sr': 'Serbian',
      'hr': 'Croatian',
      'sl': 'Slovenian',
      'lt': 'Lithuanian',
      'lv': 'Latvian',
      'et': 'Estonian',
      'fi': 'Finnish',
      'sv': 'Swedish',
      'no': 'Norwegian',
      'da': 'Danish',
      'is': 'Icelandic',
      'ga': 'Irish',
      'cy': 'Welsh',
      'mt': 'Maltese',
      'el': 'Greek',
      'hu': 'Hungarian',
      'sq': 'Albanian',
      'mk': 'Macedonian',
      'bs': 'Bosnian',
      'zh': 'Chinese',
      'ja': 'Japanese',
      'ko': 'Korean',
      'vi': 'Vietnamese',
      'th': 'Thai',
      'id': 'Indonesian',
      'ms': 'Malay',
      'tl': 'Filipino',
      'hi': 'Hindi',
      'bn': 'Bengali',
      'ur': 'Urdu',
      'ar': 'Arabic',
      'he': 'Hebrew',
      'fa': 'Persian',
      'tr': 'Turkish',
      'sw': 'Swahili',
      'zu': 'Zulu',
      'xh': 'Xhosa',
      'af': 'Afrikaans',
      'eo': 'Esperanto',
      'lat': 'Latin',
      'mi': 'Maori'
    };

    const result = {};
    this.supportedLocales.forEach((info, code) => {
      result[code] = englishNames[code] || info.name;
    });
    return result;
  }

  /**
   * Форматування дати
   */
  formatDate(date, locale = null, options = {}) {
    const loc = locale || this.currentLocale;
    const dateObj = date instanceof Date ? date : new Date(date);
    
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };

    const formatOptions = { ...defaultOptions, ...options };
    
    try {
      return new Intl.DateTimeFormat(loc, formatOptions).format(dateObj);
    } catch (error) {
      return new Intl.DateTimeFormat(this.fallbackLocale, formatOptions).format(dateObj);
    }
  }

  /**
   * Форматування часу
   */
  formatTime(time, locale = null, options = {}) {
    const loc = locale || this.currentLocale;
    const timeObj = time instanceof Date ? time : new Date(time);
    
    const defaultOptions = {
      hour: '2-digit',
      minute: '2-digit'
    };

    const formatOptions = { ...defaultOptions, ...options };
    
    try {
      return new Intl.DateTimeFormat(loc, formatOptions).format(timeObj);
    } catch (error) {
      return new Intl.DateTimeFormat(this.fallbackLocale, formatOptions).format(timeObj);
    }
  }

  /**
   * Форматування дати і часу
   */
  formatDateTime(dateTime, locale = null, options = {}) {
    const loc = locale || this.currentLocale;
    const dtObj = dateTime instanceof Date ? dateTime : new Date(dateTime);
    
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };

    const formatOptions = { ...defaultOptions, ...options };
    
    try {
      return new Intl.DateTimeFormat(loc, formatOptions).format(dtObj);
    } catch (error) {
      return new Intl.DateTimeFormat(this.fallbackLocale, formatOptions).format(dtObj);
    }
  }

  /**
   * Форматування чисел
   */
  formatNumber(number, locale = null, options = {}) {
    const loc = locale || this.currentLocale;
    
    const defaultOptions = {};
    const formatOptions = { ...defaultOptions, ...options };
    
    try {
      return new Intl.NumberFormat(loc, formatOptions).format(number);
    } catch (error) {
      return new Intl.NumberFormat(this.fallbackLocale, formatOptions).format(number);
    }
  }

  /**
   * Форматування валюти
   */
  formatCurrency(amount, currency, locale = null) {
    const loc = locale || this.currentLocale;
    
    try {
      return new Intl.NumberFormat(loc, {
        style: 'currency',
        currency: currency
      }).format(amount);
    } catch (error) {
      return new Intl.NumberFormat(this.fallbackLocale, {
        style: 'currency',
        currency: currency
      }).format(amount);
    }
  }

  /**
   * Форматування відсотків
   */
  formatPercent(value, locale = null, options = {}) {
    const loc = locale || this.currentLocale;
    
    const defaultOptions = {
      style: 'percent',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    };

    const formatOptions = { ...defaultOptions, ...options };
    
    try {
      return new Intl.NumberFormat(loc, formatOptions).format(value / 100);
    } catch (error) {
      return new Intl.NumberFormat(this.fallbackLocale, formatOptions).format(value / 100);
    }
  }

  /**
   * Множинність (pluralization)
   */
  pluralize(key, count, params = {}, locale = null) {
    const loc = locale || this.currentLocale;
    const pluralRule = this.supportedLocales.get(loc)?.pluralRules || ((n) => n === 1 ? 0 : 1);
    const pluralIndex = pluralRule(count);
    
    const translations = this.translations.get(loc) || {};
    const translation = translations[key];
    
    if (!translation) {
      return this.pluralize(key, count, params, this.fallbackLocale);
    }

    let text;
    if (Array.isArray(translation)) {
      text = translation[pluralIndex] || translation[translation.length - 1];
    } else if (typeof translation === 'object') {
      const keys = ['zero', 'one', 'two', 'few', 'many', 'other'];
      text = translation[keys[pluralIndex]] || translation.other || Object.values(translation)[0];
    } else {
      text = translation;
    }

    return this.interpolate(text, { count, ...params });
  }

  /**
   * Інтерполяція змінних у текст
   */
  interpolate(text, params) {
    if (!text) return '';
    
    return text.replace(/\{(\w+)\}/g, (match, key) => {
      return params.hasOwnProperty(key) ? params[key] : match;
    });
  }

  /**
   * Переклад тексту
   */
  translate(key, params = {}, locale = null) {
    const loc = locale || this.currentLocale;
    const translations = this.translations.get(loc) || {};
    
    let text = translations[key];
    
    if (!text) {
      // Спроба отримати з fallback локалі
      const fallbackTranslations = this.translations.get(this.fallbackLocale) || {};
      text = fallbackTranslations[key];
    }

    if (!text) {
      // Повернення ключа якщо переклад не знайдено
      text = key;
    }

    return this.interpolate(text, params);
  }

  /**
   * Скорочений метод для translate
   */
  t(key, params = {}, locale = null) {
    return this.translate(key, params, locale);
  }

  /**
   * Завантаження перекладів
   */
  loadTranslations(locale, translations) {
    if (!this.supportedLocales.has(locale)) {
      console.warn(`Cannot load translations for unsupported locale: ${locale}`);
      return this;
    }

    const existing = this.translations.get(locale) || {};
    this.translations.set(locale, { ...existing, ...translations });
    
    return this;
  }

  /**
   * Завантаження перекладів з файлу (JSON)
   */
  async loadTranslationsFromFile(locale, filePath) {
    const fs = require('fs').promises;
    const path = require('path');
    
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const translations = JSON.parse(content);
      return this.loadTranslations(locale, translations);
    } catch (error) {
      console.error(`Failed to load translations from ${filePath}:`, error.message);
      return this;
    }
  }

  /**
   * Отримання всіх перекладів для локалі
   */
  getTranslations(locale = null) {
    const loc = locale || this.currentLocale;
    return this.translations.get(loc) || {};
  }

  /**
   * Автоматичне визначення локалі з запиту
   */
  detectLocaleFromRequest(request) {
    // Accept-Language header
    const acceptLanguage = request.headers?.['accept-language'];
    
    if (acceptLanguage) {
      const languages = acceptLanguage.split(',').map(lang => {
        const [code, quality = 'q=1'] = lang.trim().split(';');
        return {
          code: code.trim(),
          quality: parseFloat(quality.split('=')[1]) || 1
        };
      });

      languages.sort((a, b) => b.quality - a.quality);

      for (const lang of languages) {
        if (this.supportedLocales.has(lang.code)) {
          return lang.code;
        }
        
        // Спроба знайти базову мову (наприклад, en з en-US)
        const baseLang = lang.code.split('-')[0];
        if (this.supportedLocales.has(baseLang)) {
          return baseLang;
        }
      }
    }

    // URL параметр
    const urlLocale = request.query?.locale || request.params?.locale;
    if (urlLocale && this.supportedLocales.has(urlLocale)) {
      return urlLocale;
    }

    // Cookie
    const cookieLocale = request.cookies?.locale;
    if (cookieLocale && this.supportedLocales.has(cookieLocale)) {
      return cookieLocale;
    }

    // Locale за замовчуванням
    return this.currentLocale;
  }

  /**
   * Middleware для Express
   */
  middleware() {
    return (req, res, next) => {
      if (this.autoDetect) {
        const detectedLocale = this.detectLocaleFromRequest(req);
        this.setLocale(detectedLocale);
        req.locale = detectedLocale;
      } else {
        req.locale = this.currentLocale;
      }

      req.t = (key, params) => this.translate(key, params, req.locale);
      req.__ = req.t;

      res.locals.locale = req.locale;
      res.locals.t = req.t;
      res.locals.__ = req.t;
      res.locals.localization = this;

      next();
    };
  }

  /**
   * Експорт перекладів у файл
   */
  async exportTranslations(locale, filePath) {
    const fs = require('fs').promises;
    const path = require('path');
    
    const translations = this.getTranslations(locale);
    
    try {
      const dir = path.dirname(filePath);
      await fs.mkdir(dir, { recursive: true });
      await fs.writeFile(filePath, JSON.stringify(translations, null, 2), 'utf-8');
      return true;
    } catch (error) {
      console.error(`Failed to export translations to ${filePath}:`, error.message);
      return false;
    }
  }

  /**
   * Генерація шаблону перекладів для нової локалі
   */
  generateTranslationTemplate(locale, baseLocale = 'en') {
    const baseTranslations = this.getTranslations(baseLocale);
    const template = {};

    Object.keys(baseTranslations).forEach(key => {
      template[key] = `[TRANSLATION_NEEDED:${key}]`;
    });

    return template;
  }

  /**
   * Перевірка наявності перекладів
   */
  hasTranslation(key, locale = null) {
    const loc = locale || this.currentLocale;
    const translations = this.translations.get(loc) || {};
    return translations.hasOwnProperty(key);
  }

  /**
   * Отримання відсутніх перекладів
   */
  getMissingTranslations(locale, baseLocale = 'en') {
    const baseTranslations = this.getTranslations(baseLocale);
    const targetTranslations = this.getTranslations(locale);
    const missing = [];

    Object.keys(baseTranslations).forEach(key => {
      if (!targetTranslations.hasOwnProperty(key)) {
        missing.push(key);
      }
    });

    return missing;
  }

  /**
   * Створення звіту про переклади
   */
  getTranslationReport() {
    const report = {
      totalLocales: this.supportedLocales.size,
      locales: {}
    };

    const baseTranslations = this.getTranslations(this.fallbackLocale);
    const totalKeys = Object.keys(baseTranslations).length;

    this.supportedLocales.forEach((info, code) => {
      const translations = this.getTranslations(code);
      const translatedKeys = Object.keys(translations).length;
      const percentage = totalKeys > 0 ? Math.round((translatedKeys / totalKeys) * 100) : 0;

      report.locales[code] = {
        name: info.name,
        translated: translatedKeys,
        total: totalKeys,
        percentage,
        missing: totalKeys - translatedKeys
      };
    });

    return report;
  }

  /**
   * Ініціалізація системи
   */
  async init(config = {}) {
    if (config.defaultLocale) {
      this.fallbackLocale = config.defaultLocale;
      this.currentLocale = config.defaultLocale;
    }

    if (config.supportedLocales) {
      // Фільтрація тільки потрібних локалей
      const filtered = new Map();
      config.supportedLocales.forEach(code => {
        if (this.supportedLocales.has(code)) {
          filtered.set(code, this.supportedLocales.get(code));
        }
      });
      this.supportedLocales = filtered;
    }

    if (config.translations) {
      Object.entries(config.translations).forEach(([locale, trans]) => {
        this.loadTranslations(locale, trans);
      });
    }

    if (config.autoDetect !== undefined) {
      this.autoDetect = config.autoDetect;
    }

    return this;
  }
}

module.exports = LocalizationSystem;
