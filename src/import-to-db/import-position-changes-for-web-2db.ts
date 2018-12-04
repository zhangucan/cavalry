import { setEsUrl, search, saveJsonToDb } from '@uranplus/cavalry-sdk'

// import * as path from 'path'
// import * as fs from 'fs'
// import { xlsx2json, trimObj, setEsUrl, saveJsonToDb, search, del } from '@uranplus/cavalry-utils'
// import * as moment from 'moment'
// import * as config from 'config'
// import * as _ from 'lodash'
// import * as fp from 'lodash/fp'
// import * as bodybuilder from 'bodybuilder'
// import axios from 'axios'
// import { Role, Fruit, JobStatus, DIC_CAT_MAPPING } from '@uranplus/cavalry-define'

// const maxSize = 10000
// const month = moment(config.get('cavalry.month')).format('YYYY-MM-DD')
// const defaultCustomer = [
//     '东亭物业',
//     '泰康',
//     '联通',
//     '东风安道拓金口',
//     '东风安道拓沌口',
//     '东风安通林',
//     '北辰物流',
//     '联想',
//     '天马',
//     '富士康',
//     '安波福',
//     '哈金森',
//     '捷众',
//     '安吉物流',
//     '安吉通汇',
//     '东原地产',
//     '住电',
//     '有家',
//     '华工正源',
//     '延锋汽车',
//     '敏实',
//     '恒通',
//     '武汉通汇',
//     '易点租',
//     '心怡金口',
//     '心怡蔡甸',
//     '联想客服备件',
//     '奇宏',
//     '东泰盛',
//     '马应龙',
//     '上海交运',
//     '远航物流',
//     'Today',
//     '天合汽车',
//     '朗迪',
//     '长联来福',
//     '古河',
//     '格力凌达',
//     '南车',
//     '美的',
//     '李尔汽车',
//     '中航上发',
//     '格力小时工',
//     '准时达',
//     '华星光电',
//     '长飞光纤',
//     '金亭',
//     '联明机械',
//     '东风本田',
//     '鸿图',
//     '佛吉亚',
//     '代招项目-陈学超',
//     '代招项目-王大超',
//     '代招项目-付俊杰',
//     '代招项目-费天富',
//     '代招项目-蒋坤佚',
//     '代招项目-张学文',
//     '代招项目-黄伟',
//     '代招项目-段曾丽',
//     '代招项目-李茂盛',
//     '代招项目-曾金',
//     '代招项目-李路',
//     '代招项目-杨金',
//     '代招项目-郑荆沙',
//     '代招项目-李文强',
//     '代招项目-李博',
//     '代招项目-齐松亚',
//     '通力',
//     '人福药业',
//     '中铁十一局',
//     '去哪儿网外包',
//     '小米有品外包',
//     '美团外包',
//     '美团外包',
//     '格力外包',
//     '邮政中心局',
//     '邮政发投局',
//     '邮政EMS',
//     '物流-顺丰',
//     '顺丰仓储',
//     '顺丰冷链',
//     '顺丰中转场',
//     '江夏-中百',
//     '东西湖-中百',
//     '沃尔玛',
//     '烟草外包',
//     '孝感分公司',
//     '黄石分公司',
//     '洪湖分公司',
//     '钟祥分公司',
//     '爱斯达克',
//     '中建钢构',
//     '全时',
//     '武汉客车',
//     '中粮集团',
//     '圣戈班',
//     '铁塔',
//     '绿枫叶',
//     '华新汽车',
//     '海外U',
//     '施耐德',
//     '友德',
//     '华网电力',
//     '李尔云鹤',
//     '东风河西',
//     '延锋安道拓',
//     '三新书业',
//     '法比特',
//     '耀皮',
//     '优尼科',
//     '华工高理',
//     '华工正源',
//     '圣辉',
//     '华楷',
//     '爱普科斯',
//     '孝感邮政',
//     '孝感顺丰',
//     '广发银行',
//     '日丰',
//     '鑫诠',
//     '西普电子',
//     '艾博',
//     '上达电子',
//     '威弘',
// ].map((item, index) => {
//     let temp = ''
//     let code = index + 1
//     if (`${code}`.length === 3) {
//         temp = `001005${code}`
//     } else if (`${code}`.length === 2) {
//         temp = `0010050${code}`
//     } else {
//         temp = `00100500${code}`
//     }
//     return {
//         name: item,
//         code: temp,
//         catCode: {
//             name: '入职单位',
//             code: '001005',
//         },
//     }
// })
// const defaultPositions = [
//     '总经理',
//     '顾问',
//     '总监',
//     '助理',
//     DIC_CAT_MAPPING.ZJ.JL.name,
//     '司机',
//     DIC_CAT_MAPPING.ZJ.YG.name,
//     DIC_CAT_MAPPING.ZJ.ZG.name,
//     '开票员',
//     '开发组专员',
//     '宣传专员',
//     '技术专员',
//     '行政文员',
//     '会务主管',
//     '会务专员',
//     '保洁员',
//     '餐管',
//     '电工',
//     '门岗',
//     '运营专员',
//     '客服专员',
//     '客服主管',
//     '项目经理',
//     '助理',
//     '项目总监',
//     '保安',
//     '招聘专员',
//     '招聘主管',
//     '驻厂专员',
//     '社保专员',
//     '社保主管',
//     '宿舍管理员',
//     '保洁员',
//     '施工员',
//     '物业管理员',
//     '水电工',
//     '销售主管',
//     '销售代表',
//     '简历文员',
//     '培训主管',
//     '培训专员',
//     '猎头顾问',
//     '经理',
//     '行政文员',
//     '会务主管',
//     '会务专员',
//     '餐管',
//     '电工',
//     '门岗',
//     '技术专员',
//     '开发组专员',
//     '主管',
//     '运营专员',
//     '宣传专员',
//     '客服专员',
//     '客服主管',
//     '会计',
//     '出纳',
//     '开票员',
//     '银行出纳',
//     '现金出纳',
//     '司机',
//     '员工',
// ].map((item, index) => {
//     let temp = ''
//     let code = index + 1
//     if (`${code}`.length === 3) {
//         temp = `001001${code}`
//     } else if (`${code}`.length === 2) {
//         temp = `0010010${code}`
//     } else {
//         temp = `00100100${code}`
//     }
//     return {
//         name: item,
//         code: temp,
//         catCode: {
//             name: '岗位',
//             code: '001001',
//         },
//     }
// })
// const defaultTitle = [
//     '高管',
//     '项目总监',
//     DIC_CAT_MAPPING.ZJ.YG.name,
//     DIC_CAT_MAPPING.ZJ.JL.name,
//     DIC_CAT_MAPPING.ZJ.ZG.name,
// ].map((item, index) => {
//     let temp = ''
//     let code = index + 1
//     if (`${code}`.length === 3) {
//         temp = `001002${code}`
//     } else if (`${code}`.length === 2) {
//         temp = `0010020${code}`
//     } else {
//         temp = `00100200${code}`
//     }
//     return {
//         name: item,
//         code: temp,
//         catCode: {
//             name: '职级',
//             code: '001002',
//         },
//     }
// })
// const defaultAchievement = ['绩效', '回款'].map((item, index) => {
//     let temp = ''
//     let code = index + 1
//     if (`${code}`.length === 3) {
//         temp = `001004${code}`
//     } else if (`${code}`.length === 2) {
//         temp = `0010040${code}`
//     } else {
//         temp = `00100400${code}`
//     }
//     return {
//         name: item,
//         code: temp,
//         catCode: {
//             name: '业绩类型',
//             code: '001004',
//         },
//     }
// })
// const defaultKPI = ['份额', '缺职率'].map((item, index) => {
//     let temp = ''
//     let code = index + 1
//     if (`${code}`.length === 3) {
//         temp = `001003${code}`
//     } else if (`${code}`.length === 2) {
//         temp = `0010030${code}`
//     } else {
//         temp = `00100300${code}`
//     }
//     return {
//         name: item,
//         code: temp,
//         catCode: {
//             name: '考核指标',
//             code: '001003',
//         },
//     }
// })
// async function saveDataCode() {
//     // await saveJsonToDb(
//     //     [
//     //         {
//     //             name: '根节点',
//     //             code: '001',
//     //         },
//     //     ],
//     //     'sys-data-code-cat',
//     //     'type'
//     // )
//     await saveJsonToDb(
//         defaultCustomer.map(item => {
//             return {
//                 name: item.name,
//             }
//         }),
//         'sys-in-unit',
//         'type'
//     )
//     // await saveJsonToDb(defaultTitle, 'sys-data-code', 'type')
//     // await saveJsonToDb(defaultPositions, 'sys-data-code', 'type')
//     // await saveJsonToDb(defaultKPI, 'sys-data-code', 'type')
//     // await saveJsonToDb(defaultAchievement, 'sys-data-code', 'type')
// }
// // export async function saveEmployee2db() {
// //     const folder = path.join(require('@uranplus/cavalry-raw-files'), '/employee/')
// //     for (let file of fs.readdirSync(folder)) {
// //         const filePath = path.join(folder, file)
// //         var stat = fs.statSync(filePath)
// //         if (stat.isFile() && filePath.endsWith('.xlsx')) {
// //             const data = xlsx2json(filePath, 2).map((item, line) => {
// //                 const entry = trimObj(item)
// //                 const employee = new Employee()
// //                 employee.name = entry['姓名']
// //                 employee.team = entry['组别']
// //                 employee.department = entry['部门']
// //                 employee.title = entry['职级']
// //                 employee.position = entry['岗位']
// //                 employee.leader = entry['直接领导']
// //                 employee.hireDate = entry['入职时间']
// //                 employee.lengthOfHiredate = entry['司龄']
// //                 employee.rangeOfHiredate = entry['司龄分段']
// //                 employee.month = moment(month).format('YYYY-MM-DD')
// //                 return employee
// //             })
// //         }
// //     }
// // }
// function returnObj(code, name, status, createDate) {
//     return {
//         code: code,
//         name: name,
//         status: 'on',
//         createDate: createDate,
//         modifiedDate: moment().format('YYYY-MM-DD'),
//         lastlabelResetDate: null,
//     }
// }
// enum status {
//     RESIGN = '离职',
//     LEAVE = '自离',
//     ENTRY = '入职',
//     FAKE_ENTRY = '虚拟入职',
//     TRANSFER = '异动',
//     UNKNOWN = '未知',
// }
// enum type {
//     ROOT = 'root',
//     CORPORATION = '公司',
//     DEPARTMENT = '部门',
//     ORGANIZATION = '机构',
//     PROJECT = '项目组',
//     TEAM = '小组',
// }
// function getPosition(entry) {
//     if (entry['职级'].indexOf('理') !== -1) {
//         return {
//             name: DIC_CAT_MAPPING.ZJ.JL.name,
//             code: '002003',
//         }
//     } else if (entry['职级'].indexOf('管') !== -1) {
//         return {
//             name: DIC_CAT_MAPPING.ZJ.ZG.name,
//             code: '002002',
//         }
//     } else {
//         return {
//             name: DIC_CAT_MAPPING.ZJ.YG.name,
//             code: '002001',
//         }
//     }
// }
// function getTitle(entry) {
//     if (entry['职级'].indexOf('理')) {
//         return {
//             name: DIC_CAT_MAPPING.ZJ.JL.name,
//             code: '001003',
//         }
//     } else if (entry['职级'].indexOf('管')) {
//         return {
//             name: DIC_CAT_MAPPING.ZJ.ZG.name,
//             code: '001002',
//         }
//     } else {
//         return {
//             name: DIC_CAT_MAPPING.ZJ.YG.name,
//             code: '001001',
//         }
//     }
// }
// function getFruitTitle(fruit: Fruit): Role {
//     if (fruit.staffPosition.groupLeader) {
//         if (fruit.staffPosition.groupLeader === fruit.staffPosition.name) {
//             return Role.GROPOUP_LEADER
//         } else {
//             return Role.STAFF
//         }
//     } else {
//         if (fruit.staffPosition.manager === fruit.staffPosition.name) {
//             return Role.MANAGER
//         } else {
//             return Role.STAFF
//         }
//     }
// }
// function getFruitLeader(fruit: Fruit): string {
//     if (fruit.staffPosition.groupLeader) {
//         if (fruit.staffPosition.groupLeader === fruit.staffPosition.name) {
//             return fruit.staffPosition.manager
//         } else {
//             return fruit.staffPosition.groupLeader
//         }
//     } else {
//         if (fruit.staffPosition.manager === fruit.staffPosition.name) {
//             return null
//         } else {
//             return fruit.staffPosition.manager
//         }
//     }
// }
// function fillTeamInfo2TeamTree(fruits: any[]) {
//     return fp.pipe(fruits => {
//         const departments = _.groupBy(fruits, (item: Fruit) => {
//             return item.staffPosition.department
//         })
//         const teams = _.groupBy(fruits, (item: Fruit) => {
//             return item.staffPosition.team
//         })
//         return Object.keys(departments).map((name, index) => {
//             return { title: name, key: name, children: departments[name] }
//         })
//     })(fruits)
// }
// function fillTeamFruits(fruits: any[]) {
//     return fp.pipe(
//         fruits =>
//             fruits.map((fruit: Fruit) => {
//                 fruit.staffPosition.title = getFruitTitle(fruit)
//                 fruit.staffPosition.leader = getFruitLeader(fruit)
//                 return fruit
//             }),
//         groups => {
//             return _.groupBy(groups, (item: Fruit) => {
//                 return item.staffPosition.title
//             })
//         },
//         groups => {
//             const managers = groups[Role.MANAGER]
//             const groupLeaders = groups[Role.GROPOUP_LEADER]
//             const staffs = groups[Role.STAFF]
//             // [...managers, ...groupLeaders, ...staffs]
//             return managers.map((a: Fruit) => {
//                 const staff4manager = [...(staffs ? staffs : [])]
//                     .filter((b: Fruit) => {
//                         return a.staffPosition.name === b.staffPosition.leader
//                     })
//                     .map((b: Fruit) => {
//                         return {
//                             name: b.staffPosition.name,
//                             title: getFruitTitle(b),
//                             project: b.staffPosition.team,
//                             team: b.staffPosition.department,
//                             leader: getFruitLeader(b),
//                         }
//                     })
//                 const groupLeader4manager = [...(groupLeaders ? groupLeaders : [])]
//                     .filter((groupFruit: Fruit) => {
//                         return (
//                             a.staffPosition.name === groupFruit.staffPosition.leader &&
//                             groupFruit.staffPosition.groupLeader
//                         )
//                     })
//                     .map((b: Fruit) => {
//                         return {
//                             name: b.staffPosition.name,
//                             title: getFruitTitle(b),
//                             project: b.staffPosition.team,
//                             team: b.staffPosition.department,
//                             leader: getFruitLeader(b),
//                             children: staffs
//                                 .filter((c: Fruit) => {
//                                     return (
//                                         c.staffPosition.manager === a.staffPosition.manager &&
//                                         c.staffPosition.groupLeader === b.staffPosition.groupLeader
//                                     )
//                                 })
//                                 .map((d: Fruit) => {
//                                     return {
//                                         key: d['id'],
//                                         range: `${b.start} ~ ${b.end}`,
//                                         name: d.staffPosition.name,
//                                         title: this.getTitle(d),
//                                         incoming: d.incoming,
//                                         cost: d.cost,
//                                         rangeSalary: d.salary,
//                                     }
//                                 }),
//                         }
//                     })
//                 return {
//                     key: a['id'],
//                     range: `${a.start} ~ ${a.end}`,
//                     name: a.staffPosition.name,
//                     title: Role.MANAGER,
//                     incoming: a.incoming,
//                     cost: a.cost,
//                     rangeSalary: a.salary,
//                     children: [...groupLeader4manager, ...staff4manager],
//                 }
//             })
//         }
//     )(fruits)
// }
// export async function transitionPosition2db() {
//     const fruits = await search(
//         'fruit_slices',
//         'fruit_slices',
//         bodybuilder()
//             .filter('term', 'month', month)
//             .size(10000)
//             .build()
//     )
//     const temp = await fillTeamFruits(fruits)
//     console.log(temp)
// }
// export async function saveCorporation2db() {
//     const folder = path.join(require('@uranplus/cavalry-raw-files'), '/employee/')
//     const root = []
//     let corp = []
//     let teams = []
//     let projects = []
//     let departments = []
//     let team = []
//     let temp = []
//     let tempEmployee = []
//     let employees = []
//     root.push(returnObj('001', '纳杰人才', '', moment().format('YYYY-MM-DD')))
//     for (let file of fs.readdirSync(folder)) {
//         const filePath = path.join(folder, file)
//         corp.push({
//             ...returnObj('001001', file.split('.')[0], '', new Date()),
//             parentOrg: {
//                 code: '001',
//                 name: '纳杰人才',
//             },
//         })
//         var stat = fs.statSync(filePath)
//         if (stat.isFile() && filePath.endsWith('.xlsx')) {
//             employees = xlsx2json(filePath, 0).map((item, line) => {
//                 const entry = trimObj(item)
//                 const employee = new Employee()
//                 employee.name = entry['姓名']
//                 employee.title = entry['职级']
//                 employee.position = entry['岗位']
//                 employee.leader = entry['直接领导']
//                 employee.team = entry['部门']
//                 employee.project = entry['组别']
//                 employee.hireDate = new Date(entry['入职时间'])
//                 employee.status = JobStatus.UNKNOWN
//                 return employee
//             })
//             teams = [...new Set(employees.map((item: Employee) => item.team))].map((item, index) => {
//                 let temp
//                 index = index + 1
//                 if (`${index}`.length === 3) {
//                     temp = `${index}`
//                 } else if (`${index}`.length === 2) {
//                     temp = `0${index}`
//                 } else {
//                     temp = `00${index}`
//                 }
//                 return {
//                     ...returnObj(`001001${temp}`, item, '', new Date()),
//                     parentOrg: {
//                         code: '001001',
//                         name: file.split('.')[0],
//                     },
//                 }
//             })
//             teams.map((team: any, index) => {
//                 const a = employees
//                     .filter(item => {
//                         return item.team === team.name
//                     })
//                     .map((item, index) => {
//                         let temp
//                         index = index + 1
//                         if (`${index}`.length === 3) {
//                             temp = `${index}`
//                         } else if (`${index}`.length === 2) {
//                             temp = `0${index}`
//                         } else {
//                             temp = `00${index}`
//                         }
//                         return {
//                             ...returnObj(`${team.code}${temp}`, item.project, '', new Date()),
//                             parentOrg: {
//                                 code: team.code,
//                                 name: team.name,
//                             },
//                         }
//                     })
//                 projects.push(...a)
//             })
//             //去重后的project
//             temp = [...new Set(projects.map(item => item.name))].map((item, index) => {
//                 let temp
//                 index = index + 1
//                 if (`${index}`.length === 3) {
//                     temp = `${index}`
//                 } else if (`${index}`.length === 2) {
//                     temp = `0${index}`
//                 } else {
//                     temp = `00${index}`
//                 }
//                 let parentCode = projects.find(m => m.name === item)
//                 return {
//                     ...returnObj(`${parentCode.parentOrg.code}${temp}`, item, '', new Date()),
//                     parentOrg: {
//                         code: parentCode.parentOrg.code,
//                         name: parentCode.parentOrg.name,
//                     },
//                 }
//             })
//             //employee
//             tempEmployee = employees.map((item: Employee) => {
//                 const org = root.concat(corp, teams, temp).find(a => {
//                     if (item.project) {
//                         return a.name === item.project
//                     } else {
//                         return a.name === item.team
//                     }
//                 })
//                 departments.map((department: any, index) => {
//                     const a = employees
//                         .filter(item => {
//                             return item.department === department.name
//                         })
//                         .map((item, index) => {
//                             let temp
//                             index = index + 1
//                             if (`${index}`.length === 3) {
//                                 temp = `${index}`
//                             } else if (`${index}`.length === 2) {
//                                 temp = `0${index}`
//                             } else {
//                                 temp = `00${index}`
//                             }
//                             return {
//                                 ...returnObj(
//                                     `${department.code}${temp}`,
//                                     item.project,
//                                     '',
//                                     moment().format('YYYY-MM-DD')
//                                 ),
//                                 parent: {
//                                     code: department.code,
//                                     name: department.name,
//                                 },
//                                 teamId: new Date().getTime(),
//                             }
//                         })
//                     projects.push(...a)
//                 })
//                 //去重后的project
//                 temp = [...new Set(projects.map(item => item.name))].map((item, index) => {
//                     let temp
//                     index = index + 1
//                     if (`${index}`.length === 3) {
//                         temp = `${index}`
//                     } else if (`${index}`.length === 2) {
//                         temp = `0${index}`
//                     } else {
//                         temp = `00${index}`
//                     }
//                     let parentCode = projects.find(m => m.name === item)
//                     return {
//                         ...returnObj(`${parentCode.parent.code}${temp}`, item, '', moment().format('YYYY-MM-DD')),
//                         parent: {
//                             code: parentCode.parent.code,
//                             name: parentCode.parent.name,
//                         },
//                         teamId: new Date().getTime(),
//                     }
//                 })
//                 //employee
//                 tempEmployee = employees
//                     .map((item: Employee) => {
//                         const org = root.concat(corp, departments, temp).find(a => {
//                             if (item.project) {
//                                 return a.name === item.project
//                             } else {
//                                 return a.name === item.team
//                             }
//                         })
//                         let tempOrg = {
//                             name: org.name,
//                             code: org.code,
//                         }
//                         let tempPosition = defaultPositions.find(position => {
//                             return position.name === item.position
//                         })
//                         let tempTitle = defaultTitle.find(title => {
//                             return title.name === item.title
//                         })
//                         if (!tempEmployee.find(n => n.name === item.name)) {
//                             return {
//                                 name: item.name,
//                                 org: tempOrg,
//                                 position: tempPosition,
//                                 title: tempTitle,
//                                 leader: {
//                                     name: item.leader ? item.leader : '空',
//                                     id: '',
//                                 },

//                                 hireDate: moment(item.hireDate).format('YYYY-MM-DD'),
//                                 createDate: new Date(),
//                             }
//                         }
//                     })
//                     .filter(item => item)
//                 // const gTempEmployee = `tempEmployee.map(item => {
//                 //     const employee = tempEmployee.find(q => q.name === item.leader.name)
//                 //     // item.leader.id = employee._id
//                 //     console.log(employee)
//                 //     return item
//                 // })

//                 //'高管', '项目总监', '员工'
//                 const staff = tempEmployee.filter(leader => {
//                     if (leader && leader.title) {
//                         return leader.title.name === '员工'
//                     }
//                 })
//                 // 主管
//                 const groupLeader = _.groupBy(staff, (item: any) => {
//                     return item.leader.name
//                 })
//                 team = Object.keys(groupLeader)
//                     .map((group, index) => {
//                         // 主管信息
//                         const temp = tempEmployee
//                             .filter((item: any) => item.title && item.title.name === '主管')
//                             .find(item => item.name === group)
//                         // console.log(temp)
//                         if (temp) {
//                             let code
//                             code = index + 1
//                             if (`${index}`.length === 3) {
//                                 code = `${index}`
//                             } else if (`${index}`.length === 2) {
//                                 code = `0${index}`
//                             } else {
//                                 code = `00${index}`
//                             }
//                             tempEmployee
//                                 .filter(item => item.leader.name === group)
//                                 .forEach(item => {
//                                     item.org.name = `${group}小组`
//                                     item.org.code = `${temp.org.code}${code}`
//                                 })
//                             if (!team.find(n => n.name === `${group}小组`)) {
//                                 return {
//                                     ...returnObj(
//                                         `${temp.org.code}${code}`,
//                                         `${group}小组`,
//                                         '',
//                                         moment().format('YYYY-MM-DD')
//                                     ),
//                                     parent: {
//                                         code: temp.org.code,
//                                         name: temp.org.name,
//                                     },
//                                     groupId: moment().format('YYYY-MM-DD'),
//                                 }
//                             }
//                         }
//                     })
//                     .filter(item => item)
//             }
//         }
//     }

//     console.log(root.length)
//     console.log(corp.length)
//     console.log(teams.length)
//     console.log(temp.length)
//     console.log(team.length)
//     console.log(tempEmployee.length)
//     // await updateLeader(tempEmployee)
//     await saveJsonToDb(root.filter(item => item.name !== '' && item.name), 'org_root', 'org')
//     await saveJsonToDb(corp.filter(item => item.name !== '' && item.name), 'org_corp', 'org')
//     await saveJsonToDb(teams.filter(item => item.name !== '' && item.name), 'org_team', 'org')
//     await saveJsonToDb(temp.filter(item => item.name !== '' && item.name), 'org_project', 'org')
//     await saveJsonToDb(team.filter(item => item.name !== '' && item.name), 'org_team', 'org')
//     await saveJsonToDb(tempEmployee.filter(item => item.name !== '' && item.name), 'employee_sys', 'employee')
// }

// export async function savePositionChange() {
//     const orgs = await search(
//         'org_*',
//         'org',
//         bodybuilder()
//             .size(10000)
//             .build()
//     )
//     const position_changes = await search(
//         'position_change',
//         'position_change',
//         bodybuilder()
//             .size(10000)
//             .build()
//     )
//     const staff_position = await search(
//         'staff_position',
//         'staff_position',
//         bodybuilder()
//             .size(10000)
//             .build()
//     )
//     const employees = await search(
//         'employee_sys',
//         'employee',
//         bodybuilder()
//             .size(10000)
//             .build()
//     )
//     const employeeMap = new Map()
//     await employees.forEach(employee => {
//         employeeMap.set(employee.name, employee)
//     })
//     const orgsMap = new Map()
//     await orgs.forEach(org => {
//         if (org.code) {
//             orgsMap.set(org.name, org)
//         }
//     })

//     console.log('position_changes.length =', position_changes.length)
//     const positionChangesForWeb = position_changes
//         .map(change => {
//             const previous = change.previous
//             const current = change.current
//             const employee = employeeMap.get(change.name)
//             return {
//                 employee: {
//                     name: change.name,
//                     id: employee ? employee._id : null,
//                 },
//                 previous: previous
//                     ? {
//                           position: defaultPositions.find(position => {
//                               return position.name === previous.position
//                           }),
//                           title: defaultTitle.find(title => {
//                               return title.name === previous.title
//                           }),
//                           org: {
//                               name: previous.team ? previous.team : previous.department,
//                               code: orgsMap.get(previous.team ? previous.team : previous.department)
//                                   ? orgsMap.get(previous.team ? previous.team : previous.department).code
//                                   : null,
//                               entryDate: staff_position.find(
//                                   item =>
//                                       item.name === change.name &&
//                                       item.team === previous.team &&
//                                       item.department === previous.department
//                               )
//                                   ? staff_position.find(
//                                         item =>
//                                             item.name === change.name &&
//                                             item.team === previous.team &&
//                                             item.department === previous.department
//                                     ).start
//                                   : null,
//                           },
//                           leader: {
//                               name: previous.leader,
//                               id: employeeMap.get(previous.leader) ? employeeMap.get(previous.leader)._id : null,
//                           },
//                       }
//                     : null,
//                 current: current
//                     ? {
//                           position: defaultPositions.find(position => {
//                               return position.name === current.position
//                           }),
//                           title: defaultTitle.find(title => {
//                               return title.name === current.title
//                           }),
//                           org: {
//                               name: current.team ? current.team : current.department,
//                               code: orgsMap.get(current.team ? current.team : current.department)
//                                   ? orgsMap.get(current.team ? current.team : current.department).code
//                                   : null,
//                               entryDate: staff_position.find(
//                                   item =>
//                                       item.name === change.name &&
//                                       item.team === current.team &&
//                                       item.department === current.department
//                               )
//                                   ? staff_position.find(
//                                         item =>
//                                             item.name === change.name &&
//                                             item.team === current.team &&
//                                             item.department === current.department
//                                     ).start
//                                   : null,
//                           },
//                           leader: {
//                               name: current.leader,
//                               id: employeeMap.get(current.leader) ? employeeMap.get(current.leader)._id : null,
//                           },
//                       }
//                     : null,
//                 date: change.date,
//                 source: 'import',
//             }
//         })
//         .filter(change => change && change.employee)
//     console.log(positionChangesForWeb.length)
//     await saveJsonToDb(positionChangesForWeb, 'position_change_sys', 'position_change')
// }
// export async function deleteImportedDataInEs(index: string, esUrl: string) {
//     let query = bodybuilder()
//         .filter('term', 'source', 'import')
//         .build()
//     await axios({
//         method: 'POST',
//         url: esUrl + '/' + index + '/_delete_by_query',
//         headers: { 'content-type': 'application/json' },
//         data: query,
//     }).catch(err => {
//         console.error('deleteDataInEs() err=', err)
//     })
// }
import * as esb from 'elastic-builder'
async function tranfer() {
    await setEsUrl('http://es.nj.jsdebug.org')
    const salary = await search(
        'fruit_slices',
        'fruit_slices',
        esb
            .requestBodySearch()
            .query(esb.termQuery('month', '2018-09-01'))
            .size(100000)
    )
    await setEsUrl('http://es.kpi.jsdebug.org/')
    console.log(
        salary.map(entry => {
            delete entry['_index']
            delete entry['_type']
            delete entry['_id']
            return entry
        })
    )
    await saveJsonToDb(
        salary.map(entry => {
            delete entry['_index']
            delete entry['_type']
            delete entry['_id']
            return entry
        }),
        'salary-fruit',
        'type'
    )
}
function saveFruit() {}
if (require.main === module) {
    ;(async function() {
        await tranfer()
    })()
}
// if (require.main === module) {
//     ;(async function() {
//         const esUrl = config.get('es.url')
//         setEsUrl('http://es.nj.jsdebug.org')
// await deleteImportedDataInEs('position_change_sys', esUrl)
// await savePositionChange()
// await saveCorporation2db()
// await saveDataCode()
// await del(
//     'sys-data-code',
//     'type',
//     bodybuilder()
//         .filter('term', '_type', 'type')
//         .build()
// )
// await del(
//     'sys-org*',
//     'type',
//     bodybuilder()
//         .filter('term', '_type', 'type')
//         .build()
// )
// await del(
//     'sys-employee',
//     'sys-employee',
//     bodybuilder()
//         .filter('term', '_type', 'sys-employee')
//         .build()
// )
//     })()
// }
// export class Employee {
//     name: string // 员工姓名
//     leader: string // 直接上级
//     team: string // 部门
//     company: string // 公司
//     project: string // 组别
//     position: string // 岗位
//     title: Role // 职级
//     hireDate: Date // 入职日期
//     lengthOfHiredate: number // 入职时长
//     leaveDate: string = null // 工资截止日期
//     status: JobStatus = JobStatus.UNKNOWN // 员工状态
//     rangeOfHiredate: string // 司龄分段
//     type: string = '在职表'
//     month: string
// }
