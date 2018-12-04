import { assert } from 'chai'
import { getAllTeamProfitCost, getTeamProfitCost } from '../src/team-profit-cost'
import { setEsUrl } from '@uranplus/cavalry-utils'
import * as config from 'config'

describe('team profit cost', () => {
    let month = '2018-08-01'
    before(async () => {
        const esUrl = config.get('es.url')
        await setEsUrl(esUrl)
    })
    it('getAllTeamCost() should work', async () => {
        const teams = await getAllTeamProfitCost(month)
        assert.isAbove(teams.length, 132)
    }).timeout(10000)
})
