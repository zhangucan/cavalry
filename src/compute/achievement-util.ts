import * as _ from 'lodash'
import { xlsx2json, trimObj, search, getEmployeeName, getLeaderFormXlsx } from '@uranplus/cavalry-utils'

import { Recruitment, AchievementType, Role, JobSeeker, DIC_CAT_MAPPING } from '@uranplus/cavalry-define'
import { getTreeLife, getTeamNames } from '@uranplus/cavalry-sdk'
import * as path from 'path'
import * as moment from 'moment'
import * as fs from 'fs'
const debug = require('debug')('achievement-util')
const bodybuilder = require('bodybuilder')
// const achievement_index = 'achievement_zhangucan'
const achievement_index = 'achievement'
const achievement_type = 'achievement'
const employee_index = 'employee'
const employee_type = 'employee'
const maxSize = 99999
export class AchievementUtil {
    tree: any
    teams: any
    monthDate: any
    employees: any
    logs: string[]
    start: moment.Moment
    end: moment.Moment
    constructor(month: string) {
        this.monthDate = moment(month)
            .startOf('month')
            .format('YYYY-MM-DD')
        this.start = moment(month).startOf('month')
        // only for elasticsearch
        this.end = moment(month)
            .add(1, 'month')
            .startOf('month')
    }
    async init(start, end) {
        this.logs = []
        this.tree = await getTreeLife()
        this.employees = await this.getEmployees()
        this.teams = await getTeamNames(this.tree, start, end)
    }
    getPosition(employee) {
        if (employee['专员']) {
            return Role.STAFF
        } else if (!employee['专员'] && employee[DIC_CAT_MAPPING.ZJ.ZG.name]) {
            return Role.GROPOUP_LEADER
        } else {
            return Role.MANAGER
        }
    }
    getAchievementType(employee): AchievementType {
        if (employee['业绩来源'] === '招聘') {
            return AchievementType.RECRUITMENT
        } else if (employee['业绩来源'] === '绩效') {
            return AchievementType.RESIDENT
        } else if (!employee['业绩来源']) {
            return AchievementType.RECRUITMENT
        }
    }
    async ormResidentAchievementFormXlsx() {
        const folder = path.join(require('@uranplus/cavalry-raw-files'), '/resident_achievement/')
        let resident_achievements = []
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
                    achievement.team = entry['本项目名称']
                    achievement.teamIn = entry['代招项目名称']
                    achievement.inauguralUnit = entry['入职客户名称']
                    achievement.isOurUnit = entry['入职性质']
                    achievement.date = new Date(entry['入职时间'])
                    achievement.type = this.getAchievementType(entry)
                    achievement.position = this.getPosition(entry)
                    achievement.employee = getEmployeeName(entry)
                    achievement.leader = getLeaderFormXlsx(entry)
                    achievement.manager = entry[DIC_CAT_MAPPING.ZJ.JL.name]
                    achievement.value = Number(entry['业绩'])
                    achievement.describe = entry['备注']
                    resident_achievements.push(achievement)
                })
            }
        }
        return resident_achievements
    }
    async getEmployees() {
        const query = bodybuilder()
            .filter('term', '_type', employee_type)
            .filter('term', 'month', this.monthDate)
            .size(maxSize)
            .build()
        return await search(employee_index, employee_type, query)
    }
    async getRecruitmentByName(name: string) {
        const query = bodybuilder()
            .query('terms', 'employee', [name])
            .filter('range', 'date', { gte: this.start.toISOString(), lt: this.end.toISOString() })
            .build()
        debug('getRecruitmentByName() query=', JSON.stringify(query))
        const json = await search(achievement_index, achievement_type, query)
        return json.map(item => this.json2recruitment(item))
    }
    async getAchievements(): Promise<Recruitment[]> {
        const query = bodybuilder()
            .filter('range', 'date', { gte: this.start.toISOString(), lt: this.end.toISOString() })
            .filter('term', 'month', this.monthDate)
            .size(maxSize)
            .build()
        debug('getAchievements() query=', JSON.stringify(query))
        const json = await search(achievement_index, achievement_type, query)
        return json.map(item => this.json2recruitment(item))
    }
    json2recruitment(json): Recruitment {
        /*const jobSeeker = new JobSeeker()
        const achievement = new Recruitment()
        jobSeeker.name = json.jobSeeker.name
        jobSeeker.gender = json.jobSeeker.gender
        jobSeeker.idCardNo = json.jobSeeker.idCardNo
        jobSeeker.phoneNumber = json.jobSeeker.phoneNumber
        achievement.createDate = json.createDate
        achievement.date = json.date
        achievement.teamIn = json.teamIn
        achievement.team = json.team
        achievement.inauguralUnit = json.inauguralUnit
        achievement.isOurUnit = json.isOurUnit
        achievement.position = json.position
        achievement.type = json.type
        achievement.value = json.value
        achievement.describe = json.describe
        achievement.employee = json.employee
        achievement.jobSeeker = jobSeeker*/
        return json
    }
}
