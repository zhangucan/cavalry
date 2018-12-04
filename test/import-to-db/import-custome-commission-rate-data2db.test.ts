import { timeout } from 'mocha-typescript'
import * as config from 'config'
import { del, setEsUrl } from '@uranplus/cavalry-utils'
import { ormCustomeCommissionRateFormXlsx } from '../../src/import-to-db/import-custome-commission-rate-data2db'
const bodybuilder = require('bodybuilder')
import * as moment from 'moment'
const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')
describe('save team cost profit', () => {
    before(async () => {
        const esUrl = config.get('es.url')
        await setEsUrl(esUrl)
    })
    it('saveTeamProfit() should work', async () => {
        if (config.get('cavalry.es.commission_rate.reimport_records')) {
            await del(
                config.get('cavalry.es.commission_rate.index'),
                config.get('cavalry.es.commission_rate.type'),
                bodybuilder()
                    // .filter('term', '_type', config.get('cavalry.es.commission_rate.type'))
                    .filter('term', 'month', month)
                    .build()
            ).catch(err => {
                if (err.response.status !== 404 && err.response.status !== 400) {
                    console.log('deleteOneMonthDataInEs() err=', err)
                    throw err
                }
            })
            await ormCustomeCommissionRateFormXlsx(
                config.get('cavalry.es.commission_rate.index'),
                config.get('cavalry.es.commission_rate.type')
            )
        } else {
            console.log('config `cavalry.es.commission_rate.reimport_records` is false, skip')
        }
    }).timeout(50000)
})
