import { createEnum } from "../../utils/functions"

// !!! ВЫНЕСЕНО что бы не было ошибок импорта !!!

export const POPUP_TYPE = createEnum([
    'SETTINGS',
    'PAUSE',
    'RESULTS',
    'WIN',
    'LOSE',
    'UPGRADE',
    'TRAPPING',

    'BUILD_MINE',
    'BUILD_DRAGON',
    'BUILD_MAGIC',
    'BUILD_TOWER',
    'BUILD_CATAPULT',
    'BUILD_ICE',
    'BUILD_FIRE',

    'ERROR'
])