import * as path from 'path'
import * as fs from 'fs'
import { xlsx2json, strMapToObj, trimObj, saveJsonToDb, search } from '@uranplus/cavalry-utils'
import * as moment from 'moment'
import * as config from 'config'
import { TeamProfitCost } from '@uranplus/cavalry-define/fruit.class'

const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')
export async function saveTeamProfitCost2db(index, type) {
    const folder = path.join(require('@uranplus/cavalry-raw-files'), `/nj-data/${month}/profit_cost/`)
    let temp: TeamProfitCost[] = []
    for (let file of fs.readdirSync(folder)) {
        const filePath = path.join(folder, file)
        var stat = fs.statSync(filePath)
        if (stat.isFile() && filePath.endsWith('.xlsx')) {
            xlsx2json(filePath, 0).forEach(item => {
                const entry = trimObj(item)
                temp.push({
                    team: entry['项目'],
                    manager: entry['负责人'],
                    incoming: Number(entry['收入']),
                    teamCost: Number(entry['项目部门费用']),
                    commonCost: Number(entry['支出']),
                    month: month,
                })
            })
        }
    }
    await saveJsonToDb(temp, index, type)
}
