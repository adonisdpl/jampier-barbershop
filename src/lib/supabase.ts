import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://evnrutwhvfkpzumjnaxd.supabase.co' // remplacez par votre URL
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV2bnJ1dHdodmZrcHp1bWpuYXhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYwNzcxMzgsImV4cCI6MjA5MTY1MzEzOH0.5j5mk1EmmfdZqLjaUG9gzfccMS659HDM1HFJ-SMNihs'                          // remplacez par votre clé

export const supabase = createClient(supabaseUrl, supabaseAnonKey)