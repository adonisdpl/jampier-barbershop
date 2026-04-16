import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, Alert
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { colors, spacing, radius } from '../../theme'

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
  pending:   colors.warning,
  confirmed: colors.success,
  cancelled: colors.danger,
  done:      colors.textMuted,
}
const STATUS_BG: Record<string, string> = {
  pending:   colors.warningLight,
  confirmed: colors.successLight,
  cancelled: colors.dangerLight,
  done:      colors.borderLight,
}

function BookingCard({ booking, onCancel }: { booking: Booking; onCancel: (id: string) => void }) {
  const d = new Date(booking.date + 'T12:00')
  const dateLabel = d.toLocaleDateString('fr-CH', { weekday:'long', day:'numeric', month:'long', year:'numeric' })
  const isPast    = d < new Date()
  const canCancel = booking.status === 'pending' || booking.status === 'confirmed'

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <Text style={s.cardDate}>{dateLabel}</Text>
        <View style={[s.badge, { backgroundColor: STATUS_BG[booking.status] }]}>
          <Text style={[s.badgeText, { color: STATUS_COLOR[booking.status] }]}>
            {STATUS_LABEL[booking.status]}
          </Text>
        </View>
      </View>

      <View style={s.cardDivider} />

      <View style={s.cardBody}>
        <Row icon="✂" label={booking.barber.name} />
        <Row icon="◌" label={`${booking.service.name} · ${booking.service.duration_min} min`} />
        <Row icon="🕐" label={booking.slot_time.slice(0, 5)} />
        <Row icon="💰" label={`${booking.service.price_chf} CHF`} />
      </View>

      {canCancel && !isPast && (
        <TouchableOpacity
          style={s.cancelBtn}
          onPress={() => Alert.alert('Annuler ce RDV ?', 'Cette action est irréversible.', [
            { text: 'Non', style: 'cancel' },
            { text: 'Oui, annuler', style: 'destructive', onPress: () => onCancel(booking.id) },
          ])}
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
      .select(`id, date, slot_time, status,
        barber:barbers(name),
        service:services(name, price_chf, duration_min)`)
      .eq('client_id', user.id)
      .order('date', { ascending: false })
    if (!error) setBookings((data as any) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  async function cancelBooking(id: string) {
    const { error } = await supabase.from('bookings').update({ status: 'cancelled' }).eq('id', id)
    if (error) { Alert.alert('Erreur', error.message); return }
    fetchBookings()
  }

  const today    = new Date(); today.setHours(0,0,0,0)
  const upcoming = bookings.filter(b => new Date(b.date+'T12:00') >= today && b.status !== 'cancelled')
  const past     = bookings.filter(b => new Date(b.date+'T12:00') < today || b.status === 'cancelled' || b.status === 'done')
  const list     = tab === 'upcoming' ? upcoming : past

  return (
    <View style={s.container}>
      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity style={[s.tab, tab === 'upcoming' && s.tabActive]} onPress={() => setTab('upcoming')}>
          <Text style={[s.tabText, tab === 'upcoming' && s.tabTextActive]}>À venir ({upcoming.length})</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'past' && s.tabActive]} onPress={() => setTab('past')}>
          <Text style={[s.tabText, tab === 'past' && s.tabTextActive]}>Historique ({past.length})</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color={colors.red} style={{ marginTop: 40 }} />
      ) : list.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📅</Text>
          <Text style={s.emptyTitle}>{tab === 'upcoming' ? 'Aucun rendez-vous à venir' : 'Aucun historique'}</Text>
          <Text style={s.emptySub}>{tab === 'upcoming' ? 'Réservez votre prochain RDV !' : 'Vos anciens RDV apparaîtront ici.'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}>
          {list.map(b => <BookingCard key={b.id} booking={b} onCancel={cancelBooking} />)}
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container:     { flex:1, backgroundColor: colors.cream },
  tabs:          { flexDirection:'row', backgroundColor: colors.white, borderBottomWidth:1, borderBottomColor: colors.border },
  tab:           { flex:1, paddingVertical:14, alignItems:'center', borderBottomWidth:2, borderBottomColor:'transparent' },
  tabActive:     { borderBottomColor: colors.red },
  tabText:       { color: colors.textMuted, fontSize:13, letterSpacing:1 },
  tabTextActive: { color: colors.red, fontWeight:'600' },
  card:          { backgroundColor: colors.white, borderWidth:1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm },
  cardHeader:    { flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom: spacing.sm },
  cardDate:      { color: colors.text, fontSize:13, fontWeight:'500', flex:1, marginRight: spacing.sm },
  badge:         { paddingVertical:4, paddingHorizontal:10, borderRadius: radius.sm },
  badgeText:     { fontSize:11, letterSpacing:1, fontWeight:'500' },
  cardDivider:   { height:1, backgroundColor: colors.borderLight, marginBottom: spacing.sm },
  cardBody:      { gap: spacing.sm },
  row:           { flexDirection:'row', alignItems:'center', gap:10 },
  rowIcon:       { fontSize:14, width:20, textAlign:'center' },
  rowLabel:      { color: colors.textMuted, fontSize:13 },
  cancelBtn:     { marginTop: spacing.md, borderWidth:1.5, borderColor: colors.red, padding:10, borderRadius: radius.md, alignItems:'center' },
  cancelBtnText: { color: colors.red, fontSize:12, letterSpacing:1, fontWeight:'500' },
  empty:         { flex:1, alignItems:'center', justifyContent:'center', padding: spacing.xl, gap: spacing.sm, marginTop: 60 },
  emptyIcon:     { fontSize:48, marginBottom: spacing.sm },
  emptyTitle:    { color: colors.text, fontSize:16, fontWeight:'600', textAlign:'center' },
  emptySub:      { color: colors.textMuted, fontSize:13, textAlign:'center' },
})