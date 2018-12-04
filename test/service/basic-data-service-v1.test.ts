import { assert } from 'chai'
import * as config from 'config'
import { setEsUrl } from '@uranplus/cavalry-utils'
import { BaseDataServiceV1 } from '../../src/service/base-data-service'
let month = '2018-08-01'
describe('service dock', () => {
    let baseDataService: BaseDataServiceV1
    before(async () => {
        const esUrl = config.get('es.url')
        await setEsUrl(esUrl)
        baseDataService = new BaseDataServiceV1()
    })
    it('getAchievements', async () => {
        const temp = await baseDataService.getAchievements(month)
        assert.isAbove(temp.length, 4500)
    }).timeout(5000)
    it('getTeamProfitCosts', async () => {
        const temp = await baseDataService.getTeamProfitCosts(month)
        assert.isAbove(temp.length, 100)
    }).timeout(5000)
    it('getRecruitmentRecalls', async () => {
        const temp = await baseDataService.getRecruitmentRecalls(month)
        assert.isAbove(temp.length, 100)
    }).timeout(5000)
    it('getAllKpiPayments', async () => {
        const temp = await baseDataService.getAllKpiPayments(month)
        assert.isAbove(temp.length, 2000)
    }).timeout(5000)
    it('getPositionChanges', async () => {
        const temp = await baseDataService.getPositionChanges(month)
        assert.isAbove(temp.length, 100)
    }).timeout(5000)
    it('getCurrentEmployees', async () => {
        const temp = await baseDataService.getCurrentEmployees()
        assert.isAbove(temp.length, 1000)
    }).timeout(5000)
    it('getCurrentEmployees', async () => {
        const temp = await baseDataService.getInitialTeam()
        assert.isAbove(temp.length, 2)
    }).timeout(5000)
})
