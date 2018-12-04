import { del, setEsUrl } from '@uranplus/cavalry-utils'
import { ormKpiPaymentFormXlsx } from '../../src/import-to-db/import-kpi-payment-data2db'
import * as moment from 'moment'
import * as config from 'config'
const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')
const bodybuilder = require('bodybuilder')
describe('save kpi payment', () => {
    before(async () => {
        const esUrl = config.get('es.url')
        await setEsUrl(esUrl)
    })
    it('ormKpiPaymentFormXlsx() should work', async () => {
        if (config.get('cavalry.es.kpi_payment.reimport_records')) {
            await del(
                config.get('cavalry.es.kpi_payment.index'),
                config.get('cavalry.es.kpi_payment.type'),
                bodybuilder()
                    // .filter('term', '_type', config.get('cavalry.es.kpi_payment.type'))
                    .filter('term', 'month', month)
                    .build()
            ).catch(err => {
                if (err.response.status !== 404 && err.response.status !== 400) {
                    console.log('deleteOneMonthDataInEs() err=', err)
                    throw err
                }
            })
            await ormKpiPaymentFormXlsx(
                config.get('cavalry.es.kpi_payment.index'),
                config.get('cavalry.es.kpi_payment.type')
            )
        } else {
            console.log('config `cavalry.es.employee.reimport_records` is false, skip')
        }
    }).timeout(10000)
})
