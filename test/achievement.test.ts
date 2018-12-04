import { assert } from 'chai'
import { Achievement } from '@uranplus/cavalry-define'
import { AchievementUtil } from '../src/compute/achievement-util'
import * as moment from 'moment'
import * as config from 'config'
import { setEsUrl } from '@uranplus/cavalry-utils'

describe('achievement detail', () => {
    let achievementUtil: AchievementUtil
    before(() => {
        const esUrl = config.get('es.url')
        setEsUrl(esUrl)
        achievementUtil = new AchievementUtil('2018-08-01')
    })

    it('getRecruitmentByName', async () => {
        const data: Achievement[] = await achievementUtil.getRecruitmentByName('沈凯')
        assert.equal(data.length, 7)
    })
    it('getAchievements()', async () => {
        const achievements: Achievement[] = await achievementUtil.getAchievements()
        assert.isAbove(achievements.length, 1800)
        assert.isTrue(
            achievements.every(achievement => moment(achievement.date).format('YYYY-MM-DD') !== '2018-09-01'),
            'getAchievements(2018-08-06) return  record in 2018-09-01'
        )
    }).timeout(10000)
})
