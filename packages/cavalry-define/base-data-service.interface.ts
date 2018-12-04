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
    Attendance,
    DailyPersonalResumeCost,
    Fruit,
} from '.'

export interface BaseDataServiceInterface {
    getAchievements(start: string, end?: string): Promise<Recruitment[]>
    getAchievements(...arg): Promise<Recruitment[]>

    getTeamProfitCosts(month: string, end?: string): Promise<TeamProfitCost[]>
    getTeamProfitCosts(...arg): Promise<TeamProfitCost[]>

    getRecruitmentRecalls(start: string, end?: string): Promise<RecruitmentRecall[]>
    getRecruitmentRecalls(...arg): Promise<RecruitmentRecall[]>

    getAllKpiPayments(start: string, end?: string): Promise<KpiPayment[]>
    getAllKpiPayments(...arg): Promise<KpiPayment[]>

    getPositionChanges(month: string): Promise<PositionChange[]>
    getCurrentEmployees(start?: string, end?: string): Promise<CurrentEmployee[]>
    getCurrentEmployees(): Promise<CurrentEmployee[]>
    getEmployeeByName(name: string, month: string): Promise<CurrentEmployee>
    getInitialTeam(): Promise<any[]>
    getAllCommissionRates(month: string): Promise<CommissionRates[]>
    getAllSalary(month: string): Promise<BaseSalary[]>
    getTeamCommissionRates(team: string, manager: string, month: string)
    computeBaseSalary(name: string, month: string): Promise<number>
    getMinMonthlySalary(staffPosition: StaffPosition, month: string): Promise<number>
    getAttendanceByStaffPosition(staffPosition: StaffPosition): Promise<Attendance>
    getDailyPersonalResumeCosts(month: string): Promise<DailyPersonalResumeCost[]>
    getTeamFruits(team: string, manager: string, month: string): Promise<Fruit[]>
    visitTree(callback: ((StaffPosition) => Promise<void>))
}
