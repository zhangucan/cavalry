import * as _ from 'lodash'
import { search, xlsx2json, strMapToObj, trimObj } from '@uranplus/cavalry-utils'
import * as path from 'path'
import * as moment from 'moment'
import { Attendance, Employee, StaffPosition } from '@uranplus/cavalry-define'
import * as config from 'config'
const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')
const bodybuilder = require('bodybuilder')
const attendance_index = 'attendance'
const attendance_type = 'attendance'
const ask4leave_index = 'ask4leave'
const ask4leave_type = 'ask4leave'
const business_trip_index = 'business_trip'
const business_trip_type = 'business_trip'
let gMonthAttendanceUtilMap = new Map<string, Promise<AttendanceUtil>>()

export class AttendanceUtil {
    monthDate: any
    gAttendanceDetails: any = null
    gAsk4leaveDetails: any = null
    gBusinessTripDetails: any = null
    gEmployeeSchedul: any = null
    constructor(month: string) {
        this.monthDate = moment(month)
            .startOf('month')
            .format('YYYY-MM-DD')
    }

    async getBusinessTripByName(name) {
        if (this.gBusinessTripDetails) {
            const result = this.gBusinessTripDetails
                .filter(item => item.name === name)
                .filter(item => item.month === this.monthDate)
            return result
        } else {
            const query = bodybuilder()
                .filter('term', 'name', name)
                .filter('term', 'month', this.monthDate)
                .build()
            this.gBusinessTripDetails = await search(business_trip_index, business_trip_type, query)
            return this.gBusinessTripDetails
        }
    }
    async getBusinessTrips() {
        const query = bodybuilder()
            .filter('term', '_type', business_trip_type)
            .filter('term', 'month', this.monthDate)
            .size(10000)
            .build()
        return await search(business_trip_index, business_trip_type, query)
    }
    async getAsk4leaveByName(name) {
        if (this.gAsk4leaveDetails) {
            const result = this.gAsk4leaveDetails
                .filter(item => item.status === '同意')
                .filter(item => item.name === name)
                .filter(item => item.month === this.monthDate)
            return result
        } else {
            const query = bodybuilder()
                .filter('term', 'name', name)
                .filter('term', 'month', this.monthDate)
                .build()
            this.gAsk4leaveDetails = await search(ask4leave_index, ask4leave_type, query)
            return this.gAsk4leaveDetails.filter(item => item.status === '同意')
        }
    }
    async getAsk4leaves() {
        const query = bodybuilder()
            .filter('term', '_type', ask4leave_type)
            .filter('term', 'month', this.monthDate)
            .size(10000)
            .build()
        return await search(ask4leave_index, ask4leave_type, query)
    }
    async getAttendanceByName(name) {
        if (this.gAttendanceDetails) {
            const result = this.gAttendanceDetails
                .filter(item => item.month === this.monthDate)
                .find(item => item.name === name)
            return result
        } else {
            const query = bodybuilder()
                .filter('term', 'name', name)
                .filter('term', 'month', this.monthDate)
                .build()
            this.gAttendanceDetails = await search(attendance_index, attendance_type, query)
            if (this.gAttendanceDetails[0]) {
                return this.gAttendanceDetails[0]
            }
        }
        return null
    }
    async getAttendances() {
        const query = bodybuilder()
            .filter('term', '_type', attendance_type)
            .filter('term', 'month', this.monthDate)
            .size(10000)
            .build()
        return await search(attendance_index, attendance_type, query)
    }
    async getAllScheduling(): Promise<Employee[]> {
        if (!this.gEmployeeSchedul) {
            const temp = path.join(
                require('@uranplus/cavalry-raw-files'),
                `/nj-data/${this.monthDate}/attendance/派遣部考勤.xlsx`
            )
            this.gEmployeeSchedul = xlsx2json(temp, 0).map(item => {
                const entry = trimObj(item)
                const employee = new Employee()
                employee.name = entry['姓名']
                employee.status = entry['是否上班']
                employee.month = entry['日期']
                return employee
            })
            return this.gEmployeeSchedul
        } else {
            return this.gEmployeeSchedul
        }
    }
    getAttendDetail(attendanceDetail, ask4leave, businessTrip) {
        const detail = attendanceDetail.detail
        const result = Object.keys(detail)
            .filter(q => !/未排班/g.test(detail[q]))
            .map(q => {
                const tempAttendance = new Map()
                const tempAsk4leave = new Map()
                const tempBusinessTrip = new Map()
                const forgetPunchCardTimes = new Map()
                const lateTimes = new Map()
                tempAttendance.set(q, 1)
                const a = ask4leave.find(
                    item => moment(q).isSameOrAfter(item.start) && moment(q).isSameOrBefore(item.end)
                )
                const b = businessTrip.find(
                    item => moment(q).isSameOrAfter(item.start) && moment(q).isSameOrBefore(item.end)
                )
                if (/旷工/g.test(detail[q])) {
                    if (a) {
                        if (Math.abs(a.range - _.ceil(a.range)) === 0.5) {
                            if (moment(q).isSame(a.start) || moment(q).isSame(a.end)) {
                                tempAttendance.set(q, 0.5)
                                tempAsk4leave.set(q, 0.5)
                            } else {
                                tempAttendance.set(q, 0)
                                tempAsk4leave.set(q, 1)
                            }
                        } else {
                            tempAttendance.set(q, 0)
                            tempAsk4leave.set(q, 1)
                        }
                    } else if (b) {
                        tempBusinessTrip.set(q, 1)
                        tempAttendance.set(q, 1)
                    } else {
                        const temp = this.gEmployeeSchedul.find((schedul: Employee) => {
                            return schedul.name === attendanceDetail.name && schedul.month === q
                        })
                        if (temp) {
                            if (temp.status === '否') {
                                tempAttendance.set(q, -2)
                            } else {
                                tempAttendance.set(q, 1)
                            }
                        } else {
                            tempAttendance.set(q, -2)
                        }
                    }
                } else if (/缺卡/g.test(detail[q])) {
                    if (a) {
                        if (Math.abs(a.range - _.ceil(a.range)) === 0.5) {
                            if (moment(q).isSame(a.start) || moment(q).isSame(a.end)) {
                                tempAttendance.set(q, 0.5)
                            } else {
                                tempAttendance.set(q, 0)
                            }
                        } else {
                            tempAttendance.set(q, 0)
                        }
                    } else if (b) {
                        tempBusinessTrip.set(q, 1)
                        tempAttendance.set(q, 1)
                    } else {
                        tempAttendance.set(q, 1)
                        forgetPunchCardTimes.set(q, 1)
                    }
                } else if (/迟到/g.test(detail[q]) || /早退/g.test(detail[q])) {
                    if (a) {
                        if (Math.abs(a.range - _.ceil(a.range)) === 0.5) {
                            if (moment(q).isSame(a.start) || moment(q).isSame(a.end)) {
                                tempAttendance.set(q, 0.5)
                                tempAsk4leave.set(q, 0.5)
                            } else {
                                tempAttendance.set(q, 0)
                                tempAsk4leave.set(q, 1)
                            }
                        } else {
                            tempAttendance.set(q, 0)
                            tempAsk4leave.set(q, 1)
                        }
                    } else {
                        lateTimes.set(q, 1)
                        tempAttendance.set(q, 1)
                    }
                } else if (detail[q] === '正常') {
                    if (a) {
                        if (Math.abs(a.range - _.ceil(a.range)) === 0.5) {
                            if (moment(q).isSame(a.start) || moment(q).isSame(a.end)) {
                                tempAttendance.set(q, 0.5)
                                tempAsk4leave.set(q, 0.5)
                            } else {
                                tempAttendance.set(q, 0)
                                tempAsk4leave.set(q, 1)
                            }
                        } else {
                            tempAttendance.set(q, 0)
                            tempAsk4leave.set(q, 1)
                        }
                    } else {
                        tempAttendance.set(q, 1)
                    }
                }
                const result = new Map()
                result.set(q, {
                    tempAttendance: tempAttendance.get(q) ? tempAttendance.get(q) : 0,
                    tempAsk4leave: tempAsk4leave.get(q) ? tempAsk4leave.get(q) : 0,
                    tempBusinessTrip: tempBusinessTrip.get(q) ? tempBusinessTrip.get(q) : 0,
                    forgetPunchCard: forgetPunchCardTimes.get(q) ? forgetPunchCardTimes.get(q) : 0,
                    late: lateTimes.get(q) ? lateTimes.get(q) : 0,
                })
                return strMapToObj(result)
            })
        const temp = {}
        result.forEach(item => _.merge(temp, item))
        return temp
    }
    async isExit(name) {
        return this.gAttendanceDetails.find(item => item.name === name) ? true : false
    }
    async getAttendanceByRange(name, start, end): Promise<Attendance> {
        let should = 0
        let acture = 0
        let lateTimes = 0
        let forgetPunchCardTimes = 0
        let businessTripTimes = 0
        let detail = {}
        if (await this.isExit(name)) {
            const attendanceDetail = await this.getAttendanceByName(name)
            const ask4leave = await this.getAsk4leaveByName(name)
            const businessTrip = await this.getBusinessTripByName(name)
            start = moment(start).format('YYYY-MM-DD')
            end = moment(end)
                .subtract(1, 'days')
                .format('YYYY-MM-DD')
            detail = this.getAttendDetail(attendanceDetail, ask4leave, businessTrip)
            const filterResult = Object.keys(detail).filter(
                item => moment(item).isSameOrAfter(start) && moment(item).isSameOrBefore(end)
            )
            should = filterResult.length
            acture = filterResult.reduce((total, item) => {
                return total + detail[item].tempAttendance
            }, 0)
            businessTripTimes = filterResult.reduce((total, item) => {
                return total + detail[item].tempBusinessTrip
            }, 0)
            forgetPunchCardTimes = filterResult.reduce((total, item) => {
                return total + detail[item].forgetPunchCard
            }, 0)
            lateTimes = filterResult.reduce((total, item) => {
                return total + detail[item].late
            }, 0)
        }

        return {
            name: name,
            start: start,
            end: end,
            should: should,
            acture: acture,
            businessTripTimes: businessTripTimes,
            forgetPunchCardTimes: forgetPunchCardTimes,
            lateTimes: lateTimes,
            detail: detail,
            // attendanceDetail: attendanceDetail.detail,
            // ask4leaveDetail: ask4leave,
            // businessTripDetail: businessTrip,
        }
    }
    async init() {
        this.gAttendanceDetails = await this.getAttendances()
        this.gAsk4leaveDetails = await this.getAsk4leaves()
        this.gBusinessTripDetails = await this.getBusinessTrips()
        this.gEmployeeSchedul = await this.getAllScheduling()
    }
}

export async function _getAttendanceUtilOfMonth(month: string) {
    const attendanceUtil = new AttendanceUtil(month)
    await attendanceUtil.init()
    return attendanceUtil
}

export async function getAttendanceUtilOfMonth(month: string) {
    let monthStr = moment(month)
        .startOf('month')
        .format('YYYY-MM-DD')
    if (!gMonthAttendanceUtilMap.has(monthStr)) {
        gMonthAttendanceUtilMap.set(monthStr, _getAttendanceUtilOfMonth(monthStr))
    }
    return gMonthAttendanceUtilMap.get(monthStr)
}

export async function getAttendanceByStaffPosition(staffPosition: StaffPosition): Promise<Attendance> {
    let attendanceUtil = await getAttendanceUtilOfMonth(staffPosition.start)
    let attendance = await attendanceUtil
        .getAttendanceByRange(staffPosition.name, staffPosition.start, staffPosition.end)
        .catch(err => {
            console.error(
                'StaffFruit.init() set attendance ',
                staffPosition.name,
                staffPosition.start,
                '-',
                staffPosition.end,
                ', catch error:',
                err
            )
            console.error('StaffFruit.init() use default attendance')
            return {
                acture: moment(staffPosition.end).diff(moment(staffPosition.start), 'day'),
                should: moment(staffPosition.end).diff(moment(staffPosition.start), 'day'),
            }
        })
    if (attendance.acture < 0) {
        attendance.acture = 0
    }
    if (attendance.should === 0 && attendance.acture === 0) {
        console.error(
            'StaffFruit.init() set attendance ',
            staffPosition.name,
            staffPosition.start,
            '-',
            staffPosition.end,
            ', error, not attendance data found, use default attendance'
        )
        attendance = {
            acture: moment(staffPosition.end).diff(moment(staffPosition.start), 'day'),
            should: moment(staffPosition.end).diff(moment(staffPosition.start), 'day'),
        }
    }
    return attendance
}

if (require.main === module) {
    ;(async function() {
        const attendance = new AttendanceUtil('2018-08-01')
        await attendance.init()
        // const data = await attendance.getAttendances()
        // const data = await attendance.getRecordByName('陈安易')
        // const data = await attendance.getBusinessTripByName('王阳')
        const data = await attendance.getAttendanceByRange('肖莲', '2018-08-01', '2018-08-31')
    })()
}
