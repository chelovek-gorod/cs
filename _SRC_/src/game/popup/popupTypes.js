import { createEnum } from "../../utils/functions"

// !!! ВЫНЕСЕНО что бы не было ошибок импорта !!!

export const POPUP_TYPE = createEnum([
    'SETTINGS',
    'PAUSE',
    'RESULTS',
    'WIN',
    'LOSE',
    'UPGRADE',

    'BUILD_MINE',
    'BUILD_TRAP',
    'BUILD_DRAGON',
    'BUILD_WIZARD',
    'BUILD_TOWER',
    'BUILD_CATAPULT',
    'BUILD_ICE',
    'BUILD_FOG',

    'ERROR'
])