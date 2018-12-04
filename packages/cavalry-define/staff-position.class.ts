import { NodeSlice } from './node-slice.class'
import { JobStatus } from './job-status.enum'
import { Role } from './index';
export class StaffPosition {
    department?: string // 部门
    team?: string // 组别
    manager?: string // 经理
    groupLeader?: string // 主管
    leader?: string // 直接领导
    title?: Role // 职级
    position?: string // 职位
    name?: string //姓名
    start?: string //开始日期
    end?: string //结束日期
    leaderStart?: string //上级开始日期
    leaderEnd?: string //上级结束日期
    status?: JobStatus
    nodeSlice?: NodeSlice // nodeSlice from tree-life
}
