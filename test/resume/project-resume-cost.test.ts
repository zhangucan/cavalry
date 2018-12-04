import { assert } from 'chai'
import { getDailyPersonalResumeCosts } from '../../src/resume/project-resume-cost'
import * as moment from 'moment'

describe('project resume cost', () => {
    let month = '2018-08-01'
    it('getDailyPersonalResumeCosts() ', async () => {
        const dailyPersonalResumeCosts = getDailyPersonalResumeCosts(month)
        assert.isAbove(dailyPersonalResumeCosts.length, 1000)
        assert.isNotEmpty(dailyPersonalResumeCosts[0])
    })
})
