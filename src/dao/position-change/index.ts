import { PositionChange } from '@uranplus/cavalry-define'
import * as config from 'config'
import { search } from '@uranplus/cavalry-utils'
import * as bodybuilder from 'bodybuilder'
const index = config.get('cavalry.es.position_change.index')
const type = config.get('cavalry.es.position_change.type')
const maxSize = 99999
export async function getPositionChanges(end: Date): Promise<PositionChange[]> {
    const query = bodybuilder()
        .filter('range', 'date', { lt: end.toISOString() })
        .size(maxSize)
        .build()
    const json = await search(index, type, query)
    return json.map((positionChange: PositionChange) => {
        if (!positionChange.previous) {
            positionChange.previous = {}
        }
        if (!positionChange.current) {
            positionChange.current = {}
        }
        return positionChange
    })
}
