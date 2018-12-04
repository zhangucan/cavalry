import { timeout } from 'mocha-typescript'
import * as config from 'config'
import { del, setEsUrl } from '@uranplus/cavalry-utils'
import { saveTeamProfitCost2db } from '../../src/import-to-db/import-team-profit-cost-data2db'
const bodybuilder = require('bodybuilder')
import * as moment from 'moment'
const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')
describe('save team cost profit', () => {
    before(async () => {
        const esUrl = config.get('es.url')
        await setEsUrl(esUrl)
    })
    it('saveTeamProfit() should work', async () => {
        if (config.get('cavalry.es.team_profit_cost.reimport_records')) {
            await del(
                config.get('cavalry.es.team_profit_cost.index'),
                config.get('cavalry.es.team_profit_cost.type'),
                bodybuilder()
                    // .filter('term', '_type', config.get('cavalry.es.team_profit_cost.type'))
                    .filter('term', 'month', month)
                    .build()
            ).catch(err => {
                if (err.response.status !== 404 && err.response.status !== 400) {
                    console.log('deleteOneMonthDataInEs() err=', err)
                    throw err
                }
            })
            await saveTeamProfitCost2db(
                config.get('cavalry.es.team_profit_cost.index'),
                config.get('cavalry.es.team_profit_cost.type')
            )
        } else {
            console.log('config `cavalry.es.team_profit_cost.reimport_records` is false, skip')
        }
    }).timeout(50000)
})
