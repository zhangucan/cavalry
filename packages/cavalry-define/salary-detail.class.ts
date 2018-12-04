import { PositionChange } from './position-change.class'

export class SalaryDetail {
    team: string //项目组
    path: string //excel
    cost4All: number //部门成本
    cost4Manage: number //管理费用
    staffBaseSalary: number //员工基本工资
    groupLeaderBaseSalary: number //主管基本工资
    staffRoyaltyRate: number //员工提成
    groupLeaderRoyaltyRate: number //主管提成
    reward: number //奖励
    timeRange: any //时间段
    profitRatio: number
    adjustBaseSalary: number //起征税
    attendanceDetail: any //考勤明细
    employeePositionChange: PositionChange[] //员工异动
    employeeLive: any // 在职员工
    employeeLeave: any //离职员工
    socialInsurance: any //社保
    manager: string //经理
    cost4Paper: number //纸张费用
    eachPaperPay: number
    outputData: any
}
