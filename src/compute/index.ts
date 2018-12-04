import { Compute } from '../load-csv-salary-origin-json'
import { ManagerDetail } from '../ManagerSalary'
import { loadJsonFromDb, saveJsonToDb } from '@uranplus/cavalry-utils'
import * as moment from 'moment'
import * as fs from 'fs'
import * as _ from 'lodash'
const config = require('config')
const month = config.get('cavalry.month')
const maxSize = 10000
const errPath = `./error`
async function getTeamConfigs() {
    return loadJsonFromDb('team_config', 'team_config', 9999, {
        key: 'month',
        value: moment(month).toISOString(),
    })
}
async function getManagerProfit() {
    return loadJsonFromDb('manager_profit', 'profit', 9999, {
        key: 'month',
        value: moment(month).toISOString(),
    })
}
async function getProfitIn() {
    return loadJsonFromDb('profit_in', 'profit', 9999, {
        key: 'month',
        value: moment(month).toISOString(),
    })
}
async function getProfitOut() {
    return loadJsonFromDb('profit_out', 'profit', 9999, {
        key: 'month',
        value: moment(month).toISOString(),
    })
}
async function compute() {
    const a = await getTeamConfigs()
    console.log(a)
    for (const teamConfig of await getTeamConfigs()) {
        console.log(
            'begin to calculate team:',
            teamConfig.team,
            ' manager=',
            teamConfig.manager
        )
        try {
            const teamComputer = new Compute(teamConfig)
            await teamComputer.init()
            const salaryDetails = await teamComputer.getSalaryDetail()
            console.log('team:', teamConfig.team, 'salaryDetails.length=', salaryDetails.length)
            await saveJsonToDb(
                salaryDetails,
                config.get('cavalry.es.salary_slice.index'),
                config.get('cavalry.es.salary_slice.type')
            )
        } catch (err) {
            await fs.appendFile(`./error.txt`, `${new Date()}: ${err}\r\n`, _ => {
                console.log('compute team[', teamConfig.team, '] salary, err:', err)
            })
        }
    }
}
async function computeManagerSalary() {
    const c = {
        managerProfit: await getManagerProfit(),
        profitIn: await getProfitIn(),
        profitOut: await getProfitOut(),
    }
    for (const teamConfig of await getTeamConfigs()) {
        c['teamConfig'] = teamConfig
        const teamComputer = new ManagerDetail(c)
        const result = await teamComputer.getSalaryDetail()
        await saveJsonToDb(
            result,
            config.get('cavalry.es.salary_slice.index'),
            config.get('cavalry.es.salary_slice.type')
        )
    }
}
if (require.main === module) {
    ;(async function() {
        await compute()
        await computeManagerSalary()
    })()
}
