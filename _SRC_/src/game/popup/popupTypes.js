import { createEnum } from "../../utils/functions"

export const POPUP_TYPE = createEnum([
    'SETTINGS',
    'PAUSE',
    'RESULTS',
    'WIN',
    'LOSE',
    'UPGRADE',
    'ERROR'
])