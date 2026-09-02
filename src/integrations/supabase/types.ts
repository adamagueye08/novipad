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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          actor_id: string | null
          created_at: string
          entity_id: string | null
          entity_type: string | null
          id: string
          new_value: Json | null
          old_value: Json | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          new_value?: Json | null
          old_value?: Json | null
        }
        Relationships: []
      }
      couriers: {
        Row: {
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          notes: string | null
          phone: string
          updated_at: string
          vehicle: string | null
          zone: string | null
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          notes?: string | null
          phone: string
          updated_at?: string
          vehicle?: string | null
          zone?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          notes?: string | null
          phone?: string
          updated_at?: string
          vehicle?: string | null
          zone?: string | null
        }
        Relationships: []
      }
      deliveries: {
        Row: {
          address: string | null
          courier_assigned_at: string | null
          courier_id: string | null
          courier_name: string | null
          created_at: string
          id: string
          is_demo: boolean
          order_id: string | null
          phone: string | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          courier_assigned_at?: string | null
          courier_id?: string | null
          courier_name?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          order_id?: string | null
          phone?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          courier_assigned_at?: string | null
          courier_id?: string | null
          courier_name?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          order_id?: string | null
          phone?: string | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deliveries_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deliveries_courier_id_fkey"
            columns: ["courier_id"]
            isOneToOne: false
            referencedRelation: "couriers"
            referencedColumns: ["id"]
          },
        ]
      }
      flex_accounts: {
        Row: {
          completed_at: string | null
          created_at: string
          delivery_address: string | null
          delivery_phone: string | null
          id: string
          is_demo: boolean
          paid_amount: number
          product_id: string | null
          status: Database["public"]["Enums"]["flex_status"]
          target_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_phone?: string | null
          id?: string
          is_demo?: boolean
          paid_amount?: number
          product_id?: string | null
          status?: Database["public"]["Enums"]["flex_status"]
          target_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          delivery_address?: string | null
          delivery_phone?: string | null
          id?: string
          is_demo?: boolean
          paid_amount?: number
          product_id?: string | null
          status?: Database["public"]["Enums"]["flex_status"]
          target_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flex_accounts_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      flex_cancellations: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          fee_amount: number
          flex_account_id: string
          id: string
          keep_as_credit: boolean
          paid_amount: number
          reason: string | null
          refundable_amount: number
          status: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          fee_amount?: number
          flex_account_id: string
          id?: string
          keep_as_credit?: boolean
          paid_amount?: number
          reason?: string | null
          refundable_amount?: number
          status?: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          fee_amount?: number
          flex_account_id?: string
          id?: string
          keep_as_credit?: boolean
          paid_amount?: number
          reason?: string | null
          refundable_amount?: number
          status?: Database["public"]["Enums"]["request_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "flex_cancellations_flex_account_id_fkey"
            columns: ["flex_account_id"]
            isOneToOne: false
            referencedRelation: "flex_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      flex_deposits: {
        Row: {
          amount: number
          created_at: string
          flex_account_id: string
          id: string
          payment_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          flex_account_id: string
          id?: string
          payment_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          flex_account_id?: string
          id?: string
          payment_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "flex_deposits_flex_account_id_fkey"
            columns: ["flex_account_id"]
            isOneToOne: false
            referencedRelation: "flex_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flex_deposits_payment_fk"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_movements: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          movement_type: string
          note: string | null
          product_id: string
          quantity: number
          unit_id: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type: string
          note?: string | null
          product_id: string
          quantity?: number
          unit_id?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          movement_type?: string
          note?: string | null
          product_id?: string
          quantity?: number
          unit_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inventory_movements_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "inventory_units"
            referencedColumns: ["id"]
          },
        ]
      }
      inventory_units: {
        Row: {
          created_at: string
          id: string
          is_demo: boolean
          product_id: string
          serial_number: string | null
          status: Database["public"]["Enums"]["unit_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_demo?: boolean
          product_id: string
          serial_number?: string | null
          status?: Database["public"]["Enums"]["unit_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_demo?: boolean
          product_id?: string
          serial_number?: string | null
          status?: Database["public"]["Enums"]["unit_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "inventory_units_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          audience: string
          body: string | null
          channel: string
          created_at: string
          id: string
          is_demo: boolean
          read_at: string | null
          title: string
          tontine_id: string | null
          user_id: string | null
        }
        Insert: {
          audience?: string
          body?: string | null
          channel?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          read_at?: string | null
          title: string
          tontine_id?: string | null
          user_id?: string | null
        }
        Update: {
          audience?: string
          body?: string | null
          channel?: string
          created_at?: string
          id?: string
          is_demo?: boolean
          read_at?: string | null
          title?: string
          tontine_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "notifications_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          quantity: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          quantity?: number
          unit_price: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          created_at: string
          flex_account_id: string | null
          formula: Database["public"]["Enums"]["purchase_formula"]
          id: string
          is_demo: boolean
          product_id: string | null
          reference: string
          status: Database["public"]["Enums"]["order_status"]
          unit_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          flex_account_id?: string | null
          formula: Database["public"]["Enums"]["purchase_formula"]
          id?: string
          is_demo?: boolean
          product_id?: string | null
          reference?: string
          status?: Database["public"]["Enums"]["order_status"]
          unit_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          flex_account_id?: string | null
          formula?: Database["public"]["Enums"]["purchase_formula"]
          id?: string
          is_demo?: boolean
          product_id?: string | null
          reference?: string
          status?: Database["public"]["Enums"]["order_status"]
          unit_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "inventory_units"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          confirmed_at: string | null
          created_at: string
          external_reference: string | null
          flex_account_id: string | null
          id: string
          is_demo: boolean
          order_id: string | null
          payment_method: string | null
          status: Database["public"]["Enums"]["payment_status"]
          tontine_id: string | null
          tontine_member_id: string | null
          user_id: string
        }
        Insert: {
          amount: number
          confirmed_at?: string | null
          created_at?: string
          external_reference?: string | null
          flex_account_id?: string | null
          id?: string
          is_demo?: boolean
          order_id?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tontine_id?: string | null
          tontine_member_id?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          confirmed_at?: string | null
          created_at?: string
          external_reference?: string | null
          flex_account_id?: string | null
          id?: string
          is_demo?: boolean
          order_id?: string | null
          payment_method?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          tontine_id?: string | null
          tontine_member_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_flex_account_id_fkey"
            columns: ["flex_account_id"]
            isOneToOne: false
            referencedRelation: "flex_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_tontine_member_id_fkey"
            columns: ["tontine_member_id"]
            isOneToOne: false
            referencedRelation: "tontine_members"
            referencedColumns: ["id"]
          },
        ]
      }
      price_history: {
        Row: {
          changed_by: string | null
          created_at: string
          field: string
          id: string
          new_value: number | null
          old_value: number | null
          product_id: string
        }
        Insert: {
          changed_by?: string | null
          created_at?: string
          field: string
          id?: string
          new_value?: number | null
          old_value?: number | null
          product_id: string
        }
        Update: {
          changed_by?: string | null
          created_at?: string
          field?: string
          id?: string
          new_value?: number | null
          old_value?: number | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          color: string | null
          condition: string | null
          connectivity: string | null
          created_at: string
          description: string | null
          features: Json
          generation: string | null
          id: string
          images: string[]
          is_active: boolean
          is_demo: boolean
          low_stock_threshold: number
          model: string
          price_cash: number
          price_flex: number
          price_tontine: number
          purchase_cost_usd: number
          shipping_cost_usd: number
          slug: string
          specs: Json
          stock_quantity: number
          storage: string | null
          updated_at: string
          warranty_months: number
        }
        Insert: {
          category?: string
          color?: string | null
          condition?: string | null
          connectivity?: string | null
          created_at?: string
          description?: string | null
          features?: Json
          generation?: string | null
          id?: string
          images?: string[]
          is_active?: boolean
          is_demo?: boolean
          low_stock_threshold?: number
          model: string
          price_cash?: number
          price_flex?: number
          price_tontine?: number
          purchase_cost_usd?: number
          shipping_cost_usd?: number
          slug: string
          specs?: Json
          stock_quantity?: number
          storage?: string | null
          updated_at?: string
          warranty_months?: number
        }
        Update: {
          category?: string
          color?: string | null
          condition?: string | null
          connectivity?: string | null
          created_at?: string
          description?: string | null
          features?: Json
          generation?: string | null
          id?: string
          images?: string[]
          is_active?: boolean
          is_demo?: boolean
          low_stock_threshold?: number
          model?: string
          price_cash?: number
          price_flex?: number
          price_tontine?: number
          purchase_cost_usd?: number
          shipping_cost_usd?: number
          slug?: string
          specs?: Json
          stock_quantity?: number
          storage?: string | null
          updated_at?: string
          warranty_months?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          email: string | null
          first_name: string
          id: string
          is_demo: boolean
          last_name: string
          phone: string | null
          status: Database["public"]["Enums"]["account_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          first_name?: string
          id: string
          is_demo?: boolean
          last_name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          first_name?: string
          id?: string
          is_demo?: boolean
          last_name?: string
          phone?: string | null
          status?: Database["public"]["Enums"]["account_status"]
          updated_at?: string
        }
        Relationships: []
      }
      refunds: {
        Row: {
          amount: number
          created_at: string
          flex_cancellation_id: string | null
          id: string
          note: string | null
          payment_id: string | null
          processed_at: string | null
          processed_by: string | null
          status: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          flex_cancellation_id?: string | null
          id?: string
          note?: string | null
          payment_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          flex_cancellation_id?: string | null
          id?: string
          note?: string | null
          payment_id?: string | null
          processed_at?: string | null
          processed_by?: string | null
          status?: Database["public"]["Enums"]["request_status"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "refunds_flex_cancellation_id_fkey"
            columns: ["flex_cancellation_id"]
            isOneToOne: false
            referencedRelation: "flex_cancellations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "refunds_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      stories: {
        Row: {
          id: string
          title: string | null
          media_url: string
          media_type: Database["public"]["Enums"]["story_media_type"]
          product_id: string | null
          is_active: boolean
          created_by: string
          created_at: string
          expires_at: string
        }
        Insert: {
          id?: string
          title?: string | null
          media_url: string
          media_type: Database["public"]["Enums"]["story_media_type"]
          product_id?: string | null
          is_active?: boolean
          created_by: string
          created_at?: string
          expires_at: string
        }
        Update: {
          id?: string
          title?: string | null
          media_url?: string
          media_type?: Database["public"]["Enums"]["story_media_type"]
          product_id?: string | null
          is_active?: boolean
          created_by?: string
          created_at?: string
          expires_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stories_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      tontine_contributions: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          is_demo: boolean
          member_id: string
          paid_at: string | null
          payment_id: string | null
          reference: string | null
          status: Database["public"]["Enums"]["contribution_status"]
          tontine_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          is_demo?: boolean
          member_id: string
          paid_at?: string | null
          payment_id?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["contribution_status"]
          tontine_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          is_demo?: boolean
          member_id?: string
          paid_at?: string | null
          payment_id?: string | null
          reference?: string | null
          status?: Database["public"]["Enums"]["contribution_status"]
          tontine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tontine_contributions_member_id_fkey"
            columns: ["member_id"]
            isOneToOne: false
            referencedRelation: "tontine_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_contributions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_contributions_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
        ]
      }
      tontine_cycles: {
        Row: {
          beneficiary_member_id: string | null
          created_at: string
          cycle_index: number
          end_date: string | null
          id: string
          start_date: string | null
          tontine_id: string
        }
        Insert: {
          beneficiary_member_id?: string | null
          created_at?: string
          cycle_index: number
          end_date?: string | null
          id?: string
          start_date?: string | null
          tontine_id: string
        }
        Update: {
          beneficiary_member_id?: string | null
          created_at?: string
          cycle_index?: number
          end_date?: string | null
          id?: string
          start_date?: string | null
          tontine_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tontine_cycles_beneficiary_member_id_fkey"
            columns: ["beneficiary_member_id"]
            isOneToOne: false
            referencedRelation: "tontine_members"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_cycles_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
        ]
      }
      tontine_members: {
        Row: {
          assigned_unit_id: string | null
          created_at: string
          id: string
          is_demo: boolean
          late_count: number
          paid_amount: number
          status: Database["public"]["Enums"]["member_status"]
          terms_accepted_at: string | null
          terms_version: string | null
          tontine_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          assigned_unit_id?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          late_count?: number
          paid_amount?: number
          status?: Database["public"]["Enums"]["member_status"]
          terms_accepted_at?: string | null
          terms_version?: string | null
          tontine_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          assigned_unit_id?: string | null
          created_at?: string
          id?: string
          is_demo?: boolean
          late_count?: number
          paid_amount?: number
          status?: Database["public"]["Enums"]["member_status"]
          terms_accepted_at?: string | null
          terms_version?: string | null
          tontine_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tontine_members_assigned_unit_id_fkey"
            columns: ["assigned_unit_id"]
            isOneToOne: false
            referencedRelation: "inventory_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tontine_members_tontine_id_fkey"
            columns: ["tontine_id"]
            isOneToOne: false
            referencedRelation: "tontines"
            referencedColumns: ["id"]
          },
        ]
      }
      tontines: {
        Row: {
          allocation_rules: string | null
          contribution_amount: number
          created_at: string
          duration_months: number
          end_date: string | null
          frequency: string
          id: string
          ipads_available: number
          is_demo: boolean
          member_capacity: number
          name: string
          price: number
          product_id: string | null
          start_date: string | null
          status: Database["public"]["Enums"]["tontine_status"]
          terms: string | null
          terms_version: string
          updated_at: string
        }
        Insert: {
          allocation_rules?: string | null
          contribution_amount?: number
          created_at?: string
          duration_months?: number
          end_date?: string | null
          frequency?: string
          id?: string
          ipads_available?: number
          is_demo?: boolean
          member_capacity?: number
          name: string
          price?: number
          product_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["tontine_status"]
          terms?: string | null
          terms_version?: string
          updated_at?: string
        }
        Update: {
          allocation_rules?: string | null
          contribution_amount?: number
          created_at?: string
          duration_months?: number
          end_date?: string | null
          frequency?: string
          id?: string
          ipads_available?: number
          is_demo?: boolean
          member_capacity?: number
          name?: string
          price?: number
          product_id?: string | null
          start_date?: string | null
          status?: Database["public"]["Enums"]["tontine_status"]
          terms?: string | null
          terms_version?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tontines_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_staff: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      account_status: "ACTIVE" | "SUSPENDED"
      app_role:
        | "super_admin"
        | "admin"
        | "finance"
        | "stock"
        | "tontine_manager"
        | "client"
      contribution_status: "PENDING" | "PAID" | "LATE" | "CANCELLED"
      delivery_status:
        | "PENDING"
        | "PREPARING"
        | "SHIPPED"
        | "OUT_FOR_DELIVERY"
        | "DELIVERED"
        | "FAILED"
      flex_status: "ACTIVE" | "COMPLETED" | "CANCELLED"
      member_status:
        | "PENDING"
        | "APPROVED"
        | "ACTIVE"
        | "SUSPENDED"
        | "COMPLETED"
        | "REMOVED"
      order_status:
        | "PENDING"
        | "PAID"
        | "CONFIRMED"
        | "PREPARING"
        | "SHIPPED"
        | "DELIVERED"
        | "COMPLETED"
        | "CANCELLED"
      payment_status:
        | "PENDING"
        | "SUCCESS"
        | "FAILED"
        | "CANCELLED"
        | "REFUNDED"
      purchase_formula: "CASH" | "FLEX" | "TONTINE"
      request_status: "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED"
      story_media_type: "IMAGE" | "VIDEO"
      tontine_status: "DRAFT" | "OPEN" | "ACTIVE" | "CLOSED"
      unit_status:
        | "AVAILABLE"
        | "RESERVED"
        | "PREPARING"
        | "SHIPPED"
        | "DELIVERED"
        | "SOLD"
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
      account_status: ["ACTIVE", "SUSPENDED"],
      app_role: [
        "super_admin",
        "admin",
        "finance",
        "stock",
        "tontine_manager",
        "client",
      ],
      contribution_status: ["PENDING", "PAID", "LATE", "CANCELLED"],
      delivery_status: [
        "PENDING",
        "PREPARING",
        "SHIPPED",
        "OUT_FOR_DELIVERY",
        "DELIVERED",
        "FAILED",
      ],
      flex_status: ["ACTIVE", "COMPLETED", "CANCELLED"],
      member_status: [
        "PENDING",
        "APPROVED",
        "ACTIVE",
        "SUSPENDED",
        "COMPLETED",
        "REMOVED",
      ],
      order_status: [
        "PENDING",
        "PAID",
        "CONFIRMED",
        "PREPARING",
        "SHIPPED",
        "DELIVERED",
        "COMPLETED",
        "CANCELLED",
      ],
      payment_status: ["PENDING", "SUCCESS", "FAILED", "CANCELLED", "REFUNDED"],
      purchase_formula: ["CASH", "FLEX", "TONTINE"],
      request_status: ["PENDING", "APPROVED", "REJECTED", "REFUNDED"],
      tontine_status: ["DRAFT", "OPEN", "ACTIVE", "CLOSED"],
      unit_status: [
        "AVAILABLE",
        "RESERVED",
        "PREPARING",
        "SHIPPED",
        "DELIVERED",
        "SOLD",
      ],
    },
  },
} as const
