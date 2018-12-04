import * as path from 'path'
import * as fs from 'fs'
import { xlsx2json, strMapToObj, trimObj, saveJsonToDb, search } from '@uranplus/cavalry-utils'
import * as moment from 'moment'
import * as config from 'config'

const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')
export async function saveBaseSalary2db(index, type) {
    const folder = path.join(require('@uranplus/cavalry-raw-files'), `/nj-data/${month}/base_salary/`)
    let temp = []
    for (let file of fs.readdirSync(folder)) {
        const filePath = path.join(folder, file)
        var stat = fs.statSync(filePath)
        if (stat.isFile() && filePath.endsWith('.xlsx')) {
            xlsx2json(filePath, 0).forEach(item => {
                const entry = trimObj(item)
                temp.push({
                    name: entry['姓名'],
                    salary: Number(entry['基本工资']),
                    month: month,
                })
            })
            xlsx2json(filePath, 1).forEach(item => {
                const entry = trimObj(item)
                temp.push({
                    name: entry['姓名'],
                    salary: Number(entry['基本工资']),
                    month: month,
                })
            })
        }
    }
    await saveJsonToDb(temp, index, type)
}
