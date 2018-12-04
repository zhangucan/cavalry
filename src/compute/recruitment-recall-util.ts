import * as _ from 'lodash'
import { search } from '@uranplus/cavalry-utils'
import { getTreeLife, getTeamNames } from '@uranplus/cavalry-sdk'
import { RecruitmentRecall, DIC_CAT_MAPPING } from '@uranplus/cavalry-define'
import * as moment from 'moment'

const bodybuilder = require('bodybuilder')
const employee_index = 'employee'
const employee_type = 'employee'
const recruitment_recall_index = 'recruitment_recall'
const recruitment_recall_type = 'recruitment_recall'
const maxSize = 99999

export class RecruitmentRecallUtil {
    tree: any
    teams: any
    monthDate: any
    employees: any
    start: moment.Moment
    end: moment.Moment
    constructor(month: string) {
        this.monthDate = moment(month).format('YYYY-MM-DD')
        this.start = moment(month).startOf('month')
        // only for elasticsearch
        this.end = moment(month)
            .add(1, 'month')
            .startOf('month')
    }
    async init(start, end) {
        this.tree = await getTreeLife()
        this.employees = await this.getEmployees()
        this.teams = await getTeamNames(this.tree, start, end)
    }
    getEmployeeName(employee) {
        if (employee['专员']) {
            return employee['专员']
        } else if (!employee['专员'] && employee[DIC_CAT_MAPPING.ZJ.ZG.name]) {
            return employee[DIC_CAT_MAPPING.ZJ.ZG.name]
        } else {
            return employee[DIC_CAT_MAPPING.ZJ.JL.name]
        }
    }
    async getEmployees() {
        const query = bodybuilder()
            .filter('term', '_type', employee_type)
            .filter('term', 'month', this.monthDate)
            .size(10000)
            .build()
        return await search(employee_index, employee_type, query)
    }
    async getRecruitmentRecallByJobSeekerName(name: string) {
        const query = bodybuilder()
            .filter('term', 'jobSeeker.name', name)
            .build()
        const json = await search(recruitment_recall_index, recruitment_recall_type, query)
        return json.map(item => this.json2recruitmentRecall(item))
    }
    async getRecruitmentRecallByEmployeeName(name: string) {
        const query = bodybuilder()
            .filter('term', 'employee', name)
            .filter('term', 'month', this.monthDate)
            .build()
        const json = await search(recruitment_recall_index, recruitment_recall_type, query)
        return json.map(item => this.json2recruitmentRecall(item))
    }
    json2recruitmentRecall(json) {
        // const jobSeeker = new JobSeeker()
        // const recruitmentRecall = new RecruitmentRecall()
        // jobSeeker.name = json.jobSeeker.name
        // jobSeeker.gender = json.jobSeeker.gender
        // jobSeeker.idCardNo = json.jobSeeker.idCardNo
        // jobSeeker.phoneNumber = json.jobSeeker.phoneNumber
        // recruitmentRecall.createDate = json.createDate
        // recruitmentRecall.leaveDate = json.leaveDate
        // recruitmentRecall.leader = json.leader
        // recruitmentRecall.value = json.value
        // recruitmentRecall.manager = json.manager
        // recruitmentRecall.employee = json.employee
        // recruitmentRecall.jobSeeker = jobSeeker
        // return recruitmentRecall
        return json
    }

    async getRecruitmentRecalls(): Promise<RecruitmentRecall[]> {
        const query = bodybuilder()
            // .filter('range', 'leaveDate', { gte: this.start.toISOString(), lt: this.end.toISOString() })
            .filter('term', 'month', this.monthDate)
            .size(maxSize)
            .build()
        const json = await search(recruitment_recall_index, recruitment_recall_type, query)
        return json.map(item => this.json2recruitmentRecall(item))
    }
}

if (require.main === module) {
    ;(async function() {
        const performanceBackUtil = new RecruitmentRecallUtil('2018-08-01')
        await performanceBackUtil.init('2018-08-01', '2018-08-31')
        // const data = await incomingsUtil.getEmployeeByName('疏琼')
        // console.log(data)
    })()
}
