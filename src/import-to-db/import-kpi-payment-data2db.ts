import * as path from 'path'
import * as fs from 'fs'
import { xlsx2json, strMapToObj, trimObj, saveJsonToDb, search } from '@uranplus/cavalry-utils'
import { KpiPayment, KpiType } from '@uranplus/cavalry-define'
import * as moment from 'moment'
import * as config from 'config'
const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')

function getKpiType(entry) {
    let temp = KpiType.OTHER
    switch (entry['指标名称']) {
        // 人才
        case '缺职率':
            temp = KpiType.LAPSE_RATE
            break
        case '贡献率':
            temp = KpiType.CONTRIBUTION_RATE
            break
        case '离职率':
            temp = KpiType.SEPARATION_RATE
            break
        case '忠诚度':
            temp = KpiType.LOYALTY_RATE
            break
        // 监察
        case '客户敬重':
            temp = KpiType.CUSTOMER_RESPECT
            break
        case '员工满意':
            temp = KpiType.EMPLOYEE_SATISFACTION
            break
        case '同行敬畏':
            temp = KpiType.OPPONENT_RESPECT
            break
        case '政府认可':
            temp = KpiType.GOVERNMENT_ENDORSEMENT
            break
        // 份额
        case '同行人数':
            temp = KpiType.OPPONENT_PEOPLE_NUMBER
            break
        case '我方人数':
            temp = KpiType.OURPEOPLE_NUMBER
            break
        case '我方增长':
            temp = KpiType.OUR_GROWTH
            break
        case '市场份额':
            temp = KpiType.MARKET_SHARE
            break
        case '失责罚款':
            temp = KpiType.DEFAULT_FINE
            break
        // 风险
        case '市场份额':
            temp = KpiType.RISK
            break
        // 其它
        default:
            temp = KpiType.OTHER
            break
    }
    return temp
}
export async function ormKpiPaymentFormXlsx(index, type) {
    const temp = path.join(require('@uranplus/cavalry-raw-files'), `/nj-data/${month}/kpi/17项指标考核.xlsx`)
    const data = xlsx2json(temp, 0).map((item, line) => {
        const entry = trimObj(item)
        const kpiPayment = new KpiPayment()
        kpiPayment.date = entry['日期']
        kpiPayment.describe = entry['指标详细']
        kpiPayment.employee = entry['姓名']
        kpiPayment.isInCash = entry['是否已缴'] === '是' ? true : false
        kpiPayment.name = entry['指标名称']
        kpiPayment.value = Number(entry['指标扣款'])
        kpiPayment.type = getKpiType(entry)
        kpiPayment.month = month
        return kpiPayment
    })
    await saveJsonToDb(data, index, type)
}
