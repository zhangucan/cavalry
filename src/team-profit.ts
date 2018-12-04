import * as _ from 'lodash'
const bodybuilder = require('bodybuilder')
import * as config from 'config'
import { search } from '@uranplus/cavalry-utils'
import * as moment from 'moment'
import * as path from 'path'
import * as raw_path from '@uranplus/cavalry-raw-files'
const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')
const team_profit_index = config.get('cavalry.es.team_profit.index')
const team_profit_type = config.get('cavalry.es.team_profit.type')

let gTeamCost: any = null
export async function getAllTeamProfit(): Promise<TeamProfit[]> {
    if (!gTeamCost) {
        const query = bodybuilder()
            .filter('term', '_type', team_profit_type)
            .filter('term', 'month', month)
            .size(10000)
            .build()
        gTeamCost = await search(team_profit_index, team_profit_type, query)
        return gTeamCost
    } else {
        return gTeamCost
    }
}
export async function getTeamProfit(team: string, manager: string): Promise<number> {
    const teamProfit = await getAllTeamProfit()
    let temp = teamProfit.find(
        (item: TeamProfit) => item.team === team && item.manager === manager
    )
    if (!temp) {
        return 0
    } else {
        return temp.value
    }
}
export class TeamProfit {
    team: string
    manager: string
    value: number
}
