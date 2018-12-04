import { search } from '@uranplus/cavalry-utils'
import * as config from 'config'
import { CurrentEmployee, CommissionRates } from '@uranplus/cavalry-define'
import * as bodybuilder from 'bodybuilder'
import { BaseSalary } from '@uranplus/cavalry-define/fruit.class'
const index = config.get('cavalry.es.base_salary.index')
const type = config.get('cavalry.es.base_salary.type')
const maxSize = 99999
export async function getAllSalary(month: string): Promise<BaseSalary[]> {
    const query = bodybuilder()
        .filter('term', '_type', type)
        .filter('term', 'month', month)
        .size(maxSize)
        .build()
    const json = await search(index, type, query)
    return json.map((item: BaseSalary) => item)
}
