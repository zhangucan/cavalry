import * as path from 'path'
import * as fs from 'fs'
import { xlsx2json, strMapToObj, trimObj, saveJsonToDb, search } from '@uranplus/cavalry-utils'
import * as moment from 'moment'
import * as config from 'config'
import { Employee, Company, Role } from '@uranplus/cavalry-define'

const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')
export async function saveEmployee2db(index, type) {
    const folder = path.join(require('@uranplus/cavalry-raw-files'), '/employee/')
    for (let file of fs.readdirSync(folder)) {
        const filePath = path.join(folder, file)
        var stat = fs.statSync(filePath)
        if (stat.isFile() && filePath.endsWith('.xlsx')) {
            const data = xlsx2json(filePath, 0).map((item, line) => {
                const entry = trimObj(item)
                const employee = new Employee()
                employee.name = entry['姓名']
                employee.team = entry['组别']
                employee.department = entry['部门']
                employee.title = entry['职级']
                employee.position = entry['岗位']
                employee.leader = entry['直接领导']
                employee.hireDate = entry['入职时间']
                employee.lengthOfHiredate = entry['司龄']
                employee.rangeOfHiredate = entry['司龄分段']
                employee.month = moment(month).format('YYYY-MM-DD')
                return employee
            })
            await saveJsonToDb(data, index, type)
        }
    }
}
