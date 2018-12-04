export * from './staff-fruit'
export * from './group-fruit'
export * from './team-fruit'
export * from './team-salary'
export * from './tree-life'
// export * from './company-salary'
import { initTeamFruits } from './team-salary'
import { BaseDataServiceInterface } from '@uranplus/cavalry-define'

export function init(monthStr: string, baseDataService: BaseDataServiceInterface) {
    initTeamFruits(monthStr, baseDataService)
}
