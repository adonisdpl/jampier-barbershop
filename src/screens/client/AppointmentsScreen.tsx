import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, Alert
} from 'react-native'
import { supabase } from '../../lib/supabase'

// ─── Types ────────────────────────────────────────────────
interface Booking {
  id: string
  date: string
  slot_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'done'
  barber: { name: string }
  service: { name: string; price_chf: number; duration_min: number }
}

const STATUS_LABEL: Record<string, string> = {
  pending:   'En attente',
  confirmed: 'Confirmé',
  cancelled: 'Annulé',
  done:      'Terminé',
}

const STATUS_COLOR: Record<string, string> = {
  pending:   '#BA7517',
  confirmed: '#1D9E75',
  cancelled: '#e05252',
  done:      '#555',
}

// ─── Composant carte RDV ──────────────────────────────────
function BookingCard({ booking, onCancel }: { booking: Booking; onCancel: (id: string) => void }) {
  const d = new Date(booking.date + 'T12:00')
  const dateLabel = d.toLocaleDateString('fr-CH', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const isPast = d < new Date()
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed'

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardDate}>{dateLabel}</Text>
        <View style={[s.badge, { backgroundColor: STATUS_COLOR[booking.status] + '22' }]}>
          <Text style={[s.badgeText, { color: STATUS_COLOR[booking.status] }]}>
            {STATUS_LABEL[booking.status]}
          </Text>
        </View>
      </View>

      <View style={s.cardBody}>
        <Row icon="✂" label={booking.barber.name} />
        <Row icon="◌" label={`${booking.service.name} · ${booking.service.duration_min} min`} />
        <Row icon="⌚" label={booking.slot_time.slice(0, 5)} />
        <Row icon="💰" label={`${booking.service.price_chf} CHF`} />
      </View>

      {canCancel && !isPast && (
        <TouchableOpacity
          style={s.cancelBtn}
          onPress={() => Alert.alert(
            'Annuler ce RDV ?',
            'Cette action est irréversible.',
            [
              { text: 'Non', style: 'cancel' },
              { text: 'Oui, annuler', style: 'destructive', onPress: () => onCancel(booking.id) },
            ]
          )}
        >
          <Text style={s.cancelBtnText}>Annuler ce rendez-vous</Text>
        </TouchableOpacity>
      )}
    </View>
  )
}

function Row({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowIcon}>{icon}</Text>
      <Text style={s.rowLabel}>{label}</Text>
    </View>
  )
}

// ─── Écran principal ──────────────────────────────────────
export default function AppointmentsScreen() {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState<'upcoming' | 'past'>('upcoming')

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, date, slot_time, status,
        barber:barbers(name),
        service:services(name, price_chf, duration_min)
      `)
      .eq('client_id', user.id)
      .order('date', { ascending: false })
      .order('slot_time', { ascending: false })

    if (!error) setBookings((data as any) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  async function cancelBooking(id: string) {
    const { error } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', id)
    if (error) { Alert.alert('Erreur', error.message); return }
    fetchBookings()
  }

  const today = new Date(); today.setHours(0,0,0,0)
  const upcoming = bookings.filter(b => new Date(b.date + 'T12:00') >= today && b.status !== 'cancelled')
  const past     = bookings.filter(b => new Date(b.date + 'T12:00') < today  || b.status === 'cancelled' || b.status === 'done')
  const list     = tab === 'upcoming' ? upcoming : past

  return (
    <View style={s.container}>
      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, tab === 'upcoming' && s.tabActive]}
          onPress={() => setTab('upcoming')}
        >
          <Text style={[s.tabText, tab === 'upcoming' && s.tabTextActive]}>
            À venir ({upcoming.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'past' && s.tabActive]}
          onPress={() => setTab('past')}
        >
          <Text style={[s.tabText, tab === 'past' && s.tabTextActive]}>
            Historique ({past.length})
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#c9a96e" style={{ marginTop: 40 }} />
      ) : list.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📅</Text>
          <Text style={s.emptyText}>
            {tab === 'upcoming' ? 'Aucun rendez-vous à venir' : 'Aucun historique'}
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {list.map(b => (
            <BookingCard key={b.id} booking={b} onCancel={cancelBooking} />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────
const s = StyleSheet.create({
  container:       { flex:1, backgroundColor:'#1a1a1a' },
  tabs:            { flexDirection:'row', borderBottomWidth:1, borderBottomColor:'#222' },
  tab:             { flex:1, paddingVertical:14, alignItems:'center' },
  tabActive:       { borderBottomWidth:2, borderBottomColor:'#c9a96e' },
  tabText:         { color:'#555', fontSize:13, letterSpacing:1 },
  tabTextActive:   { color:'#c9a96e' },
  card:            { backgroundColor:'#222', borderWidth:1, borderColor:'#333', borderRadius:8, padding:16, marginBottom:12 },
  cardHeader:      { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:12 },
  cardDate:        { color:'#fff', fontSize:13, flex:1, marginRight:8 },
  badge:           { paddingVertical:4, paddingHorizontal:10, borderRadius:4 },
  badgeText:       { fontSize:11, letterSpacing:1 },
  cardBody:        { gap:8 },
  row:             { flexDirection:'row', alignItems:'center', gap:10 },
  rowIcon:         { fontSize:14, width:20, textAlign:'center' },
  rowLabel:        { color:'#aaa', fontSize:13 },
  cancelBtn:       { marginTop:14, borderWidth:1, borderColor:'#e05252', padding:10, borderRadius:4, alignItems:'center' },
  cancelBtnText:   { color:'#e05252', fontSize:12, letterSpacing:1 },
  empty:           { flex:1, alignItems:'center', justifyContent:'center', gap:12 },
  emptyIcon:       { fontSize:40 },
  emptyText:       { color:'#555', fontSize:14, letterSpacing:1 },
})