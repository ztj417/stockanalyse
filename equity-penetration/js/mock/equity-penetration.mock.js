/* ============================================================
 * Mock 数据文件 equity-penetration.mock.js
 * 作用范围：仅在开发联调阶段提供假数据，不承载页面主逻辑
 * 使用约束：
 *   1. 必须通过 window.pageConfig.useMock 开关控制是否启用
 *   2. Mock 字段结构必须贴近正式接口结构，便于后续联调替换
 *   3. 文件中只放假数据和少量读取方法
 * ============================================================ */
'use strict';

(function (win) {
    //云南建投四建示例数据：覆盖多层级股东与对外投资结构
    var yntdEnterpriseData = {
        root: {
            id: 'root-yntd',
            name: '云南建投第四建设有限公司',
            shortName: '云南建投四建',
            level: 0,
            type: 'root',
            legalPerson: '李建波',
            registeredCapital: '100000.00万人民币',
            creditCode: '91530000216524184W',
            status: '存续',
            establishDate: '1990-03-24',
            province: '云南省昆明市'
        },
        upward: [
            {
                id: 'sh-1',
                name: '云南建投第一水利水电建设有限公司',
                shortName: '云南建投一水',
                ratio: '1.77%',
                amount: '1770.00万元',
                level: -1,
                type: 'shareholder',
                legalPerson: '赵云松',
                registeredCapital: '120000.00万人民币',
                creditCode: '91530000216518392M',
                status: '存续',
                establishDate: '1992-06-18',
                province: '云南省昆明市',
                parents: [
                    {
                        id: 'sh-1-1',
                        name: '云南省建设投资控股集团有限公司',
                        shortName: '云南建投集团',
                        ratio: '100%',
                        amount: '120000.00万元',
                        level: -2,
                        type: 'shareholder',
                        legalPerson: '陈祖军',
                        registeredCapital: '3049581.00万人民币',
                        creditCode: '91530000795276531Q',
                        status: '存续',
                        establishDate: '2006-11-20',
                        province: '云南省昆明市',
                        parents: [
                            {
                                id: 'sh-1-1-1',
                                name: '云南省人民政府国有资产监督管理委员会',
                                shortName: '云南省国资委',
                                ratio: '90%',
                                level: -3,
                                type: 'shareholder',
                                legalPerson: '机关法人',
                                registeredCapital: '-',
                                status: '正常',
                                province: '云南省昆明市'
                            },
                            {
                                id: 'sh-1-1-2',
                                name: '云南省财政厅',
                                shortName: '云南省财政厅',
                                ratio: '10%',
                                level: -3,
                                type: 'shareholder',
                                legalPerson: '机关法人',
                                registeredCapital: '-',
                                status: '正常',
                                province: '云南省昆明市'
                            }
                        ]
                    }
                ]
            },
            {
                id: 'sh-2',
                name: '云南省建设投资控股集团有限公司',
                shortName: '云南建投集团',
                ratio: '98.23%',
                amount: '98230.00万元',
                level: -1,
                type: 'shareholder',
                legalPerson: '陈祖军',
                registeredCapital: '3049581.00万人民币',
                creditCode: '91530000795276531Q',
                status: '存续',
                establishDate: '2006-11-20',
                province: '云南省昆明市',
                parents: [
                    {
                        id: 'sh-2-1',
                        name: '云南省人民政府国有资产监督管理委员会',
                        shortName: '云南省国资委',
                        ratio: '90%',
                        amount: '2744622.90万元',
                        level: -2,
                        type: 'shareholder',
                        legalPerson: '机关法人',
                        registeredCapital: '-',
                        status: '正常',
                        province: '云南省昆明市'
                    },
                    {
                        id: 'sh-2-2',
                        name: '云南省财政厅',
                        shortName: '云南省财政厅',
                        ratio: '10%',
                        amount: '304958.10万元',
                        level: -2,
                        type: 'shareholder',
                        legalPerson: '机关法人',
                        registeredCapital: '-',
                        status: '正常',
                        province: '云南省昆明市'
                    }
                ]
            }
        ],
        downward: [
            {
                id: 'sub-1',
                name: '会泽县承泽基础设施投资建设有限公司',
                shortName: '会泽承泽基投',
                ratio: '1%',
                amount: '100.00万元',
                level: 1,
                type: 'subsidiary',
                legalPerson: '唐晓明',
                registeredCapital: '10000.00万人民币',
                creditCode: '91530326MA6K3M5D77',
                status: '存续',
                establishDate: '2016-08-25',
                province: '云南省曲靖市',
                children: [
                    {
                        id: 'sub-1-1',
                        name: '会泽承泽市政公用工程有限公司',
                        shortName: '承泽市政工程',
                        ratio: '70%',
                        amount: '350.00万元',
                        level: 2,
                        type: 'subsidiary',
                        legalPerson: '张鹏',
                        registeredCapital: '500.00万人民币',
                        status: '存续',
                        establishDate: '2018-04-12',
                        province: '云南省曲靖市'
                    },
                    {
                        id: 'sub-1-2',
                        name: '会泽县城乡水务投资开发有限责任公司',
                        shortName: '会泽水务开发',
                        ratio: '30%',
                        amount: '1500.00万元',
                        level: 2,
                        type: 'subsidiary',
                        legalPerson: '刘志刚',
                        registeredCapital: '5000.00万人民币',
                        status: '存续',
                        establishDate: '2019-03-20',
                        province: '云南省曲靖市'
                    }
                ]
            },
            {
                id: 'sub-2',
                name: '巧家县欣盛建设管理有限公司',
                shortName: '巧家欣盛建管',
                ratio: '1%',
                amount: '20.00万元',
                level: 1,
                type: 'subsidiary',
                legalPerson: '王洪林',
                registeredCapital: '2000.00万人民币',
                creditCode: '91530622MA6N10243C',
                status: '存续',
                establishDate: '2018-11-09',
                province: '云南省昭通市',
                children: [
                    {
                        id: 'sub-2-1',
                        name: '巧家县欣盛安置区建设开发有限公司',
                        shortName: '巧家安置区建设',
                        ratio: '100%',
                        amount: '1000.00万元',
                        level: 2,
                        type: 'subsidiary',
                        legalPerson: '李勇',
                        registeredCapital: '1000.00万人民币',
                        status: '存续',
                        establishDate: '2020-01-15',
                        province: '云南省昭通市'
                    }
                ]
            },
            {
                id: 'sub-3',
                name: '师宗开源工业投资有限责任公司',
                shortName: '师宗开源工投',
                ratio: '1%',
                amount: '50.00万元',
                level: 1,
                type: 'subsidiary',
                legalPerson: '郭海峰',
                registeredCapital: '5000.00万人民币',
                creditCode: '91530323MA6KDYF344',
                status: '存续',
                establishDate: '2017-06-22',
                province: '云南省曲靖市',
                children: [
                    {
                        id: 'sub-3-1',
                        name: '师宗县工业园区开发投资有限公司',
                        shortName: '师宗园区开发',
                        ratio: '65%',
                        amount: '1300.00万元',
                        level: 2,
                        type: 'subsidiary',
                        legalPerson: '陈伟',
                        registeredCapital: '2000.00万人民币',
                        status: '存续',
                        establishDate: '2018-09-10',
                        province: '云南省曲靖市'
                    },
                    {
                        id: 'sub-3-2',
                        name: '师宗县开源煤炭物流储备中心有限公司',
                        shortName: '师宗煤炭物流',
                        ratio: '35%',
                        amount: '700.00万元',
                        level: 2,
                        type: 'subsidiary',
                        legalPerson: '杨建林',
                        registeredCapital: '2000.00万人民币',
                        status: '存续',
                        establishDate: '2019-11-28',
                        province: '云南省曲靖市'
                    }
                ]
            },
            {
                id: 'sub-4',
                name: '弥渡县弥川供排水一体化有限公司',
                shortName: '弥渡弥川供排水',
                ratio: '1%',
                amount: '80.00万元',
                level: 1,
                type: 'subsidiary',
                legalPerson: '杨永红',
                registeredCapital: '8000.00万人民币',
                creditCode: '91532925MA6P3U5948',
                status: '存续',
                establishDate: '2019-07-31',
                province: '云南省大理白族自治州',
                children: [
                    {
                        id: 'sub-4-1',
                        name: '弥渡弥川供水服务有限责任公司',
                        shortName: '弥渡供水服务',
                        ratio: '100%',
                        amount: '500.00万元',
                        level: 2,
                        type: 'subsidiary',
                        legalPerson: '周华',
                        registeredCapital: '500.00万人民币',
                        status: '存续',
                        establishDate: '2021-03-05',
                        province: '云南省大理州'
                    }
                ]
            },
            {
                id: 'sub-5',
                name: '曲靖市富罗高速公路投资建设开发有限公司',
                shortName: '曲靖富罗高速',
                ratio: '0.1%',
                amount: '50.00万元',
                level: 1,
                type: 'subsidiary',
                legalPerson: '孙学光',
                registeredCapital: '50000.00万人民币',
                creditCode: '91530300MA6MYU6521',
                status: '存续',
                establishDate: '2018-05-18',
                province: '云南省曲靖市',
                children: [
                    {
                        id: 'sub-5-1',
                        name: '曲靖罗平富乐高速服务区经营开发有限公司',
                        shortName: '富乐服务区开发',
                        ratio: '80%',
                        amount: '800.00万元',
                        level: 2,
                        type: 'subsidiary',
                        legalPerson: '孙学光',
                        registeredCapital: '1000.00万人民币',
                        status: '存续',
                        establishDate: '2020-09-18',
                        province: '云南省曲靖市'
                    }
                ]
            }
        ]
    };

    //腾讯科技示例数据：覆盖国际化股东和子公司结构
    var tencentEnterpriseData = {
        root: {
            id: 'root-tencent',
            name: '腾讯科技（深圳）有限公司',
            shortName: '腾讯科技',
            level: 0,
            type: 'root',
            legalPerson: '马化腾',
            registeredCapital: '200万美元',
            creditCode: '9144030071526726XG',
            status: '存续',
            establishDate: '2000-02-24',
            province: '广东省深圳市'
        },
        upward: [
            {
                id: 'tc-sh-1',
                name: '中策控股有限公司（中策控股）',
                shortName: '中策控股',
                ratio: '100%',
                level: -1,
                type: 'shareholder',
                legalPerson: '企业法人',
                registeredCapital: '外资控股',
                status: '存续',
                establishDate: '1999-11-12',
                parents: [
                    {
                        id: 'tc-sh-1-1',
                        name: '腾讯控股有限公司 (Tencent Holdings Ltd.)',
                        shortName: '腾讯控股',
                        ratio: '100%',
                        level: -2,
                        type: 'shareholder',
                        legalPerson: '马化腾 (董事会主席)',
                        registeredCapital: '开曼群岛注册',
                        status: '上市公司 (00700.HK)',
                        parents: [
                            {
                                id: 'tc-sh-1-1-1',
                                name: 'Naspers Limited (南非报业/Prosus)',
                                shortName: 'Prosus / Naspers',
                                ratio: '25.8%',
                                level: -3,
                                type: 'shareholder',
                                status: '主要股东'
                            },
                            {
                                id: 'tc-sh-1-1-2',
                                name: '马化腾 (Advance Data Services Limited)',
                                shortName: '马化腾',
                                ratio: '8.4%',
                                level: -3,
                                type: 'shareholder',
                                status: '核心创始人'
                            },
                            {
                                id: 'tc-sh-1-1-3',
                                name: 'The Vanguard Group, Inc. (先锋领航)',
                                shortName: '先锋领航',
                                ratio: '2.5%',
                                level: -3,
                                type: 'shareholder',
                                status: '机构股东'
                            }
                        ]
                    }
                ]
            }
        ],
        downward: [
            {
                id: 'tc-sub-1',
                name: '深圳市腾讯计算机系统有限公司',
                shortName: '腾讯计算机',
                ratio: '100%',
                level: 1,
                type: 'subsidiary',
                legalPerson: '马化腾',
                registeredCapital: '6500.00万人民币',
                children: [
                    {
                        id: 'tc-sub-1-1',
                        name: '北京微梦创科网络技术有限公司 (微博投资)',
                        shortName: '微梦创科',
                        ratio: '7.8%',
                        level: 2,
                        type: 'subsidiary'
                    },
                    {
                        id: 'tc-sub-1-2',
                        name: '深圳市腾讯动漫科技有限公司',
                        shortName: '腾讯动漫',
                        ratio: '100%',
                        level: 2,
                        type: 'subsidiary'
                    }
                ]
            },
            {
                id: 'tc-sub-2',
                name: '腾讯数码（深圳）有限公司',
                shortName: '腾讯数码',
                ratio: '100%',
                level: 1,
                type: 'subsidiary',
                legalPerson: '奚丹',
                registeredCapital: '2000万美元'
            },
            {
                id: 'tc-sub-3',
                name: '腾讯音乐娱乐科技（深圳）有限公司',
                shortName: '腾讯音乐',
                ratio: '100%',
                level: 1,
                type: 'subsidiary',
                legalPerson: '彭迦信',
                registeredCapital: '500万美元',
                children: [
                    {
                        id: 'tc-sub-3-1',
                        name: '广州酷狗计算机科技有限公司',
                        shortName: '酷狗音乐',
                        ratio: '100%',
                        level: 2,
                        type: 'subsidiary'
                    },
                    {
                        id: 'tc-sub-3-2',
                        name: '北京酷我科技有限公司',
                        shortName: '酷我音乐',
                        ratio: '100%',
                        level: 2,
                        type: 'subsidiary'
                    }
                ]
            },
            {
                id: 'tc-sub-4',
                name: '阅文集团有限责任公司',
                shortName: '阅文集团',
                ratio: '56.9%',
                level: 1,
                type: 'subsidiary',
                legalPerson: '侯晓楠',
                registeredCapital: '1000万美元'
            }
        ]
    };

    //示例企业清单：用于企业切换下拉
    var sampleCompanies = [
        { id: 'yntd', name: '云南建投第四建设有限公司', data: yntdEnterpriseData },
        { id: 'tencent', name: '腾讯科技（深圳）有限公司', data: tencentEnterpriseData }
    ];

    //统一挂到 window.pageMockData，便于主脚本读取
    win.pageMockData = {
        yntdEnterpriseData: yntdEnterpriseData,
        tencentEnterpriseData: tencentEnterpriseData,
        sampleCompanies: sampleCompanies
    };

    /* ---------- 以下为 Mock 读取方法，对应原 mockData.ts 的导出 ---------- */

    //读取默认初始企业数据
    function getMockInitialTreeData() {
        return win.pageMockData.yntdEnterpriseData;
    }

    //读取示例企业清单
    function getMockSampleCompanies() {
        return win.pageMockData.sampleCompanies;
    }

    //根据企业 id 读取对应 Mock 数据
    function getMockTreeDataByCompanyId(companyId) {
        var sampleList = win.pageMockData.sampleCompanies;
        var matchedSample = null;
        for (var i = 0; i < sampleList.length; i++) {
            if (sampleList[i].id === companyId) {
                matchedSample = sampleList[i];
                break;
            }
        }
        if (!matchedSample) {
            return null;
        }
        return matchedSample.data;
    }

    //暴露给主脚本使用
    win.mockReader = {
        getMockInitialTreeData: getMockInitialTreeData,
        getMockSampleCompanies: getMockSampleCompanies,
        getMockTreeDataByCompanyId: getMockTreeDataByCompanyId
    };
})(window);
