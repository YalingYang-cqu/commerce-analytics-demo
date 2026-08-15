/**
 * namespace: Api
 *
 * 所有接口相关类型定义
 * 在.vue文件使用会报错，需要在 eslint.config.mjs 中配置 globals: { Api: 'readonly' }
 */
/* 类型声明文件使用 namespace 与全局 declare，此处关闭对应 ESLint 规则 */
/* eslint-disable @typescript-eslint/no-namespace */
/* eslint-disable @typescript-eslint/no-unused-vars */

import { deptProps } from '@/views/system/dept-manage/modules/dept-manage/index.vue'

declare namespace Api {
  /** 通用类型 */
  namespace Common {
    /** 分页参数 */
    interface PaginationParams {
      /** 当前页码 */
      currentPage: number
      /** 每页条数 */
      pageSize: number
      /** 总条数 */
      total: number
    }

    /** 通用搜索参数 */
    type CommonSearchParams = Pick<PaginationParams, 'currentPage' | 'pageSize'>

    /** 分页响应基础结构 */
    interface PaginatedResponse<T = any> {
      records: T[]
      current: number
      size: number
      total: number
    }

    /** 启用状态 */
    type EnableStatus = '1' | '2'
  }

  /** 认证类型 */
  namespace Auth {
    /** 登录参数 */
    interface LoginParams {
      userName: string
      password: string
    }

    /** 登录响应 */
    interface LoginResponse {
      token: string
      refreshToken: string
    }

    /** 用户信息 */
    interface UserInfo {
      buttons: string[]
      roles: string[]
      userId: number
      userName: string
      email: string
      avatar?: string
    }
  }

  /** 系统管理类型 */
  namespace SystemManage {
    /** 用户列表 */
    type UserList = Api.Common.PaginatedResponse<UserListItem>

    /** 用户列表项 */
    interface UserListItem {
      id: number
      avatar: string
      status: string
      userName: string
      userGender: string
      nickName: string
      userPhone: string
      userEmail: string
      userRoles: string[]
      createBy: string
      createTime: string
      updateBy: string
      updateTime: string
    }
    /** 字典列表项 */
    interface DictListItem {
      dictName: string
      dictCode: string
      status: string
      remark: string
      hasCount?: boolean
      id?: string
    }

    interface userHabits {
      key: string
      habits: any
    }
    // 下拉店铺 - 请求参数
    interface requestCountyParam {
      country: string | string[]
    }

    interface responseSellerCount {
      country: string
      name: string
      sellerld: string
      value: string
    }
    // 下拉店铺 - 返回参数
    interface responseSellerList {
      code: number
      data: {
        count: responseSellerCount
        dtoList: responseSellerCount[]
        total: number
      }
      msg: string
      success: boolean
    }

    // 请求 - 下拉框 - 币种
    interface requestCurrencyList {
      accountIdList: string[]
      campaignIdList?: number[]
      country: string | string[]
    }

    // 请求 - 下拉框 - 广告组
    interface requestAdvGroupList {
      accountIdList: string[] | string
      campaignIdList: string[]
      country: string
    }

    // 下载中心 - 请求参数
    interface sendDownLoadCommand {
      account?: string
      code?: string
      implName?: string
      name?: string
      param?: string
      timeScope?: string
      topic?: string
      userId?: number
    }

    // 核算主体 - 请求体
    interface CompanyList {
      englishName?: string
      name?: string
    }

    // 核算主体 - 返回结构
    interface CompanyListResponse {
      /** 地址 */
      address: string
      /** 印章ID */
      assignedSealId: string
      /** 通用字段 */
      common: string
      /** 创建时间 */
      createTime: string
      /** 创建人 */
      creator: number
      /** 英文地址 */
      englishAddress: string
      /** 英文名称 */
      englishName: string
      /** 主键ID */
      id: number
      /** 名称 */
      name: string
      /** 编号 */
      number: string
      /** 组织机构一级 */
      organizationalCharFirst: string
      /** 组织机构代码 */
      organizationalCode: string
      /** 组织负责人 */
      organizationalHead: string
      /** 电话 */
      phone: string
      /** 状态 */
      state: boolean
    }

    // 仓库 - 请求体
    interface WarehouseSearchParams {
      warehouseName?: string
      warehouseCode?: string
      warehouseType?: number
      supplierId?: number
      enableStatus?: number
    }

    // 仓库 - 返回结构
    interface WarehouseResponse {
      /** 主键ID */
      id: number
      /** 仓库编码 */
      warehouseCode: string
      /** 仓库名称 */
      warehouseName: string
      /** 仓库类型 (1: 供应商仓, 2: 三方仓, 3: 平台仓) */
      warehouseType: number
      /** 仓库类型名称 */
      warehouseTypeName: string
      /** 状态 (0: 停用, 1: 启用) */
      enableStatus: number
      /** 状态名称 */
      enableStatusName: string
      /** 负责人 */
      principalName: string
      /** 联系人 */
      contactName?: string
      /** 联系电话 */
      contactPhone?: string
      /** 联系邮箱 */
      contactEmail?: string
      /** 供应商ID */
      supplierId?: number
      /** 供应商名称 */
      supplierName?: string
      /** 供应商编码 */
      supplierCode?: string
      /** 店铺ID */
      accountId?: number
      /** 店铺名称 */
      accountName?: string
      /** 平台 */
      platform?: string
      /** 站点 */
      marketplace?: string
      /** 平台仓库类型 */
      platformWarehouseType?: string
      /** 地址 */
      address?: string
      /** 国家 */
      country?: string
      /** 省份 */
      province?: string
      /** 城市 */
      city?: string
      /** 区域 */
      area?: string
      /** 邮编 */
      postCode?: string
      /** 创建时间 */
      createTime: string
      /** 创建时间字符串 */
      createTimeStr: string
      /** 创建人ID */
      creatorId?: number
      /** 创建人名称 */
      creatorName?: string
      /** 更新时间 */
      updateTime: string
      /** 更新时间字符串 */
      updateTimeStr: string
      /** 更新人ID */
      updateId?: number
      /** 更新人名称 */
      updateName?: string
      /** 是否删除 */
      isDeleted: number
      /** Mock字段: 是否有库存 */
      hasInventory?: boolean
      /** Mock字段: 是否有库存流水 */
      hasTransactions?: boolean
      /** Mock字段: 是否有关联单据 */
      hasRelatedDocuments?: boolean
    }

    type DictList = Api.Common.PaginatedResponse<DictListItem>
    /** 用户搜索参数 */
    type UserSearchParams = Partial<
      Pick<UserListItem, 'id' | 'userName' | 'userGender' | 'userPhone' | 'userEmail' | 'status'> &
        Api.Common.CommonSearchParams
    >
    /** 用户搜索参数 */
    type DictSearchParams = Partial<
      Pick<
        UserListItem,
        'id' | 'userName' | 'userGender' | 'userPhone' | 'userEmail' | 'status' | 'dictCode'
      > &
        Api.Common.CommonSearchParams
    > & { hasCount: boolean }
    /** dept搜索参数 */
    type DeptSearchParams = Partial<
      Pick<deptProps, 'deptId' | 'status' | 'managerId'> & Api.Common.CommonSearchParams
    >

    /** 角色列表 */
    type RoleList = Api.Common.PaginatedResponse<RoleListItem>

    /** 角色列表项 */
    interface RoleListItem {
      roleId: number
      roleName: string
      roleCode: string
      description: string
      enabled: boolean
      createTime: string
    }

    /** 角色搜索参数 */
    type RoleSearchParams = Partial<
      Pick<RoleListItem, 'roleId' | 'roleName' | 'roleCode' | 'description' | 'enabled'> &
        Api.Common.CommonSearchParams
    >

    /** 角色用户列表项 */
    interface RoleUserListItem {
      id: number
      userName: string
      realName: string
      phone: string
      email: string
      position: string
      status: '1' | '0'
    }

    /** 角色用户列表 */
    type RoleUserList = Api.Common.PaginatedResponse<RoleUserListItem>

    /** 角色用户搜索参数 */
    type RoleUserSearchParams = Partial<
      Pick<RoleUserListItem, 'userName' | 'realName' | 'phone' | 'email' | 'position' | 'status'> &
        Api.Common.CommonSearchParams & {
          roleId?: number
          keyword?: string
        }
    >
  }
  /** 供应商类型 */
  namespace Supplier {
    /** 列表项（与后端文档对齐） */
    interface SupplierListDto {
      /** 主键ID */
      id: number
      /** 供应商编码 */
      supplierCode: string
      /** 供应商全称 */
      supplierFullName: string
      /** 供应商简称 */
      supplierShortName: string
      /** 合作状态（潜在/正常/暂停/终止等） */
      cooperationStatus?: string
      /** 变更状态（草稿/待审批/已驳回/已生效） */
      changeStatus?: string
      /** 审批状态（草稿/待审批/已驳回/已生效） */
      approvalStatus?: string
      /** 默认联系人手机号 */
      mobile?: string
      /** 默认联系人邮箱 */
      email?: string
      /** 采购负责人，逗号分隔 */
      supplierNames?: string
      /** 审厂人，逗号分隔 */
      auditorNames?: string
      /** 供应商仓库 */
      supplierWarehouse?: string
      /** 飞书对接群 */
      feishuGroup?: string
      /** 关联用户数量 */
      associatedUsers?: string
      /** 创建时间（字符串） */
      createTime?: string
      /** 更新时间（字符串） */
      updateTime?: string
      /** 更新人名称 */
      updateBy?: string
      /** 默认联系人名称 */
      contactNames?: string
      /** 统一社会信用代码 */
      socialCreditCode?: string
      /** 成立日期 */
      establishmentDate?: string
      /** 公司地址 */
      companyAddress?: string
      /** 法人姓名 */
      legalPersonName?: string
      /** 注册资本 */
      registeredCapital?: string | number
      /** 附件（逗号分隔的URL字符串或数组） */
      attachment?: string
      attachments?: string[]
      /** 法人联系电话 */
      legalPersonPhone?: string
      /** 员工规模 */
      employeeScale?: string
      /** 结算方式 */
      settlementMethod?: string
      /** 结算周期 */
      settlementCycle?: string
      /** 预付比例 */
      prepaymentRatio?: string | number
      /** 付款期限 */
      paymentTerm?: string | number
      /** 付款期限是否月底 */
      paymentTermEndOfMonth?: boolean
      /** 结算币别 */
      settlementCurrency?: string
      /** 基准日期 */
      baseDate?: string
    }
    /** 列表响应（标准化） */
    type SupplierList = Api.Common.PaginatedResponse<SupplierListDto>
    /** 查询参数（与后端文档对齐） */
    interface SupplierQueryParam extends Api.Common.CommonSearchParams {
      /** 审批状态列表（草稿/审批中/已驳回/已生效） */
      approvalStatusList?: string[]
      /** 变更状态列表（草稿/待审批/已驳回/已生效） */
      changeStatusList?: string[]
      /** 合作状态列表（潜在/正常/暂停/终止） */
      cooperationStatusList?: string[]
      /** 创建时间-开始（yyyy-MM-dd HH:mm:ss） */
      createTimeFrom?: string
      /** 创建时间-结束（yyyy-MM-dd HH:mm:ss） */
      createTimeTo?: string
      /** 更新时间-开始（yyyy-MM-dd HH:mm:ss） */
      updateTimeFrom?: string
      /** 更新时间-结束（yyyy-MM-dd HH:mm:ss） */
      updateTimeTo?: string
      /** 排序参数，如："createTime desc" */
      orderBy?: string
      /** 是否查询总量 */
      hasCount?: boolean
      /** 采购负责人ID列表 */
      purchaserIdList?: number[]
      /** 供应商编码（模糊） */
      supplierCode?: string
      /** 供应商全称（模糊） */
      supplierFullName?: string
      /** 供应商简称（模糊） */
      supplierShortName?: string
    }
    /** 供编辑使用的完整实体（用于弹窗） */
    interface SupplierItem {
      /** 供应商ID */
      supplierId: number
      /** 供应商编码 */
      supplierCode: string
      /** 供应商名称（全称） */
      supplierName: string
      /** 供应商简称 */
      shortName?: string
      /** 分类（字典值） */
      category?: string
      /** 等级（字典值） */
      level?: string
      /** 国家（字典值） */
      country?: string
      /** 省份 */
      province?: string
      /** 城市 */
      city?: string
      /** 详细地址 */
      address?: string
      /** 联系人名称 */
      contactName?: string
      /** 联系人电话 */
      contactPhone?: string
      /** 联系人邮箱 */
      contactEmail?: string
      /** 开户银行名称 */
      bankName?: string
      /** 开户人名称 */
      bankAccountName?: string
      /** 银行账号 */
      bankAccountNumber?: string
      /** 税号 */
      taxNumber?: string
      /** 附件列表（上传元数据） */
      attachments?: SupplierAttachment[]
      /** 合作状态 */
      cooperationStatus?: string
      /** 供应商仓库 */
      supplierWarehouse?: string
      /** 飞书对接群 */
      feishuGroup?: string
      /** 备注 */
      remark?: string
      /** 是否启用 */
      status: boolean
      /** 创建时间 */
      createTime: string
    }
    interface SupplierAttachment {
      id?: number
      name: string
      url?: string
      type?: string
      size?: number
    }
    /** 搜索参数 */
    type SupplierSearchParams = Partial<
      Pick<
        SupplierItem,
        'supplierCode' | 'supplierName' | 'category' | 'level' | 'country' | 'status'
      > &
        Api.Common.CommonSearchParams
    > & {
      startTime?: string
      endTime?: string
    }
    /** 新增参数 */
    type SupplierCreateParams = Omit<SupplierItem, 'supplierId' | 'createTime' | 'status'> & {
      status?: boolean
    }
    /** 更新参数 */
    type SupplierUpdateParams = Partial<SupplierCreateParams> & {
      supplierId: number
    }
    /** 操作日志项 */
    interface OperationLogItem {
      id: number
      operationTime: string
      operator: string
      operationType: string
      description: string
    }
    /** 操作日志查询参数 */
    interface OperationLogQueryParam extends Api.Common.CommonSearchParams {
      supplierId?: number
    }
    /** 操作日志列表响应 */
    type OperationLogList = Api.Common.PaginatedResponse<OperationLogItem>
  }
  /** 物流商类型 */
  namespace Logistics {
    /** 列表项（与后端文档对齐） */
    interface LogisticsListDto {
      /** 主键ID */
      id: number
      /** 物流商编码 */
      logisticsCode: string
      /** 物流商全称 */
      logisticsFullName: string
      /** 物流商简称 */
      logisticsShortName: string
      /** 合作状态（潜在/正常/暂停/终止等） */
      cooperationStatus?: string
      /** 默认联系人手机号 */
      mobile?: string
      /** 默认联系人邮箱 */
      email?: string
      /** 物流负责人，逗号分隔 */
      logisticsNames?: string
      /** 物流商仓库 */
      logisticsWarehouse?: string
      /** 飞书对接群 */
      feishuGroup?: string
      /** 创建时间（字符串） */
      createTime?: string
      /** 更新时间（字符串） */
      updateTime?: string
      /** 更新人名称 */
      updateBy?: string
      /** 默认联系人名称 */
      contactNames?: string
    }
    /** 列表响应（标准化） */
    type LogisticsList = Api.Common.PaginatedResponse<LogisticsListDto>
    /** 查询参数（与后端文档对齐） */
    interface LogisticsQueryParam extends Api.Common.CommonSearchParams {
      /** 变更状态列表（草稿/待审批/已驳回/已生效） */
      changeStatusList?: string[]
      /** 审批状态列表（草稿/待审批/已驳回/已生效） */
      approvalStatusList?: string[]
      /** 合作状态列表（潜在/正常/暂停/终止） */
      cooperationStatusList?: string[]
      /** 创建时间-开始（yyyy-MM-dd HH:mm:ss） */
      createTimeFrom?: string
      /** 创建时间-结束（yyyy-MM-dd HH:mm:ss） */
      createTimeTo?: string
      /** 更新时间-开始（yyyy-MM-dd HH:mm:ss） */
      updateTimeFrom?: string
      /** 更新时间-结束（yyyy-MM-dd HH:mm:ss） */
      updateTimeTo?: string
      /** 排序参数，如："createTime desc" */
      orderBy?: string
      /** 是否查询总量 */
      hasCount?: boolean
      /** 物流负责人ID列表 */
      logisticsManagerIdList?: number[]
      /** 物流商编码（模糊） */
      logisticsCode?: string
      /** 物流商全称（模糊） */
      logisticsFullName?: string
      /** 物流商简称（模糊） */
      logisticsShortName?: string
    }
    /** 供编辑使用的完整实体（用于弹窗） */
    interface LogisticsItem {
      /** 物流商ID */
      logisticsId: number
      /** 物流商编码 */
      logisticsCode: string
      /** 物流商名称（全称） */
      logisticsName: string
      /** 物流商简称 */
      shortName?: string
      /** 分类（字典值） */
      category?: string
      /** 等级（字典值） */
      level?: string
      /** 国家（字典值） */
      country?: string
      /** 省份 */
      province?: string
      /** 城市 */
      city?: string
      /** 详细地址 */
      address?: string
      /** 联系人名称 */
      contactName?: string
      /** 联系人电话 */
      contactPhone?: string
      /** 联系人邮箱 */
      contactEmail?: string
      /** 开户银行名称 */
      bankName?: string
      /** 开户人名称 */
      bankAccountName?: string
      /** 银行账号 */
      bankAccountNumber?: string
      /** 税号 */
      taxNumber?: string
      /** 附件列表（上传元数据） */
      attachments?: LogisticsAttachment[]
      /** 合作状态 */
      cooperationStatus?: string
      /** 物流商仓库 */
      logisticsWarehouse?: string
      /** 飞书对接群 */
      feishuGroup?: string
      /** 备注 */
      remark?: string
      /** 是否启用 */
      status: boolean
      /** 创建时间 */
      createTime: string
    }
    interface LogisticsAttachment {
      id?: number
      name: string
      url?: string
      type?: string
      size?: number
    }
    /** 搜索参数 */
    type LogisticsSearchParams = Partial<
      Pick<
        LogisticsItem,
        'logisticsCode' | 'logisticsName' | 'category' | 'level' | 'country' | 'status'
      > &
        Api.Common.CommonSearchParams
    > & {
      startTime?: string
      endTime?: string
    }
    /** 新增参数 */
    type LogisticsCreateParams = Omit<LogisticsItem, 'logisticsId' | 'createTime' | 'status'> & {
      status?: boolean
    }
    /** 更新参数 */
    type LogisticsUpdateParams = Partial<LogisticsCreateParams> & {
      logisticsId: number
    }
    /** 操作日志项 */
    interface OperationLogItem {
      /** 主键ID */
      id: number
      /** 操作时间 */
      operationTime: string
      /** 操作人 */
      operator: string
      /** 操作类型 */
      operationType: string
      /** 说明 */
      description: string
    }
    /** 操作日志查询参数 */
    interface OperationLogQueryParam extends Api.Common.CommonSearchParams {
      /** 物流商ID */
      logisticsId?: number
    }
    /** 操作日志列表响应 */
    type OperationLogList = Api.Common.PaginatedResponse<OperationLogItem>
  }

  /** 补货需求单类型 */
  namespace Replenishment {
    /** 单据状态枚举 (根据MCP API规范) */
    enum Status {
      DRAFT = 1, // 草稿
      PENDING = 2, // 待审批
      PENDING_PURCHASE = 3, // 待采购
      PURCHASING = 4, // 采购中
      COMPLETED = 5, // 已完成
      REJECTED = 6, // 已驳回
      VOID = 7 // 已作废
    }

    /** 操作日志类型枚举 */
    enum OperationType {
      CREATE = '创建',
      EDIT = '编辑',
      SUBMIT = '提交审批',
      RECALL = '撤回审批',
      APPROVE = '审批通过',
      REJECT = '审批驳回',
      VOID = '作废',
      GENERATE_PO = '生成采购订单',
      UPDATE_REMARK = '更新备注',
      UPDATE_OWNER = '更新负责人',
      UPDATE_ATTACHMENT = '更新附件'
    }

    /** 查询参数 (根据MCP API规范: ReplenishmentRequestQueryParam) */
    interface QueryParam extends Api.Common.CommonSearchParams {
      /** 状态: 1草稿 2待审批 3待采购 4采购中 5已完成 6已驳回 7已作废 */
      status?: number
      /** 补货需求单号 */
      requestNo?: string
      /** 采购订单号 */
      purchaseOrderNo?: string
      /** SKU */
      sku?: string
      /** 中文品名 */
      productChineseName?: string
      /** SPU */
      spu?: string
      /** 中文款名 */
      spuName?: string
      /** 物料编码 */
      materialCode?: string
      /** 单据备注 */
      documentRemark?: string
      /** 产品备注 */
      itemRemark?: string
      /** 品牌ID列表 */
      brandIds?: number[]
      /** 分类ID列表 */
      categoryIds?: number[]
      /** 单据负责人ID列表 */
      responsiblePersonIds?: number[]
      /** 采购负责人ID列表 */
      purchaseResponsiblePersonIds?: number[]
      /** 创建时间起 */
      createTimeFrom?: string
      /** 创建时间止 */
      createTimeTo?: string
      /** 更新时间起 */
      updateTimeFrom?: string
      /** 更新时间止 */
      updateTimeTo?: string
      /** 期望交货时间起 */
      expectedDeliveryTimeFrom?: string
      /** 期望交货时间止 */
      expectedDeliveryTimeTo?: string
      /** 排序参数 */
      orderBy?: string
      /** 是否查询总量 */
      hasCount?: boolean
    }

    /** 各状态数量统计 (根据MCP: ReplenishmentRequestStatusCountVo) */
    interface StatusCount {
      /** 全部数量 */
      totalCount: number
      /** 草稿数量 */
      draftCount: number
      /** 待审批数量 */
      pendingApprovalCount: number
      /** 待采购数量 */
      pendingPurchaseCount: number
      /** 采购中数量 */
      purchasingCount: number
      /** 已完成数量 */
      completedCount: number
      /** 已驳回数量 */
      rejectedCount: number
      /** 已作废数量 */
      cancelledCount: number
    }

    /** 列表响应 (根据MCP: Page«ReplenishmentRequestDetailVo») */
    type ListResponse = Api.Common.PaginatedResponse<DetailVo>

    /** 列表响应 (兼容旧类型) */
    type List = Api.Common.PaginatedResponse<ListItem>

    /** 列表项 (兼容旧类型) */
    interface ListItem {
      /** 主键ID */
      id: number
      /** 补货需求单号 */
      requirementNo: string
      /** 申请理由 */
      applyReason: string
      /** 单据状态 */
      status: number
      /** 单据状态名称 */
      statusName: string
      /** 产品SKU数量 */
      productCount: number
      /** 申请补货总量 */
      totalQuantity: number
      /** 单据负责人名称(多个用逗号分隔) */
      ownerNames?: string
      /** 创建人名称 */
      creatorName: string
      /** 创建时间 */
      createTime: string
      /** 更新时间 */
      updateTime?: string
    }

    /** 补货需求单详情 (根据MCP: ReplenishmentRequestDetailVo) */
    interface DetailVo {
      /** 主键ID */
      id: number
      /** 单据编号 */
      requestNo: string
      /** 申请理由 */
      reason: string
      /** 单据备注 */
      documentRemark?: string
      /** 状态: 1草稿 2待审批 3待采购 4采购中 5已完成 6已驳回 7已作废 */
      status: number
      /** 负责人ID列表 */
      responsiblePersonIds?: number[]
      /** 负责人名称 */
      responsiblePersonNames?: string
      /** 创建人ID */
      createBy?: number
      /** 创建人名称 */
      createByName?: string
      /** 创建时间 */
      createTime?: string
      /** 更新人ID */
      updateBy?: number
      /** 更新人名称 */
      updateByName?: string
      /** 更新时间 */
      updateTime?: string
      /** 提交时间 */
      submitTime?: string
      /** 审批时间 */
      approveTime?: string
      /** 完成时间 */
      completeTime?: string
      /** 作废时间 */
      cancelTime?: string
      /** 生成采购订单时间 */
      generatePurchaseOrderTime?: string
      /** 附件列表 */
      attachments?: AttachmentItem[]
      /** 产品明细列表 */
      items?: ItemDetailVo[]
      /** 采购订单号 */
      purchaseOrderNos?: string[]
      /** 状态流 */
      statusFlowVos?: StatusFlowVo[]
    }

    /** 详情响应类型 */
    type DetailResponse = DetailVo

    /** 附件信息 (根据MCP: 附件) */
    interface AttachmentItem {
      /** 附件名称 */
      name?: string
      /** 附件uid */
      uid?: string
      /** 附件URL */
      url?: string
      /** 附件类型 */
      type?: string
      /** 附件大小 */
      size?: number
    }

    /** 状态流 (根据MCP: StatusFlowVo) */
    interface StatusFlowVo {
      /** 状态 */
      status?: number
      /** 状态名称 */
      statusName?: string
      /** 操作人ID */
      operatorId?: number
      /** 操作人名称 */
      operatorName?: string
      /** 操作时间 */
      operateTime?: string
      /** 备注 */
      remark?: string
    }

    /** 产品明细详情 (根据MCP: ReplenishmentRequestItemDetailVo) */
    interface ItemDetailVo {
      /** 明细ID */
      id?: number
      /** 补货需求单ID */
      requestId?: number
      /** SKU ID */
      skuId?: number
      /** SKU */
      sku?: string
      /** 中文品名 */
      productChineseName?: string
      /** SPU */
      spu?: string
      /** 款名 */
      spuName?: string
      /** 物料编码 */
      materialCode?: string
      /** 分类Id */
      categoryId?: number
      /** 分类名称 */
      categoryName?: string
      /** 品牌Id */
      brandId?: number
      /** 品牌名称 */
      brandName?: string
      /** 申请补货量 */
      requestQty?: number
      /** 已采购量 */
      purchasedQty?: number
      /** 单箱数量 */
      quantityPerBox?: number
      /** 箱数 */
      numberOfBoxes?: number
      /** 期望交货日期 */
      expectDeliveryDate?: string
      /** 采购负责人id */
      purchaseResponsiblePersonIds?: number[]
      /** 采购负责人名称 */
      responsiblePersonNames?: string
      /** 标签资料 */
      labelMaterial?: ItemLabel[]
      /** 备注 */
      remark?: string
      /** 创建时间 */
      createTime?: string
      /** 更新时间 */
      updateTime?: string
      /** 图片URL (显示用) */
      imageUrl?: string
      /** 图片地址 (传给后端) */
      picUrl?: string
      /** 单位 */
      unit?: string
      /** 采购主体ID */
      purchaseOrganizationId?: number
      /** 采购主体名称 */
      purchaseOrganizationName?: string
      /** 采购主体地址 */
      purchaseOrganizationAddress?: string
      /** 采购币种 */
      currency?: string
      /** 产品供应商报价 */
      productSupplierQuotationVo?: any[]
    }

    /** 标签资料 (根据MCP: ReplenishmentRequestItemLabel) */
    interface ItemLabel {
      /** 留言内容 */
      content?: string
      /** 标签名称 */
      labelName?: string
      /** 标签类型 */
      labelType?: string
      /** 标签文件链接 */
      labelUrl?: string
      /** 操作人 */
      operatingBy?: number
      /** 操作人名称 */
      operatingByName?: string
      /** 操作端 */
      operatingEnd?: string
      /** 上传时间 */
      uploadTime?: string
    }

    /** 产品级列表项(用于展示产品明细的列表视图) */
    interface ProductLevelListItem extends ProductItem {
      /** 需求单ID */
      requirementId: number
      /** 补货需求单号 */
      requirementNo: string
      /** 申请理由 */
      applyReason: string
      /** 单据状态 */
      requirementStatus: number
      /** 单据状态名称 */
      requirementStatusName: string
      /** 单据负责人名称(多个用逗号分隔) */
      ownerNames?: string
      /** 创建人名称 */
      creatorName: string
      /** 创建时间 */
      createTime: string
      /** 更新时间 */
      updateTime?: string
      /** 已采购量 */
      purchasedQuantity?: number
      /** 产品备注 */
      productRemark?: string
    }

    /** 产品级列表响应 */
    type ProductLevelList = Api.Common.PaginatedResponse<ProductLevelListItem>

    /** 详情实体 */
    interface Item {
      /** 主键ID */
      id: number
      /** 补货需求单号 */
      requirementNo: string
      /** 申请理由 */
      applyReason: string
      /** 单据状态 */
      status: number
      /** 单据状态名称 */
      statusName: string
      /** 单据负责人ID列表 */
      ownerIds: number[]
      /** 单据负责人名称列表 */
      ownerNames: string[]
      /** 单据备注 */
      documentRemark?: string
      /** 附件URL(多个用逗号分隔) */
      attachment?: string
      /** 产品明细列表 */
      productItems: ProductItem[]
      /** 创建人ID */
      creatorId: number
      /** 创建人名称 */
      creatorName: string
      /** 创建时间 */
      createTime: string
      /** 更新人名称 */
      updateByName?: string
      /** 更新时间 */
      updateTime?: string
    }

    /** 详情(含附件信息) */
    interface Detail {
      /** 主键ID */
      id: number
      /** 补货需求单号 */
      requirementNo: string
      /** 申请理由 */
      applyReason: string
      /** 单据状态 */
      status: number
      /** 单据状态名称 */
      statusName: string
      /** 单据负责人ID列表 */
      ownerIds: number[]
      /** 单据负责人名称(逗号分隔) */
      ownerNames: string
      /** 单据备注 */
      documentRemark?: string
      /** 附件数量 */
      attachmentCount: number
      /** 附件列表 */
      attachments?: Attachment[]
      /** 产品明细列表 */
      productItems: ProductItem[]
      /** 创建人ID */
      creatorId: number
      /** 创建人名称 */
      creatorName: string
      /** 创建时间 */
      createTime: string
      /** 更新时间 */
      updateTime?: string
      /** 采购单号(逗号拼接，用于表单展示) */
      purchaseOrderNo?: string
      /** 关联的采购订单列表(用于详情插槽展示与跳转) */
      purchaseOrders?: { purchaseOrderId: number; purchaseOrderNo: string }[]
    }

    /** 附件信息 */
    interface Attachment {
      /** 附件ID */
      id: number
      /** 文件名 */
      fileName: string
      /** 文件URL */
      fileUrl: string
      /** 文件大小(字节) */
      fileSize: number
      /** 上传时间 */
      uploadTime: string
    }

    /** 产品明细 */
    interface ProductItem {
      /** 明细ID */
      id?: number
      /** 产品SKU ID */
      productSkuId: number
      /** SKU编码 */
      sku: string
      /** 中文品名 */
      chineseProductName: string
      /** SPU编码 */
      spu: string
      /** 中文款名 */
      chineseStyleName: string
      /** 物料编码 */
      materialCode: string
      /** 分类路径 */
      categoryPath: string
      /** 品牌名称 */
      brandName: string
      /** 图片URL */
      imageUrl?: string
      /** 申请补货量 */
      requestQuantity: number
      /** 单箱数量 */
      quantityPerBox: number
      /** 箱数 */
      boxCount: number
      /** 期望交货时间 */
      expectedDeliveryDate: string
      /** 采购负责人ID */
      purchaserId?: number
      /** 采购负责人名称 */
      purchaserName?: string
      /** 资料状态 (0:草稿, 1:待审批, 2:已生效, 3:已驳回) */
      dataStatus: number
      /** 资料状态名称 */
      dataStatusName: string
      /** 标签资料URL(多个用逗号分隔) */
      labelMaterial?: string
      /** 产品备注 */
      remark?: string
      /** 箱数是否为整数 */
      isBoxCountInteger?: boolean
    }

    /** 保存参数 (根据MCP: SaveReplenishmentRequestReqVo) */
    interface SaveParams {
      /** 主键ID (编辑时传) */
      id?: number
      /** 申请理由 */
      reason: string
      /** 单据备注 */
      documentRemark?: string
      /** 负责人ID列表 */
      responsiblePersonIds?: number[]
      /** 附件列表 */
      attachments?: SaveAttachmentItem[]
      /** 产品明细列表 */
      items: SaveItemParams[]
      /** 是否提交: true-保存并提交审批, false-仅保存草稿 */
      submit?: boolean
    }

    /** 保存附件参数 (根据MCP: 附件) */
    interface SaveAttachmentItem {
      /** 附件名称 */
      name?: string
      /** 附件uid */
      uid?: string
      /** 附件地址 */
      url?: string
    }

    /** 保存明细参数 (根据MCP: ReplenishmentRequestItemVo) */
    interface SaveItemParams {
      /** 明细ID (编辑时传) */
      id?: number
      /** SKU ID */
      skuId?: number
      /** SKU */
      sku?: string
      /** 中文品名 */
      productChineseName?: string
      /** SPU */
      spu?: string
      /** 款名 */
      spuName?: string
      /** 物料编码 */
      materialCode?: string
      /** 品牌Id */
      brandId?: number
      /** 品牌名称 */
      brandName?: string
      /** 分类Id */
      categoryId?: number
      /** 分类名称 */
      categoryName?: string
      /** 申请补货量 */
      requestQty?: number
      /** 已采购量 */
      purchasedQty?: number
      /** 单箱数量 */
      quantityPerBox?: number
      /** 箱数 */
      numberOfBoxes?: number
      /** 期望交货日期 */
      expectDeliveryDate?: string
      /** 采购负责人ID列表 */
      purchaseResponsiblePersonIds?: number[]
      /** 标签资料 */
      labelMaterial?: ItemLabel[]
      /** 备注 */
      remark?: string
      /** 图片地址 (来自productSkuBasicVo) */
      picUrl?: string
      /** 单位 (来自productSkuBasicVo) */
      unit?: string
      /** 采购主体ID (来自productFinanceInfoVo) */
      purchaseOrganizationId?: number
      /** 采购主体名称 (来自productFinanceInfoVo) */
      purchaseOrganizationName?: string
      /** 采购主体地址 (来自productFinanceInfoVo) */
      purchaseOrganizationAddress?: string
      /** 采购币种 (来自productPurchaseBasicVo) */
      currency?: string
      /** 产品供应商报价 (来自productPurchaseBasicVo) */
      productSupplierQuotationVo?: any[]
    }

    /** 更新标签资料参数 (根据MCP: UpdateLabelDto) */
    interface UpdateLabelParams {
      /** 明细行业务ID */
      businessId: number
      /** 标签资料 */
      labelMaterial: ItemLabel[]
    }

    /** 创建参数(新增、暂存) - 兼容旧类型 */
    interface CreateParams {
      /** 申请理由 */
      applyReason: string
      /** 单据负责人ID列表 */
      ownerIds?: number[]
      /** 单据备注 */
      documentRemark?: string
      /** 附件URL */
      attachment?: string
      /** 产品明细列表 */
      productItems: ProductItemParams[]
      /** 单据状态 (0:草稿, 1:待审批) */
      status: number
    }

    /** 更新参数(编辑、暂存) - 兼容旧类型 */
    interface UpdateParams extends CreateParams {
      /** 主键ID */
      id: number
    }

    /** 产品明细参数 - 兼容旧类型 */
    interface ProductItemParams {
      /** 明细ID(编辑时传) */
      id?: number
      /** 产品SKU ID */
      productSkuId: number
      /** 申请补货量 */
      requestQuantity: number
      /** 单箱数量 */
      quantityPerBox: number
      /** 箱数 */
      boxCount: number
      /** 期望交货时间 */
      expectedDeliveryDate: string
      /** 标签资料URL */
      labelMaterial?: string
      /** 产品备注 */
      productRemark?: string
    }

    /** 操作日志列表 */
    type OperationLogList = Api.Common.PaginatedResponse<OperationLogItem>

    /** 操作日志项 */
    interface OperationLogItem {
      /** 日志ID */
      id: number
      /** 操作类型 */
      operationType: string
      /** 操作内容描述 */
      operationContent: string
      /** 操作人名称 */
      operatorName: string
      /** 操作时间 */
      operationTime: string
    }

    /** 操作日志(简化) */
    interface OperationLog {
      /** 日志ID */
      id: number
      /** 补货需求单ID */
      requirementId: number
      /** 操作类型 */
      operationType: string
      /** 操作人ID */
      operatorId: number
      /** 操作人名称 */
      operatorName: string
      /** 操作时间 */
      operationTime: string
      /** 备注 */
      remark?: string
    }

    /** 操作日志查询参数 */
    interface OperationLogQueryParam extends Api.Common.CommonSearchParams {
      /** 补货需求单ID */
      requirementId?: number
      /** 操作类型 */
      operationType?: string
    }

    /** 产品选择查询参数 */
    interface ProductSelectQueryParam extends Api.Common.CommonSearchParams {
      /** 搜索类型: sku, chineseProductName, spu, chineseStyleName, materialCode */
      searchType?: string
      /** 搜索值 */
      searchValue?: string
      /** SKU编码 (兼容旧版) */
      sku?: string
      /** 中文品名 (兼容旧版) */
      chineseProductName?: string
      /** SPU编码 (兼容旧版) */
      spu?: string
      /** 中文款名 (兼容旧版) */
      chineseStyleName?: string
      /** 物料编码 (兼容旧版) */
      materialCode?: string
      /** 分类ID列表 */
      categoryIds?: number[]
      /** 品牌ID列表 */
      brandIds?: number[]
      /** 资料状态列表 */
      dataStatusList?: number[]
    }

    /** 产品选择列表项 */
    interface ProductSelectItem {
      /** 产品SKU ID */
      productSkuId: number
      /** SKU编码 */
      sku: string
      /** 中文品名 */
      chineseProductName: string
      /** 图片URL (显示用) */
      imageUrl?: string
      /** 图片地址 (传给后端) */
      picUrl?: string
      /** SPU编码 */
      spu: string
      /** 中文款名 */
      chineseStyleName: string
      /** 物料编码 */
      materialCode: string
      /** 分类ID */
      categoryId?: number
      /** 分类路径 */
      categoryPath: string
      /** 品牌ID */
      brandId?: number
      /** 品牌名称 */
      brandName: string
      /** 单箱数量(从SKU资料带出) */
      quantityPerBox: number
      /** 采购负责人ID */
      purchaserId?: number
      /** 采购负责人名称 */
      purchaserName?: string
      /** 资料状态 (0:草稿, 1:待审批, 2:已生效, 3:已驳回) */
      dataStatus: number
      /** 资料状态名称 */
      dataStatusName: string
      /** 单位 (来自productSkuBasicVo) */
      unit?: string
      /** 采购主体ID (来自productFinanceInfoVo) */
      purchaseOrganizationId?: number
      /** 采购主体名称 (来自productFinanceInfoVo) */
      purchaseOrganizationName?: string
      /** 采购主体地址 (来自productFinanceInfoVo) */
      purchaseOrganizationAddress?: string
      /** 采购币种 (来自productPurchaseBasicVo) */
      currency?: string
      /** 产品供应商报价 (来自productPurchaseBasicVo) */
      productSupplierQuotationVo?: any[]
    }
  }

  /** 调拨单模块 */
  namespace Transfer {
    /** 调拨单状态: 1待配货 2待发货 3待收货 4已完成 5已作废 */
    type Status = 1 | 2 | 3 | 4 | 5

    /** 运输方式 */
    type TransportMethod =
      | 'SEA_FCL'
      | 'SEA_LCL'
      | 'AIR'
      | 'EXPRESS'
      | 'TRUCK'
      | 'RAIL'
      | 'MULTIMODAL'

    /** 调拨单列表查询参数 */
    interface QueryParams extends Common.CommonSearchParams {
      /** 状态 */
      status?: Status
      /** 调拨单号/询价单号/货件编号等模糊搜索 */
      keyword?: string
      /** 搜索类型 */
      searchType?: string
      /** 创建时间开始 */
      createTimeStart?: string
      /** 创建时间结束 */
      createTimeEnd?: string
      /** 更新时间开始 */
      updateTimeStart?: string
      /** 更新时间结束 */
      updateTimeEnd?: string
      /** 期望发货时间开始 */
      expectShipTimeStart?: string
      /** 期望发货时间结束 */
      expectShipTimeEnd?: string
      /** 预计到货时间开始 */
      expectArrivalTimeStart?: string
      /** 预计到货时间结束 */
      expectArrivalTimeEnd?: string
      /** 调出仓IDs */
      sourceWarehouseIds?: number[]
      /** 调入仓IDs */
      targetWarehouseIds?: number[]
      /** 运输方式 */
      transportMethods?: TransportMethod[]
      /** 物流渠道IDs */
      logisticsChannelIds?: number[]
      /** 物流商IDs */
      logisticsProviderIds?: number[]
      /** 单据负责人IDs */
      responsiblePersonIds?: number[]
      /** 店铺IDs */
      shopIds?: number[]
      /** 分类IDs */
      categoryIds?: number[]
      /** 品牌IDs */
      brandIds?: number[]
    }

    /** 调拨单列表项 */
    interface ListItem {
      /** ID */
      id: number
      /** 调拨单号 */
      transferNo: string
      /** 状态 */
      status: Status
      /** 状态名称 */
      statusName: string
      /** 调出仓库ID */
      sourceWarehouseId: number
      /** 调出仓库名称 */
      sourceWarehouseName: string
      /** 调入仓库ID */
      targetWarehouseId: number
      /** 调入仓库名称 */
      targetWarehouseName: string
      /** 调出主体 */
      sourceSubject?: string
      /** 调入主体 */
      targetSubject?: string
      /** 询价单号 */
      inquiryNo?: string
      /** 运输方式 */
      transportMethod?: TransportMethod
      /** 运输方式名称 */
      transportMethodName?: string
      /** 物流渠道 */
      logisticsChannel?: string
      /** 物流商 */
      logisticsProvider?: string
      /** 预计到货时间 */
      expectArrivalTime?: string
      /** 计划发货时间 */
      planShipTime?: string
      /** 计划发货周 */
      planShipWeek?: string
      /** 单据负责人IDs */
      responsiblePersonIds?: number[]
      /** 单据负责人名称 */
      responsiblePersonNames?: string
      /** 单据备注 */
      documentRemark?: string
      /** 总调拨量 */
      totalTransferQty: number
      /** 总已发货量 */
      totalShippedQty: number
      /** 总已签收量 */
      totalReceivedQty: number
      /** 创建人 */
      createByName?: string
      /** 创建时间 */
      createTime: string
      /** 更新时间 */
      updateTime?: string
      /** 产品明细 */
      items?: TransferItem[]
    }

    /** 调拨单产品明细 */
    interface TransferItem {
      /** ID */
      id: number
      /** 调拨单ID */
      transferId: number
      /** SKU ID */
      skuId: number
      /** SKU */
      sku: string
      /** 中文品名 */
      chineseProductName: string
      /** 物料编码 */
      materialCode: string
      /** 图片URL */
      imageUrl?: string
      /** 店铺ID */
      shopId?: number
      /** 店铺名称 */
      shopName?: string
      /** 销售SKU */
      salesSku?: string
      /** FNSKU */
      fnsku?: string
      /** 调拨量 */
      transferQty: number
      /** 已发货量 */
      shippedQty: number
      /** 已签收量 */
      receivedQty: number
      /** 待收货量 */
      pendingReceiveQty: number
      /** 单箱数量 */
      quantityPerBox: number
      /** 箱数 */
      boxCount: number
      /** 单箱尺寸 */
      boxSize?: string
      /** 单箱毛重(kg) */
      boxGrossWeight?: number
      /** 总重量(kg) */
      totalWeight?: number
      /** 总体积(m³) */
      totalVolume?: number
      /** 关联发货计划编号 */
      shippingPlanNo?: string
      /** 关联发货计划ID */
      shippingPlanId?: number
      /** 关联货件编号 */
      shipmentNo?: string
      /** 关联货件ID */
      shipmentId?: number
      /** 标签资料 */
      labelMaterials?: LabelMaterial[]
    }

    /** 标签资料 */
    interface LabelMaterial {
      /** ID */
      id: number
      /** 文件名 */
      fileName: string
      /** 文件URL */
      fileUrl: string
      /** 文件大小 */
      fileSize?: number
    }

    /** 调拨单详情 */
    interface Detail extends ListItem {
      /** 附件列表 */
      attachments?: Attachment[]
      /** 状态流 */
      statusFlowVos?: StatusFlow[]
    }

    /** 附件 */
    interface Attachment {
      /** ID */
      id: number
      /** 文件名 */
      fileName: string
      /** 文件URL */
      fileUrl: string
      /** 文件大小 */
      fileSize?: number
    }

    /** 状态流 */
    interface StatusFlow {
      /** 节点名称 */
      flowNodeName: string
      /** 创建时间 */
      createTime: string
      /** 操作人 */
      operatorName?: string
      /** 备注 */
      remark?: string
    }

    /** 收货参数 */
    interface ReceiveParams {
      /** 调拨单ID */
      transferId: number
      /** 收货明细 */
      items: {
        /** 明细ID */
        itemId: number
        /** 本次收货量 */
        receiveQty: number
      }[]
    }

    /** 编辑负责人参数 */
    interface EditResponsiblePersonParams {
      /** 调拨单ID */
      id: number
      /** 负责人IDs */
      responsiblePersonIds: number[]
    }
  }

  /** 供应商端发货单模块 */
  namespace SupplierDelivery {
    /** 发货单状态: 1待配货 2已配货 3待提货 4已发货 5已作废 */
    type Status = 1 | 2 | 3 | 4 | 5

    /** 发货单列表查询参数 */
    interface QueryParams extends Common.CommonSearchParams {
      /** 状态 */
      status?: Status
      /** 发货单号/计划编号/SKU等模糊搜索 */
      keyword?: string
      /** 搜索类型 */
      searchType?: string
      /** 创建时间开始 */
      createTimeStart?: string
      /** 创建时间结束 */
      createTimeEnd?: string
      /** 更新时间开始 */
      updateTimeStart?: string
      /** 更新时间结束 */
      updateTimeEnd?: string
      /** 计划发货时间开始 */
      planShipTimeStart?: string
      /** 计划发货时间结束 */
      planShipTimeEnd?: string
      /** 预计到货时间开始 */
      expectArrivalTimeStart?: string
      /** 预计到货时间结束 */
      expectArrivalTimeEnd?: string
      /** 发货仓库IDs */
      warehouseIds?: number[]
    }

    /** 发货单列表项 */
    interface ListItem {
      /** ID */
      id: number
      /** 发货单号 */
      deliveryNo: string
      /** 关联调拨单ID */
      transferId: number
      /** 关联调拨单号 */
      transferNo: string
      /** 状态 */
      status: Status
      /** 状态名称 */
      statusName: string
      /** 发货仓库ID */
      warehouseId: number
      /** 发货仓库名称 */
      warehouseName: string
      /** 目的仓库名称 */
      targetWarehouseName: string
      /** 计划发货时间 */
      planShipTime?: string
      /** 预计到货时间 */
      expectArrivalTime?: string
      /** 总发货量 */
      totalDeliveryQty: number
      /** 总已发货量 */
      totalShippedQty: number
      /** 创建时间 */
      createTime: string
      /** 更新时间 */
      updateTime?: string
      /** 产品明细 */
      items?: DeliveryItem[]
    }

    /** 发货单产品明细 */
    interface DeliveryItem {
      /** ID */
      id: number
      /** 发货单ID */
      deliveryId: number
      /** SKU ID */
      skuId: number
      /** SKU */
      sku: string
      /** 中文品名 */
      chineseProductName: string
      /** 物料编码 */
      materialCode: string
      /** 图片URL */
      imageUrl?: string
      /** 发货量 */
      deliveryQty: number
      /** 已发货量 */
      shippedQty: number
      /** 单箱数量 */
      quantityPerBox: number
      /** 箱数 */
      boxCount: number
      /** 标签资料 */
      labelMaterials?: Transfer.LabelMaterial[]
    }

    /** 发货单详情 */
    interface Detail extends ListItem {
      /** 附件列表 */
      attachments?: Transfer.Attachment[]
      /** 状态流 */
      statusFlowVos?: Transfer.StatusFlow[]
    }

    /** 预约取件参数 */
    interface BookPickupParams {
      /** 发货单ID */
      deliveryId: number
      /** 预约取件时间 */
      pickupTime: string
      /** 取件联系人 */
      contactPerson: string
      /** 取件联系电话 */
      contactPhone: string
      /** 取件联系人邮箱 */
      contactEmail?: string
      /** 取件地址 */
      pickupAddress: string
    }

    /** 确认发货参数 */
    interface ConfirmShipParams {
      /** 发货单ID */
      deliveryId: number
      /** 提货凭证(附件URL) */
      pickupVoucherUrls: string[]
    }
  }

  /** 物流方案类型 */
  namespace LogisticsMethod {
    /** 状态: 0禁用 1启用 */
    type Status = 0 | 1

    /** 运输方式 */
    type TransportMethod =
      | 'SEA_FCL'
      | 'SEA_LCL'
      | 'AIR'
      | 'EXPRESS'
      | 'TRUCK'
      | 'RAIL'
      | 'MULTIMODAL'

    /** 计费方式 */
    type BillingMethod = 'WEIGHT' | 'VOLUME'

    /** 计重规则 */
    type WeightingRule = 'TICKET' | 'PIECE'

    /** 进位规则 */
    type RoundingRule = 'UP_1' | 'UP_0_5'

    /** 货物属性 */
    type CargoAttribute =
      | '普货'
      | '带磁'
      | '带电'
      | '纯电池'
      | '粉末'
      | '液体'
      | '纺织品'
      | '食品'
      | '其他'

    /** 列表查询参数 */
    interface QueryParams extends Common.CommonSearchParams {
      /** 关键字搜索 */
      keyword?: string
      /** 搜索类型: methodCode 方案编码, methodName 方案名称 */
      searchType?: string
      /** 状态列表 */
      statusList?: Status[]
      /** 运输方式列表 */
      transportMethods?: TransportMethod[]
      /** 物流渠道IDs */
      channelIds?: number[]
      /** 是否包税 */
      includeTaxList?: boolean[]
      /** 支持发货地省份 */
      originProvinces?: string[]
      /** 支持目的国家（API 传参用） */
      destinationCountries?: string[]
      /** 支持目的国家-洲/国家级联（表单内部用，每项为 [洲, 国家code]） */
      destinationCountryArr?: string[][]
      /** 物流商IDs */
      providerIds?: number[]
      /** 头程承运商 */
      firstMileCarriers?: string[]
      /** 尾程承运商 */
      lastMileCarriers?: string[]
      /** 可接货物属性 */
      cargoAttributes?: CargoAttribute[]
      /** 是否接一般贸易 */
      acceptGeneralTradeList?: boolean[]
      /** 计费方式 */
      billingMethods?: BillingMethod[]
    }

    /** 列表项 */
    interface ListItem {
      id: number
      /** 方案编码 */
      methodCode: string
      /** 方案名称 */
      methodName: string
      /** 物流商ID */
      providerId: number
      /** 物流商名称 */
      providerName: string
      /** 物流商简称 */
      providerShortName: string
      /** 运输方式编码 */
      transportMethod: TransportMethod
      /** 运输方式名称 */
      transportMethodName: string
      /** 物流渠道ID */
      channelId?: number
      /** 物流渠道名称 */
      channelName?: string
      /** 出运/截止时间 */
      cutoffTime: string
      /** 头程承运商 */
      firstMileCarrier: string
      /** 尾程承运商 */
      lastMileCarrier: string
      /** 发货省份 */
      originProvince?: string
      /** 发货城市 */
      originCity?: string
      /** 目的国家 */
      destinationCountry?: string
      /** 可接货物属性 */
      cargoAttribute: string
      /** 是否包税 */
      includeTax: boolean
      /** 是否接一般贸易 */
      acceptGeneralTrade: boolean
      /** 计费方式 */
      billingMethod: BillingMethod
      /** 计费方式名称 */
      billingMethodName: string
      /** 体积重量比（按体积计费时） */
      volumeWeightRatio?: number
      /** 单票最低消费体积（按体积计费时） */
      minBillingVolume?: number
      /** 计重规则（按重量计费时） */
      weightingRule?: WeightingRule
      /** 计重规则名称 */
      weightingRuleName?: string
      /** 材积参数（按重量计费时） */
      dimensionalFactor?: number
      /** 单票最小计费重（按重量计费时） */
      minBillingWeight?: number
      /** 单件最小计费重（按重量计费时） */
      minPieceBillingWeight?: number
      /** 进位规则 */
      roundingRule: RoundingRule
      /** 进位规则名称 */
      roundingRuleName: string
      /** 状态 */
      status: Status
      /** 状态名称 */
      statusName: string
      /** 创建人 */
      createByName: string
      /** 创建时间 */
      createTime: string
      /** 更新时间 */
      updateTime: string
    }

    /** 详情 */
    interface Detail extends ListItem {
      /** 最大重量限制（KG） */
      maxWeight?: number
      /** 最大体积限制（CBM） */
      maxVolume?: number
      /** 备注 */
      remark?: string
      /** 附件 */
      attachments?: Array<{
        id?: number
        name: string
        url: string
      }>
    }

    /** 保存参数 */
    interface SaveParams {
      /** ID (编辑时传入) */
      id?: number
      /** 物流商ID */
      providerId: number
      /** 物流商名称 */
      providerName?: string
      /** 方案名称 */
      methodName: string
      /** 运输方式 */
      transportMethod: TransportMethod
      /** 物流渠道ID */
      channelId?: number
      /** 物流渠道名称 */
      channelName?: string
      /** 出运/截止时间 */
      cutoffTime?: string
      /** 头程承运商 */
      firstMileCarrier?: string
      /** 尾程承运商 */
      lastMileCarrier?: string
      /** 发货省份（单选时） */
      originProvince?: string
      /** 发货地多选：每项为 "省" 或 "省/市" */
      originProvinces?: string[]
      /** 发货城市 */
      originCity?: string
      /** 目的国家（单选时） */
      destinationCountry?: string
      /** 目的国多选：每项为 "洲" 或 "洲/国家" */
      destinationCountries?: string[]
      /** 可接货物属性 */
      cargoAttribute?: CargoAttribute | string
      /** 是否包税 */
      includeTax: boolean
      /** 是否接一般贸易 */
      acceptGeneralTrade?: boolean
      /** 计费方式 */
      billingMethod: BillingMethod
      /** 体积重量比 */
      volumeWeightRatio?: number
      /** 单票最低消费体积 */
      minBillingVolume?: number
      /** 计重规则 */
      weightingRule?: WeightingRule
      /** 材积参数 */
      dimensionalFactor?: number
      /** 单票最小计费重 */
      minBillingWeight?: number
      /** 单件最小计费重 */
      minPieceBillingWeight?: number
      /** 进位规则 */
      roundingRule?: RoundingRule
      /** 最大重量限制（KG） */
      maxWeight?: number
      /** 最大体积限制（CBM） */
      maxVolume?: number
      /** 备注 */
      remark?: string
      /** 状态 */
      status?: Status
    }
  }

  /** 物流渠道类型 */
  namespace LogisticsChannel {
    /** 状态: 0禁用 1启用 */
    type Status = 0 | 1

    /** 列表查询参数 */
    interface QueryParams extends Common.CommonSearchParams {
      /** 搜索类型：channel_name-物流渠道，plan_name-关联物流方案名称，channel_desc-渠道描述 */
      searchType?: 'channel_name' | 'plan_name' | 'channel_desc'
      /** 搜索值 */
      searchValue?: string
      /** 状态列表 */
      statusList?: Status[]
      /** 最近更新时间开始 */
      updateTimeStart?: string
      /** 最近更新时间结束 */
      updateTimeEnd?: string
    }

    /** 关联物流方案信息 */
    interface TransportPlan {
      /** 物流方案ID */
      id: number
      /** 物流商名称 */
      logisticsProviderName?: string
      /** 物流方案名称 */
      planName?: string
      /** 运输方式 */
      transportMode?: string
    }

    /** 列表项 */
    interface ListItem {
      id: number
      /** 物流渠道名称 */
      channelName: string
      /** 预计整体时效（天） */
      estimatedDays: number
      /** 状态 */
      status: Status
      /** 状态名称 */
      statusName: string
      /** 渠道描述 */
      description: string
      /** 关联物流方案数量 */
      methodCount: number
      /** 关联物流方案名称（逗号分隔） */
      methodNames: string
      /** 关联物流方案简要信息（用于下拉展开显示） */
      methods?: Array<{
        id: number
        methodName: string
        providerName: string
        transportMode: string
      }>
      /** 关联物流方案列表 */
      transportPlanList?: TransportPlan[]
      /** 创建人ID */
      createBy?: number
      /** 创建人 */
      createByName: string
      /** 创建时间 */
      createTime: string
      /** 更新人ID */
      updateBy?: number
      /** 更新人 */
      updateByName?: string
      /** 更新时间 */
      updateTime: string
    }

    /** 关联的物流方案 */
    interface LinkedMethod {
      id: number
      methodCode: string
      methodName: string
      /** 物流商名称 */
      logisticsProviderName?: string
      /** 运输方式 */
      transportMode?: string
    }

    /** 详情 */
    interface Detail extends ListItem {
      /** 关联的物流方案列表 */
      methods: LinkedMethod[]
    }

    /** 保存参数 */
    interface SaveParams {
      /** ID (编辑时传入) */
      id?: number
      /** 物流渠道名称 */
      channelName: string
      /** 预计整体时效（天） */
      estimatedDays: number
      /** 状态 */
      status: Status
      /** 渠道描述 */
      description: string
      /** 关联的物流方案ID列表 */
      methodIds?: number[]
    }
  }

  /** 物流运单模块 */
  namespace Waybill {
    /** 物流运单状态枚举 */
    type Status =
      | 'WAIT_ORDER' // 待下单
      | 'WAIT_ACCEPT' // 待接单
      | 'PRE_GENERATED' // 预生成
      | 'REJECTED' // 已拒绝
      | 'WAIT_PICKUP' // 待揽收
      | 'WAIT_MEASURE' // 待测量
      | 'WAIT_CONFIRM_FEE' // 待确认费用
      | 'WAIT_TRANSPORT' // 待运输
      | 'IN_TRANSPORT' // 运输中
      | 'COMPLETED' // 已完成
      | 'CANCELED' // 已取消

    /** 运输方式枚举（与接口 transportMode/transportModeList 对齐） */
    type TransportMode =
      | 'sea_fcl' // 海运整柜
      | 'sea_lcl' // 海运拼柜
      | 'air' // 空运
      | 'express' // 快递
      | 'truck' // 卡航
      | 'rail' // 铁路
      | 'multimodal' // 多式联运
      | 'SEA_DELIVERY' // 海递（兼容旧值）
      | 'TRUCK' // 兼容旧值

    /** 费用类型 */
    type FeeKind = 'ESTIMATE' | 'ACTUAL'

    /** 附件类型 */
    type AttachmentType =
      | 'MARK' // 物流唛
      | 'PICKUP_PROOF' // 提货凭证
      | 'DELIVERY_NOTE' // 送货单
      | 'CUSTOMS_DOC' // 报关资料
      | 'RELEASE_NOTICE' // 放行通知单
      | 'CUSTOMS_BILL' // 报关底单
      | 'BILL_OF_LADING' // 提单
      | 'SIGN_PROOF' // 签收凭证
      | 'OTHER' // 其他

    /** 附件状态 */
    type AttachmentStatus =
      | 'CLB_UPLOAD' //(物流商协同端已上传),
      | 'CLB_COMMIT' //(物流商协同端已提交),
      | 'BS_UPLOAD' //(业务端已上传),
      | 'BS_COMMIT' //(业务端已提交),
      | 'CLB_W_UPLOAD' //(供应商协同端已上传),
      | 'CLB_W_COMMIT' //(供应商协同端已提交),
      | 'DELETED' //(已删除)

    /** 操作端 */
    type OperateEnd = 'BIZ' | 'SUPPLIER' | 'LOGISTICS'

    /** 附加费类型 */
    type ExtraFeeType =
      | 'FUEL' // 燃油附加费
      | 'CUSTOMS' // 一般贸易报关费
      | 'PAGE' // 续页附加费
      | 'CLEARANCE' // 清关费
      | 'TAX_ADVANCE' // 税金垫付手续费
      | 'SPECIAL' // 特殊产品附加费
      | 'SINGLE_ITEM_NAME' // 单票品名附加费
      | 'ITEM_NAME' // 单件品名附加费
      | 'SINGLE_ITEM' // 单票单件附加费
      | 'NON_FBA' // 非FBA地址附加费
      | 'REMOTE' // 偏远地区附加费
      | 'OVERSIZE' // 超大包裹附加费
      | 'OTHER' // 其他

    /** 搜索类型 */
    type SearchType = 'WAYBILL_NO' | 'CARGO_NO' | 'CUSTOM_NO'

    /** 分页查询参数 */
    interface QueryParams extends Common.CommonSearchParams {
      /** 搜索类型 */
      searchType?: SearchType
      /** 搜索内容 */
      searchValue?: string
      /** 物流运单状态列表 */
      statusList?: Status[]
      /** 运输方式列表 */
      transportModeList?: TransportMode[]
      /** 物流运输状态列表 */
      transportStatusList?: string[]
      /** 物流渠道ID列表 */
      logisticsChannelIdList?: number[]
      /** 物流方案ID列表 */
      transportPlanIdList?: number[]
      /** 物流中心编码列表 */
      logisticsCenterCodeList?: string[]
      /** 单据负责人ID列表 */
      ownerIdList?: number[]
      /** 物流商ID列表(后端数据范围控制用) */
      logisticsProviderIdList?: number[]
      /** 创建时间-开始 */
      createTimeStart?: string
      /** 创建时间-结束 */
      createTimeEnd?: string
      /** 下单时间-开始 */
      orderTimeStart?: string
      /** 下单时间-结束 */
      orderTimeEnd?: string
      /** 接单时间-开始 */
      acceptTimeStart?: string
      /** 接单时间-结束 */
      acceptTimeEnd?: string
      /** 期望发货时间-开始 */
      expectShipTimeStart?: string
      /** 期望发货时间-结束 */
      expectShipTimeEnd?: string
      /** 实际发货时间-开始 */
      actualShipTimeStart?: string
      /** 实际发货时间-结束 */
      actualShipTimeEnd?: string
      /** 预计到货时间-开始 */
      etaTimeStart?: string
      /** 预计到货时间-结束 */
      etaTimeEnd?: string
      /** 实际签收时间-开始 */
      signTimeStart?: string
      /** 实际签收时间-结束 */
      signTimeEnd?: string
      /** 排序参数 */
      orderBy?: string
      /** 是否查询总量 */
      hasCount?: boolean
    }

    /** 列表项（与 TmsWaybillPageRespVo 对齐） */
    interface ListItem {
      /** 主键ID */
      id: number
      /** 物流运单号 */
      waybillNo: string
      /** 自定义单号 */
      customNo?: string
      /** 物流运单状态 */
      status: Status
      /** 物流运单状态名称 */
      statusName: string
      /** 运输方式 */
      transportMode?: TransportMode | string
      /** 运输方式名称 */
      transportModeName?: string
      /** 物流商名称 */
      logisticsProviderName?: string
      /** 物流渠道名称 */
      logisticsChannelName?: string
      /** 物流方案名称 */
      transportPlanName?: string
      /** 物流运输状态 */
      transportStatus?: string
      /** 货件编号（分号分隔） */
      cargoNos?: string
      /** Shipment ID（接口返回 array，前端展示为逗号分隔字符串） */
      shipmentId?: string | string[]
      /** Reference ID（接口返回 array，前端展示为逗号分隔字符串） */
      referenceId?: string | string[]
      /** 发货地 */
      shipFromPlace?: string
      /** 目的地 */
      shipToPlace?: string
      /** 箱数 */
      boxCount?: number
      /** 商品数量 */
      goodsQty?: number
      /** 总毛重(kg) */
      totalGrossWeight?: number
      /** 总体积(CBM) */
      totalVolume?: number
      /** 总体积重(kg) */
      totalVolumeWeight?: number
      /** 调出主体名称 */
      sourceEntityName?: string
      /** 调入主体名称 */
      destEntityName?: string
      /** 申报币种 */
      declareCurrency?: string
      /** 申报总金额 */
      declareTotalAmount?: number
      /** 预估费用币种 */
      estimateCurrency?: string
      /** 预估费用金额 */
      estimateTotalAmount?: number
      /** 预估计费体积(CBM) */
      estimateChargeVolume?: number
      /** 预估计费重(kg) */
      estimateChargeWeight?: number
      /** 测量费用币种 */
      measureCurrency?: string
      /** 测量费用金额 */
      measureTotalAmount?: number
      /** 测量计费体积(CBM) */
      measureChargeVolume?: number
      /** 测量计费重(kg) */
      measureChargeWeight?: number
      /** 下单时间 */
      orderTime?: string
      /** 实际签收时间 */
      signTime?: string
      /** 预计到货时间 */
      etaTime?: string
      /** 创建时间 */
      createTime?: string
      /** 更新时间 */
      updateTime?: string
    }

    /** 详情 */
    interface Detail {
      /** 主键ID */
      id: number
      /** 物流运单号 */
      waybillNo: string
      /** 自定义单号 */
      customNo?: string
      /** 物流运单状态 */
      status: Status
      /** 物流运单状态名称 */
      statusName?: string
      /** 运输方式 */
      transportMode?: TransportMode
      /** 运输方式名称 */
      transportModeName?: string
      /** 物流商ID */
      logisticsProviderId?: number
      /** 物流商名称 */
      logisticsProviderName?: string
      /** 物流渠道ID */
      logisticsChannelId?: number
      /** 物流渠道名称 */
      logisticsChannelName?: string
      /** 物流方案ID */
      transportPlanId?: number
      /** 物流方案编码 */
      transportPlanCode?: string
      /** 物流方案名称 */
      transportPlanName?: string
      /** 询价单号 */
      inquiryNo?: string
      /** 调拨单号 */
      transferNo?: string
      /** 联系人 */
      contactName?: string
      /** 联系电话 */
      contactPhone?: string
      /** 邮箱 */
      contactEmail?: string
      /** 单据负责人ID */
      ownerId?: number
      /** 单据负责人名称 */
      ownerName?: string
      /** 单据负责人ID列表 */
      ownerIdList?: number[]
      /** 单据负责人名称(逗号分隔) */
      ownerNames?: string
      /** 备注 */
      remark?: string
      /** 货件编号列表 */
      cargoNoList?: string[]
      /** 货件编号(分号分隔) */
      cargoNos?: string
      /** Shipment ID */
      shipmentId?: string
      /** Reference ID */
      referenceId?: string
      /** 物流中心编码 */
      logisticsCenterCode?: string
      /** 承运商 */
      carrier?: string
      /** 跟踪单号 */
      trackingNo?: string
      /** 物流运输状态 */
      transportStatus?: string
      // 地址信息
      /** 发货地地址ID */
      shipFromAddressId?: number
      /** 发货地-国家 */
      shipFromCountry?: string
      /** 发货地-省 */
      shipFromProvince?: string
      /** 发货地-城市 */
      shipFromCity?: string
      /** 发货地-街道 */
      shipFromStreet?: string
      /** 发货地-邮编 */
      shipFromPostCode?: string
      /** 目的地地址ID */
      shipToAddressId?: number
      /** 目的地-国家 */
      shipToCountry?: string
      /** 目的地-省 */
      shipToProvince?: string
      /** 目的地-城市 */
      shipToCity?: string
      /** 目的地-街道 */
      shipToStreet?: string
      /** 目的地-邮编 */
      shipToPostCode?: string
      // 汇总信息
      /** 总箱数 */
      boxCount?: number
      /** 商品数量 */
      goodsQty?: number
      /** 总毛重(kg) */
      totalGrossWeight?: number
      /** 总体积(CBM) */
      totalVolume?: number
      /** 总体积重(kg) */
      totalVolumeWeight?: number
      /** 申报币种 */
      declareCurrency?: string
      /** 申报价值 */
      declareTotalAmount?: number
      // 取件信息
      /** 取件信息ID */
      pickupId?: number
      /** 取件状态 */
      pickupStatus?: string
      /** 预约状态 */
      pickupAppointStatus?: string
      /** 预约取件时间 */
      pickupAppointTime?: string
      /** 取件联系人 */
      pickupContactName?: string
      /** 取件联系电话 */
      pickupContactPhone?: string
      /** 取件联系人邮箱 */
      pickupContactEmail?: string
      /** 取件地址 */
      pickupAddress?: string
      /** 提货凭证 */
      pickupVoucher?: string
      // 时间信息
      /** 下单时间 */
      orderTime?: string
      /** 接单时间 */
      acceptTime?: string
      /** 接单说明 */
      acceptRemark?: string
      /** 期望发货时间 */
      expectShipTime?: string
      /** 实际发货时间 */
      actualShipTime?: string
      /** 预计到货时间 */
      etaTime?: string
      /** 实际签收时间 */
      signTime?: string
      /** 期望时效(天) */
      expectTimelinessDays?: number
      /** 实际时效(天) */
      actualTimelinessDays?: number
      /** 取消原因 */
      cancelReason?: string
      /** 取消时间 */
      cancelTime?: string
      /** 创建时间 */
      createTime?: string
      /** 更新时间 */
      updateTime?: string
      // 子列表
      /** 装箱明细列表 */
      packageList?: PackageItem[]
      /** 测量数据列表 */
      measureList?: MeasureItem[]
      /** 费用信息列表 */
      feeList?: FeeItem[]
      /** 附件列表 */
      attachmentList?: AttachmentItem[]
      /** 轨迹信息ID */
      trackId?: number
      /** 状态流（流程节点，含 updateTime） */
      statusFlowVos?: Waybill.StatusFlowNode[]
    }

    /** 物流运单状态流节点 */
    interface StatusFlowNode {
      /** 节点名称 */
      flowNodeName?: string
      /** 节点状态：0-已完成，1-未完成 */
      flowNodeStatus?: number
      /** 创建时间 */
      createTime?: string
      /** 更新时间 */
      updateTime?: string
      /** 操作人 */
      userName?: string
      /** 备注 */
      remark?: string
    }

    /** 装箱明细 */
    interface PackageItem {
      /** 主键ID */
      id?: number
      /** 物流运单ID */
      waybillId?: number
      /** 箱号 */
      boxNo?: string
      /** 箱数 */
      boxQty?: number
      /** 单箱尺寸 */
      boxSize?: string
      /** 单箱毛重(kg) */
      boxGrossWeight?: number
      /** 总体积(CBM) */
      totalVolume?: number
      /** 总毛重(kg) */
      totalGrossWeight?: number
      /** Shipment ID */
      shipmentId?: string
      /** Reference ID */
      referenceId?: string
      /** SKU */
      sku?: string
      /** SKU ID（用于详情跳转） */
      skuId?: number
      /** SKU中文品名 */
      skuCnName?: string
      /** SPU */
      spu?: string
      /** SPU ID（用于详情跳转） */
      spuId?: number
      /** SPU中文款名 */
      spuCnName?: string
      /** 报关HSCODE */
      hsCode?: string
      /** 货物类型 */
      cargoType?: string
      /** 单箱数量 */
      qtyPerBox?: number
      /** 申报币种 */
      declareCurrency?: string
      /** 申报单价 */
      declareUnitPrice?: number
    }

    /** 测量数据 */
    interface MeasureItem {
      /** 主键ID */
      id?: number
      /** 箱号 */
      boxNo?: string
      /** 测量类型 */
      measureKind?: FeeKind
      /** 测量类型名称 */
      measureKindName?: string
      /** 标准重量(kg) */
      standardWeight?: number
      /** 标准长度(cm) */
      standardLength?: number
      /** 标准宽度(cm) */
      standardWidth?: number
      /** 标准高度(cm) */
      standardHeight?: number
      /** 实际测量重量(kg) */
      actualWeight?: number
      /** 实际测量长度(cm) */
      actualLength?: number
      /** 实际测量宽度(cm) */
      actualWidth?: number
      /** 实际测量高度(cm) */
      actualHeight?: number
      /** 测量凭证文件名列表 */
      voucherFileNameList?: string[]
      /** 测量凭证说明 */
      voucherRemark?: string
    }

    /** 附加费明细项 */
    interface ExtraFeeItem {
      /** 附加费类型 */
      feeType?: ExtraFeeType
      /** 金额 */
      amount?: number
      /** 币种 */
      currency?: string
      /** 费用说明 */
      remark?: string
    }

    /** 费用信息 */
    interface FeeItem {
      /** 主键ID */
      id?: number
      /** 费用类型 */
      feeKind?: FeeKind
      /** 费用类型名称 */
      feeKindName?: string
      /** 计费方式 */
      billingMethod?: string
      /** 材积参数 */
      volumeParam?: number
      /** 体积重量比 */
      volumeWeightRatio?: number
      /** 实重(kg) */
      weight?: number
      /** 体积(CBM) */
      volume?: number
      /** 计费重(kg) */
      chargeWeight?: number
      /** 计费体积(CBM) */
      chargeVolume?: number
      /** 运费单价 */
      freightUnitPrice?: number
      /** 运费单价币种 */
      freightUnitPriceCurrency?: string
      /** 运费金额 */
      freightAmount?: number
      /** 运费金额币种 */
      freightAmountCurrency?: string
      /** 税费 */
      taxAmount?: number
      /** 税费币种 */
      taxAmountCurrency?: string
      /** 折扣 */
      discountAmount?: number
      /** 折扣币种 */
      discountAmountCurrency?: string
      /** 总金额 */
      totalAmount?: number
      /** 总金额币种 */
      totalAmountCurrency?: string
      /** 附加费明细 */
      extraAmount?: ExtraFeeItem[]
    }

    /** 附件信息 */
    interface AttachmentItem {
      /** 主键ID */
      id?: number
      /** 物流运单ID */
      waybillId?: number
      /** 附件类型 */
      attachmentType?: AttachmentType
      /** 附件类型名称 */
      attachmentTypeName?: string
      /** 文件名称/路径 */
      fileName?: string
      /** 文件URL（OSS路径或完整URL） */
      fileUrl?: string
      /** 留言内容 */
      message?: string
      /** 操作端 */
      operateEnd?: OperateEnd
      /** 操作端名称 */
      operateEndName?: string
      /** 接收端 */
      receiveEnd?: OperateEnd
      /** 接收端名称 */
      receiveEndName?: string
      /** 状态 */
      status?: AttachmentStatus
      /** 状态名称 */
      statusName?: string
      /** 提交时间 */
      submitTime?: string
    }

    /** 状态数量统计 */
    interface StatusCount {
      /** 状态 */
      status: Status
      /** 数量 */
      cnt: number
    }

    /** 状态操作记录 */
    interface StatusLogItem {
      /** 主键ID */
      id: number
      /** 物流运单ID */
      waybillId: number
      /** 物流运单号 */
      waybillNo: string
      /** 物流运单状态 */
      status: Status
      /** 物流运单状态名称 */
      statusName: string
      /** 操作人ID */
      operatorId?: number
      /** 操作人名称 */
      operatorName?: string
      /** 操作时间 */
      operateTime?: string
      /** 备注 */
      remark?: string
    }

    /** 批量变更状态参数 */
    interface ChangeStatusBatchParams {
      /** 物流运单ID列表 */
      ids: number[]
      /** 目标状态 */
      status: Status
      /** 备注 */
      remark?: string
    }

    /** 确认接单参数(协同端) */
    interface AcceptOrderParams {
      /** 物流运单ID列表 */
      ids: number[]
      /** 接单结果: true接单 false拒绝 */
      accept: boolean
      /** 接单说明 */
      remark?: string
    }

    /** 提交测量参数(协同端) */
    interface SubmitMeasureParams {
      /** 物流运单ID */
      waybillId: number
      /** 测量数据列表 */
      measureList: {
        /** 测量ID */
        id: number
        /** 实际重量 */
        actualWeight?: number
        /** 实际长度 */
        actualLength?: number
        /** 实际宽度 */
        actualWidth?: number
        /** 实际高度 */
        actualHeight?: number
      }[]
      /** 追加费用列表 */
      extraFeeList?: ExtraFeeItem[]
      /** 测量凭证文件名列表 */
      voucherFileNameList?: string[]
    }

    /** 确认签收参数(协同端) */
    interface ConfirmSignParams {
      /** 物流运单ID列表 */
      ids: number[]
      /** 签收凭证文件名列表 */
      signProofFileNames?: string[]
    }

    /** 新增附件参数 */
    interface AddAttachmentParams {
      /** 物流运单ID */
      waybillId: number
      /** 附件类型 */
      attachmentType: AttachmentType
      /** 文件名称 */
      fileName?: string
      /** 留言内容 */
      message?: string
      /** 操作端 */
      operateEnd?: OperateEnd
      /** 接收端 */
      receiveEnd?: OperateEnd
      /** 状态 */
      status?: string
    }

    /** 附件状态变更参数 */
    interface ChangeAttachmentStatusParams {
      /** 附件ID列表 */
      ids: number[]
      /** 目标状态 */
      status: AttachmentStatus
    }

    /** 差异系数配置项 */
    interface DiffCoefficientItem {
      /** 主键ID */
      id: number
      /** 差异系数(小数形式，如0.05表示5%) */
      diffCoefficient: number
    }
  }

  /** 询价单类型 */
  namespace Inquiry {
    /** 询价单状态 */
    type Status =
      | 'WAIT_PUBLISH'
      | 'INQUIRING'
      | 'WAIT_CONFIRM'
      | 'COMPLETED'
      | 'CANCELED'
      | 'EXPIRED'

    /** 报价单状态 */
    type QuoteStatus = 'WAIT_QUOTE' | 'QUOTED' | 'EXPIRED'

    /** 搜索类型 */
    type SearchType = 'INQUIRY_NO' | 'WAYBILL_NO'

    /** 查询参数 */
    interface QueryParams {
      /** 当前页 */
      currentPage: number
      /** 每页数量 */
      pageSize: number
      /** 是否返回总数 */
      hasCount?: boolean
      /** 排序字段 */
      orderBy?: string
      /** 搜索类型 */
      searchType?: SearchType
      /** 搜索值 */
      searchValue?: string
      /** 状态列表 */
      statusList?: Status[]
      /** 运输方式列表 */
      transportModeList?: string[]
      /** 物流渠道ID列表 */
      logisticsChannelIdList?: number[]
      /** 物流商ID列表 */
      logisticsProviderIdList?: number[]
      /** 物流中心编码列表 */
      logisticsCenterCodeList?: string[]
      /** 单据负责人ID列表 */
      ownerIdList?: number[]
      /** 创建时间开始 */
      createTimeStart?: string
      /** 创建时间结束 */
      createTimeEnd?: string
      /** 发布时间开始 */
      publishTimeStart?: string
      /** 发布时间结束 */
      publishTimeEnd?: string
      /** 确认时间开始 */
      confirmTimeStart?: string
      /** 确认时间结束 */
      confirmTimeEnd?: string
      /** 期望发货时间开始 */
      expectShipTimeStart?: string
      /** 期望发货时间结束 */
      expectShipTimeEnd?: string
      /** 预计到货时间开始 */
      expectArrivalTimeStart?: string
      /** 预计到货时间结束 */
      expectArrivalTimeEnd?: string
    }

    /** 列表项 */
    interface ListItem {
      /** 主键ID */
      id: number
      /** 询价单号 */
      inquiryNo: string
      /** 状态 */
      status: Status
      /** 状态名称 */
      statusName?: string
      /** 已报价数 */
      quotedCount?: number
      /** 总询价数 */
      totalQuoteCount?: number
      /** 发货地 */
      shipFromPlace?: string
      /** 目的地 */
      shipToPlace?: string
      /** 运输方式 */
      transportMode?: string
      /** 运输方式名称 */
      transportModeName?: string
      /** 物流渠道ID */
      logisticsChannelId?: number
      /** 物流渠道名称 */
      logisticsChannelName?: string
      /** 柜子尺寸 */
      containerSize?: string
      /** 期望发货时间 */
      expectShipTime?: string
      /** 预计到货时间 */
      expectArrivalTime?: string
      /** 报价截止时间 */
      quoteDeadline?: string
      /** 关联调拨单号 */
      transferNo?: string
      /** 关联物流运单号 */
      waybillNo?: string
      /** 单据负责人ID */
      ownerId?: number
      /** 单据负责人名称 */
      ownerName?: string
      /** 发布时间 */
      publishTime?: string
      /** 确认时间 */
      confirmTime?: string
      /** 创建时间 */
      createTime?: string
      /** 报价列表 */
      quotationList?: QuoteItem[]
    }

    /** 报价项 */
    interface QuoteItem {
      /** 报价单ID */
      id: number
      /** 报价单号（API 返回 quotationNo） */
      quoteNo?: string
      /** 报价单号（API 字段） */
      quotationNo?: string
      /** 询价单ID */
      inquiryId: number
      /** 物流商ID */
      logisticsProviderId?: number
      /** 物流商名称 */
      logisticsProviderName?: string
      /** 物流方案ID */
      transportPlanId?: number
      /** 物流方案名称 */
      transportPlanName?: string
      /** 计费方式 */
      billingMethod?: string
      /** 计费方式名称 */
      billingMethodName?: string
      /** 计费方式（API 字段） */
      billingType?: string
      /** 计费方式名称（API 字段） */
      billingTypeName?: string
      /** 材积参数（API 返回 billingParam） */
      volumeParam?: number
      /** 材积参数（API 字段） */
      billingParam?: number
      /** 预计时效（旧字段，不再使用） */
      estimateTimeliness?: string
      /** 预计时效(天)（旧字段，不再使用） */
      estimatedDays?: number
      /** 预计时效-最小天数（API 字段） */
      estimatedDaysMin?: number
      /** 预计时效-最大天数（API 字段） */
      estimatedDaysMax?: number
      /** 总报价 */
      totalAmount?: number
      /** 报价币种（API 返回 totalAmountCurrency） */
      currency?: string
      /** 总金额币种（API 字段） */
      totalAmountCurrency?: string
      /** 报价有效期(天)（API 返回 validityDays） */
      validDays?: number
      /** 报价有效期(天)（API 字段） */
      validityDays?: number
      /** 状态 */
      status: QuoteStatus
      /** 状态名称 */
      statusName?: string
      /** 是否最优推荐（API 返回 isRecommended 0/1） */
      isRecommend?: boolean
      /** 是否最优推荐（API 字段） */
      isRecommended?: number
      /** 报价时间 */
      quoteTime?: string
      /** 创建时间（API 字段） */
      createTime?: string
      /** 费用明细列表（API 字段） */
      feeList?: Array<{
        feeName?: string
        amount?: number
        currency?: string
        feeType?: string
        remark?: string
      }>
    }

    /** 详情 */
    interface Detail extends ListItem {
      /** 发货地-国家（API 字段 originCountry） */
      shipFromCountry?: string
      /** 发货地-省（API 字段 originProvince） */
      shipFromProvince?: string
      /** 发货地-城市（API 字段 originCity） */
      shipFromCity?: string
      /** 发货地（API 字段 originPlace：国家-省-城市） */
      originPlace?: string
      /** 目的地-国家（API 字段 destCountry） */
      shipToCountry?: string
      /** 目的地-省 */
      shipToProvince?: string
      /** 目的地-城市 */
      shipToCity?: string
      /** 目的地（API 字段 destPlace） */
      destPlace?: string
      /** 物流中心编码 */
      logisticsCenterCode?: string
      /** 物流中心名称（API 字段） */
      logisticsCenterName?: string
      /** 备注 */
      remark?: string
      /** 调拨单ID（API 字段） */
      transferId?: number
      /** 是否一般贸易（API 字段 0/1） */
      generalTrade?: number
      /** 是否需要包税（API 字段 0/1） */
      taxIncludedRequired?: number
      // 汇总信息
      /** 总箱数（API 返回 totalBoxQty） */
      totalBoxQty?: number
      /** 总箱数 */
      boxCount?: number
      /** 商品数量（API 返回 totalProductQty） */
      totalProductQty?: number
      /** 商品数量 */
      goodsQty?: number
      /** 总毛重(kg) */
      totalGrossWeight?: number
      /** 总体积(CBM) */
      totalVolume?: number
      /** 总体积重(kg) */
      totalVolumeWeight?: number
      /** 计费重(kg) */
      chargeWeight?: number
      /** 申报币种 */
      declareCurrency?: string
      /** 申报价值 */
      declareTotalAmount?: number
      /** 货物信息列表（API 返回 packageList） */
      packageList?: CargoItem[]
      /** 货物信息列表 */
      cargoList?: CargoItem[]
      /** 报价列表（API 返回 quotationList） */
      quotationList?: QuoteItem[]
    }

    /** 货物信息项（API packageList 字段：skuName, spuName, boxProductQty） */
    interface CargoItem {
      /** 主键ID */
      id?: number
      /** 箱号 */
      boxNo?: string
      /** 箱数 */
      boxQty?: number
      /** 单箱尺寸 */
      boxSize?: string
      /** 单箱毛重(kg) */
      boxGrossWeight?: number
      /** 总体积(CBM) */
      totalVolume?: number
      /** 总毛重(kg) */
      totalGrossWeight?: number
      /** SKU/中文品名（API 字段 skuName） */
      skuName?: string
      /** SKU */
      sku?: string
      /** SKU中文品名 */
      skuCnName?: string
      /** SPU/中文款名（API 字段 spuName） */
      spuName?: string
      /** SPU */
      spu?: string
      /** SPU中文款名 */
      spuCnName?: string
      /** 单箱数量（API 字段 boxProductQty） */
      boxProductQty?: number
      /** 报关HSCODE */
      hsCode?: string
      /** 货物类型 */
      cargoType?: string
      /** 单箱数量 */
      qtyPerBox?: number
      /** 申报币种 */
      declareCurrency?: string
      /** 申报单价 */
      declareUnitPrice?: number
    }

    /** 报价详情 */
    interface QuoteDetail extends QuoteItem {
      /** 费用明细列表 */
      feeDetailList?: FeeDetailItem[]
      /** 折扣金额 */
      discountAmount?: number
    }

    /** 费用明细项 */
    interface FeeDetailItem {
      /** 序号 */
      seq?: number
      /** 费用项 */
      feeName?: string
      /** 计价单位 */
      unit?: string
      /** 计价数量 */
      qty?: number
      /** 单价 */
      unitPrice?: number
      /** 小计 */
      amount?: number
      /** 费用说明 */
      remark?: string
    }

    /** 状态数量统计 */
    interface StatusCount {
      /** 状态 */
      status: Status
      /** 数量 */
      cnt: number
    }
  }
}
