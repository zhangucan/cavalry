import { assert } from 'chai'
import { AttendanceUtil } from '../src/compute/attendance'
import * as config from 'config'
import { setEsUrl } from '@uranplus/cavalry-utils'

var fp = require('lodash/fp')
describe('attendance detail', () => {
    before(async () => {
        this.attendance = new AttendanceUtil('2018-08-01')
        await this.attendance.init()
        const esUrl = config.get('es.url')
        await setEsUrl(esUrl)
    })
    it('getAttendanceByName', async () => {
        const data = await this.attendance.getAttendanceByName('陈安易')
        assert.equal(data.name, '陈安易')
    }).timeout(5000)
    it('getAttendanceByRange', async () => {
        //TODO use , [start,end), in getAttendanceByRange()
        const data = await this.attendance.getAttendanceByRange('徐芸', '2018-08-01', '2018-09-01')
        const data2 = await this.attendance.getAttendanceByRange('曹平1', '2018-08-01', '2018-09-01')
        assert.equal(data.should, 31)
        assert.equal(data.acture, 30.5)
        assert.equal(data2.should, 31)
        assert.equal(data2.acture, 31)
        assert.equal(data2.businessTripTimes, 0)
        assert.equal(data2.forgetPunchCardTimes, 2)
        assert.equal(data2.lateTimes, 0)
    }).timeout(5000)
    it('error getAttendanceByRange', async () => {
        const data = await this.attendance.getAttendanceByRange('用户名为空', '2018-08-01', '2018-08-31')
        assert.equal(data.should, 0)
        assert.equal(data.acture, 0)
    }).timeout(5000)
}).timeout(5000)
