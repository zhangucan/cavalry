import { assert } from 'chai'
import { getAllCommissionRates, getTeamCommissionRates } from '../src/custome-commission-rate'
import * as config from 'config'
import { setEsUrl } from '@uranplus/cavalry-utils'

describe('custome commission rate', () => {
    let month = '2018-09-01'
    before(async () => {
        const esUrl = config.get('es.url')
        await setEsUrl(esUrl)
    })
    it('getAllCommissionRates() should work', async () => {
        const teams = await getAllCommissionRates(month)
        assert.equal(teams.length, 133)
    }).timeout(10000)
    it('getTeamCommissionRates() should work', async () => {
        const commissionRate = await getTeamCommissionRates('李尔汽车项目组', '邵黎明', month)
        assert(commissionRate.staffRate + '', '0.5')
        assert(commissionRate.groupleaderRate + '', '0.4')
        assert(commissionRate.managerRate + '', '0.3')
    }).timeout(10000)
})
