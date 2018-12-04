import { assert } from 'chai'
import * as _ from 'lodash'
import * as config from 'config'
import { getTeamFruitTree, visitFruitTree, TeamFruit } from '@uranplus/cavalry-sdk'
import { loadTeamFruitsFromDb, setEsUrl } from '@uranplus/cavalry-utils'
import { Fruit } from '@uranplus/cavalry-define'

describe('[cavalry sdk] team salary', () => {
    let df: TeamFruit
    before('loadTeamFruitsFromDb should be ok', async () => {
        const esUrl = config.get('es.url')
        setEsUrl(esUrl)
        const fruit_slices_index = config.get('cavalry.es.fruit_slices.index')
        const fruit_slices_type = config.get('cavalry.es.fruit_slices.type')

        this.fruits = await loadTeamFruitsFromDb(
            '天马项目组',
            '顾桑桑',
            '2018-08-01',
            fruit_slices_index,
            fruit_slices_type
        )
        assert.isAbove(this.fruits.length, 20)
        assert.isTrue(this.fruits.some(fruit => fruit.employee === '王贤鹏'))
    })

    it('getTeamFruitTree should be ok', async () => {
        this.originFruits = _.sortBy(this.fruits.map(fruit => TeamFruit.prototype.cloneFruit.apply(fruit)), [
            'salary',
            'employee',
        ])
        df = getTeamFruitTree(this.fruits)
        assert.exists(df.staffFruits)
        assert.exists(df.groupFruits)
    })

    it('change manager commission rate should be ok', async () => {
        df.commissionRate = 0.4
        df.run()
        let entries: Fruit[] = []
        await visitFruitTree(df, (fruit: Fruit) => {
            entries.push(fruit.cloneFruit())
        })

        assert.deepEqual(
            _.sortBy(entries, ['salary', 'employee']).filter(entry => entry.employee !== '顾桑桑'),
            this.originFruits.filter(entry => entry.employee !== '顾桑桑')
        )
        assert.isTrue(
            entries.find(entry => entry.employee === '顾桑桑').salary >
                this.originFruits.find(entry => entry.employee === '顾桑桑').salary
        )
    })

    it('change group commission rate should be ok', async () => {
        df.commissionRate = 0.3
        let gf = df.groupFruits.find(groupFruit => groupFruit.employee === '刘子康')
        gf.commissionRate = 0.45
        df.run()
        let entries: Fruit[] = []
        await visitFruitTree(df, (fruit: Fruit) => {
            entries.push(fruit.cloneFruit())
        })

        assert.deepEqual(
            _.sortBy(entries, ['salary', 'employee']).filter(
                entry => entry.employee !== '顾桑桑' && entry.employee !== '刘子康'
            ),
            this.originFruits.filter(entry => entry.employee !== '顾桑桑' && entry.employee !== '刘子康')
        )
        assert.isTrue(
            entries.find(entry => entry.employee === '刘子康').salary >
                this.originFruits.find(entry => entry.employee === '刘子康').salary
        )
    })
})
