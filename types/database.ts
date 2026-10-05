export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type RoleType = 'pelapor' | 'admin' | 'petugas';
export type UserStatus = 'active' | 'pending' | 'suspended';
export type ReportStatus = 'baru' | 'diverifikasi' | 'dijadwalkan' | 'dikerjakan' | 'selesai' | 'ditolak';
export type DamageType = 'retak_memanjang' | 'retak_melintang' | 'retak_buaya' | 'lubang';
export type SeverityLevel = 'low' | 'medium' | 'high' | 'critical';
export type AssignmentStatus = 'ditugaskan' | 'dikerjakan' | 'selesai';
export type FungsiJalan = 'arteri' | 'kolektor' | 'lokal' | 'lingkungan';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          role: RoleType;
          full_name: string;
          phone: string | null;
          nik: string | null;
          nip: string | null;
          instansi: string | null;
          wilayah: string | null;
          status: UserStatus;
          created_at: string;
        };
        Insert: {
          id: string;
          role: RoleType;
          full_name: string;
          phone?: string | null;
          nik?: string | null;
          nip?: string | null;
          instansi?: string | null;
          wilayah?: string | null;
          status?: UserStatus;
          created_at?: string;
        };
        Update: {
          id?: string;
          role?: RoleType;
          full_name?: string;
          phone?: string | null;
          nik?: string | null;
          nip?: string | null;
          instansi?: string | null;
          wilayah?: string | null;
          status?: UserStatus;
          created_at?: string;
        };
      };
      instansi_referensi: {
        Row: {
          id: string;
          nip: string;
          nama_pegawai: string;
          instansi: string;
          is_active: boolean;
        };
        Insert: {
          id?: string;
          nip: string;
          nama_pegawai: string;
          instansi: string;
          is_active?: boolean;
        };
        Update: {
          id?: string;
          nip?: string;
          nama_pegawai?: string;
          instansi?: string;
          is_active?: boolean;
        };
      };
      reports: {
        Row: {
          id: string;
          reporter_id: string;
          photo_url: string;
          latitude: number;
          longitude: number;
          address_text: string | null;
          description: string | null;
          fungsi_jalan: FungsiJalan;
          status: ReportStatus;
          rejection_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          reporter_id: string;
          photo_url: string;
          latitude: number;
          longitude: number;
          address_text?: string | null;
          description?: string | null;
          fungsi_jalan?: FungsiJalan;
          status?: ReportStatus;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          reporter_id?: string;
          photo_url?: string;
          latitude?: number;
          longitude?: number;
          address_text?: string | null;
          description?: string | null;
          fungsi_jalan?: FungsiJalan;
          status?: ReportStatus;
          rejection_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      detections: {
        Row: {
          id: string;
          report_id: string;
          damage_type: DamageType;
          confidence: number;
          bbox_x: number;
          bbox_y: number;
          bbox_w: number;
          bbox_h: number;
          model_version: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          damage_type: DamageType;
          confidence: number;
          bbox_x: number;
          bbox_y: number;
          bbox_w: number;
          bbox_h: number;
          model_version?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          damage_type?: DamageType;
          confidence?: number;
          bbox_x?: number;
          bbox_y?: number;
          bbox_w?: number;
          bbox_h?: number;
          model_version?: string;
          created_at?: string;
        };
      };
      priority_scores: {
        Row: {
          id: string;
          report_id: string;
          severity_value: number;
          s_norm: number;
          exposure_value: number;
          priority_value: number;
          severity_level?: SeverityLevel | null;
          confidence_component?: number | null;
          density_component?: number | null;
          computed_at: string;
        };
        Insert: {
          id?: string;
          report_id: string;
          severity_value: number;
          s_norm?: number;
          exposure_value?: number;
          priority_value: number;
          severity_level?: SeverityLevel | null;
          confidence_component?: number | null;
          density_component?: number | null;
          computed_at?: string;
        };
        Update: {
          id?: string;
          report_id?: string;
          severity_value?: number;
          s_norm?: number;
          exposure_value?: number;
          priority_value?: number;
          severity_level?: SeverityLevel | null;
          confidence_component?: number | null;
          density_component?: number | null;
          computed_at?: string;
        };
      };
      assignments: {
        Row: {
          id: string;
          report_id: string;
          petugas_id: string;
          assigned_by: string;
          assigned_at: string;
          status: AssignmentStatus;
          proof_photo_url: string | null;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          report_id: string;
          petugas_id: string;
          assigned_by: string;
          assigned_at?: string;
          status?: AssignmentStatus;
          proof_photo_url?: string | null;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          report_id?: string;
          petugas_id?: string;
          assigned_by?: string;
          assigned_at?: string;
          status?: AssignmentStatus;
          proof_photo_url?: string | null;
          completed_at?: string | null;
        };
      };
      status_history: {
        Row: {
          id: string;
          report_id: string;
          status_from: string | null;
          status_to: string;
          changed_by: string;
          changed_at: string;
          note: string | null;
        };
        Insert: {
          id?: string;
          report_id: string;
          status_from?: string | null;
          status_to: string;
          changed_by: string;
          changed_at?: string;
          note?: string | null;
        };
        Update: {
          id?: string;
          report_id?: string;
          status_from?: string | null;
          status_to?: string;
          changed_by?: string;
          changed_at?: string;
          note?: string | null;
        };
      };
      notifications: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          message: string;
          is_read: boolean;
          related_report_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          message: string;
          is_read?: boolean;
          related_report_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          message?: string;
          is_read?: boolean;
          related_report_id?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
  };
}
