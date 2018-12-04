import { assert } from 'chai'
import { Fruit } from '@uranplus/cavalry-define'
import { GroupFruit } from '@uranplus/cavalry-sdk'
import { setEsUrl } from '@uranplus/cavalry-utils'
import * as config from 'config'

describe('fruit class', () => {
    let staffPosition = {
        name: '倪世成',
        team: '长飞光纤项目组',
        department: '派遣部',
        manager: '杨正大',
        groupLeader: null,
        start: '2018-08-27',
        end: '2018-08-28',
    }
    before(async () => {
        const esUrl = config.get('es.url')
        await setEsUrl(esUrl)
    })
    it('Fruit.cloneFruit() should be ok', async () => {
        let fruit = new Fruit()
        fruit.init(staffPosition, null, null, 0)
        let newFruit1 = fruit.cloneFruit()
        assert.deepEqual(fruit, newFruit1, 'staffFruit clone error')
    })

    it('GroupFruit.cloneFruit() should be ok', async () => {
        let fruit = new Fruit()
        fruit.init(staffPosition, null, null, 0)
        let groupFruit = new GroupFruit()
        groupFruit.init(staffPosition, null, null, 0)
        groupFruit.minMonthlySalary = 0
        groupFruit.commissionRate = 0.5
        let newFruit2 = groupFruit.cloneFruit()
        assert.deepEqual(fruit, newFruit2, 'groupFruit clone error')
    })
})
