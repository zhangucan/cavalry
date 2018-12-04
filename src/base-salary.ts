import * as _ from 'lodash'
const bodybuilder = require('bodybuilder')
import * as config from 'config'
import { PositionChange, StaffPosition } from '@uranplus/cavalry-define'
import { search } from '@uranplus/cavalry-utils'
import { BaseSalary } from '@uranplus/cavalry-define/fruit.class'

// const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')
const base_salary_index = config.get('cavalry.es.base_salary.index')
const base_salary_type = config.get('cavalry.es.base_salary.type')
const position_change_index = config.get('cavalry.es.position_change.index')
const position_change_type = config.get('cavalry.es.position_change.type')

let gBaseSalary: any = {}
let gPositionChange: any = null
export async function getAllSalary(month: string): Promise<BaseSalary[]> {
    if (!gBaseSalary[month]) {
        const query = bodybuilder()
            .filter('term', '_type', base_salary_type)
            .filter('term', 'month', month)
            .size(10000)
            .build()
        gBaseSalary[month] = await search(base_salary_index, base_salary_type, query)
        return gBaseSalary[month]
    } else {
        return gBaseSalary[month]
    }
}
export async function getAllPositionChange(): Promise<PositionChange[]> {
    if (!gPositionChange) {
        const query = bodybuilder()
            .filter('term', '_type', position_change_type)
            .size(10000)
            .build()
        gPositionChange = await search(position_change_index, position_change_type, query)
        return gPositionChange
    } else {
        return gPositionChange
    }
}
export async function computeBaseSalary(name: string, month: string): Promise<number> {
    const baseSalary = await getAllSalary(month)
    let temp = baseSalary.find((item: BaseSalary) => item.name === name)
    if (!temp) {
        return 0
    } else {
        return temp.salary
    }
}
export async function getMinMonthlySalary(staffPosition: StaffPosition, month: string): Promise<number> {
    if (staffPosition.department === '派遣部') {
        if (staffPosition.manager === staffPosition.name) {
            return 0
        } else if (staffPosition.groupLeader) {
            if (staffPosition.name === staffPosition.groupLeader) {
                return 5000
            } else {
                return 4000
            }
        } else {
            return 4000
        }
    } else {
        return await computeBaseSalary(staffPosition.name, month)
    }
}
