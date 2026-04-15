import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native'
import { Session } from '@supabase/supabase-js'
import { supabase } from './src/lib/supabase'
import { colors, spacing, radius } from './src/theme'
import LoginScreen from './src/screens/shared/LoginScreen'
import BookingScreen from './src/screens/client/BookingScreen'
import AppointmentsScreen from './src/screens/client/AppointmentsScreen'
import ProfileScreen from './src/screens/client/ProfileScreen'
import DashboardScreen from './src/screens/barber/DashboardScreen'
import AgendaScreen from './src/screens/barber/AgendaScreen'

type Screen = 'home' | 'booking' | 'appointments' | 'profile'

function HomeScreen({ session }: { session: Session }) {
  const [screen, setScreen] = useState<Screen>('home')

  if (screen === 'booking') return (
    <View style={{ flex:1, backgroundColor: colors.cream }}>
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
    <View style={{ flex:1, backgroundColor: colors.cream }}>
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
    <View style={{ flex:1, backgroundColor: colors.cream }}>
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
    <View style={{ flex:1, backgroundColor: colors.cream }}>
      {/* Header rouge */}
      <View style={s.header}>
        <Text style={s.headerLogo}>Jampiero BarberoShop</Text>
        <Text style={s.headerWelcome}>Bonjour 👋 {session.user.email?.split('@')[0]}</Text>
      </View>

      {/* Contenu */}
      <View style={s.body}>
        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statCard}>
            <Text style={s.statVal}>✂</Text>
            <Text style={s.statLbl}>Barbershop</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statVal}>🇩🇴</Text>
            <Text style={s.statLbl}>Dominicain</Text>
          </View>
          <View style={s.statCard}>
            <Text style={s.statVal}>5★</Text>
            <Text style={s.statLbl}>Note</Text>
          </View>
        </View>

        {/* Menu */}
        <View style={s.menuGrid}>
          <TouchableOpacity style={[s.menuCard, s.menuCardAccent]} onPress={() => setScreen('booking')}>
            <Text style={s.menuIcon}>✂</Text>
            <Text style={[s.menuLabel, { color: colors.redDark }]}>Réserver</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.menuCard} onPress={() => setScreen('appointments')}>
            <Text style={s.menuIcon}>📅</Text>
            <Text style={s.menuLabel}>Mes RDV</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.menuCard} onPress={() => setScreen('profile')}>
            <Text style={s.menuIcon}>👤</Text>
            <Text style={s.menuLabel}>Profil</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.menuCard}>
            <Text style={s.menuIcon}>📍</Text>
            <Text style={s.menuLabel}>Adresse</Text>
          </TouchableOpacity>
        </View>

        {/* Adresse */}
        <View style={s.addressCard}>
          <Text style={s.addressTitle}>Nous trouver</Text>
          <Text style={s.addressText}>12 Rue de Rive, 1204 Genève</Text>
          <Text style={s.addressText}>Lun–Ven 9h–19h · Sam 9h–18h</Text>
        </View>
      </View>
    </View>
  )
}

function BarberApp({ barberId, onSignOut }: { barberId: string; onSignOut: () => void }) {
  const [tab, setTab] = useState<'dashboard' | 'agenda' | 'profile'>('dashboard')

  return (
    <View style={{ flex:1, backgroundColor: colors.cream }}>
      <View style={s.topBar}>
        <Text style={s.topBarTitle}>
          {tab === 'dashboard' ? 'Dashboard' : tab === 'agenda' ? 'Agenda' : 'Mon Profil'}
        </Text>
      </View>
      {tab === 'dashboard' && <DashboardScreen barberId={barberId} />}
      {tab === 'agenda'    && <AgendaScreen    barberId={barberId} />}
      {tab === 'profile'   && <ProfileScreen />}
      <View style={s.bottomTabs}>
        <TouchableOpacity style={s.bottomTab} onPress={() => setTab('dashboard')}>
          <Text style={[s.bottomTabText, tab === 'dashboard' && s.bottomTabActive]}>📅 Dashboard</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.bottomTab} onPress={() => setTab('agenda')}>
          <Text style={[s.bottomTabText, tab === 'agenda' && s.bottomTabActive]}>🗓 Agenda</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.bottomTab} onPress={() => setTab('profile')}>
          <Text style={[s.bottomTabText, tab === 'profile' && s.bottomTabActive]}>👤 Profil</Text>
        </TouchableOpacity>
      </View>
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
    const { data: prof } = await supabase
      .from('profiles').select('id, role').eq('id', userId).single()
    if (prof?.role === 'barber') {
      const { data: barber } = await supabase
        .from('barbers').select('id').eq('profile_id', userId).single()
      setProfile({ id: barber?.id ?? prof.id, role: 'barber' })
    } else {
      setProfile(prof)
    }
  }

  if (loading) return (
    <View style={{ flex:1, backgroundColor: colors.cream, alignItems:'center', justifyContent:'center' }}>
      <ActivityIndicator color={colors.red} size="large" />
    </View>
  )

  if (!session) return <LoginScreen />
  if (profile?.role === 'barber') return (
    <BarberApp barberId={profile.id} onSignOut={() => supabase.auth.signOut()} />
  )
  return <HomeScreen session={session} />
}

const s = StyleSheet.create({
  topBar:          { backgroundColor: colors.red, paddingHorizontal: spacing.md, paddingVertical: spacing.md, flexDirection:'row', alignItems:'center', justifyContent:'space-between' },
  topBarTitle:     { color: colors.white, fontSize:17, fontStyle:'italic', letterSpacing:1 },
  topBarBack:      { color: colors.white, fontSize:14, opacity:0.9 },
  header:          { backgroundColor: colors.red, paddingHorizontal: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  headerLogo:      { color: colors.white, fontSize:20, fontStyle:'italic', letterSpacing:1, marginBottom:4 },
  headerWelcome:   { color: colors.white, fontSize:14, opacity:0.85 },
  body:            { flex:1, padding: spacing.md },
  statsRow:        { flexDirection:'row', gap:8, marginBottom: spacing.md },
  statCard:        { flex:1, backgroundColor: colors.white, borderWidth:1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.sm, alignItems:'center' },
  statVal:         { fontSize:20, marginBottom:4 },
  statLbl:         { fontSize:9, color: colors.textMuted, letterSpacing:1, textTransform:'uppercase' },
  menuGrid:        { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom: spacing.md },
  menuCard:        { width:'47%', backgroundColor: colors.white, borderWidth:1.5, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, alignItems:'center' },
  menuCardAccent:  { borderColor: colors.red, backgroundColor: colors.redLight },
  menuIcon:        { fontSize:24, marginBottom:6 },
  menuLabel:       { fontSize:11, color: colors.text, letterSpacing:1, textTransform:'uppercase', fontWeight:'500' },
  addressCard:     { backgroundColor: colors.white, borderWidth:1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md },
  addressTitle:    { color: colors.red, fontSize:11, letterSpacing:2, textTransform:'uppercase', fontWeight:'600', marginBottom:6 },
  addressText:     { color: colors.textMuted, fontSize:13, lineHeight:22 },
  bottomTabs:      { flexDirection:'row', backgroundColor: colors.white, borderTopWidth:1, borderTopColor: colors.border },
  bottomTab:       { flex:1, paddingVertical:12, alignItems:'center' },
  bottomTabText:   { fontSize:11, letterSpacing:1, color: colors.textMuted, textTransform:'uppercase' },
  bottomTabActive: { color: colors.red, fontWeight:'600' },
})