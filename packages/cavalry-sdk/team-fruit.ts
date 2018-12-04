import { GroupFruit } from './group-fruit'
import { StaffFruit } from './staff-fruit'
import {
    Achievement,
    AchievementType,
    Recruitment,
    StaffPosition,
    FruitCompute,
    Fruit,
    Attendance,
    CommissionRates,
} from '@uranplus/cavalry-define'

export class TeamFruit extends StaffFruit implements FruitCompute {
    staffFruits?: StaffFruit[] = []
    groupFruits?: GroupFruit[] = []
    managerCost?: number = 0
    commonCost?: number = 0
    teamCost?: number = 0
    staffSalary?: number = 0
    staffLaborCost?: number = 0
    async init(
        staffPosition: StaffPosition,
        attendance: Attendance,
        commissionRates: CommissionRates,
        minMonthlySalary: number
    ) {
        super.init(staffPosition, attendance, commissionRates, minMonthlySalary)
        this.commissionRate = commissionRates == null ? 0.3 : commissionRates.managerRate
    }
    run() {
        this.staffFruits.forEach(staffFruit => staffFruit.run())
        this.groupFruits.forEach(groupFruit => groupFruit.run())
        this.staffSalary = this.getStaffSalary()
        this.staffLaborCost = this.getStaffLaborCost()
        super.run()
    }
    addStaffFruit(staffFruit: StaffFruit) {
        this.staffFruits.push(staffFruit)
    }
    addGroupFruit(groupFruit: GroupFruit) {
        this.groupFruits.push(groupFruit)
    }
    inputAchievement(achievement: Achievement) {
        if (achievement.type === AchievementType.RECRUITMENT) {
            let recruitment: Recruitment = achievement
        }
    }
    getIncoming() {
        return this.incoming
    }
    getStaffSalary() {
        return (
            this.staffFruits.reduce((pre, staffFruit) => {
                return pre + staffFruit.salary
            }, 0) +
            this.groupFruits.reduce((pre, groupFruit) => {
                return (
                    pre +
                    groupFruit.salary +
                    groupFruit.staffFruits.reduce((pre, staffFruit) => {
                        return pre + staffFruit.salary
                    }, 0)
                )
            }, 0)
        )
    }
    getStaffLaborCost() {
        return (
            this.staffFruits.reduce((pre, staffFruit) => {
                return pre + staffFruit.laborCost
            }, 0) +
            this.groupFruits.reduce((pre, groupFruit) => {
                return pre + groupFruit.laborCost
            }, 0)
        )
    }
    getCost() {
        this.resumeCost = this.dailyPersonalResumeCosts.reduce((pre, resumeCost) => pre + resumeCost.value, 0)
        return (
            this.staffFruits.reduce((pre, staffFruit) => {
                return pre + staffFruit.laborCost
            }, 0) +
            this.groupFruits.reduce((pre, groupFruit) => {
                return pre + groupFruit.laborCost
            }, 0) +
            this.resumeCost +
            this.commonCost
        )
    }
    getMinSalary() {
        return 0
    }
    cloneFruit() {
        let cloneObj = new Fruit()
        for (var attribute in cloneObj) {
            cloneObj[attribute] = this[attribute]
        }
        if (cloneObj.attendance) {
            // remove detail data of attendance
            delete cloneObj.attendance.detail
        }
        if (this.commonCost && this.teamCost && this.managerCost) {
            cloneObj['commonCost'] = this.commonCost
            cloneObj['teamCost'] = this.teamCost
            cloneObj['managerCost'] = this.managerCost
            cloneObj['staffSalary'] = this.staffSalary
            cloneObj['staffLaborCost'] = this.staffLaborCost
        }
        return cloneObj
    }
}

export async function visitFruitTree(tree, callback) {
    if (tree instanceof Array) {
        for (let item of tree) {
            await visitFruitTree(item, callback)
        }
    } else if (tree instanceof Fruit) {
        await callback(tree)
        if (tree['staffFruits']) {
            await visitFruitTree(tree['staffFruits'], callback)
        }
        if (tree['groupFruits']) {
            await visitFruitTree(tree['groupFruits'], callback)
        }
    }
}
