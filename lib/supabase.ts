import 'react-native-get-random-values';
import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';

const supabaseUrl = 'https://pemhmkrhcyygnhkogmry.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBlbWhta3JoY3l5Z25oa29nbXJ5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTU2MjU5OTIsImV4cCI6MjA3MTIwMTk5Mn0.ngQKBz-Ha_N1qo9iLme64ai3RbeLDRLVtL2FzeAhPuQ';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});