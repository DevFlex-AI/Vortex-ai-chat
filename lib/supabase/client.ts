import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
})

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          avatar_url: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          avatar_url?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          avatar_url?: string | null
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          user_id: string
          title: string
          messages: any[]
          system_instruction: string | null
          chat_layout: 'chat' | 'doc'
          is_pinned: boolean
          is_archived: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          messages?: any[]
          system_instruction?: string | null
          chat_layout?: 'chat' | 'doc'
          is_pinned?: boolean
          is_archived?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          messages?: any[]
          system_instruction?: string | null
          chat_layout?: 'chat' | 'doc'
          is_pinned?: boolean
          is_archived?: boolean
          updated_at?: string
        }
      }
      chat_tabs: {
        Row: {
          id: string
          user_id: string
          conversation_id: string
          tab_order: number
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          conversation_id: string
          tab_order: number
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          conversation_id?: string
          tab_order?: number
          is_active?: boolean
          updated_at?: string
        }
      }
      knowledge_base: {
        Row: {
          id: string
          user_id: string
          file_name: string
          file_type: string
          file_size: number
          content: string
          embeddings: number[] | null
          metadata: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          file_name: string
          file_type: string
          file_size: number
          content: string
          embeddings?: number[] | null
          metadata?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          file_name?: string
          file_type?: string
          file_size?: number
          content?: string
          embeddings?: number[] | null
          metadata?: any | null
          updated_at?: string
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          theme: string
          language: string
          voice_settings: any | null
          accessibility_settings: any | null
          notification_settings: any | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          theme?: string
          language?: string
          voice_settings?: any | null
          accessibility_settings?: any | null
          notification_settings?: any | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          theme?: string
          language?: string
          voice_settings?: any | null
          accessibility_settings?: any | null
          notification_settings?: any | null
          updated_at?: string
        }
      }
    }
  }
}