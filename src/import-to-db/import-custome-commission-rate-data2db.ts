import * as path from 'path'
import * as fs from 'fs'
import { xlsx2json, trimObj, saveJsonToDb } from '@uranplus/cavalry-utils'
import { CommissionRates, DIC_CAT_MAPPING } from '@uranplus/cavalry-define'
import * as moment from 'moment'
import * as config from 'config'
const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')

export async function ormCustomeCommissionRateFormXlsx(index, type) {
    const folder = path.join(require('@uranplus/cavalry-raw-files'), `/nj-data/${month}/rate/`)
    let temp: CommissionRates[] = []
    for (let file of fs.readdirSync(folder)) {
        const filePath = path.join(folder, file)
        var stat = fs.statSync(filePath)
        if (stat.isFile() && filePath.endsWith('.xlsx')) {
            xlsx2json(filePath, 0).forEach(item => {
                const entry = trimObj(item)
                temp.push({
                    team: entry['项目'],
                    manager: entry['负责人'],
                    managerRate: Number(entry[DIC_CAT_MAPPING.ZJ.JL.name]),
                    groupleaderRate: Number(entry[DIC_CAT_MAPPING.ZJ.ZG.name]),
                    staffRate: Number(entry['专员']),
                    month: month,
                })
            })
        }
    }
    await saveJsonToDb(temp, index, type)
}
