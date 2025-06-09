import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL is not set');
}

export const sql = neon(process.env.DATABASE_URL);

export interface User {
    id: number;
    email: string;
    username: string;
    password_hash: string;
    linkedin_url?: string;
    created_at: Date;
    updated_at: Date;
    email_notifications: boolean;
    last_login?: Date;
    target_industries?: string[];
    min_employees?: number;
    max_employees?: number;
    min_revenue?: number;
    max_revenue?: number;
    business_type_preference?: string;
    require_contact_info?: boolean;
}