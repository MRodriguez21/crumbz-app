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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      admins: {
        Row: {
          user_id: string
        }
        Insert: {
          user_id: string
        }
        Update: {
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "admins_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      areas: {
        Row: {
          boundary: unknown
          city_id: number
          id: number
          name: string
          slug: string
        }
        Insert: {
          boundary?: unknown
          city_id: number
          id?: never
          name: string
          slug: string
        }
        Update: {
          boundary?: unknown
          city_id?: number
          id?: never
          name?: string
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "areas_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blocks_blocked_id_fkey"
            columns: ["blocked_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "blocks_blocker_id_fkey"
            columns: ["blocker_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      cities: {
        Row: {
          country_code: string
          id: number
          name: string
          slug: string
        }
        Insert: {
          country_code?: string
          id?: never
          name: string
          slug: string
        }
        Update: {
          country_code?: string
          id?: never
          name?: string
          slug?: string
        }
        Relationships: []
      }
      dishes: {
        Row: {
          cover_photo_path: string | null
          created_at: string
          created_by: string | null
          description: string | null
          id: string
          mentions_count: number
          name: string
          place_id: string
          price_usd: number | null
          recommend_count: number
        }
        Insert: {
          cover_photo_path?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          mentions_count?: number
          name: string
          place_id: string
          price_usd?: number | null
          recommend_count?: number
        }
        Update: {
          cover_photo_path?: string | null
          created_at?: string
          created_by?: string | null
          description?: string | null
          id?: string
          mentions_count?: number
          name?: string
          place_id?: string
          price_usd?: number | null
          recommend_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "dishes_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "dishes_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "place_rankings"
            referencedColumns: ["place_id"]
          },
          {
            foreignKeyName: "dishes_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      list_items: {
        Row: {
          created_at: string
          dish_id: string | null
          id: string
          list_id: string
          note: string | null
          place_id: string | null
          position: number
        }
        Insert: {
          created_at?: string
          dish_id?: string | null
          id?: string
          list_id: string
          note?: string | null
          place_id?: string | null
          position: number
        }
        Update: {
          created_at?: string
          dish_id?: string | null
          id?: string
          list_id?: string
          note?: string | null
          place_id?: string | null
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "list_items_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_items_list_id_fkey"
            columns: ["list_id"]
            isOneToOne: false
            referencedRelation: "lists"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "list_items_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "place_rankings"
            referencedColumns: ["place_id"]
          },
          {
            foreignKeyName: "list_items_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      lists: {
        Row: {
          created_at: string
          id: string
          is_public: boolean
          is_ranked: boolean
          kind: Database["public"]["Enums"]["list_kind"]
          tag_id: number | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_public?: boolean
          is_ranked?: boolean
          kind: Database["public"]["Enums"]["list_kind"]
          tag_id?: number | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_public?: boolean
          is_ranked?: boolean
          kind?: Database["public"]["Enums"]["list_kind"]
          tag_id?: number | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lists_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lists_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      place_members: {
        Row: {
          place_id: string
          role: string
          user_id: string
          verified_at: string | null
        }
        Insert: {
          place_id: string
          role: string
          user_id: string
          verified_at?: string | null
        }
        Update: {
          place_id?: string
          role?: string
          user_id?: string
          verified_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "place_members_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "place_rankings"
            referencedColumns: ["place_id"]
          },
          {
            foreignKeyName: "place_members_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "place_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      place_service_areas: {
        Row: {
          area_id: number
          place_id: string
        }
        Insert: {
          area_id: number
          place_id: string
        }
        Update: {
          area_id?: number
          place_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "place_service_areas_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "place_service_areas_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "place_rankings"
            referencedColumns: ["place_id"]
          },
          {
            foreignKeyName: "place_service_areas_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
        ]
      }
      place_tags: {
        Row: {
          place_id: string
          tag_id: number
        }
        Insert: {
          place_id: string
          tag_id: number
        }
        Update: {
          place_id?: string
          tag_id?: number
        }
        Relationships: [
          {
            foreignKeyName: "place_tags_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "place_rankings"
            referencedColumns: ["place_id"]
          },
          {
            foreignKeyName: "place_tags_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "place_tags_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          address: string | null
          area_id: number | null
          city_id: number
          client_request_id: string | null
          created_at: string
          created_by: string | null
          google_place_id: string | null
          has_generator: boolean | null
          has_parking: boolean | null
          id: string
          instagram: string | null
          kind: Database["public"]["Enums"]["place_kind"]
          location: unknown
          location_fetched_at: string | null
          location_source: Database["public"]["Enums"]["location_source"] | null
          name: string
          payment_methods: Database["public"]["Enums"]["payment_method"][]
          posts_count: number
          price_level: number | null
          rating_sum: number
          saves_count: number
          service_modes: Database["public"]["Enums"]["service_mode"][]
          slug: string
          status: Database["public"]["Enums"]["place_status"]
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          area_id?: number | null
          city_id: number
          client_request_id?: string | null
          created_at?: string
          created_by?: string | null
          google_place_id?: string | null
          has_generator?: boolean | null
          has_parking?: boolean | null
          id?: string
          instagram?: string | null
          kind?: Database["public"]["Enums"]["place_kind"]
          location?: unknown
          location_fetched_at?: string | null
          location_source?:
            | Database["public"]["Enums"]["location_source"]
            | null
          name: string
          payment_methods?: Database["public"]["Enums"]["payment_method"][]
          posts_count?: number
          price_level?: number | null
          rating_sum?: number
          saves_count?: number
          service_modes?: Database["public"]["Enums"]["service_mode"][]
          slug: string
          status?: Database["public"]["Enums"]["place_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          area_id?: number | null
          city_id?: number
          client_request_id?: string | null
          created_at?: string
          created_by?: string | null
          google_place_id?: string | null
          has_generator?: boolean | null
          has_parking?: boolean | null
          id?: string
          instagram?: string | null
          kind?: Database["public"]["Enums"]["place_kind"]
          location?: unknown
          location_fetched_at?: string | null
          location_source?:
            | Database["public"]["Enums"]["location_source"]
            | null
          name?: string
          payment_methods?: Database["public"]["Enums"]["payment_method"][]
          posts_count?: number
          price_level?: number | null
          rating_sum?: number
          saves_count?: number
          service_modes?: Database["public"]["Enums"]["service_mode"][]
          slug?: string
          status?: Database["public"]["Enums"]["place_status"]
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "places_area_id_fkey"
            columns: ["area_id"]
            isOneToOne: false
            referencedRelation: "areas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "places_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "places_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_dishes: {
        Row: {
          dish_id: string
          note: string | null
          post_id: string
          rating: number | null
          recommended: boolean
        }
        Insert: {
          dish_id: string
          note?: string | null
          post_id: string
          rating?: number | null
          recommended?: boolean
        }
        Update: {
          dish_id?: string
          note?: string | null
          post_id?: string
          rating?: number | null
          recommended?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "post_dishes_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_dishes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_photos: {
        Row: {
          created_at: string
          dish_id: string | null
          height: number | null
          id: string
          position: number
          post_id: string
          storage_path: string
          width: number | null
        }
        Insert: {
          created_at?: string
          dish_id?: string | null
          height?: number | null
          id?: string
          position?: number
          post_id: string
          storage_path: string
          width?: number | null
        }
        Update: {
          created_at?: string
          dish_id?: string | null
          height?: number | null
          id?: string
          position?: number
          post_id?: string
          storage_path?: string
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "post_photos_dish_id_fkey"
            columns: ["dish_id"]
            isOneToOne: false
            referencedRelation: "dishes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "post_photos_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          body: string | null
          created_at: string
          id: string
          likes_count: number
          mode: Database["public"]["Enums"]["service_mode"]
          place_id: string
          rating: number
          spend_per_person_usd: number | null
          updated_at: string
          user_id: string
          visited_on: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          id?: string
          likes_count?: number
          mode: Database["public"]["Enums"]["service_mode"]
          place_id: string
          rating: number
          spend_per_person_usd?: number | null
          updated_at?: string
          user_id: string
          visited_on?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          id?: string
          likes_count?: number
          mode?: Database["public"]["Enums"]["service_mode"]
          place_id?: string
          rating?: number
          spend_per_person_usd?: number | null
          updated_at?: string
          user_id?: string
          visited_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "posts_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "place_rankings"
            referencedColumns: ["place_id"]
          },
          {
            foreignKeyName: "posts_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_path: string | null
          bio: string | null
          created_at: string
          display_name: string
          followers_count: number
          following_count: number
          home_city_id: number | null
          id: string
          posts_count: number
          username: string
        }
        Insert: {
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          display_name: string
          followers_count?: number
          following_count?: number
          home_city_id?: number | null
          id: string
          posts_count?: number
          username: string
        }
        Update: {
          avatar_path?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string
          followers_count?: number
          following_count?: number
          home_city_id?: number | null
          id?: string
          posts_count?: number
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_home_city_id_fkey"
            columns: ["home_city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          id: string
          reason: string
          reporter_id: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Insert: {
          created_at?: string
          id?: string
          reason: string
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_type: Database["public"]["Enums"]["report_target"]
        }
        Update: {
          created_at?: string
          id?: string
          reason?: string
          reporter_id?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_type?: Database["public"]["Enums"]["report_target"]
        }
        Relationships: [
          {
            foreignKeyName: "reports_reporter_id_fkey"
            columns: ["reporter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_resolved_by_fkey"
            columns: ["resolved_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      saves: {
        Row: {
          created_at: string
          place_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          place_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          place_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saves_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "place_rankings"
            referencedColumns: ["place_id"]
          },
          {
            foreignKeyName: "saves_place_id_fkey"
            columns: ["place_id"]
            isOneToOne: false
            referencedRelation: "places"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saves_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          id: number
          name: string
          slug: string
        }
        Insert: {
          id?: never
          name: string
          slug: string
        }
        Update: {
          id?: never
          name?: string
          slug?: string
        }
        Relationships: []
      }
    }
    Views: {
      place_rankings: {
        Row: {
          avg_rating: number | null
          city_id: number | null
          place_id: string | null
          raters: number | null
          score: number | null
        }
        Relationships: [
          {
            foreignKeyName: "places_city_id_fkey"
            columns: ["city_id"]
            isOneToOne: false
            referencedRelation: "cities"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      create_place: {
        Args: {
          p_address?: string
          p_area_id?: number
          p_city_id: number
          p_has_generator?: boolean
          p_has_parking?: boolean
          p_instagram?: string
          p_kind: Database["public"]["Enums"]["place_kind"]
          p_lat?: number
          p_lng?: number
          p_name: string
          p_payment_methods?: Database["public"]["Enums"]["payment_method"][]
          p_request_id?: string
          p_service_area_ids?: number[]
          p_service_modes: Database["public"]["Enums"]["service_mode"][]
          p_tag_ids?: number[]
          p_whatsapp?: string
        }
        Returns: {
          id: string
          slug: string
        }[]
      }
      immutable_unaccent: { Args: { p: string }; Returns: string }
      import_google_place: {
        Args: {
          p_address: string
          p_city_id: number
          p_google_place_id: string
          p_kind?: Database["public"]["Enums"]["place_kind"]
          p_lat: number
          p_lng: number
          p_name: string
          p_user_id: string
        }
        Returns: {
          created: boolean
          id: string
          slug: string
        }[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_in_venezuela: {
        Args: { p_lat: number; p_lng: number }
        Returns: boolean
      }
      next_place_slug: { Args: { p_name: string }; Returns: string }
      place_slug_base: { Args: { p_name: string }; Returns: string }
      places_nearby: {
        Args: {
          lat: number
          lng: number
          max_results?: number
          radius_m?: number
        }
        Returns: {
          distance_m: number
          id: string
          kind: Database["public"]["Enums"]["place_kind"]
          name: string
          score: number
          slug: string
        }[]
      }
      search_places: {
        Args: { max_results?: number; p_city_id: number; q: string }
        Returns: {
          address: string
          area_name: string
          google_place_id: string
          id: string
          kind: Database["public"]["Enums"]["place_kind"]
          match_score: number
          name: string
          service_modes: Database["public"]["Enums"]["service_mode"][]
          slug: string
        }[]
      }
      top_places: {
        Args: {
          max_results?: number
          min_raters?: number
          p_city_id: number
          p_tag_slug?: string
        }
        Returns: {
          avg_rating: number
          id: string
          name: string
          raters: number
          score: number
          slug: string
        }[]
      }
    }
    Enums: {
      list_kind: "places" | "dishes"
      location_source: "google" | "device"
      payment_method:
        | "cash_usd"
        | "cash_ves"
        | "pago_movil"
        | "card_pos"
        | "zelle"
        | "binance"
        | "transfer"
        | "other"
      place_kind:
        | "restaurant"
        | "cafe"
        | "bar"
        | "bakery"
        | "food_truck"
        | "delivery_only"
        | "other"
      place_status: "active" | "closed" | "rejected"
      report_status: "open" | "resolved" | "dismissed"
      report_target: "post" | "photo" | "place" | "dish" | "profile"
      service_mode: "dine_in" | "pickup" | "delivery"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      list_kind: ["places", "dishes"],
      location_source: ["google", "device"],
      payment_method: [
        "cash_usd",
        "cash_ves",
        "pago_movil",
        "card_pos",
        "zelle",
        "binance",
        "transfer",
        "other",
      ],
      place_kind: [
        "restaurant",
        "cafe",
        "bar",
        "bakery",
        "food_truck",
        "delivery_only",
        "other",
      ],
      place_status: ["active", "closed", "rejected"],
      report_status: ["open", "resolved", "dismissed"],
      report_target: ["post", "photo", "place", "dish", "profile"],
      service_mode: ["dine_in", "pickup", "delivery"],
    },
  },
} as const
