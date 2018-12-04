import * as path from 'path'
import * as fs from 'fs'
import * as _ from 'lodash'
import { xlsx2json, trimObj, getEmployeeName, getLeaderFormXlsx, saveJsonToDb } from '@uranplus/cavalry-utils'
import { RecruitmentRecall, JobSeeker, DIC_CAT_MAPPING } from '@uranplus/cavalry-define'
import * as config from 'config'
import * as moment from 'moment'
const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')

export async function ormRecruitmentRecallFormXlsx(index, type) {
    const folder = path.join(require('@uranplus/cavalry-raw-files'), `/nj-data/${month}/recruitment_recall`)
    let recruitmentRecalls = []
    for (let file of fs.readdirSync(folder)) {
        const filePath = path.join(folder, file)
        var stat = fs.statSync(filePath)
        if (stat.isFile() && filePath.endsWith('.xlsx')) {
            xlsx2json(filePath, 0).forEach(item => {
                const entry = trimObj(item)
                const recruitmentRecall = new RecruitmentRecall()
                const jobSeeker = new JobSeeker()
                recruitmentRecall.createDate = new Date()
                recruitmentRecall.employee = getEmployeeName(entry)
                recruitmentRecall.leader = getLeaderFormXlsx(entry)
                recruitmentRecall.leaveDate = new Date(entry['离职时间'])
                recruitmentRecall.manager = entry[DIC_CAT_MAPPING.ZJ.JL.name]
                recruitmentRecall.value = Number(entry['划回业绩'])
                recruitmentRecall.teamIn = entry['代招项目名称']
                recruitmentRecall.team = entry['本项目名称']
                recruitmentRecall.month = month
                jobSeeker.name = entry['求职者姓名']
                jobSeeker.phoneNumber = entry['联系电话']
                jobSeeker.gender = entry['性别']
                recruitmentRecall.jobSeeker = jobSeeker
                recruitmentRecalls.push(recruitmentRecall)
            })
        }
    }
    await saveJsonToDb(recruitmentRecalls, index, type)
}
