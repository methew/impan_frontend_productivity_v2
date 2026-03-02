// Accounting Application Types
// Based on 说明书/后端/02-Accounting-API.md

import type { Location, Person, Tag } from './core'

// ========== Unit ==========
export interface Unit {
  id: number
  code: string
  sig: string
  title: string
  title_zh: string
  title_ja: string
}

// ========== Commodity ==========
export type CommodityType = 'TANGIBLE' | 'CURRENCY' | 'INVESTMENT' | 'INTANGIBLE' | 'OTHER'
export type CommodityCategory = 'GOODS' | 'SERVICE' | 'DIGITAL' | 'RAW_MATERIAL' | 'SEMI_FINISHED' | 'FINISHED'

export interface Commodity {
  id: number
  ledger: number
  type: CommodityType
  sig: string
  code: string
  abbreviation: string
  title: string
  title_zh: string
  title_ja: string
  unit: number
  unit_name: string
  commodity_type: CommodityCategory
  brand: string
  model: string
  specifications: Record<string, unknown>
  net_weight: string | null
  gross_weight: string | null
  origin_country: string
  hs_code: number | null
  hs_code_code: string | null
  default_barcode: string
  details: Record<string, unknown>
  build_in: boolean
  is_valid: boolean
  commonly_use: boolean
  created_at: string
  updated_at: string
}

// ========== Ledger ==========
export interface Ledger {
  id: number
  title: string
  description: string
  start_date: string
  end_date: string
  default_currency: number | null
  default_currency_name: string | null
  default_payer: number | null
  default_payer_name: string | null
  default_payer_detail: Person | null
  default_location: number | null
  default_location_name: string | null
  default_location_detail: Location | null
  default_timezone: number | null
  default_timezone_name: string | null
  default_timezone_detail: {
    id: number
    iana_name: string
    standard_name: string
    utc_offset: string
  } | null
  is_default: boolean
  is_valid: boolean
  created_at: string
  updated_at: string
}

// ========== Fiscal Year ==========
export type FiscalYearStatus = 'OPEN' | 'CLOSED'

export interface FiscalYear {
  id: number
  ledger: number
  ledger_name: string
  year: number
  description: string
  start: string
  end: string
  status: FiscalYearStatus
  is_valid: boolean
}

// ========== Period ==========
export type PeriodStatus = 'OPEN' | 'CLOSED' | 'LOCKED'

export interface FiscalYearInfo {
  id: number
  year: number
  ledger_name: string
}

export interface Period {
  id: number
  fiscal_year: number
  fiscal_year_info: FiscalYearInfo
  number: number
  description: string
  start: string
  end: string
  status: PeriodStatus
}

// ========== Account ==========
export type AccountFirstGrade = 
  | 'ASSET' 
  | 'LIABILITY' 
  | 'EQUITY' 
  | 'REVENUE' 
  | 'INCOME' 
  | 'EXPENSE'

export type BookingMethod = 'STRICT' | 'LOOSE'

export interface Account {
  id: number
  ledger: number
  parent: number | null
  parent_name: string | null
  first_grade: AccountFirstGrade
  code: string
  abbreviation: string
  title: string
  title_zh: string
  title_ja: string
  default_currency: number | null
  currency_name: string | null
  open_date: string
  close_date: string
  details: Record<string, unknown>
  booking_method: BookingMethod
  is_inventory_account: boolean
  build_in: boolean
  is_valid: boolean
  abbreviated_path: string
  created_at: string
  updated_at: string
}

export interface AccountTreeNode extends Account {
  children: AccountTreeNode[]
}

export interface AccountBalance {
  account_id: number
  account_name: string
  balance: number
  currency: string
}

// ========== Transaction Entry ==========
export interface Entry {
  id: number
  number: number
  transaction_date: string
  description: string
  account: number
  account_name: string
  commodity: number | null
  commodity_name: string | null
  quantity: number
  unit_price: number
  debit: number | string  // Backend returns as string (Decimal)
  credit: number | string  // Backend returns as string (Decimal)
  total: number | string   // Backend returns as string (Decimal)
  currency: number
  currency_name: string | null
  lot: Record<string, unknown> | null
  is_valid: boolean
}

// ========== Transaction ==========
export type TransactionType = 'UNPAID' | 'PAID' | 'RECEIVABLE' | 'PAYABLE' | 'TRANSFER' | 'BALANCE' | 'CLAIM'

export interface PeriodInfo {
  id: number
  fiscal_year: number
  number: number
  description: string
}

export interface Transaction {
  id: number
  period: number
  period_info: PeriodInfo
  date: string
  number: number
  billing_date: string
  transaction_number: string
  type: TransactionType
  title: string
  description: string
  tags: number[]
  tags_list: Array<{ id: number; name: string }>
  tags_detail: Tag[]
  location: number | null
  location_detail: Location | null
  payee: number | null
  payee_detail: Person | null
  payer: number | null
  payer_detail: Person | null
  detail: Record<string, unknown>
  is_valid: boolean
  is_balanced: boolean
  entries: Entry[]
  created_at: string
  updated_at: string
}

// ========== Ledger Entry View ==========
export interface LedgerEntryViewAccount {
  id: number
  name: string
  code: string
  type: AccountFirstGrade
}

export interface LedgerEntryViewEntry {
  id: number
  number: number
  transaction_date: string
  description: string
  receipt_number: number
  receipt_date: string
  account_name: string
  debit: number
  credit: number
  quantity: number
  unit_price: number
}

export interface LedgerEntryViewSummary {
  total_debit: number
  total_credit: number
  closing_balance: number
}

export interface LedgerEntryView {
  account: LedgerEntryViewAccount
  opening_balance: number
  entries: LedgerEntryViewEntry[]
  summary: LedgerEntryViewSummary
  count: number
}

// ========== HSCode ==========
export interface HSCode {
  id: number
  code: string
  description: string
  description_zh: string
  parent: number | null
  unit: number | null
  unit_2: number | null
  import_tax_rate: number | null
  export_tax_rate: number | null
  is_valid: boolean
  created_at: string
  updated_at: string
}

// ========== Barcode ==========
export type BarcodeType = 
  | 'EAN_13' 
  | 'EAN_8' 
  | 'UPC_A' 
  | 'UPC_E' 
  | 'GTIN_14' 
  | 'CODE_128' 
  | 'CODE_39' 
  | 'ITF_14' 
  | 'ISBN' 
  | 'ISSN'

export interface Barcode {
  id: number
  barcode: string
  barcode_type: BarcodeType
  commodity: number
  is_primary: boolean
  is_valid: boolean
  barcode_image: string | null
  created_at: string
  updated_at: string
}
