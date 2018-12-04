import { assert } from 'chai'
import {
    initTeamFruits,
    getTeamFruits,
    findStaffFruitByLevel,
    findStaffFruit,
    findFruit,
    searchStaffFruits,
    TeamFruit,
    GroupFruit,
} from '@uranplus/cavalry-sdk'
import { deleteOneMonthDataInEs, saveFruitsToDb, setEsUrl } from '@uranplus/cavalry-utils'
import * as sinon from 'sinon'
import { BaseDataServiceV1 } from '../src/service/base-data-service'

describe('company salary', () => {
    let teamFruits: TeamFruit[]
    const config = require('config')
    const monthStr = '2018-0-01'
    before(async () => {
        const esUrl = config.get('es.url')
        await setEsUrl(esUrl)
    })
    it('initTeamFruits() should return team fruits', async () => {
        teamFruits = await initTeamFruits(monthStr, new BaseDataServiceV1())
        assert.isAbove(teamFruits.length, 100)
    }).timeout(300000)

    it('findStaffFruit() when staff not in position-change should be ok', async () => {
        let staffPosition = {
            name: '韩典',
            team: '代招去哪儿网项目组',
            manager: '胡建军',
            groupLeader: null,
            start: '2018-08-06',
            end: '2018-08-07',
        }
        let sf = await findStaffFruit(teamFruits, staffPosition)
        assert.exists(sf)
    })

    it('findStaffFruit() when staff without groupleader information', async () => {
        let staffPosition = {
            name: '金鹏翔',
            team: '哈金森项目组',
            manager: '许学文',
            groupLeader: null,
            start: '2018-08-03',
            end: '2018-08-04',
        }
        let sf = await findStaffFruit(teamFruits, staffPosition)
        // TODO
        // assert.exists(sf)
    })

    it('findFruit() should be ok', async () => {
        let staffPosition = {
            name: '倪世成',
            team: '长飞光纤项目组',
            manager: '杨正大',
            groupLeader: null,
            start: '2018-08-27',
            end: '2018-08-28',
        }
        let df: TeamFruit = findFruit(teamFruits, staffPosition, 'manager')
        assert.exists(df)
        let sf = findFruit(df.staffFruits, staffPosition, 'name')
        assert.exists(sf)
    })

    it('searchStaffFruits() should be ok', async () => {
        let staffPosition = {
            name: '麦倩仪',
            team: '易点租项目组',
            manager: '杨新光',
            groupLeader: '方舒婷',
            start: '2018-08-27',
            end: '2018-08-28',
        }
        let sfs = await searchStaffFruits(teamFruits, staffPosition, ['name'])
        assert.equal(sfs.length, 1)
    })

    it('findStaffFruitByLevel() should be ok', async () => {
        let staffPosition = {
            name: '倪世成',
            team: '长飞光纤项目组',
            manager: '杨正大',
            groupLeader: null,
            start: '2018-08-27',
            end: '2018-08-28',
        }
        let sf = findStaffFruitByLevel(teamFruits, staffPosition)
        assert.exists(sf)
    })

    it('getTeamFruits() should return team fruits', async () => {
        sinon.spy(console, 'error')
        teamFruits = await getTeamFruits(teamFruits, monthStr)
        assert.isAbove(teamFruits.length, 100)

        // TODO reduce mismatch achievement records
        assert.isBelow(console.error['callCount'], 2125)
        console.log('mismatch achievement records length is ', console.error['callCount'])
    }).timeout(160000)

    it('getTeamFruits() fruit of 联想项目组', async () => {
        let staffPosition = {
            name: '关红涛',
            team: '联想项目组',
            manager: '田勇',
            groupLeader: '李艳1',
            start: '2018-08-25',
            end: '2018-08-26',
        }
        let df: TeamFruit = findFruit(teamFruits, staffPosition, 'team')
        assert.isNotEmpty(df)
        let gf: GroupFruit = findFruit(df.groupFruits, staffPosition, 'groupLeader')
        assert.isNotEmpty(gf)
        // console.log('联想项目组 gf=', gf)
        assert.equal(gf.staffFruits.length, 4)
        for (let sf of gf.staffFruits) {
            if (sf.employee === '陈慈') {
                assert.equal(sf.incoming, 7000)
            } else if (sf.employee === '许银银') {
                assert.equal(sf.incoming, 3000)
            } else if (sf.employee === '胡政') {
                assert.equal(sf.incoming, 4998)
            } else if (sf.employee === '关红涛') {
                assert.equal(sf.incoming, 4000)
            } else {
                assert.notEqual(sf.employee, '陈志伟')
                assert.notEqual(sf.employee, '刘雅倩')
            }
        }
    })
    it('findStaffFruit() fruit of 乐倩文 with achievements', async () => {
        let staffPosition = {
            start: '2018-08-01',
            end: '2018-09-01',
            team: '招聘会',
            name: '乐倩文',
            manager: '张磊',
            groupLeader: '吴燕峰',
        }
        let sf = await findStaffFruit(teamFruits, staffPosition)
        assert.isAbove(sf.achievements.length, 30)
        assert.equal(sf.incoming, 11260)
    })

    it('findStaffFruit() fruit of 秦张良 with recruitment recalls', async () => {
        let staffPosition = {
            start: '2018-09-01',
            end: '2018-09-21',
            team: '朗迪+施耐德项目组',
            name: '宁茹',
            manager: '宁茹',
        }
        let sf = await findStaffFruit(teamFruits, staffPosition)
        console.log('findStaffFruit() fruit of 宁茹 with recruitment recalls', sf)
        // assert.equal(sf.recruitmentRecalls.length, 1)
        // assert.equal(sf.recall, 2000)
    })

    it('findStaffFruit() fruit of 郑朱江 who leaved', async () => {
        let staffPosition = {
            start: '2018-08-28',
            end: '2018-08-29',
            team: '富士康项目组',
            name: '郑朱江',
            manager: '李永',
            groupLeader: '张国立',
        }
        let sf = await findStaffFruit(teamFruits, staffPosition)
        assert.equal(sf.salary, 0)
        assert.isAbove(sf.resumeCost, 0)
    })

    it('saveFruitsToDb() should work', async () => {
        if (config.get('cavalry.es.fruit_slices.reimport_records')) {
            await deleteOneMonthDataInEs(
                monthStr,
                config.get('cavalry.es.fruit_slices.index'),
                config.get('es.url')
            ).catch(err => {
                if (err.response.status !== 404 && err.response.status !== 400) {
                    console.log('deleteOneMonthDataInEs() err=', err)
                    throw err
                }
            })
            await saveFruitsToDb(
                teamFruits,
                config.get('cavalry.es.fruit_slices.index'),
                config.get('cavalry.es.fruit_slices.type')
            )
        } else {
            console.log('config `cavalry.es.fruit_slices,reimport_records` is false, skip')
        }
    }).timeout(10000)

    // TODO recall changed
    // it('handle recruitment recall', async () => {
    //     let staffPosition = {
    //         start: '2018-08-01',
    //         end: '2018-09-01',
    //         team: '古河+华网电力项目组',
    //         name: '倪磊',
    //         manager: '倪磊',
    //     }
    //     let sf = await findStaffFruit(teamFruits, staffPosition)
    //     console.log('findStaffFruit() fruit of 倪磊 with recruitment recalls', sf)

    //     assert.equal(sf.recruitmentRecalls.length, 10)
    //     const length = sf.recruitmentRecalls.reduce((total, recruitmentRecall: RecruitmentRecall) => {
    //         total = recruitmentRecall.employee === '刘琪2' ? total + 1 : total
    //         return total
    //     }, 0)
    //     assert.equal(length, 2)
    //     let staffPosition2 = {
    //         start: '2018-08-01',
    //         end: '2018-09-01',
    //         team: '古河+华网电力项目组',
    //         name: '刘琪2',
    //         manager: '倪磊',
    //     }

    //     let sf2 = await findStaffFruit(teamFruits, staffPosition2)
    //     assert.equal(sf2.recruitmentRecalls.length, 2)
    //     console.log('findStaffFruit() fruit of 刘琪2 with recruitment recalls', sf2)
    // }).timeout(10000)

    afterEach(() => {
        if (console.error['restore']) {
            console.log('sinon restore console.error')
            console.error['restore']()
        }
    })
})
