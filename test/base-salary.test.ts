import { assert } from 'chai'
import { getAllSalary, getAllPositionChange, computeBaseSalary } from '../src/base-salary'
import * as config from 'config'
import { setEsUrl } from '@uranplus/cavalry-utils'

describe('base salary', () => {
    let month = '2018-08-01'
    before(async () => {
        const esUrl = config.get('es.url')
        await setEsUrl(esUrl)
    })
    it('getAllSalary() should work', async () => {
        const baseSalary = await getAllSalary(month)
        assert.isAbove(baseSalary.length, 116)
    }).timeout(10000)
    it('getAllPositionChange() should work', async () => {
        const positionChange = await getAllPositionChange()
        console.log('positionChange', positionChange.length)
        assert(positionChange.length, '3487')
    }).timeout(10000)
    it('computeBaseSalary() should work', async () => {
        const baseSalary1 = await computeBaseSalary('毛雪芬', month)
        const baseSalary2 = await computeBaseSalary('田俊华', month)
        const baseSalary3 = await computeBaseSalary('程玉洁', month)
        const baseSalary4 = await computeBaseSalary('曹婷', month)
        assert(baseSalary1 + '', '3500')
        assert(baseSalary2 + '', '3500')
        assert(baseSalary3 + '', '0')
        assert(baseSalary4 + '', '4000')
    }).timeout(10000)
})
