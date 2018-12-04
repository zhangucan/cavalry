import * as _ from 'lodash'
import * as config from 'config'
import * as moment from 'moment'
import { loadJsonFromDb } from '@uranplus/cavalry-utils'
import { getUserAttendanceMap } from './user-attendance'
import { GroupSlice, NodeSlice, SalaryDetail, DIC_CAT_MAPPING } from '@uranplus/cavalry-define'
import { getTreeLife, getStaffSliceTimeRange, getNodeSlicesByTimeRange } from '@uranplus/cavalry-sdk'

import { totalmem } from 'os'
import * as fs from 'fs'
const fp = require('lodash/fp')
const maxSize = 10000

// const pipe = functions => data => {
//     return functions.reduce((value, func) => {
//         return func(value)
//     }, data)
// }

enum EmployeeStatus {
    Live = '在职',
    namalLeave = '离职',
    abnormalLeave = '自离',
}

export class Compute extends SalaryDetail {
    treeLife
    constructor(c) {
        super()
        Object.assign(this, c)
        const monthDate = moment(config.get('cavalry.month'))
        this.timeRange = {
            start: monthDate.startOf('month').format('YYYY-MM-DD'),
            end: monthDate
                .endOf('month')
                .add(1, 'days')
                .format('YYYY-MM-DD'),
        }
    }
    log4compute(key, value) {
        console.error(`${key}出现错误,错误值: ${value}`)
        fs.appendFile(`./log/${this.team}_error.txt`, `${moment()}: ${key}出现错误,错误为: ${value}\r\n`, _ => {})
    }
    async init() {
        // const cost4paper_wb = XLSX.readFile(this.cost4PaperPath)
        this.attendanceDetail = await getUserAttendanceMap(this.timeRange.start, this.timeRange.end)
        this.employeeLeave = fp.pipe(
            this.filter_normal_leave_employee_by_team,
            this.filter_leave_employee_by_time,
            this.create_leave_employee_obj
        )(await loadJsonFromDb('employee_leave', 'employee_leave', maxSize))

        this.treeLife = await getTreeLife()

        // this.employeePositionChange = pipe([
        //     this.filter_current_month_position_change_employee,
        //     this.create_position_change,
        // ])(await loadJsonFromDb('employee_position_change', 'employee_position_change', maxSize))
        // this.cost4Paper = pipe([this.sheet2json, this.create_cost4paper_obj])({
        //     wb: cost4paper_wb,
        //     sheet: 2,
        // })
        this.socialInsurance = fp.pipe(this.create_social_insurance_obj)(
            await loadJsonFromDb('social_insurance', 'social_insurance', maxSize)
        )
    }
    // cost4PaperPath: string = `./data/cost4Paper.xlsx`
    getTeamSlice(incoming) {
        if (!this.treeLife.get(this.team)) {
            this.log4compute(this.team, `${this.team}: treeLife 不存在项目组`)
            throw `${this.team}: treeLife 不存在项目组`
        }
        let teamSlices = this.treeLife.get(this.team).get(incoming.manager)
        if (teamSlices) {
            // console.log('teamSlices=', teamSlices)
            let validTeamSlices = getNodeSlicesByTimeRange(
                teamSlices,
                this.timeRange.start,
                this.timeRange.end
            )
            if (!(validTeamSlices instanceof Array)) {
                throw new Error(
                    `getTeamSlice() error, team:${this.team}, manager:${
                        incoming.manager
                    } not found from slices`
                )
            } else if (validTeamSlices.length > 1) {
                throw new Error(
                    `getTeamSlice() error, team:${this.team}, manager:${
                        incoming.manager
                    } too many slices`
                )
            } else {
                return validTeamSlices[0]
            }
        } else {
            throw new Error(`getTeamSlice() error, incoming:${JSON.stringify(incoming)} not found`)
        }
    }
    compute_groupleader_salary = arr => {
        const temp = _.groupBy(arr, item => {
            return item.parentId
        })
        return arr.map(item => {
            if (item.parentId === item.id) {
                item.incomings = _.reduce(
                    temp[item.parentId],
                    (sum, n) => {
                        return sum + Number(n.incomings)
                    },
                    0
                )
            }
            return item
        })
    }
    filter_leave_employee_by_time = arr =>
        arr.filter(item => {
            item['状态'] = EmployeeStatus.namalLeave
            let time = item['工资截止时间']
            if (item['离职情况'] !== '离职') {
                item['状态'] = EmployeeStatus.abnormalLeave
                time = this.timeRange.start
            }
            return moment(time).isSameOrAfter(this.timeRange.start) && moment(time).isBefore(this.timeRange.end)
        })
    filter_normal_leave_employee_by_team = arr =>
        arr.filter(item => {
            return item['组别'] == this.team
        })
    filter_current_month_position_change_employee = arr =>
        arr.filter(
            item =>
                moment(item['异动日期']).isSameOrAfter(this.timeRange.start) &&
                moment(item['异动日期']).isBefore(this.timeRange.end)
        )
    filter_manager = incomings => incomings.filter(incoming => incoming.manager === this.manager)
    fill_field = arr => {
        const temp = []
        _.reduce(
            arr,
            (group, item) => {
                if (item[DIC_CAT_MAPPING.ZJ.ZG.name]) {
                    item.parentId = item._id
                    item.position = DIC_CAT_MAPPING.ZJ.ZG.name
                    item.leader = item[DIC_CAT_MAPPING.ZJ.ZG.name]
                    group = {
                        id: item._id,
                        name: item[DIC_CAT_MAPPING.ZJ.ZG.name],
                    }
                } else {
                    item[DIC_CAT_MAPPING.ZJ.ZG.name] = group.name
                    item.parentId = group.id
                    item.position = DIC_CAT_MAPPING.ZJ.YG.name
                    item.leader = item[DIC_CAT_MAPPING.ZJ.ZG.name]
                }
                temp.push(item)
                return group
            },
            {}
        )
        return temp
    }
    create_leave_employee_obj = arr =>
        arr.map(item => {
            return {
                name: item['姓名'],
                endTime: item['工资截止时间'],
                status: item['状态'],
            }
        })
    create_social_insurance_obj = arr =>
        arr.map(item => {
            return {
                name: item['姓名'],
                socialInsurance: Number(item['个人社保费']),
            }
        })
    create_base_salary = arr =>
        arr
            .filter(item => !!item['专员'])
            .map(item => {
                const name = item['专员']
                let incomings = Number(item['业绩'])
                if (!incomings || incomings !== incomings) {
                    incomings = 0
                }
                const group = item[DIC_CAT_MAPPING.ZJ.ZG.name]
                if (!name) this.log4compute(this.team, `${name}: 利润表表头[专员]为空`)
                if (!group) this.log4compute(this.team, `${name}: 利润表表头[主管]为空`)
                return {
                    id: item._id,
                    manager: item.manager,
                    line: item.line,
                    group: group,
                    parentId: item.parentId,
                    team: this.team,
                    leader: item.leader,
                    name: name,
                    position: item.position,
                    incomings: incomings,
                }
            })
    add_manager = arr => {
        const manager = {
            group: '',
            team: this.team,
            name: this.manager,
            position: '项目经理',
            incomings: 0,
        }
        return arr.concat([manager])
    }
    create_position_change = arr =>
        arr.map(item => {
            return {
                id: item._id,
                name: item['姓名'],
                positionChangeDate: item['异动日期'],
                origin: {
                    leader: item['原直接领导'],
                    position: item['原职级'],
                    team: item['原组别'],
                },
                current: {
                    leader: item['现直接领导'],
                    position: item['新职级'],
                    team: item['新组别'],
                },
            }
        })
    create_cost4paper_obj = arr => {
        arr.map(item => {
            return {
                team: item['项目'],
                paperPay: item['纸张金额'],
            }
        })
    }

    toNumber(item: any) {
        return _.isFinite(Number(item)) ? Number(item) : 0
    }

    async getSalaryDetail() {
        const compute_attendance = arr => {
            const log = {
                type: '计算出勤',
                input: arr,
            }
            return arr.map(item => {
                if (!this.attendanceDetail[item.name]) {
                    this.log4compute(this.team, `${item.name}: 名称与考勤表不一致 暂作为全勤处理`)
                    item.start = this.timeRange.start
                    item.end = this.timeRange.end
                } else {
                    let attendance = this.attendanceDetail[item.name].sort((a, b) => {
                        return moment(a.time).isAfter(b.time) ? 1 : -1
                    })
                    item.hiredate = attendance[0].hiredate
                    item.start = attendance[0].time
                    item.end = attendance[attendance.length - 1].time
                }
                log['output'] = item
                return item
            })
        }

        const compute_attendance_with_position_change = incomings => {
            let managerId = null
            let manager = null
            let teamSlice = null

            if (incomings instanceof Array && incomings.length >= 1) {
                teamSlice = this.getTeamSlice(incomings[0])
                manager = incomings[0].manager
                incomings.some(incoming => {
                    if (incoming.id === incoming.parentId && incoming.name === incoming.manager) {
                        managerId = incoming.id
                        return true
                    }
                })
                const incomingTree = _.groupBy(_.values(_.groupBy(incomings, 'parentId')), list => list[0].leader)
                _.each(incomingTree, (incomingsList, leader) => {
                    if (leader === manager) {
                        //TODO incomingsList should only have one incomings
                        _.each(incomingsList, staffIncomings => {
                            staffIncomings.forEach(staffIncoming => {
                                if (staffIncoming.id === managerId) {
                                    // 经理
                                    staffIncoming.start = teamSlice.start
                                    staffIncoming.end = teamSlice.end
                                } else {
                                    // 经理直属员工
                                    Object.assign(
                                        staffIncoming,
                                        getStaffSliceTimeRange(
                                            teamSlice.staffTree
                                                ? teamSlice.staffTree.get(staffIncoming.name)
                                                : null,
                                            teamSlice.start,
                                            teamSlice.end
                                        )
                                    )
                                }
                            })
                        })
                    } else {
                        const sortedIncomingsList = incomingsList.sort(
                            (aIncomings, bIncomings) => aIncomings[0].line - bIncomings[0].line
                        )
                        if (!teamSlice.subSliceTree.get(leader)) {
                            teamSlice.subSliceTree.set(leader, [new NodeSlice(null, null)])
                        }

                        let groupSlices: any[] = getNodeSlicesByTimeRange(
                            teamSlice.subSliceTree.get(leader),
                            teamSlice.start,
                            teamSlice.end
                        )
                        if (!groupSlices) {
                            throw new Error(
                                `compute_attendance_with_position_change() error, groupSlices not found, leader:${leader}, teamSlice:${JSON.stringify(
                                    teamSlice
                                )}`
                            )
                        }
                        if (sortedIncomingsList.length === groupSlices.length) {
                            for (let i = 0; i < sortedIncomingsList.length; ++i) {
                                for (let staffIncoming of sortedIncomingsList[i]) {
                                    // 主管及员工
                                    Object.assign(
                                        staffIncoming,
                                        getStaffSliceTimeRange(
                                            groupSlices[i].subSliceTree
                                                ? groupSlices[i].subSliceTree.get(staffIncoming.name)
                                                : null,
                                            groupSlices[i].start,
                                            groupSlices[i].end
                                        )
                                    )
                                }
                            }
                        } else {
                            throw new Error(
                                `compute_attendance_with_position_change() error,group: ${leader}, group length don't match, groupIncomingsList:${JSON.stringify(
                                    sortedIncomingsList
                                )} groupSlices:${JSON.stringify(groupSlices)}`
                            )
                        }
                    }
                })
                return incomings
            } else {
                return []
            }
        }

        const compute_attendance_with_employee_leave = arr =>
            arr.map(item => {
                item.id === item.parentId
                let employeeLeave = this.employeeLeave.find(employee => {
                    return employee.name === item.name
                })
                if (employeeLeave) {
                    item.end = employeeLeave.endTime
                    item.status = EmployeeStatus.namalLeave
                }
                return _.merge(item, employeeLeave)
            })
        const compute_attendance_detail = arr =>
            arr.map(employee => {
                if (employee.start === '自离' || employee.end === '自离') {
                    employee.start = this.timeRange.start
                    employee.end = this.timeRange.start
                    employee.should = 0
                    employee.acture = 0
                    employee.lateFine = 0
                } else if (!this.attendanceDetail[employee.name]) {
                    const days = (moment(employee.end).unix() - moment(employee.start).unix()) / 60 / 60 / 24
                    employee.should = days
                    employee.acture = days
                    employee.lateFine = 0
                } else {
                    employee.should = this.attendanceDetail[employee.name]
                        .filter(
                            date =>
                                moment(date.time).isSameOrAfter(employee.start) &&
                                moment(date.time).isBefore(employee.end)
                        )
                        .reduce((total, q) => {
                            return total + Number(q.should)
                        }, 0)
                    employee.acture = this.attendanceDetail[employee.name]
                        .filter(
                            date =>
                                moment(date.time).isSameOrAfter(employee.start) &&
                                moment(date.time).isBefore(employee.end)
                        )
                        .reduce((total, q) => {
                            return total + Number(q.acture)
                        }, 0)
                    employee.lateFine = this.attendanceDetail[employee.name]
                        .filter(
                            date =>
                                moment(date.time).isSameOrAfter(employee.start) &&
                                moment(date.time).isBefore(employee.end)
                        )
                        .reduce((total, q) => {
                            return total + Number(q.fine)
                        }, 0)
                }
                return employee
            })

        const compute_attendance_fine = arr => {
            const range = moment(this.timeRange.end).dayOfYear() - (moment(this.timeRange.start).dayOfYear() - 1)
            return arr.map(employee => {
                if (employee.name === employee.group) {
                    employee.fine = (this.groupLeaderBaseSalary / range) * (employee.should - employee.acture)
                } else {
                    employee.fine = (this.staffBaseSalary / range) * (employee.should - employee.acture)
                }
                return employee
            })
        }
        const compute_staff_outgoings = arr => {
            const attendance_setting = arr.reduce((total: number, item: any) => {
                if (item.name === this.manager) return total
                return total + item.should
            }, 0)
            return arr.map(item => {
                if (item.group !== item.name) {
                    item.outgoings = (this.cost4All / attendance_setting) * item.should + this.cost4Manage * item.should
                }
                return item
            })
        }
        const compute_group_leader_breach = arr => {
            return arr.map(item => {
                if (item.name === item.group) {
                    item.breach = item.incomings - item.outgoings > 0 ? 0 : item.incomings - item.outgoings
                }
                return item
            })
        }
        const compute_base_salary = arr => {
            const range = moment(this.timeRange.end).diff(moment(this.timeRange.start), 'days') + 1
            return arr.map(item => {
                let baseSalary = this.staffBaseSalary
                if (item.group === item.name) {
                    baseSalary = this.groupLeaderBaseSalary
                }
                item.baseSalary = (baseSalary / range) * item.should
                return item
            })
        }
        const compute_min_salary = arr => {
            return arr.map(item => {
                const range = moment(this.timeRange.end).diff(moment(this.timeRange.start), 'days') + 1
                let baseSalary = this.staffBaseSalary
                if (item.group === item.name) baseSalary = this.groupLeaderBaseSalary
                item.minSalary = _.ceil((baseSalary / range) * item.acture)
                return item
            })
        }
        const compute_cost4group_leader = arr => {
            const attendance_setting = arr.reduce((total: number, item: any) => {
                return total + item.should
            }, 0)
            return arr.map(item => {
                if (item.group === item.name) {
                    item.cost4GroupLeader = _.ceil(
                        (this.cost4All / attendance_setting) * item.should +
                            this.cost4Manage * item.should +
                            this.groupLeaderBaseSalary -
                            item.fine
                    )
                }
                return item
            })
        }
        const compute_abnormal_leave_salary = arr => {
            return arr.map(item => {
                if (item.status === EmployeeStatus.abnormalLeave) {
                    item.minSalary = 0
                    item.lateFine = 0
                    item.accruedSalary = 0
                }
                return item
            })
        }
        const format_salary = arr => {
            return arr.map(item => {
                item.fine = _.ceil(item.fine, 2)
                item.outgoings = _.ceil(item.outgoings, 2)
                item.royalty = _.ceil(item.royalty, 2)
                item.minSalary = _.ceil(item.minSalary, 2)
                item.breach = _.ceil(item.breach, 2)
                item.groupLeaderBreach = _.ceil(item.groupLeaderBreach, 2)
                item.actureSalary = _.ceil(item.actureSalary, 2)
                item.managerBreach = _.ceil(item.managerBreach, 2)
                item.accruedSalary = _.ceil(item.accruedSalary, 2)
                item.paperPay = _.ceil(item.paperPay, 2)
                return item
            })
        }
        const compute_tax = arr => {
            return arr.map(item => {
                const temp = item.accruedSalary - this.adjustBaseSalary
                if (_.inRange(temp, 0, 1500)) {
                    item.taxes = temp * 0.03
                } else if (_.inRange(temp, 1500, 4500)) {
                    item.taxes = temp * 0.1 - 105
                } else if (_.inRange(temp, 4500, 9000)) {
                    item.taxes = temp * 0.2 - 555
                } else if (_.inRange(temp, 9000, 35000)) {
                    item.taxes = temp * 0.25 - 1005
                } else if (_.inRange(temp, 35000, 55000)) {
                    item.taxes = temp * 0.3 - 2755
                } else if (_.inRange(temp, 55000, 80000)) {
                    item.taxes = temp * 0.35 - 5505
                } else if (_.inRange(temp, 80000, Number.POSITIVE_INFINITY)) {
                    item.taxes = temp * 0.45 - 13505
                }
                return item
            })
        }
        const compute_length_of_hiredate = arr => {
            return arr.map(item => {
                item.lengthOfHiredate = moment(item.end).diff(moment(item.hiredate), 'days') + 1
                return item
            })
        }
        const compute_hiredate_salary = arr => {
            return arr.map(item => {
                const temp = item.lengthOfHiredate
                item.hiredateSalary = 0
                if (_.inRange(temp, 90, 180)) {
                    item.hiredateSalary = (100 / item.should) * item.acture
                } else if (_.inRange(temp, 180, 270)) {
                    item.hiredateSalary = (200 / item.should) * item.acture
                } else if (_.inRange(temp, 270, 360)) {
                    item.hiredateSalary = (300 / item.should) * item.acture
                } else if (_.inRange(temp, 360, 540)) {
                    item.hiredateSalary = (400 / item.should) * item.acture
                } else if (_.inRange(temp, 540, 720)) {
                    item.hiredateSalary = (500 / item.should) * item.acture
                } else if (_.inRange(temp, 720, 1080)) {
                    item.hiredateSalary = (600 / item.should) * item.acture
                } else if (_.inRange(temp, 1080, 1440)) {
                    item.hiredateSalary = (700 / item.should) * item.acture
                } else if (_.inRange(temp, 1440, 1800)) {
                    item.hiredateSalary = (800 / item.should) * item.acture
                } else if (_.inRange(temp, 1800, Number.POSITIVE_INFINITY)) {
                    item.hiredateSalary = (800 / item.should) * item.acture
                }
                return item
            })
        }
        const compute_social_insurance = arr => {
            return arr.map(item => {
                item.socialInsurance = 0
                const temp = this.socialInsurance.find(employee => item.name === employee.name)
                if (temp) item.socialInsurance = temp.socialInsurance
                return item
            })
        }

        const compute_paper_pay = arr => {
            // let allPaperPay = this.cost4Paper.find(item => this.team === item.team)
            const employeeAttendance = arr.reduce((total, item) => {
                return total + item.should
            }, 0)
            return arr.map(item => {
                item.paperPay = (this.cost4Paper / employeeAttendance + this.eachPaperPay) * item.acture
                return item
            })
        }
        const compute_aggregate_salary = arr => {
            let positionChangeEmployee = arr.filter(item => item.positionChangeDate)
            let narmalemployee = arr.filter(item => !item.positionChangeDate)
            positionChangeEmployee = _.groupBy(positionChangeEmployee, item => item.name)
            positionChangeEmployee = Object.keys(positionChangeEmployee).map(item => {
                const q = positionChangeEmployee[item].length
                if (q === 1) {
                    item = positionChangeEmployee[item][0]
                } else {
                    let current = positionChangeEmployee[item].findIndex(employee => {
                        return (
                            employee.current.team === this.team &&
                            employee.position === employee.current.position
                        )
                    })
                    let origin = current === 0 ? 1 : 0
                    let currentItem: any = positionChangeEmployee[item][current]
                    let originItem: any = positionChangeEmployee[item][origin]
                    if (currentItem) {
                        fs.appendFile(`./error.txt`, `${new Date()}: ${new Date()}: 无${item}当前部门数据\r\n`, _ => {})
                        throw `无${item}当前部门数据`
                    }
                    if (originItem) {
                        fs.appendFile(`./error.txt`, `${new Date()}: 无${item}当前部门数据\r\n`, _ => {})
                        throw `无${item}原始部门数据`
                    }
                    currentItem.incomings = this.toNumber(currentItem.incomings) + this.toNumber(originItem.incomings)
                    currentItem.outgoings = this.toNumber(currentItem.outgoings) + this.toNumber(originItem.outgoings)
                    currentItem.should = this.toNumber(currentItem.should) + this.toNumber(originItem.should)
                    currentItem.acture = this.toNumber(currentItem.acture) + this.toNumber(originItem.acture)
                    currentItem.fine = this.toNumber(currentItem.absentFine) + this.toNumber(originItem.absentFine)
                    currentItem.outgoings = this.toNumber(currentItem.outgoings) + this.toNumber(originItem.outgoings)
                    currentItem.minSalary = this.toNumber(currentItem.minSalary) + this.toNumber(originItem.minSalary)
                    currentItem.breach = this.toNumber(currentItem.breach) + this.toNumber(originItem.breach)
                    currentItem.accruedSalary =
                        this.toNumber(currentItem.accruedSalary) + this.toNumber(originItem.accruedSalary)
                    currentItem.paperPay = this.toNumber(currentItem.paperPay) + this.toNumber(originItem.paperPay)
                    item = currentItem
                }
                return item
            })
            return positionChangeEmployee.concat(narmalemployee)
        }
        // const compute_command_salary = arr => {
        //     return arr.map(item => {
        //         item.commandSalary = item.
        //     })
        // }
        const compute_staff_accrued_salary = arr => {
            return arr.map(item => {
                if (item.name !== item.group) {
                    item.initialSalary = (item.incomings - item.outgoings) * this.staffRoyaltyRate
                    item.accruedSalary =
                        (item.initialSalary < item.baseSalary ? item.baseSalary : item.initialSalary) - item.fine
                }
                return item
            })
        }
        const compute_staff_breach = arr => {
            return arr.map(item => {
                if (item.name !== item.group) {
                    item.breach = item.incomings - item.outgoings > 0 ? 0 : item.incomings - item.outgoings
                }
                return item
            })
        }
        const compute_group_leader_incomings = arr => {
            return arr.map(item => {
                if (item.name === item.group && item.name !== item.manager) {
                    console.log(`开始计算${item.name}收入`)
                    item.incomings = arr.reduce((total: number, employee: any) => {
                        if (item.name === employee.group) {
                            total = total + employee.incomings
                        }
                        return total
                    }, 0)
                    console.log(`${item.name}收入 = `, item.incomings)
                }
                return item
            })
        }
        const compute_group_leader_outgoings = arr => {
            const attendance_setting = arr.reduce((total: number, item: any) => {
                if (item.name === this.manager) return total
                return total + item.should
            }, 0)
            return arr.map(item => {
                const staffBreach = arr.reduce((total, employee) => {
                    // 找到主管下的所有员工的 实际工资 失责 成本
                    if (item.id === employee.parentId && employee.id !== employee.parentId) {
                        return total + employee.accruedSalary + employee.breach + employee.outgoings
                    }
                    return total
                }, 0)
                item.outgoings =
                    staffBreach + (this.cost4All / attendance_setting) * item.should + this.cost4Manage * item.should
                return item
            })
        }
        const compute_group_leader_accrued_salary = arr => {
            return arr.map(item => {
                if (item.name === item.group) {
                    item.initialSalary = (item.incomings - item.outgoings) * this.groupLeaderRoyaltyRate
                    item.accruedSalary =
                        (item.initialSalary < item.baseSalary ? item.baseSalary : item.initialSalary) - item.fine
                }
                return item
            })
        }
        const compute_manage_info = arr => {
            let manager: any = {}
            const attendance_setting = arr.reduce((total: number, item: any) => {
                if (item.name === this.manager) return total
                return total + item.should
            }, 0)
            manager.name = this.manager
            manager.position = DIC_CAT_MAPPING.ZJ.JL.name
            manager.team = this.team
            const staffIncoming = arr
                .filter(incoming => incoming.group === manager.name)
                .reduce((total, incoming) => {
                    return total + incoming.incomings
                }, 0)
            const groupLeaderIncoming = arr
                .filter(incoming => incoming.name !== manager.name && incoming.group === manager.name)
                .reduce((total, incoming) => {
                    return total + incoming.incomings
                }, 0)
            manager.incomings = staffIncoming + groupLeaderIncoming
            const employeeCost = arr
                .filter(employee => employee.name !== manager.name)
                .reduce((total, employee) => {
                    return (
                        total +
                        (this.cost4All / attendance_setting) * employee.should +
                        this.cost4Manage * employee.should
                    )
                }, 0)
            const staffBreach = arr
                .filter(incoming => incoming.group === manager.name)
                .reduce((total, incoming) => {
                    return total + incoming.breach
                }, 0)
            const groupLeaderBreach = arr
                .filter(incoming => incoming.name !== manager.name && incoming.group === manager.name)
                .reduce((total, incoming) => {
                    return total + incoming.breach
                }, 0)
            manager.outgoings =
                arr
                    .filter(employee => employee.name !== manager.name)
                    .reduce((total, employee) => {
                        return total + employee.accruedSalary
                    }, 0) +
                groupLeaderBreach +
                staffBreach +
                employeeCost
            manager.socialInsurance = 0
            const temp = this.socialInsurance.find(employee => manager.name === employee.name)
            if (temp) manager.socialInsurance = temp.socialInsurance
            arr.push(manager)
            return arr
        }
        return fp.pipe(
            // TODO: 创建计算日志 log
            this.filter_manager,
            this.fill_field,
            this.create_base_salary,
            this.compute_groupleader_salary,
            compute_attendance,
            compute_attendance_with_position_change,
            compute_attendance_with_employee_leave,
            compute_attendance_detail,
            compute_attendance_fine,
            compute_base_salary,
            compute_staff_outgoings,
            compute_min_salary,
            compute_staff_accrued_salary,
            compute_staff_breach,

            compute_group_leader_incomings,
            compute_group_leader_outgoings,
            compute_group_leader_accrued_salary,
            compute_group_leader_breach,
            compute_abnormal_leave_salary,

            compute_length_of_hiredate,
            compute_manage_info,
            compute_hiredate_salary,
            compute_paper_pay,
            compute_social_insurance,
            format_salary
        )(await loadJsonFromDb('incomings', 'raw', maxSize, { key: 'team', value: this.team }, 'line'))
    }
}

/**
 * 组别 = group
姓名 = name
职务 = job
保底工资 = baseSalary
考勤扣款 = attendanceCutPayment
入职总人数 = totalPeople
收入 = incomings
支出 = outgoings
收入-支出 = inAndOut
提成 = royalty
提成比例 = royaltyRate
提成/绩效 = performance
员工状态 = status
失责 = breach
奖励 = reward
扣款 = cashFine
主管失责 = groupLeaderBreach
项目经理失责 = managerBreach
主管成本 = cost4GroupLeader
成本 = cost4All

起征税 = adjustBaseSalary
个人纸张费用 = paperPay
纸张费用 = cost4Paper
管理费用 = cost4Manage 
团队利润 = teamProfit
员工利润比例 = staffProfitRatio
主管利润比例 = groupLeaderProfitRatio
a = profitRatio
团队利润提成 = teamProfitCommission
真实工资 = actureSalary
应付工资 = accruedSalary
入职时间 = hiredate
入职时长 = lengthOfHiredate
月份 = month
社保 = socialInsurance
录入时间 = createDate
 */
