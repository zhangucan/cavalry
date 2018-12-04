import { search } from '@uranplus/cavalry-utils'
import * as config from 'config'
import { TeamProfitCost } from '@uranplus/cavalry-define/fruit.class'
import * as bodybuilder from 'bodybuilder'
const index = config.get('cavalry.es.team_profit_cost.index')
const type = config.get('cavalry.es.team_profit_cost.type')
const maxSize = 99999
export async function getTeamProfitCosts(start: string): Promise<TeamProfitCost[]> {
    const query = bodybuilder()
        .filter('term', 'month', start)
        .size(maxSize)
        .build()
    const json = await search(index, type, query)
    return json.map((item: TeamProfitCost) => item)
}
