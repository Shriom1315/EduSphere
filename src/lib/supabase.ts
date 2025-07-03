import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'super_admin' | 'principal' | 'teacher' | 'student';
          school_id?: string;
          phone?: string;
          qualification?: string;
          class_id?: string;
          roll_number?: string;
          parent_name?: string;
          parent_phone?: string;
          is_first_login: boolean;
          created_at: string;
          last_login?: string;
        };
        Insert: Omit<Database['public']['Tables']['users']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['users']['Insert']>;
      };
      schools: {
        Row: {
          id: string;
          name: string;
          principal_id: string;
          address: string;
          phone: string;
          email: string;
          logo?: string;
          total_students: number;
          total_teachers: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['schools']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['schools']['Insert']>;
      };
      classes: {
        Row: {
          id: string;
          name: string;
          grade: string;
          school_id: string;
          class_teacher_id?: string;
          section?: string;
          capacity?: number;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['classes']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['classes']['Insert']>;
      };
      subjects: {
        Row: {
          id: string;
          name: string;
          code: string;
          teacher_id?: string;
          class_id: string;
          school_id: string;
          description?: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['subjects']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['subjects']['Insert']>;
      };
      attendance: {
        Row: {
          id: string;
          student_id: string;
          class_id: string;
          date: string;
          status: 'present' | 'absent' | 'late';
          teacher_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['attendance']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['attendance']['Insert']>;
      };
      grades: {
        Row: {
          id: string;
          student_id: string;
          subject_id: string;
          exam_type: string;
          marks: number;
          max_marks: number;
          date: string;
          teacher_id: string;
          comments?: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['grades']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['grades']['Insert']>;
      };
      notices: {
        Row: {
          id: string;
          title: string;
          content: string;
          school_id: string;
          target_role?: string;
          created_by: string;
          priority: 'low' | 'medium' | 'high';
          attachments?: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['notices']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['notices']['Insert']>;
      };
      assignments: {
        Row: {
          id: string;
          title: string;
          description: string;
          subject_id: string;
          class_id: string;
          teacher_id: string;
          due_date: string;
          max_marks: number;
          attachments?: string[];
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['assignments']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['assignments']['Insert']>;
      };
      fees: {
        Row: {
          id: string;
          student_id: string;
          amount: number;
          due_date: string;
          paid_date?: string;
          status: 'pending' | 'paid' | 'overdue';
          description: string;
          school_id: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['fees']['Row'], 'id' | 'created_at'>;
        Update: Partial<Database['public']['Tables']['fees']['Insert']>;
      };
    };
  };
}