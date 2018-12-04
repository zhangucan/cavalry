import { RecruitmentRecall } from '@uranplus/cavalry-define'
import { search } from '@uranplus/cavalry-utils'
import * as config from 'config'
import * as bodybuilder from 'bodybuilder'
const index = config.get('cavalry.es.recruitment_recall.index')
const type = config.get('cavalry.es.recruitment_recall.type')
const maxSize = 99999
export async function getRecruitmentRecalls(start: Date, end: Date): Promise<RecruitmentRecall[]> {
    const query = bodybuilder()
        .filter('range', 'leaveDate', { gte: start.toISOString(), lt: end.toISOString() })
        .size(maxSize)
        .build()
    const json = await search(index, type, query)
    return json.map((item: RecruitmentRecall) => item)
}
