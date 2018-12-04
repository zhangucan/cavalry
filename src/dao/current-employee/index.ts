import { search } from '@uranplus/cavalry-utils'
import * as config from 'config'
import { CurrentEmployee } from '@uranplus/cavalry-define'
import * as moment from 'moment'
import * as bodybuilder from 'bodybuilder'
const index = config.get('cavalry.es.employee.index')
const type = config.get('cavalry.es.employee.type')
const maxSize = 99999
export async function getCurrentEmployees(): Promise<CurrentEmployee[]> {
    const query = bodybuilder()
        .size(maxSize)
        .build()
    const json = await search(index, type, query)
    return json.map((item: CurrentEmployee) => item)
}

export async function getEmployeeByName(name, monthDate): Promise<CurrentEmployee> {
    monthDate = moment(monthDate)
        .startOf('month')
        .format('YYYY-MM-DD')

    const query = bodybuilder()
        .filter('term', 'name', name)
        .filter('term', 'month', monthDate)
        .build()
    const result: any[] = await search(index, type, query)
    if (result[0]) {
        return result[0]
    }
    return null
}
