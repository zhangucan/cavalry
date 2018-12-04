import { search } from '@uranplus/cavalry-utils'
import * as config from 'config'
import { KpiPayment } from '@uranplus/cavalry-define'
import * as bodybuilder from 'bodybuilder'
const index = config.get('cavalry.es.kpi_payment.index')
const type = config.get('cavalry.es.kpi_payment.type')
const maxSize = 99999
export async function getKpiPayments(start: Date, end: Date): Promise<KpiPayment[]> {
    const query = bodybuilder()
        .filter('range', 'date', { gte: start.toISOString(), lt: end.toISOString() })
        .size(maxSize)
        .build()
    const json = await search(index, type, query)
    return json.map((item: KpiPayment) => item)
}
