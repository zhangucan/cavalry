import * as path from 'path'
import { xlsx2json, strMapToObj, trimObj, saveJsonToDb } from '@uranplus/cavalry-utils'
import * as moment from 'moment'
import * as config from 'config'

const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')
export async function saveAttendance2db(index, type) {
    const temp = path.join(
        require('@uranplus/cavalry-raw-files'),
        `/nj-data/${month}/attendance/湖北纳杰人力资源有限公司月度考勤.xlsx`
    )
    const data = xlsx2json(temp, 0).map((entry, line) => {
        entry = trimObj(entry)
        const detail = new Map()
        const reg = /^[0-9]{4}-[0-1][0-9]-[0-3][0-9]$/
        Object.keys(entry).forEach(q => {
            if (reg.test(q)) {
                detail.set(q, entry[q])
            }
        })
        return {
            name: entry['姓名'].split('（离职）')[0],
            team: entry['部门'],
            detail: strMapToObj(detail),
            should: Number(entry['出勤天数']),
            acture: detail.size,
            lateTimes: Number(entry['迟到次数']),
            range4Late: entry['迟到时长'],
            earlyLeaveTimes: Number(entry['早退次数']),
            range4earlyLeave: Number(entry['早退时长']),
            notClockTimes: Number(entry['上班缺卡次数']) + Number(entry['下班缺卡次数']),
            month: moment(month).format('YYYY-MM-DD'),
        }
    })
    await saveJsonToDb(data, index, type)
}
export async function saveAsk4leave2db(index, type) {
    const temp = path.join(require('@uranplus/cavalry-raw-files'), `/nj-data/${month}/attendance/请假明细.xlsx`)
    const data = xlsx2json(temp, 0).map((entry, line) => {
        entry = trimObj(entry)
        return {
            name: entry['姓名'],
            team: entry['部门'],
            category: entry['事假'],
            reasons: entry['请假原因'],
            start: entry['请假开始时间'],
            end: entry['请假结束时间'],
            range: Number(entry['请假天数']),
            reviewerName: entry['审批人'],
            reviewerTime: entry['审批时间'],
            status: entry['状态'],
            month: moment(month).format('YYYY-MM-DD'),
        }
    })
    await saveJsonToDb(data, index, type)
}
export async function saveBusinessTrip2db(index, type) {
    const temp = path.join(require('@uranplus/cavalry-raw-files'), `/nj-data/${month}/attendance/外出明细.xlsx`)
    const data = xlsx2json(temp, 0).map((entry, line) => {
        entry = trimObj(entry)
        return {
            name: entry['姓名'],
            group: entry['小组'],
            team: entry['部门'],
            category: entry['类别'],
            reasons: entry['请假原因'],
            start: entry['外出时间'],
            end: entry['返回时间'],
            apply4time: entry['申请时间'],
            range: Number(entry['外出时长']),
            month: moment(month).format('YYYY-MM-DD'),
        }
    })
    await saveJsonToDb(data, index, type)
}
