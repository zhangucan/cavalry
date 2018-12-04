import { assert } from 'chai'
import { RecruitmentRecall } from '@uranplus/cavalry-define'
import { RecruitmentRecallUtil } from '../src/compute/recruitment-recall-util'
import * as config from 'config'
import { setEsUrl } from '@uranplus/cavalry-utils'

describe('recruitment recall', () => {
    before(async () => {
        this.recruitmentRecallUtil = new RecruitmentRecallUtil('2018-08-01')
        const esUrl = config.get('es.url')
        await setEsUrl(esUrl)
    })
    it('getRecruitmentRecallByEmployeeName', async () => {
        const recruitmentRecalls: RecruitmentRecall[] = await this.recruitmentRecallUtil.getRecruitmentRecallByEmployeeName(
            '王仙亮'
        )
        console.log('recruitmentRecalls=', recruitmentRecalls)
        assert.equal(recruitmentRecalls[0].jobSeeker.name, '喻双全')
    })
    it('getRecruitmentRecallByJobSeekerName', async () => {
        const recruitmentRecalls: RecruitmentRecall[] = await this.recruitmentRecallUtil.getRecruitmentRecallByJobSeekerName(
            '喻双全'
        )
        assert.equal(recruitmentRecalls.length, 2)
        for (let recruitmentRecall of recruitmentRecalls) {
            assert.isTrue(['蔡倩', '王仙亮'].includes(recruitmentRecall.employee))
        }
    })
    it('getRecruitments', async () => {
        const recruitmentRecalls: RecruitmentRecall[] = await this.recruitmentRecallUtil.getRecruitmentRecalls()
        assert.isAbove(recruitmentRecalls.length, 140)
    })
})
