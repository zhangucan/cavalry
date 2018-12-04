import { assert } from 'chai'
import { getAllKpiPayment } from '../src/kpi-payment'
import { setEsUrl } from '@uranplus/cavalry-utils'
import * as config from 'config'

describe('kpi payment', () => {
    let month = '2018-08-01'
    before(async () => {
        const esUrl = config.get('es.url')
        await setEsUrl(esUrl)
    })
    it('getAllKPIPayment should work', async () => {
        const kpiPayments = await getAllKpiPayment(month)
        assert(kpiPayments.length, '2560')
    }).timeout(10000)
})
