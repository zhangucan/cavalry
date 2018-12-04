import { getAchievements } from '../dao/achievement'
import * as moment from 'moment'

import { getTeamProfitCosts } from '../dao/team-profit-cost'
import { getRecruitmentRecalls } from '../dao/recall'
import { getKpiPayments } from '../dao/kpi'
import { getPositionChanges } from '../dao/position-change'
import { getCurrentEmployees, getEmployeeByName } from '../dao/current-employee'
import { getInitialTeam } from '../dao/initial-team'
import { loadTeamFruitsFromDb } from '@uranplus/cavalry-utils'
import {
    Recruitment,
    PositionChange,
    CurrentEmployee,
    CommissionRates,
    StaffPosition,
    TeamProfitCost,
    RecruitmentRecall,
    KpiPayment,
    BaseSalary,
    BaseDataServiceInterface,
    Attendance,
    DailyPersonalResumeCost,
    Fruit,
} from '@uranplus/cavalry-define'
import { getAllCommissionRates } from '../dao/commission-rate'
import { getAllSalary } from '../dao/base-salary'
import { getAttendanceByStaffPosition } from '../compute/attendance'
import { getDailyPersonalResumeCosts } from '../resume/project-resume-cost'
import * as config from 'config'
export class BaseDataServiceV1 implements BaseDataServiceInterface {
    async getAchievements(start: string, end?: string): Promise<Recruitment[]>
    async getAchievements(...arg): Promise<Recruitment[]> {
        if (arg.length === 1) {
            return await getAchievements(
                moment(arg[0])
                    .startOf('month')
                    .toDate(),
                moment(arg[0])
                    .add(1, 'months')
                    .startOf('month')
                    .toDate()
            )
        } else if (arg.length === 2) {
            return await getAchievements(
                moment(arg[0])
                    .startOf('month')
                    .toDate(),
                moment(arg[1])
                    .startOf('month')
                    .toDate()
            )
        }
    }

    async getTeamProfitCosts(month: string, end?: string): Promise<TeamProfitCost[]>
    async getTeamProfitCosts(...arg): Promise<TeamProfitCost[]> {
        if (arg.length === 1) {
            return await getTeamProfitCosts(
                moment(arg[0])
                    .startOf('month')
                    .format('YYYY-MM-DD')
            )
        }
    }

    async getRecruitmentRecalls(start: string, end?: string): Promise<RecruitmentRecall[]>
    async getRecruitmentRecalls(...arg): Promise<RecruitmentRecall[]> {
        if (arg.length === 1) {
            return await getRecruitmentRecalls(
                moment(arg[0])
                    .startOf('month')
                    .toDate(),
                moment(arg[0])
                    .add(1, 'months')
                    .startOf('month')
                    .toDate()
            )
        } else if (arg.length === 2) {
            return await getRecruitmentRecalls(
                moment(arg[0])
                    .startOf('month')
                    .toDate(),
                moment(arg[1])
                    .startOf('month')
                    .toDate()
            )
        }
    }

    async getAllKpiPayments(start: string, end?: string): Promise<KpiPayment[]>
    async getAllKpiPayments(...arg): Promise<KpiPayment[]> {
        if (arg.length === 1) {
            return await getKpiPayments(
                moment(arg[0])
                    .startOf('month')
                    .toDate(),
                moment(arg[0])
                    .add(1, 'months')
                    .startOf('month')
                    .toDate()
            )
        } else if (arg.length === 2) {
            return await getKpiPayments(
                moment(arg[0])
                    .startOf('month')
                    .toDate(),
                moment(arg[1])
                    .startOf('month')
                    .toDate()
            )
        }
    }

    async getPositionChanges(month: string): Promise<PositionChange[]> {
        return await getPositionChanges(
            moment(month)
                .add(1, 'months')
                .startOf('month')
                .toDate()
        )
    }
    async getCurrentEmployees(start?: string, end?: string): Promise<CurrentEmployee[]>
    async getCurrentEmployees(): Promise<CurrentEmployee[]> {
        return await getCurrentEmployees()
    }
    async getEmployeeByName(name: string, month: string): Promise<CurrentEmployee> {
        return await getEmployeeByName(name, month)
    }
    async getInitialTeam(): Promise<any[]> {
        return await getInitialTeam()
    }
    async getAllCommissionRates(month: string): Promise<CommissionRates[]> {
        return await getAllCommissionRates(month)
    }
    async getAllSalary(month: string): Promise<BaseSalary[]> {
        return await getAllSalary(month)
    }
    async getTeamCommissionRates(team: string, manager: string, month: string): Promise<CommissionRates> {
        const teamCost = await getAllCommissionRates(month)
        let temp = teamCost.find(
            (item: CommissionRates) => item.team === team && item.manager === manager
        )
        if (!temp) {
            return null
        } else {
            return temp
        }
    }
    async computeBaseSalary(name: string, month: string): Promise<number> {
        const baseSalary = await getAllSalary(month)
        let temp = baseSalary.find((item: BaseSalary) => item.name === name)
        if (!temp) {
            return 0
        } else {
            return temp.salary
        }
    }
    async getMinMonthlySalary(staffPosition: StaffPosition, month: string): Promise<number> {
        if (staffPosition.department === '派遣部') {
            if (staffPosition.manager === staffPosition.name) {
                return 0
            } else if (staffPosition.groupLeader) {
                if (staffPosition.name === staffPosition.groupLeader) {
                    return 5000
                } else {
                    return 4000
                }
            } else {
                return 4000
            }
        } else {
            return await this.computeBaseSalary(staffPosition.name, month)
        }
    }

    async getAttendanceByStaffPosition(staffPosition: StaffPosition): Promise<Attendance> {
        return getAttendanceByStaffPosition(staffPosition)
    }
    async getDailyPersonalResumeCosts(month: string): Promise<DailyPersonalResumeCost[]> {
        return getDailyPersonalResumeCosts(month)
    }
    async getTeamFruits(team: string, manager: string, month: string): Promise<Fruit[]> {
        const fruit_slices_index = config.get('cavalry.es.fruit_slices.index')
        const fruit_slices_type = config.get('cavalry.es.fruit_slices.type')
        return loadTeamFruitsFromDb(team, manager, month, fruit_slices_index, fruit_slices_type)
    }
}
