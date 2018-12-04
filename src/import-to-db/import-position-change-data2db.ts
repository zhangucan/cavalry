import * as fs from 'fs'
import * as path from 'path'
import * as config from 'config'
import { saveJsonToDb, search, xlsx2json, strMapToObj, trimObj } from '@uranplus/cavalry-utils'
import * as moment from 'moment'
import { Employee, Company, Role, StaffPosition, PositionChange, JobStatus } from '@uranplus/cavalry-define'

const shortid = require('shortid')
const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')
export async function savePositionChange(index, type) {
    const folder = path.join(require('@uranplus/cavalry-raw-files'), '/employee/')
    for (let file of fs.readdirSync(folder)) {
        const filePath = path.join(folder, file)
        var stat = fs.statSync(filePath)
        if (stat.isFile() && filePath.endsWith('.xlsx')) {
            const employeesCheckInData = xlsx2json(filePath, 2).map((item, line) => {
                const entry = trimObj(item)
                const employee = new Employee()
                employee.name = entry['姓名']
                employee.team = entry['组别']
                employee.department = entry['部门']
                employee.title = entry['职级']
                employee.position = entry['岗位']

                employee.status = JobStatus.ENTRY
                employee.leader = entry['直接领导']
                employee.hireDate = new Date(entry['入职日期'])
                employee.lengthOfHiredate = entry['司龄']
                employee.rangeOfHiredate = entry['司龄分段']
                employee.month = moment(month).format('YYYY-MM-DD')
                return employee
            })
            const employeesLeaveData = xlsx2json(filePath, 1).map((item, line) => {
                const entry = trimObj(item)
                const employee = new Employee()
                employee.name = entry['姓名']
                employee.team = entry['组别']
                employee.department = entry['部门']
                employee.title = entry['职级']
                employee.position = entry['岗位']
                employee.leader = entry['直接领导']
                employee.hireDate = entry['入职时间']
                employee.lengthOfHiredate = entry['司龄']
                employee.rangeOfHiredate = entry['司龄分段']
                if (
                    entry['工资截止时间'] &&
                    entry['工资截止时间'] !== '自离' &&
                    entry['工资截止时间'] !== '0' &&
                    entry['工资截止时间'] !== '无工资' &&
                    entry['工资截止时间'] !== '停薪留职'
                ) {
                    employee.status = JobStatus.RESIGN
                    employee.leaveDate = moment(new Date(entry['工资截止时间']))
                        .add(1, 'days')
                        .format('YYYY-MM-DD')
                } else if (
                    entry['自离离职日期'] &&
                    entry['自离离职日期'] !== '0' &&
                    entry['自离离职日期'] !== '自离' &&
                    entry['自离离职日期'] !== '无工资' &&
                    entry['自离离职日期'] !== '停薪留职'
                ) {
                    employee.status = JobStatus.LEAVE
                    employee.leaveDate = moment(new Date(entry['自离离职日期']))
                        .add(1, 'days')
                        .format('YYYY-MM-DD')
                } else if (
                    entry['办理离职日期'] &&
                    entry['办理离职日期'] !== '0' &&
                    entry['办理离职日期'] !== '自离' &&
                    entry['办理离职日期'] !== '无工资' &&
                    entry['办理离职日期'] !== '停薪留职'
                ) {
                    employee.status = JobStatus.LEAVE
                    employee.leaveDate = moment(new Date(entry['办理离职日期']))
                        .add(1, 'days')
                        .format('YYYY-MM-DD')
                } else if (
                    entry['工资发放时间'] &&
                    entry['工资发放时间'] !== '0' &&
                    entry['工资发放时间'] !== '自离' &&
                    entry['工资发放时间'] !== '无工资' &&
                    entry['工资发放时间'] !== '停薪留职'
                ) {
                    employee.status = JobStatus.LEAVE
                    employee.leaveDate = moment(new Date(entry['工资发放时间']))
                        .add(1, 'days')
                        .format('YYYY-MM-DD')
                } else {
                    employee.status = JobStatus.LEAVE
                    employee.leaveDate = moment()
                        .add(1, 'days')
                        .format('YYYY-MM-DD')
                }
                employee.month = moment(month).format('YYYY-MM-DD')
                return employee
            })
            const employeesPositionChange = xlsx2json(filePath, 3).map(item => {
                const entry = trimObj(item)
                const positionChange = new PositionChange()
                const a = new StaffPosition()
                const b = new StaffPosition()
                positionChange.name = entry['姓名']
                positionChange.id = shortid.generate()
                positionChange.date = moment(new Date(entry['异动日期'])).format('YYYY-MM-DD')
                positionChange.status = JobStatus.TRANSFER
                a.team = entry['原组别']
                a.department = entry['原部门']
                a.leader = entry['原直接领导']
                a.title = entry['原职级']
                a.position = entry['原岗位']

                b.department = entry['新部门']
                b.team = entry['新组别']
                b.leader = entry['现直接领导']
                b.title = entry['新职级']
                b.position = entry['新岗位']
                positionChange.previous = a
                positionChange.current = b
                return positionChange
            })
            const data1 = employeesCheckInData.map((item: Employee) => {
                const positionChange = new PositionChange()
                positionChange.name = item.name
                positionChange.id = shortid.generate()
                positionChange.previous = null
                const a = new StaffPosition()
                a.team = item.team
                a.leader = item.leader
                a.position = item.position
                a.name = item.name
                a.title = item.title
                a.department = item.department
                positionChange.date = moment(new Date(item.hireDate)).format('YYYY-MM-DD')
                positionChange.status = item.status
                positionChange.current = a
                return positionChange
            })
            const data2 = employeesLeaveData.map((item: Employee) => {
                const positionChange = new PositionChange()
                positionChange.name = item.name
                positionChange.id = shortid.generate()
                positionChange.current = null
                const a = new StaffPosition()
                a.team = item.team
                a.leader = item.leader
                a.position = item.position
                a.name = item.name
                a.title = item.title
                a.department = item.department
                positionChange.date = moment(new Date(item.leaveDate)).format('YYYY-MM-DD')
                positionChange.status = item.status
                positionChange.previous = a
                return positionChange
            })
            await saveJsonToDb(
                employeesPositionChange.concat(data1, data2).filter(item => item.date !== 'Invalid date'),
                index,
                type
            )
        }
    }
}
