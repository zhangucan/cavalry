import {
    Fruit,
    StaffPosition,
    RecruitmentRecall,
    Recruitment,
    CommissionRates,
    BaseDataServiceInterface,
} from '@uranplus/cavalry-define'
import { TeamFruit, visitFruitTree } from './team-fruit'
import { getSampleUnixTime, filterSortedTimeRangesByTime, phraseMap } from './tree-life'

import { GroupFruit } from './group-fruit'
import { StaffFruit } from './staff-fruit'
import { getLeader } from './common/utils'
import * as moment from 'moment'
import { assert } from 'chai'

import { flatTeamFruits } from './flat-team-fruits'
import { findStaffFruit, searchStaffFruits } from './search-fruit'

const fruitMap = new Map<string, Fruit[]>()
let gBaseDataService: BaseDataServiceInterface

export async function changeCommissionRates(commissionRates: CommissionRates) {
    let df = getTeamFruitTree(
        await gBaseDataService.getTeamFruits(commissionRates.team, commissionRates.manager, commissionRates.month)
    )
    await visitFruitTree(df, (fruit: Fruit) => {
        if (fruit.employee === fruit.staffPosition.manager) {
            fruit.commissionRate = commissionRates.managerRate
        } else if (fruit.employee === fruit.staffPosition.groupLeader) {
            fruit.commissionRate = commissionRates.groupleaderRate
        } else {
            fruit.commissionRate = commissionRates.staffRate
        }
    })
    df.run()
    let entries: Fruit[] = []
    await visitFruitTree([df], (fruit: Fruit) => {
        entries.push(fruit.cloneFruit())
    })
    return entries
}

export function getTeamFruitTree(entries: Fruit[]) {
    let df = getTeamFruit(entries)
    df.staffFruits = getTeamStaffFruits(entries)
    df.groupFruits = getGroupFruits(entries)
    return df
}
function getTeamFruit(entries: Fruit[]): TeamFruit {
    let teamFruit = new TeamFruit()
    return Object.assign(
        teamFruit,
        entries.find(entry => {
            if (entry.staffPosition.manager === entry.employee) {
                return true
            }
        })
    )
}

function getTeamStaffFruits(entries: Fruit[]): StaffFruit[] {
    return entries
        .filter(entry => {
            if (entry.staffPosition.manager !== entry.employee && entry.staffPosition.groupLeader == null) {
                return true
            }
        })
        .map(entry => Object.assign(new StaffFruit(), entry))
}

function getGroupFruits(entries: Fruit[]): GroupFruit[] {
    return entries
        .filter(entry => {
            if (
                entry.staffPosition.manager !== entry.employee &&
                entry.staffPosition.groupLeader != null &&
                entry.staffPosition.groupLeader === entry.employee
            ) {
                return true
            }
        })
        .map(entry => getGroupFruitTree(entries, entry))
}

function getGroupFruitTree(entries: Fruit[], groupEntry: Fruit): GroupFruit {
    let gf = Object.assign(new GroupFruit(), groupEntry)
    gf.staffFruits = getGroupStaffFruits(entries, gf.employee)
    return gf
}

function getGroupStaffFruits(entries: Fruit[], groupLeader: string): StaffFruit[] {
    return entries
        .filter(entry => {
            if (
                entry.staffPosition.manager !== entry.employee &&
                entry.employee !== groupLeader &&
                entry.staffPosition.groupLeader == groupLeader
            ) {
                return true
            }
        })
        .map(entry => Object.assign(new StaffFruit(), entry))
}

export function getBaseDataService() {
    return gBaseDataService
}

export async function initTeamFruits(
    monthStr: string,
    baseDataService: BaseDataServiceInterface
): Promise<TeamFruit[]> {
    const month = moment(monthStr)
    const start = month.startOf('month').format('YYYY-MM-DD')
    const end = month
        .add(1, 'month')
        .startOf('month')
        .format('YYYY-MM-DD')
    gBaseDataService = baseDataService
    let teamFruits: TeamFruit[] = []
    let curTeamFruit: TeamFruit
    let curGroupFruit: GroupFruit

    await gBaseDataService.visitTree(async (staffPosition: StaffPosition) => {
        const attendance = await gBaseDataService.getAttendanceByStaffPosition(staffPosition)
        const commissionRates = await gBaseDataService.getTeamCommissionRates(
            staffPosition.team,
            staffPosition.manager,
            start
        )
        const minMonthlySalary = await gBaseDataService.getMinMonthlySalary(staffPosition, start)
        if (staffPosition.name && staffPosition.start < staffPosition.end) {
            if (staffPosition.name === staffPosition.manager) {
                curTeamFruit = new TeamFruit()
                await curTeamFruit.init(staffPosition, attendance, commissionRates, minMonthlySalary)
                teamFruits.push(curTeamFruit)
            } else if (!staffPosition.groupLeader) {
                let sf = new StaffFruit()
                await sf.init(staffPosition, attendance, commissionRates, minMonthlySalary)
                curTeamFruit.addStaffFruit(sf)
            } else if (staffPosition.groupLeader === staffPosition.name) {
                curGroupFruit = new GroupFruit()
                await curGroupFruit.init(staffPosition, attendance, commissionRates, minMonthlySalary)
                curTeamFruit.addGroupFruit(curGroupFruit)
            } else {
                let sf = new StaffFruit()
                await sf.init(staffPosition, attendance, commissionRates, minMonthlySalary)
                curGroupFruit.addStaffFruit(sf)
            }
        }
    })
    await flatTeamFruits(teamFruits, fruitMap)
    return teamFruits
}

export function findFruit(fruits: Fruit[], staffPosition: StaffPosition, level): any {
    if (!(fruits instanceof Array)) {
        return null
    }
    let dps: Fruit[] = filterSortedTimeRangesByTime(
        fruits
            .filter(
                fruit =>
                    fruit.staffPosition[level] === staffPosition[level] &&
                    fruit.staffPosition.team === staffPosition.team
            )
            .sort((sp1, sp2) => getSampleUnixTime(sp1) - getSampleUnixTime(sp2)),
        staffPosition.start,
        staffPosition.end
    )
    assert.isBelow(
        dps.length,
        2,
        'findFruit() error, found more than 1 record, staffPosition =' +
            JSON.stringify(staffPosition) +
            'dps =' +
            JSON.stringify(dps)
    )
    // if (dps.length === 0) {
    //     debug('findFruit() fruit not found! fruits=', fruits, ' staffPosition=', staffPosition)
    // }
    return dps[0]
}

export async function getTeamFruits(teamFruits: TeamFruit[], monthStr: string): Promise<TeamFruit[]> {
    const month = moment(monthStr)
    const start = month.startOf('month').format('YYYY-MM-DD')
    const end = month
        .add(1, 'month')
        .startOf('month')
        .format('YYYY-MM-DD')
    const achievements = await gBaseDataService.getAchievements(start)
    const teamProfitCosts = await gBaseDataService.getTeamProfitCosts(start)
    const recalls = await gBaseDataService.getRecruitmentRecalls(start)
    const kpiPayments = await gBaseDataService.getAllKpiPayments(start)
    for (let achievement of achievements) {
        let staffPosition = new StaffPosition()
        staffPosition.name = achievement.employee
        staffPosition.team = phraseMap(achievement.team)
        staffPosition.manager = achievement.manager
        staffPosition.groupLeader = achievement.manager === achievement.leader ? null : achievement.leader
        staffPosition.start = moment(achievement.date).format('YYYY-MM-DD')
        staffPosition.end = moment(achievement.date)
            .add(1, 'day')
            .format('YYYY-MM-DD')

        let staffFruit: StaffFruit = await findStaffFruit(teamFruits, staffPosition)
        if (!staffFruit) {
            continue
        }
        staffFruit.achievements.push(achievement)
    }
    for (let teamProfitCost of teamProfitCosts) {
        let days = 1
        let staffPosition = new StaffPosition()
        staffPosition.name = teamProfitCost.manager
        staffPosition.manager = teamProfitCost.manager
        staffPosition.team = teamProfitCost.team
        staffPosition.start = null
        staffPosition.end = null
        let staffFruits: any[] = await searchStaffFruits(teamFruits, staffPosition, ['name', 'team', 'manager'])
        let staffFruits2: any[] = await searchStaffFruits(teamFruits, staffPosition, ['team'])
        if (staffFruits.length >= 2) {
            console.warn('getTeamFruits() import teamProfitCost, warn found more than one staffFruit, use last one')
        }
        if (staffFruits.length === 0) {
            console.error(
                'getTeamFruits() import teamProfitCost() failed, staffPosition =',
                JSON.stringify(staffPosition)
            )
        } else {
            staffFruits[0].incoming = teamProfitCost.incoming
            staffFruits[0].commonCost = teamProfitCost.commonCost
            staffFruits[0].teamCost = teamProfitCost.teamCost
        }
        // 部门均摊成本（每人每天）
        days = staffFruits2.reduce((total, item) => {
            if (item.staffPosition.manager === item.staffPosition.name) {
                return total
            }
            return total + item.attendance.should
        }, 0)
        staffFruits2.forEach(staffFruit => (staffFruit.teamDailyCost = teamProfitCost.teamCost / days))
    }

    // TODO recruitment recall
    // for (let recruitmentRecall of recalls) {
    //     const staff: StaffPosition = await fillRecruitmentRecalls2Fruits(
    //         monthStr,
    //         fruitMap.get(recruitmentRecall.employee),
    //         recruitmentRecall,
    //         achievements
    //     )
    //     if (staff) {
    //         const leader = getLeader(staff)
    //         if (leader) {
    //             if (leader === recruitmentRecall.manager) {
    //                 await fillRecruitmentRecalls2Fruits(
    //                     monthStr,
    //                     fruitMap.get(recruitmentRecall.manager),
    //                     recruitmentRecall,
    //                     achievements
    //                 )
    //             } else {
    //                 await fillRecruitmentRecalls2Fruits(
    //                     monthStr,
    //                     fruitMap.get(recruitmentRecall.manager),
    //                     recruitmentRecall,
    //                     achievements
    //                 )
    //                 await fillRecruitmentRecalls2Fruits(monthStr, fruitMap.get(leader), recruitmentRecall, achievements)
    //             }
    //         }
    //     }
    // }

    for (let kpiPayment of kpiPayments) {
        let staffPosition = new StaffPosition()
        staffPosition.name = kpiPayment.employee
        staffPosition.start = moment(kpiPayment.date).format('YYYY-MM-DD')
        staffPosition.end = moment(kpiPayment.date)
            .add(1, 'day')
            .format('YYYY-MM-DD')

        let staffFruits = await searchStaffFruits(teamFruits, staffPosition, ['name'])
        if (staffFruits.length >= 2) {
            console.warn('getTeamFruits() import kpiPayment, warn found more than one staffFruit, use last one')
        }
        if (staffFruits.length === 0) {
            console.error('getTeamFruits() import kpiPayment failed, staffPosition =', JSON.stringify(staffPosition))
        } else {
            staffFruits[staffFruits.length - 1].kpiPayments.push(kpiPayment)
        }
    }

    for (let dailyPersonalResumeCost of await gBaseDataService.getDailyPersonalResumeCosts(start)) {
        let staffPosition = new StaffPosition()
        staffPosition.name = dailyPersonalResumeCost.name
        staffPosition.start = moment(dailyPersonalResumeCost.date).format('YYYY-MM-DD')
        staffPosition.end = moment(dailyPersonalResumeCost.date)
            .add(1, 'day')
            .format('YYYY-MM-DD')
        let staffFruits = await searchStaffFruits(teamFruits, staffPosition, ['name'])
        if (staffFruits.length >= 2) {
            console.warn(
                'getTeamFruits() import dailyPersonalResumeCost, warn found more than one staffFruit, use last one'
            )
        }
        if (staffFruits.length === 0) {
            console.error(
                'getTeamFruits() import dailyPersonalResumeCost failed, staffPosition =',
                JSON.stringify(staffPosition)
            )
        } else {
            staffFruits[staffFruits.length - 1].dailyPersonalResumeCosts.push(dailyPersonalResumeCost)
        }
    }
    teamFruits.forEach(teamFruit => teamFruit.run())
    return teamFruits
}

async function fillRecruitmentRecalls2Fruits(
    month: string,
    fruits: Fruit[],
    recruitmentRecall: RecruitmentRecall,
    achievements: Recruitment[]
): Promise<StaffPosition> {
    const start = moment(month)
        .subtract(1, 'months')
        .format('YYYY-MM-DD')
    const recruitment = achievements.find((recruitment: Recruitment) => {
        if (recruitment.jobSeeker) {
            return (
                recruitmentRecall.jobSeeker.name === recruitment.jobSeeker.name &&
                recruitmentRecall.jobSeeker.phoneNumber === recruitment.jobSeeker.phoneNumber
            )
        } else {
            return false
        }
    })
    if (fruits && recruitment) {
        const temp1 = fruits.find((fruit: Fruit) => {
            return (
                fruit.staffPosition.team === recruitment.team &&
                fruit.staffPosition.manager === recruitment.manager &&
                getLeader(fruit.staffPosition) === recruitment.leader
            )
        })
        const temp2 = fruits.find((fruit: Fruit) => {
            return fruit.staffPosition.team === recruitment.team && fruit.staffPosition.manager === recruitment.manager
        })
        const temp3 = fruits.find((fruit: Fruit) => {
            return fruit.staffPosition.team === recruitment.team
        })
        if (temp1) {
            temp1.recruitmentRecalls.push(recruitmentRecall)
            return temp1.staffPosition
        } else if (temp2) {
            temp2.recruitmentRecalls.push(recruitmentRecall)
            return temp2.staffPosition
        } else if (temp3) {
            temp3.recruitmentRecalls.push(recruitmentRecall)
            return temp3.staffPosition
        } else {
            fruits[0].recruitmentRecalls.push(recruitmentRecall)
            return fruits[0].staffPosition
        }
    } else {
        return null
    }
}
