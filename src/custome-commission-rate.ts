import * as _ from 'lodash'
const bodybuilder = require('bodybuilder')
import * as config from 'config'
import { search } from '@uranplus/cavalry-utils'
import { CommissionRates } from '@uranplus/cavalry-define'

const custome_profit_rate_index = config.get('cavalry.es.commission_rate.index')
const custome_profit_rate_type = config.get('cavalry.es.commission_rate.type')

let gProfitRate: any = {}
export async function getAllCommissionRates(month: string): Promise<CommissionRates[]> {
    if (!gProfitRate[month]) {
        const query = bodybuilder()
            .filter('term', '_type', custome_profit_rate_type)
            .filter('term', 'month', month)
            .size(10000)
            .build()
        gProfitRate[month] = await search(custome_profit_rate_index, custome_profit_rate_type, query)
        return gProfitRate[month]
    } else {
        return gProfitRate[month]
    }
}
export async function getTeamCommissionRates(
    team: string,
    manager: string,
    month: string
): Promise<CommissionRates> {
    const teamCost = await getAllCommissionRates(month)
    let temp = teamCost.find(
        (item: CommissionRates) => item.team === team && item.manager === manager
    )
    if (!temp) {
        return null
    } else {
        return temp
    }
}
