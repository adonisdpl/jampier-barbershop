import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { Session } from '@supabase/supabase-js'
import { supabase } from './src/lib/supabase'
import LoginScreen from './src/screens/shared/LoginScreen'
import BookingScreen from './src/screens/client/BookingScreen'
import AppointmentsScreen from './src/screens/client/AppointmentsScreen'
import ProfileScreen from './src/screens/client/ProfileScreen'
import DashboardScreen from './src/screens/barber/DashboardScreen'

type Screen = 'home' | 'booking' | 'appointments' | 'profile'

function HomeScreen({ session }: { session: Session }) {
  const [screen, setScreen] = useState<Screen>('home')

  async function signOut() { await supabase.auth.signOut() }

  if (screen === 'booking') return (
    <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={() => setScreen('home')}>
          <Text style={s.topBarBack}>← Retour</Text>
        </TouchableOpacity>
        <Text style={s.topBarTitle}>Réservation</Text>
        <View style={{ width: 60 }} />
      </View>
      <BookingScreen />
    </View>
  )

  if (screen === 'appointments') return (
  <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
    <View style={s.topBar}>
      <TouchableOpacity onPress={() => setScreen('home')}>
        <Text style={s.topBarBack}>← Retour</Text>
      </TouchableOpacity>
      <Text style={s.topBarTitle}>Mes RDV</Text>
      <View style={{ width: 60 }} />
    </View>
    <AppointmentsScreen />
  </View>
)

if (screen === 'profile') return (
  <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
    <View style={s.topBar}>
      <TouchableOpacity onPress={() => setScreen('home')}>
        <Text style={s.topBarBack}>← Retour</Text>
      </TouchableOpacity>
      <Text style={s.topBarTitle}>Mon Profil</Text>
      <View style={{ width: 60 }} />
    </View>
    <ProfileScreen />
  </View>
)

  return (
    <View style={s.container}>
      <Text style={s.logo}>Jampiero</Text>
      <Text style={s.subtitle}>BarberoShop</Text>
      <View style={s.divider} />
      <Text style={s.welcome}>Bienvenue 👋</Text>
      <Text style={s.email}>{session.user.email}</Text>

      <View style={s.menu}>
        <TouchableOpacity style={s.menuItem} onPress={() => setScreen('booking')}>
          <Text style={s.menuIcon}>✂</Text>
          <Text style={s.menuText}>Réserver</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.menuItem} onPress={() => setScreen('appointments')}>
          <Text style={s.menuIcon}>📅</Text>
          <Text style={s.menuText}>Mes RDV</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.menuItem} onPress={() => setScreen('profile')}>
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

export default function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<{ id: string; role: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session) await fetchProfile(data.session.user.id)
      setLoading(false)
    })
    supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s)
      if (s) await fetchProfile(s.user.id)
      else setProfile(null)
    })
  }, [])

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from('profiles')
      .select('id, role')
      .eq('id', userId)
      .single()
    setProfile(data)
  }

  if (loading) return (
    <View style={s.container}>
      <ActivityIndicator color="#c9a96e" size="large" />
    </View>
  )

  if (!session) return <LoginScreen />

  if (profile?.role === 'barber') return (
    <View style={{ flex: 1, backgroundColor: '#1a1a1a' }}>
      <View style={s.topBar}>
        <Text style={s.topBarTitle}>Dashboard</Text>
        <TouchableOpacity onPress={() => supabase.auth.signOut()}>
          <Text style={s.topBarBack}>Déco</Text>
        </TouchableOpacity>
      </View>
      <DashboardScreen barberId={profile.id} />
    </View>
  )

  return <HomeScreen session={session} />
}
const s = StyleSheet.create({
  container:   { flex:1, backgroundColor:'#1a1a1a', alignItems:'center', justifyContent:'center', padding:32 },
  logo:        { color:'#c9a96e', fontSize:32, fontStyle:'italic', letterSpacing:2 },
  subtitle:    { color:'#888', fontSize:14, letterSpacing:4 },
  divider:     { width:40, height:1, backgroundColor:'#c9a96e', marginVertical:24 },
  welcome:     { color:'#fff', fontSize:20, marginBottom:6 },
  email:       { color:'#555', fontSize:13, marginBottom:40 },
  menu:        { flexDirection:'row', gap:16, marginBottom:48 },
  menuItem:    { alignItems:'center', backgroundColor:'#222', borderWidth:1, borderColor:'#333', padding:20, borderRadius:8, width:90 },
  menuIcon:    { fontSize:24, marginBottom:8 },
  menuText:    { color:'#c9a96e', fontSize:12, letterSpacing:1 },
  signOut:     { borderWidth:1, borderColor:'#333', paddingVertical:10, paddingHorizontal:24, borderRadius:4 },
  signOutText: { color:'#555', fontSize:13 },
  topBar:      { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:16, borderBottomWidth:1, borderBottomColor:'#222' },
  topBarBack:  { color:'#c9a96e', fontSize:14 },
  topBarTitle: { color:'#fff', fontSize:15, letterSpacing:2 },
})