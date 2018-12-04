import * as _ from 'lodash'
import { xlsx2json, trimObj, setEsUrl, search, getLeaderFormXlsx, getEmployeeName } from '@uranplus/cavalry-utils'
import { configure, getLogger } from 'log4js'
import * as path from 'path'
import * as fs from 'fs'
import * as raw_path from '@uranplus/cavalry-raw-files'
import * as moment from 'moment'
import { StaffPosition, Recruitment, DIC_CAT_MAPPING } from '@uranplus/cavalry-define'
import * as config from 'config'

const bodybuilder = require('bodybuilder')
const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')
var teams = require(path.join(raw_path, `standard/team-names/${month}/teams.json`))
var customer = require(path.join(raw_path, `standard/team-names/${month}/customers.json`))

const folder = path.join(require('@uranplus/cavalry-raw-files'), '/achievement/')
const timeReg = /^[0-9]{4}-[0-1][0-9]-[0-3][0-9]$/
const timeReg1 = /^[1-9]?[1-9]\/[1-3]?[0-9]\/[1-3]?[0-9]$/
const timeReg2 = /^[0-9]{4}\/[0-1][0-9]\/[0-3][0-9]$/
const phoneReg = /^[0-9]{11}$/
const maxSize = 99999

class Validate {
    // tree: any
    teams: any
    monthDate: any
    customer: any
    staffPositions: StaffPosition[]
    achievements: Recruitment[]
    validateManager = (entry, index, file, logs) => {
        if (!entry[DIC_CAT_MAPPING.ZJ.JL.name]) {
            this.log4incoming(`${index} 经理:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
        } else {
            const time = entry['入职时间'] ? entry['入职时间'] : entry['时间']
            const employee = this.staffPositions.find(
                item => item.name === entry[DIC_CAT_MAPPING.ZJ.JL.name] && this.validateTime(time, item.start, item.end)
            )
            if (!employee) {
                this.log4incoming(
                    `${time} ${index} 经理: 人事报表无${entry[DIC_CAT_MAPPING.ZJ.JL.name]}`,
                    `${logs}/${file.split('.xlsx')[0]}.log`
                )
            }
        }
    }
    validateGroupleader = (entry, index, file, logs) => {
        if (entry[DIC_CAT_MAPPING.ZJ.ZG.name]) {
            const time = entry['入职时间'] ? entry['入职时间'] : entry['时间']
            const employee = this.staffPositions.find(
                item => item.name === entry[DIC_CAT_MAPPING.ZJ.JL.name] && this.validateTime(time, item.start, item.end)
            )
            if (!employee) {
                this.log4incoming(
                    `${time} ${index} 主管: 人事报表无${entry[DIC_CAT_MAPPING.ZJ.ZG.name]}`,
                    `${logs}/${file.split('.xlsx')[0]}.log`
                )
            }
        }
    }
    validateStaff = (entry, index, file, logs) => {
        if (entry['专员']) {
            const time = entry['入职时间'] ? entry['入职时间'] : entry['时间']
            const employee = this.staffPositions.find(
                item => item.name === entry[DIC_CAT_MAPPING.ZJ.JL.name] && this.validateTime(time, item.start, item.end)
            )
            if (!employee) {
                this.log4incoming(
                    `${time} ${index} 专员: 人事报表无${entry['专员']}`,
                    `${logs}/${file.split('.xlsx')[0]}.log`
                )
            }
        }
    }
    validateJobSeekerName = (entry, index, file, logs) => {
        if (!entry['求职者姓名']) {
            this.log4incoming(`${index} 求职者姓名:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
        }
    }
    validateOnSiteJobSeekerName = (entry, index, file, logs) => {
        if (entry['业绩来源'] && entry['业绩来源'] === '招聘') {
            if (!entry['求职者姓名']) {
                this.log4incoming(`${index} 求职者姓名:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
            }
        }
    }
    validatePhone = (entry, index, file, logs) => {
        if (!entry['联系电话']) {
            this.log4incoming(`${index} 联系电话:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
        } else {
            if (!phoneReg.test(entry['联系电话'])) {
                this.log4incoming(`${index} 联系电话:格式错误，应为11为数字`, `${logs}/${file.split('.xlsx')[0]}.log`)
            }
        }
    }
    validateOnSitePhone = (entry, index, file, logs) => {
        if (entry['业绩来源'] && entry['业绩来源'] === '招聘') {
            if (!entry['联系电话']) {
                this.log4incoming(`${index} 联系电话:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
            } else {
                if (!phoneReg.test(entry['联系电话'])) {
                    this.log4incoming(
                        `${index} 联系电话:格式错误，应为11为数字`,
                        `${logs}/${file.split('.xlsx')[0]}.log`
                    )
                }
            }
        }
    }
    validateTeamIn = (entry, index, file, logs) => {
        if (!entry['本项目名称']) {
            this.log4incoming(`${index} 本项目名称:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
        } else {
            if (!this.teams.includes(entry['本项目名称'])) {
                this.log4incoming(
                    `${index} 本项目名称不正确，未在数据库中查到当前项目组：${entry['本项目名称']}`,
                    `${logs}/${file.split('.xlsx')[0]}.log`
                )
            }
        }
    }
    validateCustomer2 = (entry, index, file, logs) => {
        if (!entry['入职单位']) {
            this.log4incoming(`${index} 入职单位:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
        } else {
            if (!this.customer.includes(entry['入职单位'])) {
                this.log4incoming(
                    `${index} 入职单位不正确，未在数据库中查到当前入职单位：${entry['入职单位']}`,
                    `${logs}/${file.split('.xlsx')[0]}.log`
                )
            }
        }
    }
    validateCustomer = (entry, index, file, logs) => {
        if (!entry['入职客户名称']) {
            this.log4incoming(`${index} 入职客户名称:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
        } else {
            if (!this.customer.includes(entry['入职客户名称'])) {
                this.log4incoming(
                    `${index} 入职客户名称不正确，未在数据库中查到当前入职客户名称：${entry['入职客户名称']}`,
                    `${logs}/${file.split('.xlsx')[0]}.log`
                )
            }
        }
    }
    validateInauguralUnit = (entry, index, file, logs) => {
        if (!entry['代招项目名称']) {
            this.log4incoming(`${index} 代招项目名称:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
        } else {
            if (!this.teams.includes(entry['代招项目名称'])) {
                this.log4incoming(
                    `${index} 代招项目名称名称不正确，未在数据库中查到当前代招项目名称：${entry['代招项目名称']}`,
                    `${logs}/${file.split('.xlsx')[0]}.log`
                )
            }
        }
    }
    validateOnsiteInauguralUnit = (entry, index, file, logs) => {
        if (entry['业绩来源'] && entry['业绩来源'] === '招聘') {
            if (!entry['代招项目名称']) {
                this.log4incoming(`${index} 代招项目名称:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
            } else {
                if (!this.teams.includes(entry['代招项目名称'])) {
                    this.log4incoming(
                        `${index} 代招单位名称不正确，未在数据库中查到当前代招单位：${entry['代招项目名称']}`,
                        `${logs}/${file.split('.xlsx')[0]}.log`
                    )
                }
            }
        }
    }
    validateAchievement = (entry, index, file, logs) => {
        if (!entry['业绩收入']) {
            this.log4incoming(`${index} 业绩收入:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
        } else {
            if (typeof Number(entry['业绩收入']) !== 'number') {
                this.log4incoming(`${index} 业绩收入:业绩收入应为数字`, `${logs}/${file.split('.xlsx')[0]}.log`)
            }
        }
    }
    validateRecruitmentRecall = (entry, index, file, logs) => {
        if (!entry['划回业绩']) {
            this.log4incoming(`${index} 划回业绩:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
        } else {
            if (typeof Number(entry['划回业绩']) !== 'number') {
                this.log4incoming(`${index} 划回业绩:划回业绩应为数字`, `${logs}/${file.split('.xlsx')[0]}.log`)
            }
        }
    }
    validateOnSiteAchievement = (entry, index, file, logs) => {
        if (!entry['业绩']) {
            this.log4incoming(`${index} 业绩:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
        } else {
            if (typeof Number(entry['业绩']) !== 'number') {
                this.log4incoming(`${index} 业绩:业绩应为数字`, `${logs}/${file.split('.xlsx')[0]}.log`)
            }
        }
    }
    validateIsOurUnit = (entry, index, file, logs) => {
        if (!entry['入职性质']) {
            this.log4incoming(`${index} 入职性质:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
        } else {
            if (!/^[自|代]招$/.test(entry['入职性质'])) {
                this.log4incoming(
                    `${index} 入职性质:格式不正确，应为代招或自招`,
                    `${logs}/${file.split('.xlsx')[0]}.log`
                )
            } else {
                if (!entry['入职性质']) {
                    this.log4incoming(`${index} 入职性质:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
                } else {
                    if (!/^[自|代]招$/.test(entry['入职性质'])) {
                        this.log4incoming(
                            `${index} 入职性质:格式不正确，应为代招或自招`,
                            `${logs}/${file.split('.xlsx')[0]}.log`
                        )
                    } else {
                        if (entry['入职性质'] === '代招') {
                            if (entry['代招项目名称'] === entry['本项目名称']) {
                                this.log4incoming(
                                    `${index} 入职性质:${entry['入职性质']} 代招项目名称 :${
                                        entry['代招项目名称']
                                    }  本项目名称: ${entry['本项目名称']}`,
                                    `${logs}/${file.split('.xlsx')[0]}.log`
                                )
                            }
                        } else if (entry['入职性质'] === '自招') {
                            if (entry['代招项目名称'] !== entry['本项目名称']) {
                                this.log4incoming(
                                    `${index} 入职性质: ${entry['入职性质']} 代招项目名称 :${
                                        entry['代招项目名称']
                                    }  本项目名称: ${entry['本项目名称']}`,
                                    `${logs}/${file.split('.xlsx')[0]}.log`
                                )
                            }
                        }
                    }
                }
            }
        }
    }
    validateEntryDate = (entry, index, file, logs) => {
        if (!entry['入职时间']) {
            this.log4incoming(`${index} 入职时间:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
        } else {
            if (!timeReg.test(entry['入职时间'])) {
                this.log4incoming(
                    `${index} 入职时间: ${entry['入职时间']}格式错误，应为YYYY-MM-DD`,
                    `${logs}/${file.split('.xlsx')[0]}.log`
                )
            }
        }
    }
    validateOnSiteIsOurUnit = (entry, index, file, logs) => {
        if (entry['业绩来源'] && entry['业绩来源'] === '招聘') {
            if (!entry['入职性质']) {
                this.log4incoming(`${index} 入职性质:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
            } else {
                if (!/^[自|代]招$/.test(entry['入职性质'])) {
                    this.log4incoming(
                        `${index} 入职性质: ${entry['入职性质']} 格式不正确，应为代招或自招`,
                        `${logs}/${file.split('.xlsx')[0]}.log`
                    )
                } else {
                    if (entry['入职性质'] === '代招') {
                        if (entry['代招项目名称'] === entry['项目组']) {
                            this.log4incoming(
                                `${index} 入职性质: ${entry['入职性质']} 代招项目名称 :${
                                    entry['代招项目名称']
                                }  本项目名称: ${entry['项目组']}`,
                                `${logs}/${file.split('.xlsx')[0]}.log`
                            )
                        }
                    } else if (entry['入职性质'] === '自招') {
                        if (entry['代招项目名称'] !== entry['项目组']) {
                            this.log4incoming(
                                `${index} 入职性质:${entry['入职性质']} 代招项目名称 :${
                                    entry['代招项目名称']
                                }  本项目名称: ${entry['项目组']}`,
                                `${logs}/${file.split('.xlsx')[0]}.log`
                            )
                        }
                    }
                }
            }
        }
    }
    validateLeaveDate = (entry, index, file, logs) => {
        if (!entry['离职时间']) {
            this.log4incoming(`${index} 离职时间:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
        } else {
            if (!timeReg.test(entry['离职时间'])) {
                this.log4incoming(
                    `${index} 离职时间: ${entry['离职时间']}格式错误，应为YYYY-MM-DD`,
                    `${logs}/${file.split('.xlsx')[0]}.log`
                )
            }
        }
    }
    validateCreateDate = (entry, index, file, logs) => {
        if (!entry['填写时间']) {
            this.log4incoming(`${index} 填写时间:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
        } else {
            if (!timeReg.test(entry['填写时间'])) {
                this.log4incoming(
                    `${index} 填写时间: ${entry['填写时间']}格式错误，应为YYYY-MM-DD`,
                    `${logs}/${file.split('.xlsx')[0]}.log`
                )
            }
        }
    }
    validateOnSiteTime = (entry, index, file, logs) => {
        if (!entry['时间']) {
            this.log4incoming(`${index} 时间:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
        } else {
            if (!timeReg.test(entry['时间'])) {
                this.log4incoming(
                    `${index} 时间: ${entry['时间']}格式错误，应为YYYY-MM-DD`,
                    `${logs}/${file.split('.xlsx')[0]}.log`
                )
            }
        }
    }
    validateTeamName = (entry, index, file, logs) => {
        if (!entry['项目组']) {
            this.log4incoming(`${index} 项目组:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
        } else {
            if (!this.teams.includes(entry['项目组'])) {
                this.log4incoming(
                    `${index} 项目组不正确，未在数据库中查到当前项目组：${entry['项目组']}`,
                    `${logs}/${file.split('.xlsx')[0]}.log`
                )
            }
        }
    }
    validateOnSiteCustomer = (entry, index, file, logs) => {
        if (entry['业绩来源'] && entry['业绩来源'] === '招聘') {
            if (!entry['入职客户名称']) {
                this.log4incoming(`${index} 入职客户名称:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
            } else {
                if (!this.customer.includes(entry['入职客户名称'])) {
                    this.log4incoming(
                        `${index} 入职客户名称不正确，未在数据库中查到当前入职客户名称：${entry['入职客户名称']}`,
                        `${logs}/${file.split('.xlsx')[0]}.log`
                    )
                }
            }
        }
    }
    validateAchievementType = (entry, index, file, logs) => {
        if (!entry['业绩来源']) {
            this.log4incoming(`${index} 业绩来源:不能为空`, `${logs}/${file.split('.xlsx')[0]}.log`)
        } else {
            if (!/^招聘|绩效$/.test(entry['业绩来源'])) {
                this.log4incoming(
                    `${index} 业绩来源:格式不正确，应为招聘或绩效`,
                    `${logs}/${file.split('.xlsx')[0]}.log`
                )
            }
        }
    }

    validateTime = (time, a, b): boolean => {
        if (a && b) {
            return moment(time).isSameOrAfter(moment(new Date(a))) && moment(time).isSameOrBefore(moment(new Date(b)))
        } else if (a) {
            return moment(time).isSameOrAfter(moment(new Date(a)))
        } else if (b) {
            return moment(time).isSameOrBefore(moment(new Date(b)))
        } else {
            return true
        }
    }
    validateRelationShip = (entry, index, file, logs) => {
        const manager = entry[DIC_CAT_MAPPING.ZJ.JL.name]
        const groupLeader = entry[DIC_CAT_MAPPING.ZJ.ZG.name]
        const staff = entry['专员']
        if (
            (manager === groupLeader || groupLeader === staff || manager === staff) &&
            !(manager && !groupLeader && !staff)
        ) {
            this.log4incoming(
                `${index} 经理不能同时担任主管，主管不能同时担任员工`,
                `${logs}/${file.split('.xlsx')[0]}.log`
            )
        }
    }
    validateAchievementRecall = (entry, index, file, logs) => {
        const jobSeeker = this.achievements
            .filter(item => item.jobSeeker)
            .find(
                item => item.jobSeeker.name === entry['求职者姓名'] && item.jobSeeker.phoneNumber === entry['联系电话']
            )
        if (!jobSeeker) {
            this.log4incoming(
                `${index}在上个月业绩表中没有查询到${entry['求职者姓名']},请检查姓名电话是否正确`,
                `${logs}/${file.split('.xlsx')[0]}.log`
            )
        }
    }
    validatePositionChange = (entry, index, file, logs) => {
        const leader = getLeaderFormXlsx(entry)
        const name = getEmployeeName(entry)
        const time = new Date(entry['入职时间'] ? entry['入职时间'] : entry['时间'])
        const temp: StaffPosition = this.staffPositions.find(item => {
            const a = item.groupLeader ? item.groupLeader : item.manager
            return item.name === name && a === leader && this.validateTime(time, item.leaderStart, item.leaderEnd)
        })
        if (!temp && leader) {
            const temp2: StaffPosition = this.staffPositions.find(item => {
                return item.name === name && this.validateTime(time, item.leaderStart, item.leaderEnd)
            })
            const temp4: string[] = this.staffPositions
                .filter(item => item.name === leader)
                .map(item => {
                    return `${item.start} ~ ${item.end} | ${item.team}\r\n`
                })
            const temp3: string[] = this.staffPositions
                .filter(item => item.name === name)
                .map(item => {
                    return `${item.start} ~ ${item.end} | ${item.team} | ${item.nodeSlice.title}\r\n`
                })
            let b = null
            if (temp2) {
                b = temp2.groupLeader ? temp2.groupLeader : temp2.manager
            }
            this.log4incoming(
                `${index} ${moment(time).format('YYYY-MM-DD')}:${name} 直接领导不是${leader},${
                    b ? '业绩表填写的上下级出错,应为' + b : '人事报表异动记录缺失'
                }\r\n${name}的任职情况为：\r\n${
                    temp3.length === 0 ? '空' : temp3
                } \n '人事报表直接领导任职情况为:'\r\n${temp4.length === 0 ? '空' : temp4}`,
                `${logs}/${file.split('.xlsx')[0]}.log`
            )
        }
    }
    async init() {
        const esUrl = config.get('es.url')
        await setEsUrl(esUrl)
        this.teams = teams
        this.customer = customer
        this.staffPositions = await search(
            'staff_position',
            'staff_position',
            bodybuilder()
                .filter('term', '_type', 'staff_position')
                .size(10000)
                .build()
        )
        // TODO: 下次数据需要加上当月日期
        this.achievements = await search(
            'achievement',
            'achievement',
            bodybuilder()
                .filter('term', '_type', 'achievement')
                .size(10000)
                .build()
        )
    }

    log4incoming(log, path) {
        configure({
            appenders: { incoming: { type: 'file', filename: path } },
            categories: { default: { appenders: ['incoming'], level: 'error' } },
        })
        const logger = getLogger()
        logger.level = 'error'
        logger.error(log)
    }
    async validateIncomingData() {
        const folder = path.join(require('@uranplus/cavalry-raw-files'), `/nj-data/${month}/achievement`)
        const logs = path.join(require('@uranplus/cavalry-raw-files'), '/logs/achievement/')
        for (let file of await fs.readdirSync(folder)) {
            const filePath = path.join(folder, file)
            var stat = fs.statSync(filePath)
            if (stat.isFile() && filePath.endsWith('.xlsx')) {
                xlsx2json(filePath, 0).forEach(async (entry, line) => {
                    const index = `第${line + 2}行`
                    entry = trimObj(entry)
                    this.validateEntryDate(entry, index, file, logs)
                    this.validateRelationShip(entry, index, file, logs)
                    this.validateManager(entry, index, file, logs)
                    this.validateGroupleader(entry, index, file, logs)
                    this.validateStaff(entry, index, file, logs)
                    this.validateJobSeekerName(entry, index, file, logs)
                    this.validatePhone(entry, index, file, logs)
                    this.validateTeamIn(entry, index, file, logs)
                    this.validateCustomer(entry, index, file, logs)
                    this.validateInauguralUnit(entry, index, file, logs)
                    this.validateAchievement(entry, index, file, logs)
                    this.validateIsOurUnit(entry, index, file, logs)
                    this.validatePositionChange(entry, index, file, logs)
                })
            }
        }
    }
    async validateOnSiteIncomingsData() {
        const folder = path.join(require('@uranplus/cavalry-raw-files'), `/nj-data/${month}/resident_achievement`)
        const logs = path.join(require('@uranplus/cavalry-raw-files'), '/logs/resident_achievement/')
        for (let file of await fs.readdirSync(folder)) {
            const filePath = path.join(folder, file)
            var stat = fs.statSync(filePath)
            if (stat.isFile() && filePath.endsWith('.xlsx')) {
                xlsx2json(filePath, 0).forEach(async (entry, line) => {
                    const index = `第${line + 2}行`
                    entry = trimObj(entry)
                    this.validateOnSiteTime(entry, index, file, logs)
                    this.validateRelationShip(entry, index, file, logs)
                    this.validateManager(entry, index, file, logs)
                    this.validateGroupleader(entry, index, file, logs)
                    this.validateStaff(entry, index, file, logs)
                    this.validateOnSiteIsOurUnit(entry, index, file, logs)
                    this.validateTeamName(entry, index, file, logs)
                    this.validateOnSiteCustomer(entry, index, file, logs)
                    this.validateAchievementType(entry, index, file, logs)
                    this.validateOnSiteAchievement(entry, index, file, logs)
                    this.validateOnsiteInauguralUnit(entry, index, file, logs)
                    this.validateOnSiteJobSeekerName(entry, index, file, logs)
                    this.validateOnSitePhone(entry, index, file, logs)
                    this.validatePositionChange(entry, index, file, logs)
                })
            }
        }
    }
    async validatePerformanceBackData() {
        const folder = path.join(require('@uranplus/cavalry-raw-files'), `/nj-data/${month}/recruitment_recall`)
        const logs = path.join(require('@uranplus/cavalry-raw-files'), '/logs/recruitment_recall/')
        for (let file of await fs.readdirSync(folder)) {
            const filePath = path.join(folder, file)
            var stat = fs.statSync(filePath)
            if (stat.isFile() && filePath.endsWith('.xlsx')) {
                xlsx2json(filePath, 0).forEach(async (entry, line) => {
                    const index = `第${line + 2}行`
                    entry = trimObj(entry)
                    this.validateEntryDate(entry, index, file, logs)
                    this.validateCreateDate(entry, index, file, logs)
                    this.validateLeaveDate(entry, index, file, logs)
                    this.validateRelationShip(entry, index, file, logs)
                    this.validateManager(entry, index, file, logs)
                    this.validateGroupleader(entry, index, file, logs)
                    this.validateStaff(entry, index, file, logs)
                    this.validateTeamIn(entry, index, file, logs)
                    this.validateCustomer2(entry, index, file, logs)
                    this.validateInauguralUnit(entry, index, file, logs)
                    this.validateRecruitmentRecall(entry, index, file, logs)
                    this.validateJobSeekerName(entry, index, file, logs)
                    this.validatePhone(entry, index, file, logs)
                    this.validatePositionChange(entry, index, file, logs)
                    this.validateAchievementRecall(entry, index, file, logs)
                })
            }
        }
    }
}
if (require.main === module) {
    ;(async function() {
        const validate = new Validate()
        await validate.init()
        await validate.validateIncomingData()
        await validate.validateOnSiteIncomingsData()
        await validate.validatePerformanceBackData()
    })()
}
