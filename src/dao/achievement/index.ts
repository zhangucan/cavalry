import { Recruitment } from '@uranplus/cavalry-define'
import { search } from '@uranplus/cavalry-utils'
import * as config from 'config'
import * as bodybuilder from 'bodybuilder'
const index = config.get('cavalry.es.achievement.index')
const type = config.get('cavalry.es.achievement.type')
const maxSize = 99999
export async function getAchievements(start: Date, end: Date): Promise<Recruitment[]> {
    const query = bodybuilder()
        .filter('range', 'date', { gte: start.toISOString(), lt: end.toISOString() })
        .size(maxSize)
        .build()
    const json = await search(index, type, query)
    return json.map((item: Recruitment) => item)
}
