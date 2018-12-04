import { suite, test, timeout } from 'mocha-typescript'
import { assert } from 'chai'
import * as moment from 'moment'
import { PositionChange, JobStatus, StaffPosition, DIC_CAT_MAPPING } from '@uranplus/cavalry-define'
import {
    hasNewManager,
    getPositionChanges,
    getTreeLife,
    getStaffPositionsOfStaff,
    getStaffPositionMap,
    validateNodeSlices,
    filterSortedTimeRangesByTime,
    initTreeLife,
} from '../../packages/cavalry-sdk/tree-life'
import { BaseDataServiceV1 } from '../../src/service/base-data-service'
import * as raw_path from '@uranplus/cavalry-raw-files'
import * as path from 'path'
import * as config from 'config'
import { setEsUrl } from '@uranplus/cavalry-utils'

describe('tree life', () => {
    before(async () => {
        const esUrl = config.get('es.url')
        await setEsUrl(esUrl)
        initTreeLife('2018-09-01', new BaseDataServiceV1())
        this.positionChanges = await getPositionChanges()
        // console.log(this.positionChanges)
        assert.isAbove(this.positionChanges.length, 4000)
        assert.isTrue(this.positionChanges.some(pc => pc.date === '2017-11-24'), '2017-11-24 not exists')
        assert.isFalse(
            this.positionChanges.some(pc => pc.date === '2018-10-08' && pc.name === '杨毅'),
            '2018-10-08 杨毅 not exists'
        )
        assert.isTrue(
            this.positionChanges.some(
                pc =>
                    pc.date === '2018-05-28' && pc.name === '刘雅倩' && pc.previous.title === DIC_CAT_MAPPING.ZJ.YG.name
            ),
            '2018-05-28 刘雅倩 not exists'
        )
        assert.isTrue(this.positionChanges.some(pc => pc.name === '贾建'), '贾建 not exists')
    })
    it('hasNewManager should return true', async () => {
        const teamChange = {
            leader: '李永',
            date: '2018-03-29',
            from: '天马项目组',
            to: '去哪儿网外包项目组',
        }
        assert.isTrue(
            this.positionChanges.some(
                (pc: PositionChange) =>
                    pc.date === '2018-03-29' && pc.name === '顾桑桑' && pc.current.team === teamChange.from
            ),
            '2018-03-29 顾桑桑 record not exists'
        )

        let nextManagerChange = this.positionChanges.filter(
            (positionChange: PositionChange) =>
                moment(positionChange.date).isSameOrAfter(moment(teamChange.date)) &&
                moment(positionChange.date).isSameOrBefore(moment(teamChange.date).add(7, 'days')) &&
                positionChange.current.team === teamChange.from &&
                positionChange.current.position === '项目经理'
        )[0]
        assert.exists(nextManagerChange, 'nextManagerChange not exist')
        assert.equal(hasNewManager(this.positionChanges, teamChange.from, teamChange.date), true)
    })

    it('hasNewManager should return false', async () => {
        let positionChanges = this.positionChanges
        const teamChange = {
            leader: '高星',
            date: '2018-05-05',
            from: '东泰盛项目组',
            to: '东泰盛+金亭项目组',
        }
        assert.equal(hasNewManager(positionChanges, teamChange.from, teamChange.date), false)
    })

    it('getTreeLife should return the right values', async () => {
        const tree = await getTreeLife()
        assert.isNotEmpty(tree.get('捷众项目组').get('阙汝爽'))
        assert.isNotEmpty(tree.get('东风安道拓+爱斯达克项目组').get('陈向飞'))
        assert.isNotEmpty(
            tree
                .get('东风安道拓+爱斯达克项目组')
                .get('陈向飞')[0]
                ['subSliceTree'].get('黄小龙')
        )
        assert.isNotEmpty(tree.get('中航上发+延锋安道拓项目组'))
        assert.isNotEmpty(tree.get('猎头组'))
        assert.isEmpty(tree.get('泰康短包外包项目组'))
        assert.isNotEmpty(tree.get('李尔汽车项目组'))
        assert.isNotEmpty(tree.get('天马项目组'))
        assert.isNotEmpty(tree.get('格力小时工项目组'))
        assert.isNotEmpty(tree.get('德尔福项目组'))
        assert.isNotEmpty(tree.get('恒通项目组'))
        assert.isNotEmpty(tree.get('恒通+烟草项目组'))
        assert.isNotEmpty(tree.get('长飞光纤项目组').get('周晴'))
        assert.isNotEmpty(tree.get('长飞光纤+华星光电项目组').get('周晴'))
        assert.isNotEmpty(
            tree
                .get('延锋汽车+圣戈班项目组')
                .get('朱毛毛')[0]
                .subSliceTree.get('周威')
        )
        assert.isNotEmpty(tree.get('社保二组'))
    }).timeout(30000)

    it('getTreeLife 华工高理项目组->池蓉->高满->高思敏 should exists', async () => {
        const tree = await getTreeLife()
        assert.isNotEmpty(
            tree
                .get('华工高理项目组')
                .get('池蓉')[0]
                .subSliceTree.get('高满')[0]
                .staffTree.get('高思敏')
        )
    })

    it('getTreeLife 招聘会->张磊->吴燕峰->乐倩文 should exists', async () => {
        const tree = await getTreeLife()
        assert.isNotEmpty(
            tree
                .get('招聘会')
                .get('张磊')[0]
                .subSliceTree.get('吴燕峰')[0]
                .staffTree.get('乐倩文')
        )
    })

    it('getTreeLife 财务组 should return the right values', async () => {
        const tree = await getTreeLife()
        assert.isNotEmpty(tree.get('财务组'))
    })

    it('getTreeLife 代招去哪儿网项目组->胡建军->韩典 should exists', async () => {
        const tree = await getTreeLife()
        assert.isNotEmpty(
            tree
                .get('代招去哪儿网项目组')
                .get('胡建军')[0]
                .subSliceTree.get('韩典')
        )
    })

    it('filterSortedTimeRangesByTime should return the right values', async () => {
        let sps = [
            {
                team: '长联来福项目组',
                name: '杨正大',
                manager: '张林涛',
                leaderStart: null,
                leaderEnd: '2018-04-17',
                start: null,
                end: '2018-04-17',
                groupLeader: '杨正大',
            },
            {
                team: '长联来福+友德项目组',
                name: '杨正大',
                manager: '张林涛',
                leaderStart: '2018-04-17',
                leaderEnd: '2018-07-13',
                start: '2018-04-17',
                end: '2018-07-13',
                groupLeader: '杨正大',
            },
            {
                team: '大学生兼职部六组',
                name: '杨正大',
                manager: '杨正大',
                leaderStart: '2018-07-13',
                leaderEnd: '2018-08-15',
                start: '2018-07-13',
                end: '2018-08-02',
            },
            {
                team: '代招项目-杨正大',
                name: '杨正大',
                manager: '杨正大',
                leaderStart: '2018-07-13',
                leaderEnd: '2018-08-15',
                start: '2018-08-02',
                end: '2018-08-15',
            },
            {
                team: '长飞光纤项目组',
                name: '杨正大',
                manager: '杨正大',
                leaderStart: '2018-08-15',
                leaderEnd: null,
                start: '2018-08-15',
                end: null,
            },
        ]
        let retSps = filterSortedTimeRangesByTime(sps, '2018-08-10', '2018-08-11')
        assert.deepEqual(retSps, [
            {
                team: '代招项目-杨正大',
                name: '杨正大',
                manager: '杨正大',
                leaderStart: '2018-07-13',
                leaderEnd: '2018-08-15',
                start: '2018-08-02',
                end: '2018-08-15',
            },
        ])

        sps = [
            {
                team: '人事组',
                name: '王思雨',
                manager: '王阳',
                leaderStart: '2018-03-12',
                leaderEnd: '2018-04-02',
                start: '2018-03-12',
                end: '2018-04-02',
                groupLeader: '陈露露',
            },
            {
                team: '薪酬组',
                name: '王思雨',
                manager: '翟敏',
                leaderStart: '2018-04-02',
                leaderEnd: null,
                start: '2018-04-02',
                end: null,
            },
            {
                team: '人事组',
                name: '王思雨',
                manager: '王阳',
                leaderStart: '2018-03-12',
                leaderEnd: '2018-06-21',
                start: '2018-03-12',
                end: '2018-06-21',
                groupLeader: '翟敏',
            },
            {
                team: '财务组',
                name: '王思雨',
                manager: '郭玉芬',
                leaderStart: '2018-06-21',
                leaderEnd: null,
                start: '2018-06-21',
                end: null,
            },
        ]
        retSps = filterSortedTimeRangesByTime(sps, '2018-08-01', '2018-09-01')
        assert.deepEqual(retSps, [
            {
                team: '财务组',
                name: '王思雨',
                manager: '郭玉芬',
                leaderStart: '2018-06-21',
                leaderEnd: null,
                start: '2018-06-21',
                end: null,
            },
        ])
        sps = [
            {
                team: '住电电装项目组',
                name: '汤明圆',
                manager: '汤明圆',
                leaderStart: null,
                leaderEnd: null,
                start: null,
                end: null,
            },
            {
                team: '住电+武汉客车项目组',
                name: '汤明圆',
                manager: '汤明圆',
                leaderStart: '2018-03-27',
                leaderEnd: '2018-08-22',
                start: '2018-03-27',
                end: '2018-08-22',
            },
        ]
        retSps = filterSortedTimeRangesByTime(sps, '2018-08-01', '2018-09-01')
        assert.deepEqual(retSps, [
            {
                team: '住电+武汉客车项目组',
                name: '汤明圆',
                manager: '汤明圆',
                leaderStart: '2018-03-27',
                leaderEnd: '2018-08-22',
                start: '2018-03-27',
                end: '2018-08-22',
            },
        ])
    })

    it('getStaffPositionsOfStaff 高思敏 should exists', async () => {
        let dps = await getStaffPositionsOfStaff('高思敏')
        assert.equal(dps.length, 1, 'getStaffPositionsOfStaff() 高思敏 数据条数不对')
    })

    it('getStaffPositionsOfStaff should return the right values', async () => {
        let dps = await getStaffPositionsOfStaff('陈向飞')
        assert.equal(dps.length, 5, 'getStaffPositionsOfStaff() 陈向飞 数据条数不对')
        assert.deepEqual(
            dps.slice(0, 4),
            [
                {
                    department: '派遣部',
                    team: '东风安道拓项目组',
                    name: '陈向飞',
                    manager: '万小迁',
                    leaderStart: null,
                    leaderEnd: '2018-04-04',
                    start: null,
                    end: '2018-04-04',
                    groupLeader: '陈向飞',
                    status: JobStatus.TRANSFER,
                },
                {
                    department: '派遣部',
                    team: '东风安道拓项目组',
                    name: '陈向飞',
                    manager: '陈向飞',
                    start: '2018-04-04',
                    end: '2018-05-02',
                    status: JobStatus.TRANSFER,
                },
                {
                    department: '派遣部',
                    team: '东风安道拓+爱斯达克项目组',
                    name: '陈向飞',
                    manager: '陈向飞',
                    start: '2018-05-02',
                    end: '2018-05-28',
                    status: JobStatus.TRANSFER,
                },
                {
                    department: '派遣部',
                    team: '东风安道拓+爱斯达克+心怡项目组',
                    name: '陈向飞',
                    manager: '陈向飞',
                    start: '2018-05-28',
                    end: '2018-06-15',
                    status: JobStatus.TRANSFER,
                },
            ],
            '陈向飞 StaffPositions 不正确'
        )

        dps = await getStaffPositionsOfStaff('黄小龙')
        assert.equal(dps.length, 7, 'getStaffPositionsOfStaff() 黄小龙 数据条数不对')
        assert.deepEqual(dps.slice(0, 6), [
            {
                department: '派遣部',
                team: '东风安道拓项目组',
                name: '黄小龙',
                manager: '万小迁',
                leaderStart: null,
                leaderEnd: '2018-04-04',
                start: null,
                end: '2018-04-04',
                status: JobStatus.TRANSFER,
            },
            {
                department: '派遣部',
                team: '东风安道拓+爱斯达克项目组',
                name: '黄小龙',
                manager: '陈向飞',
                leaderStart: '2018-04-04',
                leaderEnd: '2018-05-02',
                start: '2018-04-04',
                end: '2018-04-16',
                groupLeader: '梁龙',
                status: JobStatus.TRANSFER,
            },
            {
                department: '派遣部',
                team: '东风安道拓+爱斯达克项目组',
                name: '黄小龙',
                manager: '陈向飞',
                leaderStart: '2018-04-04',
                leaderEnd: null,
                start: '2018-04-16',
                end: '2018-05-02',
                groupLeader: '黄小龙',
                status: JobStatus.TRANSFER,
            },
            {
                department: '派遣部',
                team: '东风安道拓+爱斯达克项目组',
                name: '黄小龙',
                manager: '陈向飞',
                leaderStart: '2018-04-04',
                leaderEnd: null,
                start: '2018-05-02',
                end: '2018-05-28',
                groupLeader: '黄小龙',
                status: JobStatus.TRANSFER,
            },
            {
                department: '派遣部',
                team: '东风安道拓+爱斯达克项目组',
                name: '黄小龙',
                manager: '陈向飞',
                leaderStart: '2018-04-04',
                leaderEnd: null,
                start: '2018-05-28',
                end: '2018-06-15',
                groupLeader: '黄小龙',
                status: JobStatus.TRANSFER,
            },
            {
                department: '派遣部',
                team: '东风安道拓+爱斯达克项目组',
                name: '黄小龙',
                manager: '陈向飞',
                leaderStart: '2018-04-04',
                leaderEnd: null,
                start: '2018-06-15',
                end: '2018-07-06',
                groupLeader: '黄小龙',
                status: JobStatus.TRANSFER,
            },
        ])
        dps = await getStaffPositionsOfStaff('黄小龙', '2018-07-01', '2018-08-01')
        assert.equal(dps.length, 2)
        dps = await getStaffPositionsOfStaff('杨正大')
        dps = await getStaffPositionsOfStaff('杨正大', '2018-08-10', '2018-08-11')
        assert.equal(dps.length, 1)
        dps = await getStaffPositionsOfStaff('孔仁杰')
        assert.equal(dps.length, 4)
        assert.deepEqual(dps.slice(0, 3), [
            {
                department: '派遣部',
                team: '古河+华网电力项目组',
                name: '孔仁杰',
                manager: '倪磊',
                leaderStart: '2018-04-08',
                leaderEnd: '2018-06-15',
                groupLeader: '张文晴',
                start: '2018-05-07',
                end: '2018-06-19',
                status: JobStatus.TRANSFER,
            },
            {
                department: '派遣部',
                team: '古河+华网电力项目组',
                name: '孔仁杰',
                manager: '倪磊',
                leaderStart: '2018-06-19',
                leaderEnd: '2018-07-16',
                groupLeader: '曾科',
                start: '2018-06-19',
                end: '2018-07-16',
                status: JobStatus.TRANSFER,
            },
            {
                department: '派遣部',
                team: '古河+华网电力项目组',
                name: '孔仁杰',
                manager: '倪磊',
                leaderStart: '2018-04-08',
                leaderEnd: null,
                start: '2018-07-16',
                end: '2018-08-09',
                status: JobStatus.TRANSFER,
            },
        ])
        dps = await getStaffPositionsOfStaff('廖婷婷', '2018-08-01', '2018-08-02')
        assert.equal(dps.length, 1)
    })

    it('getStaffPositionsOfStaff should return the right values when employee leave', async () => {
        let dps = await getStaffPositionsOfStaff('刘雅倩')
        assert.deepEqual(dps, [
            {
                department: '派遣部',
                start: '2018-03-19',
                end: '2018-05-02',
                leaderStart: '2017-12-01',
                leaderEnd: '2018-05-01',
                team: '联想项目组',
                name: '刘雅倩',
                manager: '田勇',
                groupLeader: '黎俊刚',
                status: JobStatus.TRANSFER,
            },
            {
                department: '派遣部',
                start: '2018-05-02',
                end: '2018-05-28',
                leaderStart: '2018-05-02',
                leaderEnd: '2018-07-13',
                team: '联想项目组',
                name: '刘雅倩',
                manager: '田勇',
                groupLeader: '肖念玉',
                status: JobStatus.RESIGN,
            },
        ])
    })
    it('getStaffPositionsOfStaff 王青 should return the right values, when it have further position change', async () => {
        let sps = await getStaffPositionsOfStaff('王青')
        assert.deepEqual(sps[0], {
            start: '2018-05-22',
            end: '2018-06-09',
            leaderStart: null,
            leaderEnd: '2018-06-09',
            team: '财务组',
            name: '王青',
            manager: '刘晓晖',
            groupLeader: '王晶',
            status: JobStatus.ENTRY,
        })
    })

    it('getStaffPositionsOfStaff 金鹏翔 should return the right values', async () => {
        let sps = await getStaffPositionsOfStaff('金鹏翔')
        // TODO, 金鹏翔's groupLeader resigned
        console.log('金鹏翔 sps=', sps)
    })

    it("getStaffPositionsOfStaff 王曦 who's team name changed", async () => {
        let sps = await getStaffPositionsOfStaff('王曦')
        assert.isAbove(sps.length, 2)
        assert.deepEqual(sps[0], {
            start: '2018-09-06',
            end: '2018-09-19',
            status: JobStatus.ENTRY,
            team: '远航物流+华新汽车+安吉项目组',
            name: '王曦',
            manager: '张少杰',
            department: '派遣部',
            leaderStart: '2018-08-22',
            leaderEnd: '2018-09-19',
            groupLeader: '赵安',
        })
    })

    it('getStaffPositionsOfStaff 冯松杰 who resigned should return the right values', async () => {
        //let sps = await getStaffPositionsOfStaff('冯松杰')
        let staffPositionMap = await getStaffPositionMap()
        let sps = staffPositionMap.get('冯松杰')
        assert.isAbove(sps.length, 0)
        assert.equal(sps[sps.length - 1].status, '离职')
    })

    it('getStaffPositionsOfStaff 刘聪 who leaved should return the right values', async () => {
        let sps = await getStaffPositionsOfStaff('刘聪')
        assert.isAbove(sps.length, 0)
        assert.equal(sps[sps.length - 1].status, '自离')
    })

    // it('getStaffPositionsOfStaff 倪世成 should return the right values', async () => {
    //     let sps = await getStaffPositionsOfStaff('倪世成', '2018-08-27', '2018-08-28')
    //     console.log('sps=', sps)
    // })

    /*it('getStaffPositionMap all time data should return the right values', async () => {
        let staffPositionMap = await getStaffPositionMap()
        let count = 0
        let sum = 0
        for (let entry of staffPositionMap.entries()) {
            sum++
            if (!validateNodeSlices(entry[1])) {
                count++
                console.log('Validate StaffPosition error! staff:', entry[0], ' positions:', entry[1])
            }
        }
        console.log('staff sum=', sum)
        assert.equal(count, 0)
    })*/

    it('getStaffPositionMap one month data should return the right values', async () => {
        let staffPositionMap = await getStaffPositionMap()
        let count = 0
        let sum = 0
        for (let entry of staffPositionMap.entries()) {
            sum++
            if (!validateNodeSlices(filterSortedTimeRangesByTime(entry[1], '2018-09-01', '2018-10-01'), true)) {
                count++
                console.log('Validate StaffPosition error! staff:', entry[0], ' positions:', entry[1])
            }
        }
        console.log('staff sum=', sum, ', invalid count=', count)
        assert.isBelow(count, 13)
    })
    it('getStaffPositionMap one month data should have the right team names', async () => {
        const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')
        let teams = require(path.join(raw_path, 'standard/team-names/' + month + '/teams.json'))
        let staffPositionMap = await getStaffPositionMap()
        let wrongTeams = new Set<string>()
        for (let entry of staffPositionMap.entries()) {
            let staffPositions: StaffPosition[] = filterSortedTimeRangesByTime(entry[1], '2018-08-01', '2018-09-01')
            for (let staffPosition of staffPositions) {
                if (!teams.includes(staffPosition.team)) {
                    wrongTeams.add(staffPosition.team)
                }
            }
        }
        console.log('wrongTeams=', wrongTeams)
        // TODO reduce wrongTeams number
        assert.isBelow(wrongTeams.size, 13)
    })
}).timeout(20000)
