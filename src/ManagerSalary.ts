import * as _ from 'lodash'
import { loadJsonFromDb } from '@uranplus/cavalry-utils'
import { DIC_CAT_MAPPING } from '@uranplus/cavalry-define'
const maxSize = 10000
const pipe = functions => data => {
    return functions.reduce((value, func) => {
        return func(value)
    }, data)
}
export class ManagerDetail {
    managerProfit: any
    profitIn: any
    profitOut: any
    teamConfig: any
    constructor(config: any) {
        const { managerProfit, profitIn, profitOut, teamConfig } = config
        this.managerProfit = managerProfit
        this.profitIn = profitIn
        this.profitOut = profitOut
        this.teamConfig = teamConfig
    }
    async init() {}
    async getSalaryDetail() {
        const compute_in_out = arr => {
            let managerArr = []
            const manager = arr.find(item => item.position === DIC_CAT_MAPPING.ZJ.JL.name)
            if (manager) {
                const managerProfit = this.managerProfit.find(employee => {
                    return employee.name === manager.name
                })
                if (managerProfit) {
                    manager.incomings = Number(managerProfit.incomings)
                    manager.outgoings =
                        managerProfit.outgoings -
                        managerProfit.profit +
                        managerProfit.profitWithOutSalary +
                        manager.outgoings
                    manager.socialInsurance = manager.socialInsurance
                    managerArr.push(_.merge(manager, managerProfit))
                }
            }
            return managerArr
        }
        const compute_profit = arr => {
            return arr.map(item => {
                item.profitIn = 0
                item.profitOut = 0
                const manager = this.managerProfit.find(employee => item.name === employee.manager)
                if (manager) {
                    const profitIn = this.profitIn.find(employee => item.manager === employee['负责人'])
                    const profitOut = this.profitOut.find(employee => item.manager === employee['负责人'])
                    if (profitIn) {
                        item.profitIn = profitIn['合计'] ? Number(profitIn['合计']) : Number(profitIn['合计 '])
                    }
                    if (profitOut) {
                        item.profitOut = profitOut['合计'] ? Number(profitOut['合计']) : Number(profitOut['合计 '])
                    }
                }
                return item
            })
        }
        const compute_accruedSalary = arr => {
            return arr.map(item => {
                let royaltyRate = 0.2
                if (this.teamConfig) {
                    royaltyRate = this.teamConfig.ManagerRoyaltyRate
                }
                const profit = item.incomings - item.outgoings - item.profitOut + item.profitIn - item.ownPerformance
                item.initialSalary = profit > 0 ? profit * royaltyRate : profit
                item.accruedSalary = profit > 0 ? profit * royaltyRate : profit
                item.name = item.manager
                return item
            })
        }
        const format_salary = arr => {
            return arr
                .map(item => {
                    return {
                        name: item.name,
                        outgoings: item.outgoings,
                        incomings: item.incomings,
                        position: item.position,
                        paperPay: 0,
                        line: -1,
                        accruedSalary: item.accruedSalary ? _.ceil(Number(item.accruedSalary), 2) : 0,
                        profitIn: item.profitIn,
                        profitOut: Number(item.profitOut),
                        hiredateSalary: item.hiredateSalary,
                        socialInsurance: item.socialInsurance,
                        team: item.team,
                    }
                })
                .filter(item => item.name)
        }
        return pipe([compute_in_out, compute_profit, compute_accruedSalary, format_salary])(
            await loadJsonFromDb(
                'salary_slice',
                'salary',
                maxSize,
                { key: 'team', value: this.teamConfig.team },
                'line'
            )
        )
    }
}
