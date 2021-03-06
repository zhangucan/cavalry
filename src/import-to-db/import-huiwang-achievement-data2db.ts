import * as path from 'path'
import * as fs from 'fs'
import {
    xlsx2json,
    trimObj,
    getAchievementType,
    getPosition,
    getEmployeeName,
    getLeaderFormXlsx,
    saveJsonToDb,
} from '@uranplus/cavalry-utils'
import { Recruitment, JobSeeker, DIC_CAT_MAPPING } from '@uranplus/cavalry-define'
import * as moment from 'moment'
import * as config from 'config'
const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')

export async function ormHuiWangAchievementFormXlsx(index, type) {
    const folder = path.join(require('@uranplus/cavalry-raw-files'), `/nj-data/${month}/achievement_huiwang/`)
    let temp = []
    for (let file of fs.readdirSync(folder)) {
        const filePath = path.join(folder, file)
        var stat = fs.statSync(filePath)
        if (stat.isFile() && filePath.endsWith('.xlsx')) {
            xlsx2json(filePath, 0).forEach(item => {
                const entry = trimObj(item)
                const achievement = new Recruitment()
                achievement.jobSeeker = new JobSeeker()
                achievement.jobSeeker.name = entry['求职者姓名']
                achievement.jobSeeker.idCardNo = entry['身份证号码']
                achievement.jobSeeker.gender = entry['性别']
                achievement.jobSeeker.phoneNumber = entry['联系电话']
                achievement.createDate = new Date()
                achievement.team = entry['组别']
                achievement.teamIn = entry['代招项目名称']
                achievement.inauguralUnit = entry['入职客户名称']
                achievement.isOurUnit = entry['入职性质']
                achievement.date = entry['入职时间'] ? new Date(entry['入职时间']) : new Date(entry['日期'])
                achievement.type = getAchievementType(entry)
                achievement.position = getPosition(entry)
                achievement.employee = getEmployeeName(entry)
                achievement.leader = getLeaderFormXlsx(entry)
                achievement.manager = entry[DIC_CAT_MAPPING.ZJ.JL.name]
                achievement.value = Number(entry['业绩收入'])
                achievement.describe = entry['备注']
                achievement.source = '会网'
                achievement.month = moment(month).format('YYYY-MM-DD')
                temp.push(achievement)
            })
        }
    }
    await saveJsonToDb(temp, index, type)
}
