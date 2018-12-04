import { timeout } from 'mocha-typescript'
import * as config from 'config'
import { del, setEsUrl } from '@uranplus/cavalry-utils'
import { saveEmployee2db } from '../../src/import-to-db/import-employee-data2db'
import * as moment from 'moment'
const bodybuilder = require('bodybuilder')
const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')
describe('save employee', () => {
    before(async () => {
        const esUrl = config.get('es.url')
        await setEsUrl(esUrl)
    })
    it('saveEmployee2db() should work', async () => {
        if (config.get('cavalry.es.employee.reimport_records')) {
            await del(
                config.get('cavalry.es.employee.index'),
                config.get('cavalry.es.employee.type'),
                bodybuilder()
                    // .filter('term', '_type', config.get('cavalry.es.employee.type'))
                    .filter('term', 'month', month)
                    .build()
            ).catch(err => {
                if (err.response.status !== 404 && err.response.status !== 400) {
                    console.log('deleteOneMonthDataInEs() err=', err)
                    throw err
                }
            })
            await saveEmployee2db(config.get('cavalry.es.employee.index'), config.get('cavalry.es.employee.type'))
        } else {
            console.log('config `cavalry.es.employee.reimport_records` is false, skip')
        }
    }).timeout(10000)
})
