import { StaffFruit } from './staff-fruit'
import {
    Achievement,
    KpiPayment,
    FruitCompute,
    StaffPosition,
    Attendance,
    CommissionRates,
} from '@uranplus/cavalry-define'
declare var require: any
const debug = require('debug')('group-fruit')

export class GroupFruit extends StaffFruit implements FruitCompute {
    staffFruits: StaffFruit[] = []
    async init(
        staffPosition: StaffPosition,
        attendance: Attendance,
        commissionRates: CommissionRates,
        minMonthlySalary: number
    ) {
        super.init(staffPosition, attendance, commissionRates, minMonthlySalary)
        this.commissionRate = commissionRates == null ? 0.4 : commissionRates.groupleaderRate
    }
    run() {
        this.staffFruits.forEach(staffFruit => staffFruit.run())
        super.run()
    }
    addStaffFruit(staffFruit: StaffFruit) {
        this.staffFruits.push(staffFruit)
    }
    setAchievements(achievements: Achievement[]) {}
    setKpiPayments(kpiPayments: KpiPayment[]) {}
    getIncoming() {
        let selfIncoming = super.getIncoming()
        let staffIncomingSum = this.staffFruits.reduce((pre, staffFruit) => {
            return pre + staffFruit.incoming
        }, 0)
        debug('GroupFruit.getIncoming() selfIncoming=', selfIncoming, ' staffIncomingSum=', staffIncomingSum)
        return selfIncoming + staffIncomingSum
    }
    getRecall() {
        let selfRecruitmentRecall = this.recruitmentRecalls.reduce((pre, recruitmentRecall) => {
            return pre + recruitmentRecall.value
        }, 0)
        return selfRecruitmentRecall
    }
    getCost() {
        return (
            super.getCost() +
            this.staffFruits.reduce((pre, staffFruit) => {
                return pre + staffFruit.laborCost
            }, 0)
        )
    }
    getMinSalary() {
        return super.getMinSalary()
    }
}
