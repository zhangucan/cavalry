import { StaffPosition } from './staff-position.class'
import { Achievement } from './fruit.class'
import { Attendance } from './attendance.class'
import { CommissionRates } from './commission-rates.class'

export interface FruitCompute {
    init?(
        staffPosition: StaffPosition,
        attendance: Attendance,
        commissionRates: CommissionRates,
        minMonthlySalary: number
    )
    run()
    getIncoming()
    getCost()
    getRecall()
    getMinSalary()
    addStaffFruit?(staffFruit: any)
    addGroupFruit?(groupFruit: any)
    inputAchievement?(achievement: Achievement)
}
