import { search } from '@uranplus/cavalry-utils'
import * as config from 'config'
import { CurrentEmployee, CommissionRates } from '@uranplus/cavalry-define'
import * as bodybuilder from 'bodybuilder'
const index = config.get('cavalry.es.commission_rate.index')
const type = config.get('cavalry.es.commission_rate.type')
const maxSize = 99999
export async function getAllCommissionRates(month: string): Promise<CommissionRates[]> {
    const query = bodybuilder()
        .filter('term', '_type', type)
        .filter('term', 'month', month)
        .size(maxSize)
        .build()
    const json = await search(index, type, query)
    return json.map((item: CommissionRates) => item)
}
