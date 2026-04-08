# Система локалізації Universal No-Code CMS

## Огляд

CMS підтримує **250+ мов світу** з повною локалізацією інтерфейсу, контенту та форматування даних.

## Підтримувані мови

### Європейські мови (50+)
Українська, Англійська, Польська, Німецька, Французька, Іспанська, Італійська, Португальська, Нідерландська, Білоруська, Російська, Чеська, Словацька, Румунська, Болгарська, Сербська, Хорватська, Словенська, Литовська, Латвійська, Естонська, Фінська, Шведська, Норвезька, Данська, Ісландська, Ірландська, Валлійська, Мальтійська, Грецька, Угорська, Албанська, Македонська, Боснійська, Чорногорська, Баскська, Каталонська, Галісійська, Люксембурзька, Фарерська та інші.

### Азійські мови (40+)
Китайська (спрощена та традиційна), Японська, Корейська, В'єтнамська, Тайська, Індонезійська, Малайська, Філіппінська, Хінді, Бенгальська, Урду, Тамільська, Телугу, Маратхі, Гуджараті, Каннада, Малаялам, Пенджабі, Непальська, Сінгальська, Кхмерська, Лаоська, Бірманська, Грузинська, Вірменська, Азербайджанська, Узбецька, Казахська, Киргизька, Таджицька, Монгольська, Тибетська та інші.

### Близькосхідні мови (10+)
Арабська, Іврит, Перська, Турецька, Курдська, Пашто, Сіндхі та інші.

### Африканські мови (25+)
Суахілі, Зулу, Кхоса, Африкаанс, Амхарська, Тигринья, Сомалійська, Хауса, Йоруба, Ігбо, Малагасійська, Кіньяруанда, Кірунді, Луганда, Акан, Тві, Шона, Сесото, Сетсвана, Сісваті, Тshivenda, Xitsonga, isiNdebele та інші.

### Американські мови
Кечуа, Аймара, Гуарані.

### Океанія
Маорі, Самоанська, Тонганська, Фіджі, Гавайська.

### Штучні та класичні мови
Есперанто, Інтерлінгва, Волапюк, Ложбан, Латина, Давньогрецька, Готська, Давньоанглійська, Давньоскандинавська.

### Мови програмування (для код-блоків)
JavaScript, Python, Java, C++, C#, PHP, Ruby, Go, Rust, Swift, Kotlin, TypeScript, SQL, HTML, CSS, Shell.

### Регіональні варіанти (100+)
- Англійська: US, UK, AU, CA, IN, ZA, NG, KE, PH, SG
- Іспанська: España, México, Argentina, Colombia, Chile, Perú, Venezuela, Ecuador, Guatemala, Cuba, Bolivia, República Dominicana, Honduras, Paraguay, El Salvador, Nicaragua, Costa Rica, Panamá, Uruguay, Puerto Rico
- Португальська: Portugal, Brasil, Angola, Moçambique, Cabo Verde, Guiné-Bissau, São Tomé, Timor-Leste
- Французька: France, Canada, Belgique, Suisse, Luxembourg, Monaco, Sénégal, Côte d'Ivoire, Mali, Burkina Faso, Niger, Tchad, Madagascar, Cameroun, RDC, Congo, Gabon, Guinée, Haïti
- Німецька: Deutschland, Österreich, Schweiz, Liechtenstein, Luxemburg, Belgien
- Арабська: Saudi Arabia, Egypt, UAE, Lebanon, Jordan, Iraq, Kuwait, Qatar, Bahrain, Oman, Yemen, Syria, Palestine, Libya, Tunisia, Algeria, Morocco, Mauritania, Sudan, Somalia, Djibouti, Comoros
- Китайська: 简体中文, 繁體中文 (香港, 澳門)
- Сербська/Боснійська: Кирилиця, Latinica
- Монгольська: Кирилл, Традиційна

## Використання

### Базове використання

```javascript
const { createCMS } = require('./universal-cms');

const cms = createCMS({
  defaultLocale: 'uk',
  locales: ['uk', 'en', 'pl', 'de', 'fr']
});

await cms.init();

// Переклад тексту
cms.localization.t('common.save'); // "Зберегти"
cms.localization.t('common.save', {}, 'en'); // "Save"

// Форматування дати
cms.localization.formatDate(new Date()); // "8 квітня 2025"
cms.localization.formatDate(new Date(), 'en'); // "April 8, 2025"

// Форматування чисел
cms.localization.formatNumber(1234567.89); // "1 234 567,89"
cms.localization.formatNumber(1234567.89, 'en'); // "1,234,567.89"

// Форматування валюти
cms.localization.formatCurrency(1000, 'UAH'); // "1 000,00 ₴"
cms.localization.formatCurrency(1000, 'USD', 'en'); // "$1,000.00"

// Множинність
cms.localization.pluralize('time.minutes_ago', 1); // "1 хвилину тому"
cms.localization.pluralize('time.minutes_ago', 2); // "2 хвилини тому"
cms.localization.pluralize('time.minutes_ago', 5); // "5 хвилин тому"
```

### Завантаження перекладів

```javascript
// З файлу
await cms.localization.loadTranslationsFromFile('uk', './translations/uk.json');

// Програмно
cms.localization.loadTranslations('en', {
  'common.save': 'Save',
  'common.cancel': 'Cancel'
});
```

### Middleware для Express

```javascript
const express = require('express');
const app = express();

app.use(cms.localization.middleware());

app.get('/', (req, res) => {
  res.send(req.t('common.welcome'));
});
```

### Отримання інформації про мови

```javascript
// Всі підтримувані локалі
const allLocales = cms.localization.getAllLocales();

// Назви мов рідною мовою
const nativeNames = cms.localization.getNativeNames();

// Назви мов англійською
const englishNames = cms.localization.getEnglishNames();

// Інформація про конкретну локаль
const localeInfo = cms.localization.getLocaleInfo('uk');
// { code: 'uk', name: 'Українська', country: 'ua', timezone: 'Europe/Kiev', direction: 'ltr' }

// Напрямок тексту (LTR/RTL)
cms.localization.getLocaleInfo('ar').direction; // 'rtl'
cms.localization.getLocaleInfo('he').direction; // 'rtl'
cms.localization.getLocaleInfo('en').direction; // 'ltr'
```

### Автоматичне визначення мови

```javascript
// З HTTP запиту
const detectedLocale = cms.localization.detectLocaleFromRequest(req);

// Accept-Language header пріоритет
// Cookie locale
// URL параметр ?locale=en
```

### Експорт/Імпорт перекладів

```javascript
// Експорт у файл
await cms.localization.exportTranslations('uk', './translations/uk.json');

// Генерація шаблону для нової мови
const template = cms.localization.generateTranslationTemplate('ja', 'en');

// Отримання відсутніх перекладів
const missing = cms.localization.getMissingTranslations('ja', 'en');

// Звіт про переклади
const report = cms.localization.getTranslationReport();
```

## Структура файлів перекладів

```json
{
  "common.save": "Зберегти",
  "validation.required": "Це поле є обов'язковим",
  "time.minutes_ago": "{count} хвилин тому"
}
```

## API локалізації

| Метод | Опис |
|-------|------|
| `setLocale(locale)` | Встановити поточну локаль |
| `getLocale()` | Отримати поточну локаль |
| `t(key, params, locale)` | Перекласти текст |
| `translate(key, params, locale)` | Перекласти текст (повна назва) |
| `formatDate(date, locale, options)` | Форматувати дату |
| `formatTime(time, locale, options)` | Форматувати час |
| `formatDateTime(dt, locale, options)` | Форматувати дату і час |
| `formatNumber(num, locale, options)` | Форматувати число |
| `formatCurrency(amount, currency, locale)` | Форматувати валюту |
| `formatPercent(value, locale, options)` | Форматувати відсотки |
| `pluralize(key, count, params, locale)` | Множинність |
| `loadTranslations(locale, translations)` | Завантажити переклади |
| `getTranslations(locale)` | Отримати переклади |
| `getAllLocales()` | Всі підтримувані локалі |
| `getLocaleInfo(locale)` | Інформація про локаль |
| `detectLocaleFromRequest(req)` | Визначити локаль з запиту |
| `middleware()` | Express middleware |
| `exportTranslations(locale, path)` | Експорт у файл |
| `generateTranslationTemplate(locale, base)` | Шаблон для нової мови |
| `getMissingTranslations(locale, base)` | Відсутні переклади |
| `getTranslationReport()` | Звіт про переклади |

## Підтримка RTL мов

Система автоматично визначає напрямок тексту для RTL мов:
- Арабська (ar)
- Іврит (he)
- Перська (fa)
- Урду (ur)
- Пашто (ps)
- Сіндхі (sd)
- Їдиш (yi)
- Ладіно (lad)

## Правила множини

Підтримуються різні правила множини для різних мов:
- **Одна множина**: Китайська, Японська, Корейська, В'єтнамська
- **Дві множини**: Більшість європейських мов
- **Три множини**: Українська, Російська, Польська, Сербська, Хорватська, Болгарська

## Приклади використання в схемах

```javascript
const schema = {
  name: 'article',
  fields: [
    {
      name: 'title',
      type: 'text',
      label: {
        uk: 'Заголовок',
        en: 'Title',
        pl: 'Tytuł'
      },
      localized: true
    },
    {
      name: 'content',
      type: 'richtext',
      label: {
        uk: 'Зміст',
        en: 'Content',
        pl: 'Treść'
      },
      localized: true
    }
  ]
};
```

## Рекомендації

1. **Завжди вказуйте fallback локаль** (за замовчуванням 'en')
2. **Використовуйте ключі перекладів** замість хардкоду тексту
3. **Локалізуйте весь контент** що бачить користувач
4. **Тестуйте RTL мови** на правильність відображення
5. **Перевіряйте множинність** для всіх мов
6. **Експортуйте переклади** для роботи з перекладачами

## Ліцензія

MIT
