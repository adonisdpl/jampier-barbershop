import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { Session } from '@supabase/supabase-js'
import { supabase } from './src/lib/supabase'
import LoginScreen from './src/screens/shared/LoginScreen'

// ─── Écran d'accueil temporaire (on le remplacera par la vraie navigation) ───
function HomeScreen({ session }: { session: Session }) {
  const email = session.user.email

  async function signOut() {
    await supabase.auth.signOut()
  }

  return (
    <View style={s.container}>
      <Text style={s.logo}>Jampiero</Text>
      <Text style={s.subtitle}>BarberoShop</Text>
      <View style={s.divider} />
      <Text style={s.welcome}>Bienvenue 👋</Text>
      <Text style={s.email}>{email}</Text>

      <View style={s.menu}>
        <TouchableOpacity style={s.menuItem}>
          <Text style={s.menuIcon}>✂</Text>
          <Text style={s.menuText}>Réserver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.menuItem}>
          <Text style={s.menuIcon}>📅</Text>
          <Text style={s.menuText}>Mes RDV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.menuItem}>
          <Text style={s.menuIcon}>👤</Text>
          <Text style={s.menuText}>Profil</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={s.signOut} onPress={signOut}>
        <Text style={s.signOutText}>Se déconnecter</Text>
      </TouchableOpacity>
    </View>
  )
}

// ─── App principale ───────────────────────────────────────────────────────────
export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    supabase.auth.onAuthStateChange((_e, s) => setSession(s))
  }, [])

  if (loading) return (
    <View style={s.container}>
      <ActivityIndicator color="#c9a96e" size="large" />
    </View>
  )

  return session ? <HomeScreen session={session} /> : <LoginScreen />
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container:    { flex:1, backgroundColor:'#1a1a1a', alignItems:'center', justifyContent:'center', padding:32 },
  logo:         { color:'#c9a96e', fontSize:32, fontStyle:'italic', letterSpacing:2 },
  subtitle:     { color:'#888', fontSize:14, letterSpacing:4 },
  divider:      { width:40, height:1, backgroundColor:'#c9a96e', marginVertical:24 },
  welcome:      { color:'#fff', fontSize:20, marginBottom:6 },
  email:        { color:'#555', fontSize:13, marginBottom:40 },
  menu:         { flexDirection:'row', gap:16, marginBottom:48 },
  menuItem:     { alignItems:'center', backgroundColor:'#222', borderWidth:1, borderColor:'#333', padding:20, borderRadius:8, width:90 },
  menuIcon:     { fontSize:24, marginBottom:8 },
  menuText:     { color:'#c9a96e', fontSize:12, letterSpacing:1 },
  signOut:      { borderWidth:1, borderColor:'#333', paddingVertical:10, paddingHorizontal:24, borderRadius:4 },
  signOutText:  { color:'#555', fontSize:13 },
})