import * as path from 'path'
import * as raw_path from '@uranplus/cavalry-raw-files'
import { saveJsonToDb } from '@uranplus/cavalry-utils'
export async function saveInitialTeam2db(index, type) {
    const gInitialTeam = require(path.join(raw_path, 'initial-team.json'))
    await saveJsonToDb(gInitialTeam, index, type)
}
