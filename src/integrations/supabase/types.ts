export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      acc_vouchers: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          branch_id: string | null
          created_at: string
          created_by: string | null
          description: string | null
          financial_year_id: string | null
          id: string
          status: string
          total_amount: number
          updated_at: string
          voucher_date: string
          voucher_number: string
          voucher_type: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          financial_year_id?: string | null
          id?: string
          status?: string
          total_amount?: number
          updated_at?: string
          voucher_date?: string
          voucher_number: string
          voucher_type: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          financial_year_id?: string | null
          id?: string
          status?: string
          total_amount?: number
          updated_at?: string
          voucher_date?: string
          voucher_number?: string
          voucher_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "acc_vouchers_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acc_vouchers_financial_year_id_fkey"
            columns: ["financial_year_id"]
            isOneToOne: false
            referencedRelation: "financial_years"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance: {
        Row: {
          check_in: string | null
          check_out: string | null
          created_at: string
          date: string
          employee_id: string
          id: string
          notes: string | null
          status: string
        }
        Insert: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          employee_id: string
          id?: string
          notes?: string | null
          status?: string
        }
        Update: {
          check_in?: string | null
          check_out?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          id?: string
          notes?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          details: string | null
          id: string
          ip_address: string | null
          module: string
          new_data: Json | null
          old_data: Json | null
          record_id: string | null
          user_agent: string | null
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          module: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: string | null
          id?: string
          ip_address?: string | null
          module?: string
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string | null
          user_agent?: string | null
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: []
      }
      backup_history: {
        Row: {
          backup_type: string
          created_at: string
          created_by: string | null
          error_message: string | null
          file_name: string
          file_size: number
          format: string
          id: string
          records_count: number
          status: string
          storage_path: string | null
          tables_count: number
        }
        Insert: {
          backup_type?: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          file_name: string
          file_size?: number
          format?: string
          id?: string
          records_count?: number
          status?: string
          storage_path?: string | null
          tables_count?: number
        }
        Update: {
          backup_type?: string
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          file_name?: string
          file_size?: number
          format?: string
          id?: string
          records_count?: number
          status?: string
          storage_path?: string | null
          tables_count?: number
        }
        Relationships: []
      }
      backup_settings: {
        Row: {
          auto_backup_enabled: boolean
          id: string
          last_auto_backup_at: string | null
          retention_days: number
          schedule_interval: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          auto_backup_enabled?: boolean
          id?: string
          last_auto_backup_at?: string | null
          retention_days?: number
          schedule_interval?: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          auto_backup_enabled?: boolean
          id?: string
          last_auto_backup_at?: string | null
          retention_days?: number
          schedule_interval?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      bill_of_materials: {
        Row: {
          created_at: string
          id: string
          name: string
          notes: string | null
          product_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          product_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bill_of_materials_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "item_master"
            referencedColumns: ["id"]
          },
        ]
      }
      biometric_devices: {
        Row: {
          created_at: string
          device_name: string
          id: string
          ip_address: string
          last_sync_at: string | null
          location: string | null
          port: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          device_name: string
          id?: string
          ip_address: string
          last_sync_at?: string | null
          location?: string | null
          port?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          device_name?: string
          id?: string
          ip_address?: string
          last_sync_at?: string | null
          location?: string | null
          port?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      biometric_logs: {
        Row: {
          check_in_time: string | null
          check_out_time: string | null
          created_at: string
          date: string
          device_id: string
          device_name: string | null
          employee_code: string
          id: string
          processed: boolean
        }
        Insert: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          device_id: string
          device_name?: string | null
          employee_code: string
          id?: string
          processed?: boolean
        }
        Update: {
          check_in_time?: string | null
          check_out_time?: string | null
          created_at?: string
          date?: string
          device_id?: string
          device_name?: string | null
          employee_code?: string
          id?: string
          processed?: boolean
        }
        Relationships: []
      }
      bom_items: {
        Row: {
          bom_id: string
          id: string
          material_id: string
          quantity: number
          unit: string
        }
        Insert: {
          bom_id: string
          id?: string
          material_id: string
          quantity?: number
          unit?: string
        }
        Update: {
          bom_id?: string
          id?: string
          material_id?: string
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "bom_items_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "bill_of_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bom_items_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "item_master"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          code: string
          created_at: string
          id: string
          name: string
          phone: string | null
          status: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          code: string
          created_at?: string
          id?: string
          name: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          code?: string
          created_at?: string
          id?: string
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      chart_of_accounts: {
        Row: {
          account_code: string
          account_name: string
          account_type: string
          created_at: string
          id: string
          is_active: boolean
          opening_balance: number
          opening_balance_type: string
          parent_id: string | null
          updated_at: string
        }
        Insert: {
          account_code: string
          account_name: string
          account_type: string
          created_at?: string
          id?: string
          is_active?: boolean
          opening_balance?: number
          opening_balance_type?: string
          parent_id?: string | null
          updated_at?: string
        }
        Update: {
          account_code?: string
          account_name?: string
          account_type?: string
          created_at?: string
          id?: string
          is_active?: boolean
          opening_balance?: number
          opening_balance_type?: string
          parent_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "chart_of_accounts_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      company_settings: {
        Row: {
          address: string | null
          company_logo_url: string | null
          company_name: string
          created_at: string
          currency_code: string
          currency_name: string
          currency_position: string
          currency_symbol: string
          default_branch_id: string | null
          default_financial_year_id: string | null
          email: string | null
          id: string
          phone: string | null
          updated_at: string
          website: string | null
        }
        Insert: {
          address?: string | null
          company_logo_url?: string | null
          company_name?: string
          created_at?: string
          currency_code?: string
          currency_name?: string
          currency_position?: string
          currency_symbol?: string
          default_branch_id?: string | null
          default_financial_year_id?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Update: {
          address?: string | null
          company_logo_url?: string | null
          company_name?: string
          created_at?: string
          currency_code?: string
          currency_name?: string
          currency_position?: string
          currency_symbol?: string
          default_branch_id?: string | null
          default_financial_year_id?: string | null
          email?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "company_settings_default_branch_id_fkey"
            columns: ["default_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_settings_default_financial_year_id_fkey"
            columns: ["default_financial_year_id"]
            isOneToOne: false
            referencedRelation: "financial_years"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_participants: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          last_read_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          last_read_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          last_read_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          subject: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          subject?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          subject?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      custom_roles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          status: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
      departments: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      designations: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      employee_bank_info: {
        Row: {
          account_name: string
          account_number: string
          bank_name: string
          branch_name: string
          created_at: string
          employee_id: string
          id: string
          routing_number: string
          updated_at: string
        }
        Insert: {
          account_name?: string
          account_number?: string
          bank_name?: string
          branch_name?: string
          created_at?: string
          employee_id: string
          id?: string
          routing_number?: string
          updated_at?: string
        }
        Update: {
          account_name?: string
          account_number?: string
          bank_name?: string
          branch_name?: string
          created_at?: string
          employee_id?: string
          id?: string
          routing_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_bank_info_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_documents: {
        Row: {
          created_at: string
          document_html: string | null
          document_title: string
          document_type: string
          employee_id: string
          generated_by: string | null
          id: string
        }
        Insert: {
          created_at?: string
          document_html?: string | null
          document_title: string
          document_type: string
          employee_id: string
          generated_by?: string | null
          id?: string
        }
        Update: {
          created_at?: string
          document_html?: string | null
          document_title?: string
          document_type?: string
          employee_id?: string
          generated_by?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_documents_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_education: {
        Row: {
          created_at: string
          degree: string
          employee_id: string
          id: string
          institution: string
          passing_year: string
          result: string
        }
        Insert: {
          created_at?: string
          degree?: string
          employee_id: string
          id?: string
          institution?: string
          passing_year?: string
          result?: string
        }
        Update: {
          created_at?: string
          degree?: string
          employee_id?: string
          id?: string
          institution?: string
          passing_year?: string
          result?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_education_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_emergency_contacts: {
        Row: {
          address: string
          created_at: string
          employee_id: string
          id: string
          name: string
          phone: string
          relation: string
        }
        Insert: {
          address?: string
          created_at?: string
          employee_id: string
          id?: string
          name?: string
          phone?: string
          relation?: string
        }
        Update: {
          address?: string
          created_at?: string
          employee_id?: string
          id?: string
          name?: string
          phone?: string
          relation?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_emergency_contacts_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employee_experience: {
        Row: {
          company_name: string
          created_at: string
          designation: string
          employee_id: string
          end_date: string | null
          id: string
          job_description: string
          start_date: string | null
        }
        Insert: {
          company_name?: string
          created_at?: string
          designation?: string
          employee_id: string
          end_date?: string | null
          id?: string
          job_description?: string
          start_date?: string | null
        }
        Update: {
          company_name?: string
          created_at?: string
          designation?: string
          employee_id?: string
          end_date?: string | null
          id?: string
          job_description?: string
          start_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employee_experience_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          address: string | null
          branch_id: string | null
          created_at: string
          department_id: string | null
          designation_id: string | null
          email: string | null
          employee_code: string
          employment_type: string
          first_name: string
          id: string
          joining_date: string
          last_name: string
          mobile: string | null
          national_id: string | null
          photo_url: string | null
          salary: number
          shift_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          branch_id?: string | null
          created_at?: string
          department_id?: string | null
          designation_id?: string | null
          email?: string | null
          employee_code: string
          employment_type?: string
          first_name: string
          id?: string
          joining_date?: string
          last_name: string
          mobile?: string | null
          national_id?: string | null
          photo_url?: string | null
          salary?: number
          shift_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          branch_id?: string | null
          created_at?: string
          department_id?: string | null
          designation_id?: string | null
          email?: string | null
          employee_code?: string
          employment_type?: string
          first_name?: string
          id?: string
          joining_date?: string
          last_name?: string
          mobile?: string | null
          national_id?: string | null
          photo_url?: string | null
          salary?: number
          shift_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_department_id_fkey"
            columns: ["department_id"]
            isOneToOne: false
            referencedRelation: "departments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_designation_id_fkey"
            columns: ["designation_id"]
            isOneToOne: false
            referencedRelation: "designations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      face_data: {
        Row: {
          created_at: string
          employee_id: string
          face_encoding: string | null
          id: string
          photo_url: string | null
        }
        Insert: {
          created_at?: string
          employee_id: string
          face_encoding?: string | null
          id?: string
          photo_url?: string | null
        }
        Update: {
          created_at?: string
          employee_id?: string
          face_encoding?: string | null
          id?: string
          photo_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "face_data_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      financial_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_active: boolean
          name: string
          start_date: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_active?: boolean
          name: string
          start_date: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
        }
        Relationships: []
      }
      item_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_active: boolean
          name: string
          parent_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name: string
          parent_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean
          name?: string
          parent_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "item_categories_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "item_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      item_master: {
        Row: {
          category_id: string | null
          cost_price: number
          created_at: string
          description: string | null
          id: string
          is_stock_item: boolean
          item_code: string
          item_name: string
          item_type: string
          min_stock_level: number
          opening_stock: number
          selling_price: number
          status: string
          unit_id: string | null
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_stock_item?: boolean
          item_code: string
          item_name: string
          item_type?: string
          min_stock_level?: number
          opening_stock?: number
          selling_price?: number
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          cost_price?: number
          created_at?: string
          description?: string | null
          id?: string
          is_stock_item?: boolean
          item_code?: string
          item_name?: string
          item_type?: string
          min_stock_level?: number
          opening_stock?: number
          selling_price?: number
          status?: string
          unit_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "item_master_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "item_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "item_master_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_requests: {
        Row: {
          approved_by: string | null
          created_at: string
          employee_id: string
          end_date: string
          id: string
          leave_type_id: string
          reason: string | null
          start_date: string
          status: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          employee_id: string
          end_date: string
          id?: string
          leave_type_id: string
          reason?: string | null
          start_date: string
          status?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          employee_id?: string
          end_date?: string
          id?: string
          leave_type_id?: string
          reason?: string | null
          start_date?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_requests_leave_type_id_fkey"
            columns: ["leave_type_id"]
            isOneToOne: false
            referencedRelation: "leave_types"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_types: {
        Row: {
          created_at: string
          days_per_year: number
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          days_per_year?: number
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          days_per_year?: number
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          conversation_id: string
          created_at: string
          id: string
          is_read: boolean
          message: string
          sender_id: string
          updated_at: string
        }
        Insert: {
          conversation_id: string
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          sender_id: string
          updated_at?: string
        }
        Update: {
          conversation_id?: string
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      module_settings: {
        Row: {
          id: string
          is_enabled: boolean
          module_key: string
          module_name: string
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          id?: string
          is_enabled?: boolean
          module_key: string
          module_name: string
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          id?: string
          is_enabled?: boolean
          module_key?: string
          module_name?: string
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      number_sequences: {
        Row: {
          current_number: number
          description: string | null
          id: string
          prefix: string
          year: number
        }
        Insert: {
          current_number?: number
          description?: string | null
          id: string
          prefix: string
          year?: number
        }
        Update: {
          current_number?: number
          description?: string | null
          id?: string
          prefix?: string
          year?: number
        }
        Relationships: []
      }
      overtime_records: {
        Row: {
          approved_by: string | null
          created_at: string
          date: string
          employee_id: string
          hours: number
          id: string
          status: string
        }
        Insert: {
          approved_by?: string | null
          created_at?: string
          date?: string
          employee_id: string
          hours?: number
          id?: string
          status?: string
        }
        Update: {
          approved_by?: string | null
          created_at?: string
          date?: string
          employee_id?: string
          hours?: number
          id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "overtime_records_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      page_shortcuts: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          module_name: string
          page_name: string
          page_url: string
          shortcut_code: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          module_name: string
          page_name: string
          page_url: string
          shortcut_code: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          module_name?: string
          page_name?: string
          page_url?: string
          shortcut_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      party_notes: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          note: string
          party_id: string
          party_type: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string
          party_id: string
          party_type: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          note?: string
          party_id?: string
          party_type?: string
        }
        Relationships: []
      }
      party_payments: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          party_id: string
          party_type: string
          payment_date: string
          payment_method: string
          reference: string | null
          updated_at: string
        }
        Insert: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          party_id: string
          party_type: string
          payment_date?: string
          payment_method?: string
          reference?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          party_id?: string
          party_type?: string
          payment_date?: string
          payment_method?: string
          reference?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payment_allocations: {
        Row: {
          allocated_amount: number
          created_at: string
          id: string
          invoice_id: string
          invoice_type: string
          payment_id: string
        }
        Insert: {
          allocated_amount?: number
          created_at?: string
          id?: string
          invoice_id: string
          invoice_type: string
          payment_id: string
        }
        Update: {
          allocated_amount?: number
          created_at?: string
          id?: string
          invoice_id?: string
          invoice_type?: string
          payment_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_allocations_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "party_payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll: {
        Row: {
          allowances: number
          basic_salary: number
          created_at: string
          deductions: number
          employee_id: string
          id: string
          month: number
          net_salary: number
          status: string
          voucher_id: string | null
          year: number
        }
        Insert: {
          allowances?: number
          basic_salary?: number
          created_at?: string
          deductions?: number
          employee_id: string
          id?: string
          month: number
          net_salary?: number
          status?: string
          voucher_id?: string | null
          year: number
        }
        Update: {
          allowances?: number
          basic_salary?: number
          created_at?: string
          deductions?: number
          employee_id?: string
          id?: string
          month?: number
          net_salary?: number
          status?: string
          voucher_id?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "acc_vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      production_entries: {
        Row: {
          bom_id: string | null
          branch_id: string | null
          created_at: string
          created_by: string | null
          electricity_cost: number
          id: string
          labor_cost: number
          notes: string | null
          product_id: string
          production_date: string
          production_number: string
          quantity: number
          raw_material_cost: number
          status: string
          total_cost: number
        }
        Insert: {
          bom_id?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          electricity_cost?: number
          id?: string
          labor_cost?: number
          notes?: string | null
          product_id: string
          production_date?: string
          production_number: string
          quantity?: number
          raw_material_cost?: number
          status?: string
          total_cost?: number
        }
        Update: {
          bom_id?: string | null
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          electricity_cost?: number
          id?: string
          labor_cost?: number
          notes?: string | null
          product_id?: string
          production_date?: string
          production_number?: string
          quantity?: number
          raw_material_cost?: number
          status?: string
          total_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_entries_bom_id_fkey"
            columns: ["bom_id"]
            isOneToOne: false
            referencedRelation: "bill_of_materials"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_entries_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "item_master"
            referencedColumns: ["id"]
          },
        ]
      }
      production_materials: {
        Row: {
          cost: number
          id: string
          material_id: string
          production_id: string
          quantity: number
        }
        Insert: {
          cost?: number
          id?: string
          material_id: string
          production_id: string
          quantity?: number
        }
        Update: {
          cost?: number
          id?: string
          material_id?: string
          production_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "production_materials_material_id_fkey"
            columns: ["material_id"]
            isOneToOne: false
            referencedRelation: "item_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_materials_production_id_fkey"
            columns: ["production_id"]
            isOneToOne: false
            referencedRelation: "production_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          cost_price: number
          created_at: string
          id: string
          low_stock_threshold: number
          product_code: string
          product_name: string
          selling_price: number
          status: string
          unit: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          cost_price?: number
          created_at?: string
          id?: string
          low_stock_threshold?: number
          product_code: string
          product_name: string
          selling_price?: number
          status?: string
          unit?: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          cost_price?: number
          created_at?: string
          id?: string
          low_stock_threshold?: number
          product_code?: string
          product_name?: string
          selling_price?: number
          status?: string
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          branch_id: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          employee_id: string | null
          id: string
          is_online: boolean
          last_seen_at: string | null
          name: string
          phone: string | null
          status: string
          updated_at: string
          username: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          employee_id?: string | null
          id: string
          is_online?: boolean
          last_seen_at?: string | null
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          employee_id?: string | null
          id?: string
          is_online?: boolean
          last_seen_at?: string | null
          name?: string
          phone?: string | null
          status?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_items: {
        Row: {
          id: string
          product_id: string
          purchase_id: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          id?: string
          product_id: string
          purchase_id: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          id?: string
          product_id?: string
          purchase_id?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "item_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_return_items: {
        Row: {
          id: string
          product_id: string
          purchase_return_id: string
          quantity: number
          total: number
          unit_price: number
        }
        Insert: {
          id?: string
          product_id: string
          purchase_return_id: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Update: {
          id?: string
          product_id?: string
          purchase_return_id?: string
          quantity?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "item_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_return_items_purchase_return_id_fkey"
            columns: ["purchase_return_id"]
            isOneToOne: false
            referencedRelation: "purchase_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_returns: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
          id: string
          purchase_id: string | null
          reason: string | null
          return_date: string
          return_number: string
          status: string
          supplier_id: string | null
          total_amount: number
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          purchase_id?: string | null
          reason?: string | null
          return_date?: string
          return_number: string
          status?: string
          supplier_id?: string | null
          total_amount?: number
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          purchase_id?: string | null
          reason?: string | null
          return_date?: string
          return_number?: string
          status?: string
          supplier_id?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_returns_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_returns_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "purchases"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_returns_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      purchases: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
          id: string
          notes: string | null
          payment_method: string | null
          purchase_date: string
          purchase_number: string
          status: string
          supplier_id: string | null
          total_amount: number
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          purchase_date?: string
          purchase_number: string
          status?: string
          supplier_id?: string | null
          total_amount?: number
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          notes?: string | null
          payment_method?: string | null
          purchase_date?: string
          purchase_number?: string
          status?: string
          supplier_id?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchases_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      raw_materials: {
        Row: {
          cost_price: number
          created_at: string
          id: string
          material_code: string
          material_name: string
          status: string
          supplier_id: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          cost_price?: number
          created_at?: string
          id?: string
          material_code: string
          material_name: string
          status?: string
          supplier_id?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          cost_price?: number
          created_at?: string
          id?: string
          material_code?: string
          material_name?: string
          status?: string
          supplier_id?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "raw_materials_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          can_add: boolean
          can_delete: boolean
          can_edit: boolean
          can_view: boolean
          custom_role_id: string
          id: string
          module: string
        }
        Insert: {
          can_add?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          custom_role_id: string
          id?: string
          module: string
        }
        Update: {
          can_add?: boolean
          can_delete?: boolean
          can_edit?: boolean
          can_view?: boolean
          custom_role_id?: string
          id?: string
          module?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_custom_role_id_fkey"
            columns: ["custom_role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      salary_structures: {
        Row: {
          basic_salary: number
          created_at: string
          effective_from: string
          employee_id: string
          house_rent: number
          id: string
          medical_allowance: number
          other_allowance: number
          total_salary: number
          updated_at: string
        }
        Insert: {
          basic_salary?: number
          created_at?: string
          effective_from?: string
          employee_id: string
          house_rent?: number
          id?: string
          medical_allowance?: number
          other_allowance?: number
          total_salary?: number
          updated_at?: string
        }
        Update: {
          basic_salary?: number
          created_at?: string
          effective_from?: string
          employee_id?: string
          house_rent?: number
          id?: string
          medical_allowance?: number
          other_allowance?: number
          total_salary?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "salary_structures_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_invoice_items: {
        Row: {
          discount: number
          id: string
          price: number
          product_id: string
          quantity: number
          sales_invoice_id: string
          total: number
        }
        Insert: {
          discount?: number
          id?: string
          price?: number
          product_id: string
          quantity?: number
          sales_invoice_id: string
          total?: number
        }
        Update: {
          discount?: number
          id?: string
          price?: number
          product_id?: string
          quantity?: number
          sales_invoice_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "item_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoice_items_sales_invoice_id_fkey"
            columns: ["sales_invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_invoices: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          discount: number
          id: string
          invoice_date: string
          invoice_number: string
          net_amount: number
          notes: string | null
          status: string
          total_amount: number
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount?: number
          id?: string
          invoice_date?: string
          invoice_number: string
          net_amount?: number
          notes?: string | null
          status?: string
          total_amount?: number
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          discount?: number
          id?: string
          invoice_date?: string
          invoice_number?: string
          net_amount?: number
          notes?: string | null
          status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_invoices_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_return_items: {
        Row: {
          id: string
          price: number
          product_id: string
          quantity: number
          sales_return_id: string
          total: number
        }
        Insert: {
          id?: string
          price?: number
          product_id: string
          quantity?: number
          sales_return_id: string
          total?: number
        }
        Update: {
          id?: string
          price?: number
          product_id?: string
          quantity?: number
          sales_return_id?: string
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_return_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "item_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_return_items_sales_return_id_fkey"
            columns: ["sales_return_id"]
            isOneToOne: false
            referencedRelation: "sales_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      sales_returns: {
        Row: {
          branch_id: string | null
          created_at: string
          created_by: string | null
          customer_id: string | null
          id: string
          reason: string | null
          return_date: string
          return_number: string
          sales_invoice_id: string | null
          status: string
          total_amount: number
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          reason?: string | null
          return_date?: string
          return_number: string
          sales_invoice_id?: string | null
          status?: string
          total_amount?: number
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string | null
          id?: string
          reason?: string | null
          return_date?: string
          return_number?: string
          sales_invoice_id?: string | null
          status?: string
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "sales_returns_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_returns_sales_invoice_id_fkey"
            columns: ["sales_invoice_id"]
            isOneToOne: false
            referencedRelation: "sales_invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          created_at: string
          end_time: string
          id: string
          late_after_minutes: number
          shift_name: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_time?: string
          id?: string
          late_after_minutes?: number
          shift_name: string
          start_time?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_time?: string
          id?: string
          late_after_minutes?: number
          shift_name?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      sms_logs: {
        Row: {
          created_at: string
          event_type: string | null
          id: string
          message: string
          phone: string
          reference_id: string | null
          response: string | null
          sent_by: string | null
          status: string
        }
        Insert: {
          created_at?: string
          event_type?: string | null
          id?: string
          message: string
          phone: string
          reference_id?: string | null
          response?: string | null
          sent_by?: string | null
          status?: string
        }
        Update: {
          created_at?: string
          event_type?: string | null
          id?: string
          message?: string
          phone?: string
          reference_id?: string | null
          response?: string | null
          sent_by?: string | null
          status?: string
        }
        Relationships: []
      }
      stock_ledger: {
        Row: {
          balance_quantity: number
          branch_id: string | null
          created_at: string
          id: string
          item_id: string
          quantity_in: number
          quantity_out: number
          reference_number: string | null
          total_value: number
          transaction_date: string
          transaction_id: string | null
          transaction_type: string
          unit_cost: number
          warehouse_id: string | null
        }
        Insert: {
          balance_quantity?: number
          branch_id?: string | null
          created_at?: string
          id?: string
          item_id: string
          quantity_in?: number
          quantity_out?: number
          reference_number?: string | null
          total_value?: number
          transaction_date?: string
          transaction_id?: string | null
          transaction_type: string
          unit_cost?: number
          warehouse_id?: string | null
        }
        Update: {
          balance_quantity?: number
          branch_id?: string | null
          created_at?: string
          id?: string
          item_id?: string
          quantity_in?: number
          quantity_out?: number
          reference_number?: string | null
          total_value?: number
          transaction_date?: string
          transaction_id?: string | null
          transaction_type?: string
          unit_cost?: number
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_ledger_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_ledger_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_ledger_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          branch_id: string | null
          created_at: string
          id: string
          item_id: string | null
          movement_type: string
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
          warehouse_id: string | null
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          id?: string
          item_id?: string | null
          movement_type: string
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
          warehouse_id?: string | null
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          id?: string
          item_id?: string | null
          movement_type?: string
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
          warehouse_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "item_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfers: {
        Row: {
          created_at: string
          created_by: string | null
          from_warehouse_id: string
          id: string
          item_id: string
          notes: string | null
          quantity: number
          status: string
          to_warehouse_id: string
          transfer_date: string
          transfer_number: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          from_warehouse_id: string
          id?: string
          item_id: string
          notes?: string | null
          quantity: number
          status?: string
          to_warehouse_id: string
          transfer_date?: string
          transfer_number: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          from_warehouse_id?: string
          id?: string
          item_id?: string
          notes?: string | null
          quantity?: number
          status?: string
          to_warehouse_id?: string
          transfer_date?: string
          transfer_number?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_from_warehouse_id_fkey"
            columns: ["from_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_to_warehouse_id_fkey"
            columns: ["to_warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          status: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          status?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
      system_settings: {
        Row: {
          created_at: string
          id: string
          is_encrypted: boolean
          setting_key: string
          setting_value: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_encrypted?: boolean
          setting_key: string
          setting_value?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_encrypted?: boolean
          setting_key?: string
          setting_value?: string
          updated_at?: string
        }
        Relationships: []
      }
      units: {
        Row: {
          abbreviation: string
          created_at: string
          id: string
          name: string
        }
        Insert: {
          abbreviation: string
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          abbreviation?: string
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_activities: {
        Row: {
          activity_type: string
          created_at: string
          description: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          activity_type: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          created_at?: string
          description?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_custom_roles: {
        Row: {
          custom_role_id: string
          id: string
          user_id: string
        }
        Insert: {
          custom_role_id: string
          id?: string
          user_id: string
        }
        Update: {
          custom_role_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_custom_roles_custom_role_id_fkey"
            columns: ["custom_role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_favorite_pages: {
        Row: {
          created_at: string
          id: string
          page_url: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          page_url: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          page_url?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voucher_entries: {
        Row: {
          account_id: string
          credit: number
          debit: number
          id: string
          narration: string | null
          sort_order: number
          voucher_id: string
        }
        Insert: {
          account_id: string
          credit?: number
          debit?: number
          id?: string
          narration?: string | null
          sort_order?: number
          voucher_id: string
        }
        Update: {
          account_id?: string
          credit?: number
          debit?: number
          id?: string
          narration?: string | null
          sort_order?: number
          voucher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voucher_entries_account_id_fkey"
            columns: ["account_id"]
            isOneToOne: false
            referencedRelation: "chart_of_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "voucher_entries_voucher_id_fkey"
            columns: ["voucher_id"]
            isOneToOne: false
            referencedRelation: "acc_vouchers"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouse_stock: {
        Row: {
          id: string
          item_id: string
          quantity: number
          updated_at: string
          warehouse_id: string
        }
        Insert: {
          id?: string
          item_id: string
          quantity?: number
          updated_at?: string
          warehouse_id: string
        }
        Update: {
          id?: string
          item_id?: string
          quantity?: number
          updated_at?: string
          warehouse_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouse_stock_item_id_fkey"
            columns: ["item_id"]
            isOneToOne: false
            referencedRelation: "item_master"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "warehouse_stock_warehouse_id_fkey"
            columns: ["warehouse_id"]
            isOneToOne: false
            referencedRelation: "warehouses"
            referencedColumns: ["id"]
          },
        ]
      }
      warehouses: {
        Row: {
          branch_id: string | null
          created_at: string
          description: string | null
          id: string
          status: string
          updated_at: string
          warehouse_code: string
          warehouse_name: string
        }
        Insert: {
          branch_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          updated_at?: string
          warehouse_code: string
          warehouse_name: string
        }
        Update: {
          branch_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          updated_at?: string
          warehouse_code?: string
          warehouse_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "warehouses_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "super_admin" | "admin" | "staff"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["super_admin", "admin", "staff"],
    },
  },
} as const
