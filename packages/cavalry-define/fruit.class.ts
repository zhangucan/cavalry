import { FruitCompute } from './fruit-compute.interface'
import { StaffPosition } from './staff-position.class'
import * as moment from 'moment'
import { Attendance } from './attendance.class'
import { JobStatus } from './job-status.enum'
import { DailyPersonalResumeCost } from './daily-personal-resume-cost.interface'
import { CommissionRates } from './commission-rates.class'
import { DIC_CAT_MAPPING } from './mapping'

export class Fruit implements FruitCompute {
    employee: string = null // 员工姓名
    staffPosition: StaffPosition = null // 工作岗位
    month: string = null // 月份
    incoming: number = 0 // 收入
    recall: number = 0 //划回
    cost: number = 0 // 支出
    profit: number = 0 // 利润
    deduction: number = 0 // 扣款
    deductionInCash: number = 0 // 现金扣款
    kpiPayments: KpiPayment[] = [] // 指标(扣款)
    achievements: Achievement[] = [] // 业绩
    recruitmentRecalls: RecruitmentRecall[] = [] // 划回业绩
    managementDailyCost: number = 145 // 管理成本: 派遣145, 其它134
    teamDailyCost: number = 1 // 部门成本
    resumeCost: number = 0 // 简历成本
    dailyPersonalResumeCosts: DailyPersonalResumeCost[] = [] // 简历成本
    commission: number = 0 // 提成佣金
    commissionRate: number = 0.5 //提成比率
    minMonthlySalary: number = 0 // 最低工资
    minSalary: number = 0 // 最低工资
    fullSalary: number = 0 // 全勤工资
    salary: number = 0 // 税前工资(虚拟)
    // personalTax: number // 个税调剂(虚拟)
    loss: number = 0 // 亏损
    laborCost: number = 0 // 人力成本
    start: string = null // 开始日期
    end: string = null // 结束日期
    attendance: Attendance = null // 考勤数据
    logs: Log[] //计算日志
    init(
        staffPosition: StaffPosition,
        attendance: Attendance,
        commissionRates: CommissionRates = null,
        minMonthlySalary: number
    ) {
        this.staffPosition = staffPosition
        this.employee = staffPosition.name
        this.start = staffPosition.start
        this.end = staffPosition.end
        this.month = moment(staffPosition.start)
            .startOf('month')
            .format('YYYY-MM-DD')
        this.attendance = attendance
        this.commissionRate = commissionRates === null ? 0.5 : commissionRates.staffRate
        this.minMonthlySalary = minMonthlySalary
    }
    run() {
        this.incoming = this.getIncoming()
        this.cost = this.getCost()
        this.recall = this.getRecall()
        this.profit = this.incoming - this.cost - this.recall
        this.commission = this.profit > 0 ? this.profit * this.commissionRate : this.profit

        this.deduction = this.kpiPayments.reduce(
            (pre, kpiPayment) => (kpiPayment.isInCash ? pre : pre + kpiPayment.value),
            0
        )
        this.deductionInCash = this.kpiPayments.reduce(
            (pre, kpiPayment) => (kpiPayment.isInCash ? pre + kpiPayment.value : pre),
            0
        )
        this.minSalary = this.getMinSalary()
        if (this.minSalary < 0) {
            this.minSalary = 0
        }
        if (this.commission - this.deduction > this.minSalary) {
            this.fullSalary = this.commission - this.deduction
        } else {
            this.fullSalary = this.minSalary
        }

        // Only minSalary part adjusts by attendance rate
        if (this.staffPosition.status === JobStatus.LEAVE) {
            this.salary = 0
        } else {
            this.salary =
                this.fullSalary - this.minSalary + (this.minSalary * this.attendance.acture) / this.attendance.should
        }
        this.loss = this.salary > this.commission ? this.salary - this.commission : 0
        this.laborCost = this.salary + this.cost
    }
    getIncoming() {
        return 0
    }
    getRecall() {
        return 0
    }
    getCost() {
        return 0
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
        return cloneObj
    }
}

export class KpiPayment {
    employee: string // 员工姓名
    type: KpiType // 指标类别
    name: string // 指标名称
    isInCash: boolean // 是否现金扣款，（或者从工资里面扣）
    date: string // 日期
    describe: string // 情况说明
    value: number // 扣款金额
    month: string
}
export class Log {
    index: number
    name: string // 计算名称
    compute: string // 计算过程
    input: any // 输入
    output: any // 输出
}
export class Achievement {
    employee: string // 员工姓名
    team?: string // 项目组
    manager: string // 经理
    leader: string // 直接上级
    type: AchievementType // 业绩类别
    position: string //职位
    date: Date // 日期
    createDate: Date // 填写日期
    describe: string // 情况说明
    value: number // 业绩金额
    source: string
}

export class Recruitment extends Achievement {
    jobSeeker?: JobSeeker // 求职者
    inauguralUnit?: string // 就职单位
    teamIn?: string // 代招部门
    isOurUnit?: boolean // 是否是自招
    entryDate?: Date // 入职日期
    month?: string //月份
}
export class TeamProfitCost {
    team: string
    manager: string
    incoming: number
    teamCost: number
    commonCost: number
    month: string
}
export class BaseSalary {
    name: string
    salary: number
    month: string
}
export class RecruitmentRecall {
    jobSeeker: JobSeeker // 求职者
    createDate: Date // 填写日期
    leaveDate: Date // 离职日期
    value: number // 划回业绩
    employee: string // 员工姓名
    manager: string // 经理
    leader: string // 直接上级
    teamIn: string // 求职者原入职部门
    team: string // 招聘员工所属部门
    month: string // 业绩划回月份
}

export class JobSeeker {
    name: string // 求职者姓名
    gender: string // 性别
    idCardNo: string // 身份证号
    phoneNumber: string //手机号码
}

export class Employee {
    name: string // 员工姓名
    leader: string // 直接上级
    department: string // 部门
    company: string // 公司
    team: string // 组别
    position: string // 岗位
    title: Role // 职级
    hireDate: Date // 入职日期
    lengthOfHiredate: number // 入职时长
    leaveDate: string = null // 工资截止日期
    status: JobStatus = JobStatus.UNKNOWN // 员工状态
    rangeOfHiredate: string // 司龄分段
    type: string = '在职表'
    month: string
}

export enum Company {
    wuhan = '武汉总公司',
    xiaogan = '孝感分公司',
    huangshi = '黄石分公司',
}
export enum Role {
    STAFF = '员工',
    GROPOUP_LEADER = '主管',
    MANAGER = '经理',
    PROJECT_LEADER = '总监',
    ASSISTANT = '助理',
}
export enum AchievementType {
    RECRUITMENT = '招聘业绩',
    RESIDENT = '驻场考核',
    BackToArticle = '回款业绩',
}

export enum KpiType {
    // 人才
    LAPSE_RATE = '缺职率',
    CONTRIBUTION_RATE = '贡献率',
    SEPARATION_RATE = '离职率',
    LOYALTY_RATE = '忠诚度',
    PREPARATION_OF_CADRES = '备干部',

    // 监察
    CUSTOMER_RESPECT = '客户敬重',
    EMPLOYEE_SATISFACTION = '员工满意',
    OPPONENT_RESPECT = '同行敬畏',
    GOVERNMENT_ENDORSEMENT = '政府认可',

    // 份额
    OPPONENT_PEOPLE_NUMBER = '同行人数',
    OURPEOPLE_NUMBER = '我方人数',
    OUR_GROWTH = '我方增长',
    MARKET_SHARE = '市场份额',
    DEFAULT_FINE = '失责罚款',

    // 风险
    RISK = '风险',

    // 其它
    OTHER = '其它',
}
