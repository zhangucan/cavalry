import { timeout } from 'mocha-typescript'
import * as config from 'config'
import { del, setEsUrl } from '@uranplus/cavalry-utils'
import { saveAsk4leave2db, saveAttendance2db, saveBusinessTrip2db } from '../../src/import-to-db/import-attendance2db'
const bodybuilder = require('bodybuilder')
import * as moment from 'moment'
const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')
describe('save attendacnce data', () => {
    before(async () => {
        const esUrl = config.get('es.url')
        await setEsUrl(esUrl)
    })
    it('saveAsk4leave2db() should work', async () => {
        if (config.get('cavalry.es.ask4leave.reimport_records')) {
            await del(
                config.get('cavalry.es.ask4leave.index'),
                config.get('cavalry.es.ask4leave.type'),
                bodybuilder()
                    // .filter('term', '_type', config.get('cavalry.es.ask4leave.type'))
                    .filter('term', 'month', month)
                    .build()
            ).catch(err => {
                if (err.response.status !== 404 && err.response.status !== 400) {
                    console.log('deleteOneMonthDataInEs() err=', err)
                    throw err
                }
            })
            await saveAsk4leave2db(config.get('cavalry.es.ask4leave.index'), config.get('cavalry.es.ask4leave.type'))
        } else {
            console.log('config `cavalry.es.ask4leave.reimport_records` is false, skip')
        }
    }).timeout(10000)

    it('saveAttendance2db() should work', async () => {
        if (config.get('cavalry.es.attendance.reimport_records')) {
            await del(
                config.get('cavalry.es.attendance.index'),
                config.get('cavalry.es.attendance.type'),
                bodybuilder()
                    // .filter('term', '_type', config.get('cavalry.es.attendance.type'))
                    .filter('term', 'month', month)
                    .build()
            ).catch(err => {
                if (err.response.status !== 404 && err.response.status !== 400) {
                    console.log('deleteOneMonthDataInEs() err=', err)
                    throw err
                }
            })
            await saveAttendance2db(config.get('cavalry.es.attendance.index'), config.get('cavalry.es.attendance.type'))
        } else {
            console.log('config `cavalry.es.attendance.reimport_records` is false, skip')
        }
    }).timeout(10000)
    it('saveBusinessTrip2db() should work', async () => {
        if (config.get('cavalry.es.business_trip.reimport_records')) {
            await del(
                config.get('cavalry.es.business_trip.index'),
                config.get('cavalry.es.business_trip.type'),
                bodybuilder()
                    // .filter('term', '_type', config.get('cavalry.es.business_trip.type'))
                    .filter('term', 'month', month)
                    .build()
            ).catch(err => {
                if (err.response.status !== 404 && err.response.status !== 400) {
                    console.log('deleteOneMonthDataInEs() err=', err)
                    throw err
                }
            })
            await saveBusinessTrip2db(
                config.get('cavalry.es.business_trip.index'),
                config.get('cavalry.es.business_trip.type')
            )
        } else {
            console.log('config `cavalry.es.business_trip.reimport_records` is false, skip')
        }
    }).timeout(10000)
})
