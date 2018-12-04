## 工资对照表 salary

```
部门 = team
组别 = group
姓名 = name
职务 = job
直接领导 = leader
入职日期 = hiredate
在职状态 = statusVarchar
工龄时长 = workinglength
实出勤 = attendance
基本工资 = baseSalary
考勤扣款 = attendanceCutPayment
入职总人数 = totalPeople
管理费用 =
收入 = incomings
支出 = outgoings
收入-支出 = inAndOut
提成比例 = royalty
提成/绩效 = performance
失责 = breach
主管失责 = groupLeaderBreach
项目经理失责 = managerBreach
主管成本 = groupLeaderCost
奖励 = reword
真实工资 = realSalary
保底 = minSalary
行政扣款 = administrativeDeduction
纸张分摊 = paperpay
迟到扣款 = lateDeduction
未打卡扣款 = noCardDeduction
团队利润 = teamProfit
利润比例 = profitRatio
团队利润提成 = teamProfitCommission
孝感意外险 = accidentInsuranceOfXiaoGan
罚款 = penalty
主管调整 = DirectorOfAdjustment
工龄工资 = seniorityPay
社保 = socialSecurity
所得税 = incomeTax
扣回5月补贴 = deductSubsidyLastMonth
借支 = borrowing
6月现金罚款 = cashFineInCurrentMonth
工资卡号 = wagesCardNum
备注 = remark
员工4月利润 = staffInOfLastMonth
员工5月利润 = staffInOfBeforeLastMonth
现职位 = nowPosition
主管编制 = groupLeaderOfEstablishment
主管4月利润 = groupLeaderInOfBeforeLastMonth
主管5月利润 = groupLeaderInOfLastMonth
升降去留 = liftFuture
已处理 = processed
经理4月利润 = managerInOfBeforeLastMonth
经理5月利润 = managerInOfLastMonth
应付工资 = accruedSalary
```

## 员工表 staff

```
部门 = team
组别 = group
渠道 = channel
姓名 = name
岗位 = job
职级 = grade
直接领导 = leader
工作属地 = jobDependencies
性别 = gender
入职时间 = hiredate
司龄 = workinglength
司龄分段 = workinglengthRange
异动情况 = positionChange
出生日期 = brath
年龄 = age
年龄分层 = ageRange
联系电话 = phone
身份证号码 = cardNumber
籍贯 = birthplace
毕业院校 = school
专业 = major
学历 = degree
学历分段 = degreeRange
毕业时间 = graduationDate
现居地址 = address
身份证地址 = cardAddress
紧急联系电话 = emergencyContactPhone
合同生效日期 = contract
合同截止日期 = contractEnd
用工方式 = employmentType

//extend fields
邮箱 = email
办公电话 = businessPhone
3寸大头照 = avatar
身份证正面照片 = cardPhotoFace
身份证反面照片 = cardPhotoBack
紧急联系人 = emergencyContactPerson
职位状态 = statusVarchar
备注 = remarks
```

## 工资结算指标果实 fruit

```
员工 ID = userId
员工姓名 = username

录入日期 = date
收入 = incoming
支出 = outgoing

指标 = commission
风险 = risk

缺职率 = lapseRate
贡献率 = contributionRate
离职率 = separationRate
忠诚度 = loyaltyRate
备干部 = preparationOfCadres

客户敬重 = customerRespect
员工满意 = employeeSatisfaction
同行敬畏 = opponentRespect
政府认可 = governmentEndorsement

同行人数 = opponentPeopleNumber
我方人数 = ourPeopleNumber
我方增长 = ourGrowth
市场份额 = marketShare
失责罚款 = defaultFine

其他 = others
```

## 工资结算原始表 salary_origin

```
组别 = group
姓名 = name
职务 = job
保底工资 = baseSalary
考勤扣款 = attendanceCutPayment
入职总人数 = totalPeople
收入 = incomings
支出 = outgoings
收入-支出 = inAndOut
提成比例 = royalty
提成/绩效 = performance
失责 = breach
扣款 = cashFine
主管失责 = groupLeaderBreach
项目经理失责 = managerBreach
成本 = cost4All
管理费用 = cost4Manage

团队利润 = teamProfit
利润比例 = profitRatio
团队利润提成 = teamProfitCommission
应付工资 = actureSalary
月份 = month
```

## 员工工资配置

```
  staffSalary = 专员保底工资
  groupLeaderSalary = 主管保底工资
  managerSalary = 经理保底工资
  adjustBaseSalary = 个税起征点
```

## 员工工资表字段

```
组别 = group
姓名 = name
职务 = job
保底工资 = baseSalary
考勤扣款 = attendanceCutPayment
入职总人数 = totalPeople
收入 = incomings
支出 = outgoings
收入-支出 = inAndOut
提成 = royalty
提成比例 = royaltyRate
提成/绩效 = performance
员工状态 = status
失责 = breach
奖励 = reward
扣款 = cashFine
主管失责 = groupLeaderBreach
项目经理失责 = managerBreach
主管成本 = cost4GroupLeader
成本 = cost4All

起征税 = adjustBaseSalary
个人纸张费用 = paperPay
纸张费用 = cost4Paper
管理费用 = cost4Manage
团队利润 = teamProfit
员工利润比例 = staffProfitRatio
主管利润比例 = groupLeaderProfitRatio
团队利润提成 = teamProfitCommission
真实工资 = actureSalary
应付工资 = accruedSalary
入职时间 = hiredate
入职时长 = lengthOfHiredate
月份 = month
社保 = socialInsurance
录入时间 = createDate
```
