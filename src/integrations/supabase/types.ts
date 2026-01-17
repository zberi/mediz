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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      chat_conversations: {
        Row: {
          created_at: string
          guest_id: string | null
          id: string
          status: string
          subject: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          guest_id?: string | null
          id?: string
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          guest_id?: string | null
          id?: string
          status?: string
          subject?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      chat_messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          guest_id: string | null
          id: string
          is_from_support: boolean | null
          read_at: string | null
          sender_id: string | null
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          guest_id?: string | null
          id?: string
          is_from_support?: boolean | null
          read_at?: string | null
          sender_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          guest_id?: string | null
          id?: string
          is_from_support?: boolean | null
          read_at?: string | null
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "chat_conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          address: Json | null
          created_at: string
          customer_name: string | null
          customer_phone: string
          delivered_at: string | null
          delivery_fee: number
          discount: number
          estimated_delivery: string | null
          id: string
          items: Json
          order_number: number
          payment_method: string
          prescription_id: string | null
          status: string
          total_amount: number
          tracking_updates: Json | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: Json | null
          created_at?: string
          customer_name?: string | null
          customer_phone: string
          delivered_at?: string | null
          delivery_fee?: number
          discount?: number
          estimated_delivery?: string | null
          id?: string
          items?: Json
          order_number: number
          payment_method?: string
          prescription_id?: string | null
          status?: string
          total_amount: number
          tracking_updates?: Json | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: Json | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string
          delivered_at?: string | null
          delivery_fee?: number
          discount?: number
          estimated_delivery?: string | null
          id?: string
          items?: Json
          order_number?: number
          payment_method?: string
          prescription_id?: string | null
          status?: string
          total_amount?: number
          tracking_updates?: Json | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_prescription_id_fkey"
            columns: ["prescription_id"]
            isOneToOne: false
            referencedRelation: "prescriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      prescriptions: {
        Row: {
          consent_timestamp: string | null
          created_at: string
          id: string
          image_path: string
          order_id: string | null
          parsed_medicines: Json | null
          user_consent: boolean
          user_id: string | null
        }
        Insert: {
          consent_timestamp?: string | null
          created_at?: string
          id?: string
          image_path: string
          order_id?: string | null
          parsed_medicines?: Json | null
          user_consent?: boolean
          user_id?: string | null
        }
        Update: {
          consent_timestamp?: string | null
          created_at?: string
          id?: string
          image_path?: string
          order_id?: string | null
          parsed_medicines?: Json | null
          user_consent?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "prescriptions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      voice_orders: {
        Row: {
          admin_notes: string | null
          audio_duration_seconds: number | null
          audio_path: string
          consent_timestamp: string | null
          created_at: string
          customer_name: string | null
          customer_phone: string
          id: string
          order_id: string | null
          parsed_items: Json | null
          processing_status: string
          status: string
          transcription: string | null
          updated_at: string
          user_consent: boolean
          user_id: string | null
        }
        Insert: {
          admin_notes?: string | null
          audio_duration_seconds?: number | null
          audio_path: string
          consent_timestamp?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone: string
          id?: string
          order_id?: string | null
          parsed_items?: Json | null
          processing_status?: string
          status?: string
          transcription?: string | null
          updated_at?: string
          user_consent?: boolean
          user_id?: string | null
        }
        Update: {
          admin_notes?: string | null
          audio_duration_seconds?: number | null
          audio_path?: string
          consent_timestamp?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string
          id?: string
          order_id?: string | null
          parsed_items?: Json | null
          processing_status?: string
          status?: string
          transcription?: string | null
          updated_at?: string
          user_consent?: boolean
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "voice_orders_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
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
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "seller"
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
      app_role: ["admin", "moderator", "user", "seller"],
    },
  },
} as const
