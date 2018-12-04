import { timeout } from 'mocha-typescript'
import * as config from 'config'
import { del, setEsUrl } from '@uranplus/cavalry-utils'
import { saveBaseSalary2db } from '../../src/import-to-db/import-base-salary2db'
const bodybuilder = require('bodybuilder')
import * as moment from 'moment'
const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')
describe('save saveBaseSalary2db', () => {
    before(async () => {
        const esUrl = config.get('es.url')
        await setEsUrl(esUrl)
    })
    it('saveBaseSalary2db() should work', async () => {
        if (config.get('cavalry.es.base_salary.reimport_records')) {
            await del(
                config.get('cavalry.es.base_salary.index'),
                config.get('cavalry.es.base_salary.type'),
                bodybuilder()
                    // .filter('term', '_type', config.get('cavalry.es.base_salary.type'))
                    .filter('term', 'month', month)
                    .build()
            ).catch(err => {
                if (err.response.status !== 404 && err.response.status !== 400) {
                    console.log('deleteOneMonthDataInEs() err=', err)
                    throw err
                }
            })
            await saveBaseSalary2db(
                config.get('cavalry.es.base_salary.index'),
                config.get('cavalry.es.base_salary.type')
            )
        } else {
            console.log('config `cavalry.es.base_salary.reimport_records` is false, skip')
        }
    }).timeout(10000)
})
