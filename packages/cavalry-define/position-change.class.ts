import { StaffPosition } from './staff-position.class'
import { JobStatus } from './job-status.enum'
export { JobStatus }

export class PositionChange {
    id: string
    name: string
    date: string
    previous: StaffPosition
    current: StaffPosition
    status?: JobStatus // 入职，离职，自离，异动
}
