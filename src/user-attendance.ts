import * as moment from 'moment'
import * as _ from 'lodash'

import { loadJsonFromDb } from '@uranplus/cavalry-utils'

const maxSize = 99999

async function _getUserAttendanceMap(start, end) {
    const attendanceArray = (await loadJsonFromDb('attendance', 'attendance', maxSize))
        .filter(date => moment(date['日期']).isSameOrAfter(start) && moment(date['日期']).isSameOrBefore(end))
        .map(item => {
            return {
                name: item['姓名'],
                time: item['日期'],
                should: Number(item['应出'] ? item['应出'] : 0),
                acture: Number(item['实出'] ? item['实出'] : 0),
                hiredate: item['入职日期'],
                fine:
                    // Number(item['迟到扣款'] ? \d\. item['迟到扣款'] : 0) +
                    // Number(item['早退扣款'] ? item['早退扣款'] : 0) +
                    Number(item['上班未打卡扣款'] ? item['上班未打卡扣款'] : 0) +
                    Number(item['下班未打卡扣款'] ? item['下班未打卡扣款'] : 0),
            }
        })
    return _.groupBy(attendanceArray, item => item.name)
}

let gUserAttendanceMap = null

export async function getUserAttendanceMap(start, end) {
    if (!gUserAttendanceMap) {
        gUserAttendanceMap = _getUserAttendanceMap(start, end)
    }
    return gUserAttendanceMap
}
