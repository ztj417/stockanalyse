# 招标风险监管与标段分析系统 — 后端接口文档

> 版本：v1.0\
> 日期：2026-09-04\
> 说明：本文档基于前端 mock 数据结构逆向整理，后端按此契约实现即可无缝接入。

***

## 目录

* [通用约定](#通用约定)

* [接口 1：标段风险列表](#接口-1标段风险列表)

* [接口 2：投标单位列表](#接口-2投标单位列表)

* [接口 3：企业档案详情](#接口-3企业档案详情)

* [接口 4：股权穿透图谱](#接口-4股权穿透图谱)

* [枚举/字典值](#枚举字典值)

***

## 通用约定

| 项            | 说明                                                                  |
| ------------ | ------------------------------------------------------------------- |
| 协议           | HTTP / HTTPS                                                        |
| 方法           | 全部 `GET`                                                            |
| Content-Type | `application/json`                                                  |
| 字符编码         | UTF-8                                                               |
| 响应格式         | 统一 `{ success: boolean, code: number, message: string, data: any }` |
| 时间格式         | `YYYY-MM-DD` 或 `YYYY-MM-DD HH:mm:ss`                                |
| 分页           | 暂不分页，一次性返回全量数据                                                      |

### 统一响应结构

```json
{
  "success": true,
  "code": 0,
  "message": "ok",
  "data": { ... }
}
```

| 字段      | 类型      | 说明                       |
| ------- | ------- | ------------------------ |
| success | boolean | `true` 请求成功，`false` 业务失败 |
| code    | number  | 业务码，`0` 成功               |
| message | string  | 可读的提示信息                  |
| data    | any     | 业务数据                     |

***

## 接口 1：标段风险列表

**页面**：标段风险总览（首页 `index.html`）\
**当前配置**：`pageConfig.listApi = '../api/sections'`\
**方法**：`GET /api/sections`

### 请求参数

无（前端不传任何 query/path 参数）。

### 响应 data 结构

```jsonc
{
  "sectionList": [ SectionObject ]
}
```

### SectionObject

| 字段                  | 类型                  | 必填 | 说明                            |
| ------------------- | ------------------- | -- | ----------------------------- |
| id                  | string              | ✅  | 标段主键，如 `"sec-002"`            |
| code                | string              | ✅  | 标段招标编号，如 `"E53A006220010830"` |
| name                | string              | ✅  | 标段名称                          |
| companyCount        | number              | ✅  | 投标单位总数                        |
| riskScore           | number              | ✅  | 风险评分（0-100，分值越高越危险）           |
| riskLevel           | string              | ✅  | 风险等级，见 [枚举字典](#枚举字典值)         |
| riskCount           | number              | ✅  | 命中风险问题总数                      |
| budgetAmount        | string              | ⬜  | 招标预算金额，如 `"未提供"`              |
| bidDate             | string              | ⬜  | 开标日期，如 `"未提供"`                |
| mainRiskTypes       | string\[]           | ✅  | 主要风险类型标签                      |
| riskSummary         | string              | ✅  | 风险综述（段落文本）                    |
| conclusionData      | ConclusionData      | ✅  | 审查结论数据                        |
| companyRiskGroups   | RiskGroup\[]        | ✅  | 关联单位风险组                       |
| equityIssueList     | EquityIssue\[]      | ✅  | 股权风险问题清单                      |
| contactAssociations | ContactAssoc\[]     | ⬜  | 联系方式交叉关联（可空数组）                |
| companies           | CompanyInSection\[] | ✅  | 投标单位概要列表                      |
| equityRelations     | EquityRelation\[]   | ⬜  | 股权关系边（可空数组）                   |
| suspiciousFactors   | string\[]           | ⬜  | 其他可疑因素（可空数组）                  |

### ConclusionData 审查结论

| 字段                      | 类型        | 必填 | 说明                 |
| ----------------------- | --------- | -- | ------------------ |
| issueCategoriesCount    | number    | ✅  | 命中风险规则类别数          |
| problematicCompanyCount | number    | ✅  | 有问题的单位数            |
| highRiskGroupCount      | number    | ✅  | 高风险关联组数            |
| coreRisks               | string\[] | ✅  | 核心风险标签             |
| disposalAdvice          | string    | ✅  | 处置建议               |
| summaryText             | string    | ✅  | 总结性文字（首页 AI 结论卡使用） |

### RiskGroup 关联单位风险组

| 字段           | 类型        | 必填 | 说明                |
| ------------ | --------- | -- | ----------------- |
| id           | string    | ✅  | 组主键               |
| groupName    | string    | ✅  | 组名称，如 `"关联单位组 1"` |
| riskLevel    | string    | ✅  | 见 [枚举字典](#枚举字典值)  |
| companies    | string\[] | ✅  | 该组内企业名称数组         |
| equityIssues | string\[] | ✅  | 该组命中的风险规则名        |
| keyEvidence  | string    | ✅  | 关键证据描述            |

### EquityIssue 风险问题

| 字段              | 类型        | 必填 | 说明                  |
| --------------- | --------- | -- | ------------------- |
| id              | string    | ✅  | 问题主键                |
| issueType       | string    | ✅  | 风险规则名，如 `"实际控制人审查"` |
| riskLevel       | string    | ✅  | 见 [枚举字典](#枚举字典值)    |
| companies       | string\[] | ✅  | 涉险企业名称数组            |
| relationPath    | string    | ✅  | 关系路径描述              |
| evidenceSummary | string    | ✅  | 证据摘要                |

### ContactAssoc 联系方式交叉

| 字段           | 类型        | 必填 | 说明                                   |
| ------------ | --------- | -- | ------------------------------------ |
| id           | string    | ✅  | 记录主键                                 |
| contactType  | string    | ✅  | 联系方式类型：`phone` / `email` / `address` |
| contactValue | string    | ✅  | 联系方式内容                               |
| companies    | string\[] | ✅  | 相同联系方式的企业名称                          |

### CompanyInSection 标段下投标单位

| 字段                | 类型             | 必填 | 说明                       |
| ----------------- | -------------- | -- | ------------------------ |
| id                | string         | ✅  | 企业主键（全局唯一）               |
| name              | string         | ✅  | 企业全称                     |
| legalPerson       | string         | ✅  | 法定代表人                    |
| registeredCapital | string         | ✅  | 注册资本，如 `"62007.345万人民币"` |
| shareholders      | Shareholder\[] | ✅  | 股东列表                     |
| phone             | string         | ⬜  | 注册电话                     |
| address           | string         | ⬜  | 注册地址                     |
| email             | string         | ⬜  | 注册邮箱                     |
| riskFlags         | string\[]      | ✅  | 命中的风险标记文案                |

### Shareholder 股东

| 字段       | 类型      | 必填 | 说明                   |
| -------- | ------- | -- | -------------------- |
| name     | string  | ✅  | 股东名称（自然人姓名或企业全称）     |
| ratio    | string  | ✅  | 持股比例，如 `"98.23%"`    |
| isCommon | boolean | ✅  | 是否为国资/机构股东（影响风险研判高亮） |

### EquityRelation 股权关系边（关联图谱）

| 字段            | 类型     | 必填 | 说明                             |
| ------------- | ------ | -- | ------------------------------ |
| sourceCompany | string | ✅  | 源企业名称                          |
| targetCompany | string | ✅  | 目标企业名称                         |
| relationType  | string | ✅  | 关系类型，如 `"共同实际控制人"`             |
| description   | string | ✅  | 关系描述                           |
| riskDegree    | string | ✅  | 风险程度：`high` / `medium` / `low` |

### 响应示例

```json
{
  "success": true,
  "code": 0,
  "message": "ok",
  "data": {
    "sectionList": [
      {
        "id": "sec-002",
        "code": "E53A006220010830",
        "name": "云南革命军事馆建设项目设计、采购、施工总承包",
        "companyCount": 14,
        "riskScore": 90,
        "riskLevel": "high",
        "riskCount": 5,
        "budgetAmount": "未提供",
        "bidDate": "未提供",
        "mainRiskTypes": ["实际控制人审查", "法人股东审查", "主要人员审查"],
        "riskSummary": "本标段共14家投标单位，识别到5个关联预警问题...",
        "conclusionData": {
          "issueCategoriesCount": 3,
          "problematicCompanyCount": 8,
          "highRiskGroupCount": 3,
          "coreRisks": ["实际控制人审查", "法人股东审查", "主要人员审查"],
          "disposalAdvice": "建议进入重点复核",
          "summaryText": "本标段数据已按最新 Excel 清单重算：参评投标单位14家，高风险问题3个，中风险问题2个，低风险问题0个，综合等级为高风险。"
        },
        "companyRiskGroups": [
          {
            "id": "grp-2-1",
            "groupName": "关联单位组 1",
            "riskLevel": "high",
            "companies": ["中国京冶工程技术有限公司", "中国建筑一局（集团）有限公司"],
            "equityIssues": ["实际控制人审查"],
            "keyEvidence": "共同关联主体：国务院国有资产监督管理委员会。"
          }
        ],
        "equityIssueList": [
          {
            "id": "iss-2-1",
            "issueType": "实际控制人审查",
            "riskLevel": "high",
            "companies": ["中国京冶工程技术有限公司", "中国建筑一局（集团）有限公司"],
            "relationPath": "命中实际控制人审查，共同关联主体：国务院国有资产监督管理委员会。",
            "evidenceSummary": "命中「实际控制人审查」，关联值：国务院国有资产监督管理委员会。"
          }
        ],
        "contactAssociations": [],
        "companies": [
          {
            "id": "c2-1",
            "name": "云南建投第四建设有限公司",
            "legalPerson": "马利波",
            "registeredCapital": "62007.345万人民币",
            "shareholders": [
              { "name": "云南省建设投资控股集团有限公司", "ratio": "98.23%", "isCommon": true },
              { "name": "云南建投第一水利水电建设有限公司", "ratio": "1.77%", "isCommon": false }
            ],
            "phone": "0871-64143052",
            "address": "云南省曲靖市麒麟区三江大道西段建宁街道办事处",
            "email": "ynsj@orisc.com.cn",
            "riskFlags": ["命中「实际控制人审查」，关联值：云南省人民政府国有资产监督管理委员会。"]
          }
        ],
        "equityRelations": [],
        "suspiciousFactors": []
      }
    ]
  }
}
```

***

## 接口 2：投标单位列表

**页面**：标段风险总览中的投标单位画像 Tab\
**当前配置**：`pageConfig.getCompanyListData = '../api/companyProfile/list'`\
**方法**：`GET /api/companyProfile/list`

### 请求参数

| 参数        | 类型     | 必填 | 说明                 |
| --------- | ------ | -- | ------------------ |
| sectionId | string | ✅  | 标段主键，如 `"sec-002"` |

### 响应 data 结构

```jsonc
{
  "section": SectionBrief,
  "companyList": [ CompanyDetail ]
}
```

### SectionBrief 标段概要

| 字段        | 类型     | 必填 | 说明               |
| --------- | ------ | -- | ---------------- |
| id        | string | ✅  | 标段主键             |
| code      | string | ✅  | 标段招标编号           |
| name      | string | ✅  | 标段名称             |
| riskLevel | string | ✅  | 见 [枚举字典](#枚举字典值) |
| riskScore | number | ✅  | 风险评分             |

### CompanyDetail 企业档案详情（完整字段）

| 字段                     | 类型                      | 必填 | 说明                      |
| ---------------------- | ----------------------- | -- | ----------------------- |
| id                     | string                  | ✅  | 企业主键                    |
| name                   | string                  | ✅  | 企业全称                    |
| legalPerson            | string                  | ✅  | 法定代表人                   |
| registeredCapital      | string                  | ✅  | 注册资本                    |
| creditCode             | string                  | ⬜  | 统一社会信用代码                |
| status                 | string                  | ⬜  | 经营状态：`存续` / `注销` / `吊销` |
| establishDate          | string                  | ⬜  | 成立日期 `YYYY-MM-DD`       |
| province               | string                  | ⬜  | 注册省份                    |
| phone                  | string                  | ⬜  | 注册电话                    |
| email                  | string                  | ⬜  | 注册邮箱                    |
| address                | string                  | ⬜  | 注册地址                    |
| website                | string                  | ⬜  | 企业官网                    |
| industry               | string                  | ⬜  | 所属行业                    |
| employeeCount          | string                  | ⬜  | 员工人数，如 `"100-499人"`     |
| shareholders           | Shareholder\[]          | ✅  | 股东列表（当前在册）              |
| historicalShareholders | Shareholder\[]          | ⬜  | 历史股东                    |
| keyPersonnel           | Personnel\[]            | ⬜  | 主要人员                    |
| historicalPersonnel    | Personnel\[]            | ⬜  | 历史任职人员                  |
| patents                | IntellectualProperty\[] | ⬜  | 专利                      |
| copyrights             | IntellectualProperty\[] | ⬜  | 软著/版权                   |
| domains                | DomainRecord\[]         | ⬜  | 网站域名                    |
| annualReports          | AnnualReport\[]         | ⬜  | 企业年报                    |
| riskFlags              | string\[]               | ✅  | 命中的风险标记文案               |

### Personnel 主要人员

| 字段       | 类型      | 必填 | 说明      |
| -------- | ------- | -- | ------- |
| name     | string  | ✅  | 姓名      |
| position | string  | ✅  | 职位      |
| isLegal  | boolean | ⬜  | 是否法定代表人 |

### IntellectualProperty 知识产权

| 字段     | 类型     | 必填 | 说明      |
| ------ | ------ | -- | ------- |
| name   | string | ✅  | 专利/软著名称 |
| number | string | ⬜  | 申请号/登记号 |
| type   | string | ⬜  | 类型      |
| status | string | ⬜  | 状态      |

### DomainRecord 域名

| 字段     | 类型     | 必填 | 说明      |
| ------ | ------ | -- | ------- |
| domain | string | ✅  | 域名      |
| icp    | string | ⬜  | ICP 备案号 |

### AnnualReport 企业年报

| 字段      | 类型     | 必填 | 说明   |
| ------- | ------ | -- | ---- |
| year    | string | ✅  | 年报年份 |
| revenue | string | ⬜  | 营业收入 |
| profit  | string | ⬜  | 净利润  |

### 响应示例

```json
{
  "success": true,
  "code": 0,
  "message": "ok",
  "data": {
    "section": {
      "id": "sec-002",
      "code": "E53A006220010830",
      "name": "云南革命军事馆建设项目设计、采购、施工总承包",
      "riskLevel": "high",
      "riskScore": 90
    },
    "companyList": [
      {
        "id": "c2-1",
        "name": "云南建投第四建设有限公司",
        "legalPerson": "马利波",
        "registeredCapital": "62007.345万人民币",
        "creditCode": "91530000216524184W",
        "status": "存续",
        "establishDate": "1990-03-24",
        "province": "云南省",
        "phone": "0871-64143052",
        "email": "ynsj@orisc.com.cn",
        "address": "云南省曲靖市麒麟区三江大道西段",
        "website": "http://www.ynsj.com.cn",
        "industry": "建筑业 - 房屋建筑业",
        "employeeCount": "500-999人",
        "shareholders": [
          { "name": "云南省建设投资控股集团有限公司", "ratio": "98.23%", "isCommon": true }
        ],
        "historicalShareholders": [],
        "keyPersonnel": [
          { "name": "马利波", "position": "董事长", "isLegal": true }
        ],
        "patents": [],
        "copyrights": [],
        "domains": [],
        "annualReports": [],
        "riskFlags": ["命中「实际控制人审查」，关联值：云南省人民政府国有资产监督管理委员会。"]
      }
    ]
  }
}
```

***

## 接口 3：企业档案详情

**页面**：企业画像详情弹窗\
**当前配置**：`pageConfig.getCompanyDetailData = '../api/companyProfile/detail'`\
**方法**：`GET /api/companyProfile/detail`

### 请求参数

| 参数          | 类型     | 必填 | 说明             |
| ----------- | ------ | -- | -------------- |
| companyId   | string | ✅  | 企业主键           |
| companyName | string | ⬜  | 企业名称（辅助查询，可忽略） |

### 响应 data 结构

直接返回 `CompanyDetail` 对象，结构同 [接口 2 CompanyDetail](#companydetail-企业档案详情完整字段)。

```json
{
  "success": true,
  "code": 0,
  "message": "ok",
  "data": {
    "id": "c2-1",
    "name": "云南建投第四建设有限公司",
    "legalPerson": "马利波",
    "registeredCapital": "62007.345万人民币",
    "creditCode": "91530000216524184W",
    "shareholders": [
      { "name": "云南省建设投资控股集团有限公司", "ratio": "98.23%", "isCommon": true }
    ],
    "historicalShareholders": [],
    "keyPersonnel": [],
    "patents": [],
    "copyrights": [],
    "domains": [],
    "annualReports": [],
    "riskFlags": []
  }
}
```

***

## 接口 4：股权穿透图谱

**页面**：股权穿透分析页面\
**当前配置**：`pageConfig.getTreeData`（原 mock 入口：`getMockTreeData()`）\
**方法**：`GET /api/equity/tree`

### 请求参数

| 参数          | 类型     | 必填 | 说明        |
| ----------- | ------ | -- | --------- |
| rootId      | string | ✅  | 根企业主键     |
| companyId   | string | ⬜  | 根企业主键（备用） |
| companyName | string | ⬜  | 根企业名称     |

### 响应 data 结构

```jsonc
{
  "root": TreeNode,
  "upward": [ TreeNode ],   // 向上穿透（股东链）
  "downward": [ TreeNode ]  // 向下穿透（控股子公司链）
}
```

### TreeNode 穿透节点

| 字段                | 类型          | 必填 | 说明                                    |
| ----------------- | ----------- | -- | ------------------------------------- |
| id                | string      | ✅  | 节点主键                                  |
| name              | string      | ✅  | 企业/自然人全称                              |
| shortName         | string      | ⬜  | 简称（图谱节点上展示）                           |
| level             | number      | ✅  | 层级：`0` 根节点，`-1/-2...` 向上，`1/2...` 向下  |
| type              | string      | ✅  | `root` / `shareholder` / `subsidiary` |
| legalPerson       | string      | ⬜  | 法定代表人（仅企业）                            |
| registeredCapital | string      | ⬜  | 注册资本                                  |
| creditCode        | string      | ⬜  | 统一社会信用代码                              |
| status            | string      | ⬜  | 经营状态                                  |
| establishDate     | string      | ⬜  | 成立日期                                  |
| province          | string      | ⬜  | 注册省份                                  |
| ratio             | string      | ⬜  | 持股比例，如 `"98.23%"`（根节点无）               |
| amount            | string      | ⬜  | 出资额（根节点无）                             |
| parents           | TreeNode\[] | ⬜  | 继续向上穿透的父节点（递归结构）                      |
| children          | TreeNode\[] | ⬜  | 继续向下穿透的子节点（递归结构）                      |

> **递归说明**：`parents` 和 `children` 可以无限嵌套，后端返回完整穿透树即可，前端会自适应渲染。

### 响应示例

```json
{
  "success": true,
  "code": 0,
  "message": "ok",
  "data": {
    "root": {
      "id": "root-yntd",
      "name": "云南建投第四建设有限公司",
      "shortName": "云南建投四建",
      "level": 0,
      "type": "root",
      "legalPerson": "李建波",
      "registeredCapital": "100000.00万人民币",
      "creditCode": "91530000216524184W",
      "status": "存续",
      "establishDate": "1990-03-24",
      "province": "云南省昆明市"
    },
    "upward": [
      {
        "id": "sh-1",
        "name": "云南建投第一水利水电建设有限公司",
        "shortName": "云南建投一水",
        "ratio": "1.77%",
        "amount": "1770.00万元",
        "level": -1,
        "type": "shareholder",
        "legalPerson": "赵云松",
        "registeredCapital": "120000.00万人民币",
        "creditCode": "91530000216518392M",
        "status": "存续",
        "establishDate": "1992-06-18",
        "province": "云南省昆明市",
        "parents": [
          {
            "id": "sh-1-1",
            "name": "云南省建设投资控股集团有限公司",
            "shortName": "云南建投集团",
            "ratio": "100%",
            "level": -2,
            "type": "shareholder",
            "legalPerson": "陈祖军",
            "parents": [
              {
                "id": "sh-1-1-1",
                "name": "云南省人民政府国有资产监督管理委员会",
                "shortName": "云南省国资委",
                "ratio": "90%",
                "level": -3,
                "type": "shareholder",
                "legalPerson": "机关法人"
              }
            ]
          }
        ]
      }
    ],
    "downward": []
  }
}
```

***

## 枚举/字典值

### riskLevel 风险等级

| 值        | 说明         | UI 表现            |
| -------- | ---------- | ---------------- |
| `high`   | 高风险 / 红线预警 | 红色徽章、风险评分 70-100 |
| `medium` | 中风险 / 关注排查 | 橙色徽章、风险评分 40-69  |
| `low`    | 低风险 / 合规通过 | 绿色徽章、风险评分 0-39   |

### issueType 风险规则类型（当前覆盖）

| 规则名       | 说明              |
| --------- | --------------- |
| `实际控制人审查` | 多家投标单位共享同一实际控制人 |
| `法人股东审查`  | 多家投标单位存在共同法人股东  |
| `主要人员审查`  | 多家投标单位共享关键任职人员  |
| `注册电话相同`  | 不同投标单位注册电话相同    |
| `注册地址相同`  | 不同投标单位注册地址相同    |
| `注册邮箱相同`  | 不同投标单位注册邮箱相同    |

### TreeNode.type

| 值             | 说明         |
| ------------- | ---------- |
| `root`        | 当前查询的根企业   |
| `shareholder` | 向上穿透的股东节点  |
| `subsidiary`  | 向下穿透的控股子公司 |

### CompanyInSection.status

| 值    | 说明  |
| ---- | --- |
| `存续` | 在营  |
| `注销` | 已注销 |
| `吊销` | 被吊销 |

***

## 接入步骤

1. **后端按上述 4 个接口实现**，保证响应结构与 mock 一致。
2. **前端配置开关**：将三个 HTML 中的 `window.pageConfig.useMock` 改为 `false`。
3. **前端配置接口路径**：

   * `index.html` → `listApi` 改为实际地址

   * `company-profile.html` → `getCompanyListData` / `getCompanyDetailData` 改为实际地址

   * `equity-penetration.html` → `getTreeData` 改为实际地址
4. **跨域处理**：后端需返回 `Access-Control-Allow-Origin` 或同域部署。

***

## 变更记录

| 版本   | 日期         | 变更                        |
| ---- | ---------- | ------------------------- |
| v1.0 | 2026-09-04 | 初版，基于 mock 数据逆向整理 4 个接口契约 |

