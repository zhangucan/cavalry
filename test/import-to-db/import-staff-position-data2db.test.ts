import { del, setEsUrl } from '@uranplus/cavalry-utils'
import * as config from 'config'
import { saveStaffPosition2db } from '../../src/import-to-db/import-staff-position-data2db'
const bodybuilder = require('bodybuilder')

describe('save date', () => {
    before(async () => {
        const esUrl = config.get('es.url')
        await setEsUrl(esUrl)
    })
    it('savePositionChange() should work', async () => {
        if (config.get('cavalry.es.staff_position.reimport_records')) {
            await del(
                config.get('cavalry.es.staff_position.index'),
                config.get('cavalry.es.staff_position.type'),
                bodybuilder()
                    .query('term', '_type', config.get('cavalry.es.staff_position.type'))
                    .build()
            ).catch(err => {
                if (err.response.status !== 404 && err.response.status !== 400) {
                    console.log('deleteOneMonthDataInEs() err=', err)
                    throw err
                }
            })
            await saveStaffPosition2db(
                config.get('cavalry.es.staff_position.index'),
                config.get('cavalry.es.staff_position.type')
            )
        } else {
            console.log('config `cavalry.es.staff_position.reimport_records` is false, skip')
        }
    }).timeout(100000)
})
