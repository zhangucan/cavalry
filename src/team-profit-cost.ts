import * as _ from 'lodash'
const bodybuilder = require('bodybuilder')
import * as config from 'config'
import { search } from '@uranplus/cavalry-utils'
import * as moment from 'moment'
import { TeamProfitCost } from '@uranplus/cavalry-define/fruit.class'
const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')
const team_profit_cost_index = config.get('cavalry.es.team_profit_cost.index')
const team_profit_cost_type = config.get('cavalry.es.team_profit_cost.type')

let gTeamProfitCost: any = {}
export async function getAllTeamProfitCost(month: string): Promise<TeamProfitCost[]> {
    if (!gTeamProfitCost[month]) {
        const query = bodybuilder()
            .filter('term', '_type', team_profit_cost_type)
            .filter('term', 'month', month)
            .size(10000)
            .build()
        gTeamProfitCost[month] = await search(team_profit_cost_index, team_profit_cost_type, query)
        return gTeamProfitCost[month]
    } else {
        return gTeamProfitCost[month]
    }
}
export async function getTeamProfitCost(
    team: string,
    manager: string,
    month: string
): Promise<TeamProfitCost> {
    const teamCost = await getAllTeamProfitCost(month)
    let temp = teamCost.find(
        (item: TeamProfitCost) => item.team === team && item.manager === manager
    )
    if (!temp) {
        return null
    } else {
        return temp
    }
}
