import { updateLanguage } from "../app/events"
import { updateStoredData } from "./storage"

const SUPPORTED_LANGUAGES = [
    'en', 'ru', 'tr', 'es', 'de', 'pt', 'fr', 'pl', 'it', 'nl', 'cs', 'id', 'th', 'vi'
]

const LANGUAGE_NAMES = {
    en: {
        en: 'English',
        ru: 'Английский',
        tr: 'İngilizce',
        es: 'Inglés',
        de: 'Englisch',
        pt: 'Inglês',
        fr: 'Anglais',
        pl: 'Angielski',
        it: 'Inglese',
        nl: 'Engels',
        cs: 'Angličtina',
        id: 'Inggris',
        th: 'อังกฤษ',
        vi: 'Tiếng Anh'
    },
    ru: {
        en: 'Russian',
        ru: 'Русский',
        tr: 'Rusça',
        es: 'Ruso',
        de: 'Russisch',
        pt: 'Russo',
        fr: 'Russe',
        pl: 'Rosyjski',
        it: 'Russo',
        nl: 'Russisch',
        cs: 'Ruština',
        id: 'Rusia',
        th: 'รัสเซีย',
        vi: 'Tiếng Nga'
    },
    tr: {
        en: 'Turkish',
        ru: 'Турецкий',
        tr: 'Türkçe',
        es: 'Turco',
        de: 'Türkisch',
        pt: 'Turco',
        fr: 'Turc',
        pl: 'Turecki',
        it: 'Turco',
        nl: 'Turks',
        cs: 'Turečtina',
        id: 'Turki',
        th: 'ตุรกี',
        vi: 'Tiếng Thổ Nhĩ Kỳ'
    },
    es: {
        en: 'Spanish',
        ru: 'Испанский',
        tr: 'İspanyolca',
        es: 'Español',
        de: 'Spanisch',
        pt: 'Espanhol',
        fr: 'Espagnol',
        pl: 'Hiszpański',
        it: 'Spagnolo',
        nl: 'Spaans',
        cs: 'Španělština',
        id: 'Spanyol',
        th: 'สเปน',
        vi: 'Tiếng Tây Ban Nha'
    },
    de: {
        en: 'German',
        ru: 'Немецкий',
        tr: 'Almanca',
        es: 'Alemán',
        de: 'Deutsch',
        pt: 'Alemão',
        fr: 'Allemand',
        pl: 'Niemiecki',
        it: 'Tedesco',
        nl: 'Duits',
        cs: 'Němčina',
        id: 'Jerman',
        th: 'เยอรมัน',
        vi: 'Tiếng Đức'
    },
    pt: {
        en: 'Portuguese',
        ru: 'Португальский',
        tr: 'Portekizce',
        es: 'Portugués',
        de: 'Portugiesisch',
        pt: 'Português',
        fr: 'Portugais',
        pl: 'Portugalski',
        it: 'Portoghese',
        nl: 'Portugees',
        cs: 'Portugalština',
        id: 'Portugis',
        th: 'โปรตุเกส',
        vi: 'Tiếng Bồ Đào Nha'
    },
    fr: {
        en: 'French',
        ru: 'Французский',
        tr: 'Fransızca',
        es: 'Francés',
        de: 'Französisch',
        pt: 'Francês',
        fr: 'Français',
        pl: 'Francuski',
        it: 'Francese',
        nl: 'Frans',
        cs: 'Francouzština',
        id: 'Prancis',
        th: 'ฝรั่งเศส',
        vi: 'Tiếng Pháp'
    },
    pl: {
        en: 'Polish',
        ru: 'Польский',
        tr: 'Lehçe',
        es: 'Polaco',
        de: 'Polnisch',
        pt: 'Polonês',
        fr: 'Polonais',
        pl: 'Polski',
        it: 'Polacco',
        nl: 'Pools',
        cs: 'Polština',
        id: 'Polandia',
        th: 'โปแลนด์',
        vi: 'Tiếng Ba Lan'
    },
    it: {
        en: 'Italian',
        ru: 'Итальянский',
        tr: 'İtalyanca',
        es: 'Italiano',
        de: 'Italienisch',
        pt: 'Italiano',
        fr: 'Italien',
        pl: 'Włoski',
        it: 'Italiano',
        nl: 'Italiaans',
        cs: 'Italština',
        id: 'Italia',
        th: 'อิตาลี',
        vi: 'Tiếng Ý'
    },
    nl: {
        en: 'Dutch',
        ru: 'Нидерландский',
        tr: 'Felemenkçe',
        es: 'Neerlandés',
        de: 'Niederländisch',
        pt: 'Neerlandês',
        fr: 'Néerlandais',
        pl: 'Niderlandzki',
        it: 'Olandese',
        nl: 'Nederlands',
        cs: 'Nizozemština',
        id: 'Belanda',
        th: 'ดัตช์',
        vi: 'Tiếng Hà Lan'
    },
    cs: {
        en: 'Czech',
        ru: 'Чешский',
        tr: 'Çekçe',
        es: 'Checo',
        de: 'Tschechisch',
        pt: 'Tcheco',
        fr: 'Tchèque',
        pl: 'Czeski',
        it: 'Ceco',
        nl: 'Tsjechisch',
        cs: 'Čeština',
        id: 'Ceko',
        th: 'เช็ก',
        vi: 'Tiếng Séc'
    },
    id: {
        en: 'Indonesian',
        ru: 'Индонезийский',
        tr: 'Endonezce',
        es: 'Indonesio',
        de: 'Indonesisch',
        pt: 'Indonésio',
        fr: 'Indonésien',
        pl: 'Indonezyjski',
        it: 'Indonesiano',
        nl: 'Indonesisch',
        cs: 'Indonéština',
        id: 'Bahasa Indonesia',
        th: 'อินโดนีเซีย',
        vi: 'Tiếng Indonesia'
    },
    th: {
        en: 'Thai',
        ru: 'Тайский',
        tr: 'Tayca',
        es: 'Tailandés',
        de: 'Thailändisch',
        pt: 'Tailandês',
        fr: 'Thaïlandais',
        pl: 'Tajski',
        it: 'Thailandese',
        nl: 'Thais',
        cs: 'Thajština',
        id: 'Thailand',
        th: 'ภาษาไทย',
        vi: 'Tiếng Thái'
    },
    vi: {
        en: 'Vietnamese',
        ru: 'Вьетнамский',
        tr: 'Vietnamca',
        es: 'Vietnamita',
        de: 'Vietnamesisch',
        pt: 'Vietnamita',
        fr: 'Vietnamien',
        pl: 'Wietnamski',
        it: 'Vietnamita',
        nl: 'Vietnamees',
        cs: 'Vietnamština',
        id: 'Vietnam',
        th: 'เวียดนาม',
        vi: 'Tiếng Việt'
    }
}

const LANGUAGE_MAP = {
    // --- Русский ---
    ru: 'ru', by: 'ru', ua: 'ru', kz: 'ru', kg: 'ru', md: 'ru',

    // --- Турецкий ---
    tr: 'tr', cy: 'tr',

    // --- Испанский ---
    es: 'es', mx: 'es', ar: 'es', cl: 'es', co: 'es', pe: 'es', ve: 'es',

    // --- Немецкий ---
    de: 'de', at: 'de', ch: 'de', li: 'de',

    // --- Португальский (BR-first) ---
    pt: 'pt', br: 'pt',

    // --- Французский ---
    fr: 'fr', mc: 'fr', ca: 'fr',

    // --- Польский ---
    pl: 'pl',

    // --- Итальянский ---
    it: 'it', sm: 'it', va: 'it',

    // --- Нидерландский ---
    nl: 'nl', be: 'nl',

    // --- Чешский ---
    cs: 'cs', cz: 'cs',

    // --- Индонезийский ---
    id: 'id',

    // --- Тайский ---
    th: 'th',

    // --- Вьетнамский ---
    vi: 'vi', vn: 'vi',

    // --- Английский (fallback) ---
    en: 'en', us: 'en', gb: 'en', au: 'en', nz: 'en', ie: 'en',
    se: 'en', no: 'en', fi: 'en', dk: 'en',
    jp: 'en', kr: 'en', cn: 'en', in: 'en'
}

const browserLang = navigator.language || 'en'
let currentLanguage = normalizeLangCode(browserLang)

function normalizeLangCode(langCode) {
    const code = String(langCode || '').toLowerCase()
    const baseCode = code.split('-')[0] //  en-US → en
    const gameCode = LANGUAGE_MAP[code] || LANGUAGE_MAP[baseCode]

    if (gameCode && SUPPORTED_LANGUAGES.includes(gameCode)) {
        return gameCode;
    }

    return 'en'
}

export function setLanguage(langCode, isNeedUpdateStorage = true) {
    const normalized = normalizeLangCode(langCode)
    
    if (currentLanguage === normalized) {
        return currentLanguage 
    }
    
    currentLanguage = normalized

    updateLanguage(currentLanguage)
    
    if (isNeedUpdateStorage) updateStoredData()

    return currentLanguage 
}

export function getLanguage() {
    return currentLanguage
}

export function getAvailableLanguages() {
    return SUPPORTED_LANGUAGES.map(code => ({
        code: code,
        name: LANGUAGE_NAMES[code][currentLanguage] || LANGUAGE_NAMES[code]['en']
    }))
}

export function getLanguageName(langCode = null) {
    const code = langCode || currentLanguage
    return LANGUAGE_NAMES[code]?.[currentLanguage] || code
}