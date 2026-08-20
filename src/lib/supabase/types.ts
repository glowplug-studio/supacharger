export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  api: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_account_username_available: {
        Args: { p_username: string }
        Returns: boolean
      }
      get_account_profile_by_current_user: {
        Args: never
        Returns: {
          avatar_path: string
          created_at: string
          email: string
          first_name: string
          header_image_path: string
          id: string
          language_code: string
          last_name: string
          updated_at: string
          username: string
        }[]
      }
      get_active_products: {
        Args: never
        Returns: {
          active: boolean
          description: string
          id: string
          image: string
          metadata: Json
          name: string
          prices: Json
        }[]
      }
      get_active_subscription_by_current_user: { Args: never; Returns: Json }
      get_billing_overview_by_current_user: { Args: never; Returns: Json }
      get_user_profiles_by_identifiers: {
        Args: { p_identifiers: string[] }
        Returns: {
          avatar_path: string
          first_name: string
          header_image_path: string
          last_name: string
          user_id: string
          username: string
        }[]
      }
      has_billing_access_by_current_user: {
        Args: { p_feature_lookup_key?: string }
        Returns: boolean
      }
      is_profile_complete_by_current_user: {
        Args: { p_username_required?: boolean }
        Returns: boolean
      }
      update_account_avatar_by_current_user: {
        Args: { p_avatar_path: string }
        Returns: undefined
      }
      update_account_header_image_by_current_user: {
        Args: { p_header_image_path: string }
        Returns: undefined
      }
      update_account_language_by_current_user: {
        Args: { p_language_code: string }
        Returns: undefined
      }
      update_account_profile_by_current_user: {
        Args: { p_first_name: string; p_last_name: string; p_username?: string }
        Returns: undefined
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  api_edge: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      accept_stripe_event: {
        Args: {
          p_api_version: string
          p_event_id: string
          p_event_type: string
          p_livemode: boolean
          p_object_id: string
          p_payload: Json
        }
        Returns: boolean
      }
      billing_get_account_by_customer: {
        Args: { p_stripe_customer_id: string }
        Returns: string
      }
      billing_get_customer: {
        Args: { p_user_id: string }
        Returns: {
          stripe_customer_id: string
        }[]
      }
      billing_get_customer_for_account: {
        Args: { p_billing_account_id: string; p_livemode?: boolean }
        Returns: {
          livemode: boolean
          stripe_customer_id: string
        }[]
      }
      billing_get_or_create_user_account: {
        Args: { p_user_id: string }
        Returns: string
      }
      billing_get_user_id: {
        Args: { p_stripe_customer_id: string }
        Returns: string
      }
      billing_list_customer_mappings: {
        Args: never
        Returns: {
          billing_account_id: string
          livemode: boolean
          stripe_customer_id: string
        }[]
      }
      billing_put_customer: {
        Args: { p_stripe_customer_id: string; p_user_id: string }
        Returns: string
      }
      billing_put_customer_for_account: {
        Args: {
          p_billing_account_id: string
          p_livemode: boolean
          p_stripe_account_id?: string
          p_stripe_customer_id: string
        }
        Returns: string
      }
      billing_replace_stripe_entitlements: {
        Args: { p_entitlements: Json; p_stripe_customer_id: string }
        Returns: undefined
      }
      billing_set_catalogue_item_inactive: {
        Args: { p_id: string; p_kind: string }
        Returns: undefined
      }
      billing_update_payment_method: {
        Args: {
          p_billing_address: Json
          p_payment_method: Json
          p_user_id: string
        }
        Returns: undefined
      }
      billing_update_payment_method_for_account: {
        Args: {
          p_billing_account_id: string
          p_billing_address: Json
          p_payment_method: Json
        }
        Returns: undefined
      }
      billing_upsert_price: { Args: { p_price: Json }; Returns: undefined }
      billing_upsert_product: { Args: { p_product: Json }; Returns: undefined }
      billing_upsert_subscription: {
        Args: { p_subscription: Json }
        Returns: undefined
      }
      billing_upsert_subscription_v2: {
        Args: { p_items: Json; p_subscription: Json }
        Returns: undefined
      }
      billing_user_can_manage: {
        Args: { p_billing_account_id: string; p_user_id: string }
        Returns: boolean
      }
      claim_stripe_event: { Args: { p_event_id: string }; Returns: Json }
      complete_stripe_event: {
        Args: { p_error?: string; p_event_id: string; p_retry_at?: string }
        Returns: undefined
      }
      create_organisation_context: {
        Args: {
          p_handle: string
          p_name: string
          p_session_id: string
          p_user_id: string
        }
        Returns: Json
      }
      list_claimable_stripe_events: {
        Args: { p_limit?: number }
        Returns: {
          event_id: string
        }[]
      }
      select_organisation_context: {
        Args: { p_handle: string; p_session_id: string; p_user_id: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  app: {
    Tables: {
      billing_account_members: {
        Row: {
          billing_account_id: string
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          billing_account_id: string
          created_at?: string
          role?: string
          user_id: string
        }
        Update: {
          billing_account_id?: string
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billing_account_members_billing_account_id_fkey"
            columns: ["billing_account_id"]
            isOneToOne: false
            referencedRelation: "billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_account_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      billing_accounts: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          metadata: Json
          subject_id: string
          subject_type: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id?: string
          metadata?: Json
          subject_id: string
          subject_type: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          metadata?: Json
          subject_id?: string
          subject_type?: string
          updated_at?: string
        }
        Relationships: []
      }
      billing_features: {
        Row: {
          created_at: string
          description: string | null
          lookup_key: string
          metadata: Json
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          lookup_key: string
          metadata?: Json
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          lookup_key?: string
          metadata?: Json
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          billing_address: Json | null
          created_at: string
          id: string
          payment_method: Json | null
          stripe_customer_id: string
          updated_at: string
        }
        Insert: {
          billing_address?: Json | null
          created_at?: string
          id: string
          payment_method?: Json | null
          stripe_customer_id: string
          updated_at?: string
        }
        Update: {
          billing_address?: Json | null
          created_at?: string
          id?: string
          payment_method?: Json | null
          stripe_customer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlement_grants: {
        Row: {
          active: boolean
          billing_account_id: string
          created_at: string
          ends_at: string | null
          feature_lookup_key: string
          id: string
          metadata: Json
          source: string
          source_reference: string | null
          starts_at: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          billing_account_id: string
          created_at?: string
          ends_at?: string | null
          feature_lookup_key: string
          id?: string
          metadata?: Json
          source: string
          source_reference?: string | null
          starts_at?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          billing_account_id?: string
          created_at?: string
          ends_at?: string | null
          feature_lookup_key?: string
          id?: string
          metadata?: Json
          source?: string
          source_reference?: string | null
          starts_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlement_grants_billing_account_id_fkey"
            columns: ["billing_account_id"]
            isOneToOne: false
            referencedRelation: "billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlement_grants_feature_lookup_key_fkey"
            columns: ["feature_lookup_key"]
            isOneToOne: false
            referencedRelation: "billing_features"
            referencedColumns: ["lookup_key"]
          },
        ]
      }
      organisation_members: {
        Row: {
          created_at: string
          organisation_id: string
          role: Database["app"]["Enums"]["organisation_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          organisation_id: string
          role?: Database["app"]["Enums"]["organisation_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          organisation_id?: string
          role?: Database["app"]["Enums"]["organisation_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organisation_members_organisation_id_fkey"
            columns: ["organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
      organisations: {
        Row: {
          created_at: string
          created_by: string
          handle: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by: string
          handle: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string
          handle?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      prices: {
        Row: {
          active: boolean | null
          currency: string | null
          description: string | null
          id: string
          interval: Database["app"]["Enums"]["pricing_plan_interval"] | null
          interval_count: number | null
          metadata: Json | null
          product_id: string | null
          trial_period_days: number | null
          type: Database["app"]["Enums"]["pricing_type"] | null
          unit_amount: number | null
        }
        Insert: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id: string
          interval?: Database["app"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["app"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
        }
        Update: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id?: string
          interval?: Database["app"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["app"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_features: {
        Row: {
          created_at: string
          feature_lookup_key: string
          product_id: string
        }
        Insert: {
          created_at?: string
          feature_lookup_key: string
          product_id: string
        }
        Update: {
          created_at?: string
          feature_lookup_key?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_features_feature_lookup_key_fkey"
            columns: ["feature_lookup_key"]
            isOneToOne: false
            referencedRelation: "billing_features"
            referencedColumns: ["lookup_key"]
          },
          {
            foreignKeyName: "product_features_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          description: string | null
          id: string
          image: string | null
          metadata: Json | null
          name: string | null
        }
        Insert: {
          active?: boolean | null
          description?: string | null
          id: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Update: {
          active?: boolean | null
          description?: string | null
          id?: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_path: string | null
          created_at: string
          email: string | null
          first_name: string
          header_image_path: string | null
          id: string
          language_code: string | null
          last_name: string
          updated_at: string
          username: string | null
        }
        Insert: {
          avatar_path?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          header_image_path?: string | null
          id: string
          language_code?: string | null
          last_name?: string
          updated_at?: string
          username?: string | null
        }
        Update: {
          avatar_path?: string | null
          created_at?: string
          email?: string | null
          first_name?: string
          header_image_path?: string | null
          id?: string
          language_code?: string | null
          last_name?: string
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      stripe_customers: {
        Row: {
          billing_account_id: string
          billing_address: Json | null
          created_at: string
          id: string
          livemode: boolean | null
          payment_method: Json | null
          stripe_account_id: string
          stripe_customer_id: string
          updated_at: string
        }
        Insert: {
          billing_account_id: string
          billing_address?: Json | null
          created_at?: string
          id?: string
          livemode?: boolean | null
          payment_method?: Json | null
          stripe_account_id?: string
          stripe_customer_id: string
          updated_at?: string
        }
        Update: {
          billing_account_id?: string
          billing_address?: Json | null
          created_at?: string
          id?: string
          livemode?: boolean | null
          payment_method?: Json | null
          stripe_account_id?: string
          stripe_customer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_customers_billing_account_id_fkey"
            columns: ["billing_account_id"]
            isOneToOne: false
            referencedRelation: "billing_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_event_payloads: {
        Row: {
          event_id: string
          expires_at: string
          payload: Json
        }
        Insert: {
          event_id: string
          expires_at?: string
          payload: Json
        }
        Update: {
          event_id?: string
          expires_at?: string
          payload?: Json
        }
        Relationships: [
          {
            foreignKeyName: "stripe_event_payloads_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: true
            referencedRelation: "stripe_events"
            referencedColumns: ["event_id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          api_version: string | null
          attempt_count: number
          event_id: string
          event_type: string
          last_error: string | null
          livemode: boolean
          next_attempt_at: string
          object_id: string | null
          processed_at: string | null
          processing_started_at: string | null
          received_at: string
          status: string
        }
        Insert: {
          api_version?: string | null
          attempt_count?: number
          event_id: string
          event_type: string
          last_error?: string | null
          livemode: boolean
          next_attempt_at?: string
          object_id?: string | null
          processed_at?: string | null
          processing_started_at?: string | null
          received_at?: string
          status?: string
        }
        Update: {
          api_version?: string | null
          attempt_count?: number
          event_id?: string
          event_type?: string
          last_error?: string | null
          livemode?: boolean
          next_attempt_at?: string
          object_id?: string | null
          processed_at?: string | null
          processing_started_at?: string | null
          received_at?: string
          status?: string
        }
        Relationships: []
      }
      subscription_items: {
        Row: {
          created_at: string
          current_period_end: string
          current_period_start: string
          id: string
          metadata: Json
          price_id: string
          quantity: number | null
          subscription_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          current_period_end: string
          current_period_start: string
          id: string
          metadata?: Json
          price_id: string
          quantity?: number | null
          subscription_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          current_period_end?: string
          current_period_start?: string
          id?: string
          metadata?: Json
          price_id?: string
          quantity?: number | null
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_items_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscription_items_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          automatic_tax_enabled: boolean | null
          billing_account_id: string
          billing_mode: string | null
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          collection_method: string | null
          created: string
          currency: string | null
          current_period_end: string
          current_period_start: string
          ended_at: string | null
          id: string
          last_synced_at: string
          latest_invoice_id: string | null
          livemode: boolean | null
          metadata: Json | null
          price_id: string | null
          quantity: number | null
          status: Database["app"]["Enums"]["subscription_status"] | null
          stripe_customer_id: string | null
          trial_end: string | null
          trial_start: string | null
          user_id: string | null
        }
        Insert: {
          automatic_tax_enabled?: boolean | null
          billing_account_id: string
          billing_mode?: string | null
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          collection_method?: string | null
          created: string
          currency?: string | null
          current_period_end: string
          current_period_start: string
          ended_at?: string | null
          id: string
          last_synced_at?: string
          latest_invoice_id?: string | null
          livemode?: boolean | null
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["app"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string | null
        }
        Update: {
          automatic_tax_enabled?: boolean | null
          billing_account_id?: string
          billing_mode?: string | null
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          collection_method?: string | null
          created?: string
          currency?: string | null
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id?: string
          last_synced_at?: string
          latest_invoice_id?: string | null
          livemode?: boolean | null
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["app"]["Enums"]["subscription_status"] | null
          stripe_customer_id?: string | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_billing_account_id_fkey"
            columns: ["billing_account_id"]
            isOneToOne: false
            referencedRelation: "billing_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          role: Database["app"]["Enums"]["application_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: Database["app"]["Enums"]["application_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: Database["app"]["Enums"]["application_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_session_contexts: {
        Row: {
          active_organisation_id: string
          context_version: number
          created_at: string
          session_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active_organisation_id: string
          context_version?: number
          created_at?: string
          session_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active_organisation_id?: string
          context_version?: number
          created_at?: string
          session_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_session_contexts_active_organisation_id_fkey"
            columns: ["active_organisation_id"]
            isOneToOne: false
            referencedRelation: "organisations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      custom_access_token_hook: { Args: { event: Json }; Returns: Json }
      normalise_organisation_handle: {
        Args: { p_value: string }
        Returns: string
      }
    }
    Enums: {
      application_role: "user" | "admin"
      organisation_role: "owner" | "admin" | "member"
      pricing_plan_interval: "day" | "week" | "month" | "year"
      pricing_type: "one_time" | "recurring"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
        | "paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  api: {
    Enums: {},
  },
  api_edge: {
    Enums: {},
  },
  app: {
    Enums: {
      application_role: ["user", "admin"],
      organisation_role: ["owner", "admin", "member"],
      pricing_plan_interval: ["day", "week", "month", "year"],
      pricing_type: ["one_time", "recurring"],
      subscription_status: [
        "trialing",
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "unpaid",
        "paused",
      ],
    },
  },
  public: {
    Enums: {},
  },
} as const
