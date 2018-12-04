export const DIC_CAT_MAPPING = {
    GW: {
        code: '001001',
        name: '岗位',
    },
    ZJ: {
        code: '001002',
        name: '职级',
        YG: {
            code: '001002003',
            name: '员工',
        },
        ZG: {
            code: '001002004',
            name: '主管',
        },
        JL: {
            code: '001002005',
            name: '经理',
        },
    },
    KPI: {
        code: '001003',
        name: '考核指标',
    },
    YJ: {
        code: '001004',
        name: '业绩类型',
    },
    RZ: {
        code: '001005',
        name: '入职单位',
    },
    STATE: {
        code: '001006',
        name: '使用状态',
    },
    STATUS: {
        code: '001007',
        name: '状态',
    },
    EMP_STATUS: {
        code: '001008',
        name: '员工异动状态',
        children: {
            RZ: {
                code: '001008001',
                name: '入职',
            },
            ZZ: {
                code: '001008002',
                name: '在职',
            },
            YD: {
                code: '001008003',
                name: '异动',
            },
            LZ: {
                code: '001008004',
                name: '离职',
            },
            ZL: {
                code: '001008005',
                name: '自离',
            },
        },
    },
    ORG_STATUS: {
        code: '001009',
        name: '机构异动状态',
        children: {
            CL: {
                code: '001009001',
                name: '成立',
            },
            GM: {
                code: '001009002',
                name: '改名',
            },
            JS: {
                code: '001009003',
                name: '解散',
            },
        },
    },
    SALARY_STATUS: {
        code: '001010',
        name: '业绩审核状态',
        children: {
            TG: {
                code: '001010001',
                name: '通过',
            },
            BH: {
                code: '001010002',
                name: '驳回',
            },
            HH: {
                code: '001010003',
                name: '划回',
            },
            DSH: {
                code: '001010004',
                name: '待审核',
            },
        },
    },
}
export const SYS_MAPPING = {
    ROOT: {
        code: '001',
        name: '纳杰人才',
    },
}

export const COMMONS_MAPPING = {
    ES_TYPE: 'type',
}

export const SALARY_MAPPING = {
    RECRUIT: {
        STATUS: {
            PENDING: {
                code: 'pending',
                name: '待审核',
            },
            PASS: {
                code: 'pass',
                name: '审核通过',
            },
            RECALL: {
                code: 'recall',
                name: '划回',
            },
            UNKNOWN: {
                code: 'unknown',
                name: '未知',
            },
        },
    },
}
