import { search } from '@uranplus/cavalry-utils'
import * as config from 'config'
import * as bodybuilder from 'bodybuilder'
const index = config.get('cavalry.es.initial_team.index')
const type = config.get('cavalry.es.initial_team.type')
const maxSize = 99999
export async function getInitialTeam(): Promise<any[]> {
    const query = bodybuilder()
        .size(maxSize)
        .build()
    return await search(index, type, query)
}
