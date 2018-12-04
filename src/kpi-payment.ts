import * as _ from 'lodash'
const bodybuilder = require('bodybuilder')
import * as config from 'config'
import { KpiPayment } from '@uranplus/cavalry-define'
import { search } from '@uranplus/cavalry-utils'

const kpi_payment_index = config.get('cavalry.es.kpi_payment.index')
const kpi_payment_type = config.get('cavalry.es.kpi_payment.type')
let gKpiPayment: any = {}
export async function getAllKpiPayment(month: string): Promise<KpiPayment[]> {
    if (!gKpiPayment[month]) {
        const query = bodybuilder()
            .filter('term', '_type', kpi_payment_type)
            .filter('term', 'month', month)
            .size(10000)
            .build()
        gKpiPayment[month] = await search(kpi_payment_index, kpi_payment_type, query)
        return gKpiPayment[month]
    } else {
        return gKpiPayment[month]
    }
}
