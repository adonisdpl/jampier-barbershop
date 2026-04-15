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
  note: string | null
  client: { full_name: string; phone: string | null } | null
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

function BookingCard({ booking, onUpdate }: { booking: Booking; onUpdate: () => void }) {
  const [loading, setLoading] = useState(false)

  async function updateStatus(status: 'confirmed' | 'done' | 'cancelled') {
    setLoading(true)
    const { error } = await supabase.from('bookings').update({ status }).eq('id', booking.id)
    if (error) Alert.alert('Erreur', error.message)
    else onUpdate()
    setLoading(false)
  }

  function confirmAction(status: 'confirmed' | 'done' | 'cancelled') {
    const labels = { confirmed: 'Confirmer', done: 'Marquer terminé', cancelled: 'Annuler' }
    Alert.alert(labels[status], 'Confirmer cette action ?', [
      { text: 'Non', style: 'cancel' },
      { text: 'Oui', onPress: () => updateStatus(status) },
    ])
  }

  return (
    <View style={s.card}>
      <View style={s.cardHeader}>
        <View>
          <Text style={s.slotTime}>{booking.slot_time.slice(0, 5)}</Text>
          <Text style={s.clientName}>{booking.client?.full_name ?? 'Client inconnu'}</Text>
          {booking.client?.phone && <Text style={s.clientPhone}>{booking.client.phone}</Text>}
        </View>
        <View style={[s.badge, { backgroundColor: STATUS_BG[booking.status] }]}>
          <Text style={[s.badgeText, { color: STATUS_COLOR[booking.status] }]}>
            {STATUS_LABEL[booking.status]}
          </Text>
        </View>
      </View>

      <View style={s.serviceRow}>
        <Text style={s.serviceName}>{booking.service.name}</Text>
        <Text style={s.serviceDetail}>{booking.service.duration_min} min · {booking.service.price_chf} CHF</Text>
      </View>

      {booking.note && <Text style={s.note}>📝 {booking.note}</Text>}

      {loading ? (
        <ActivityIndicator color={colors.red} style={{ marginTop: 12 }} />
      ) : (
        <View style={s.actions}>
          {booking.status === 'pending' && (
            <>
              <TouchableOpacity style={s.btnConfirm} onPress={() => confirmAction('confirmed')}>
                <Text style={s.btnConfirmText}>Confirmer</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnCancel} onPress={() => confirmAction('cancelled')}>
                <Text style={s.btnCancelText}>Annuler</Text>
              </TouchableOpacity>
            </>
          )}
          {booking.status === 'confirmed' && (
            <>
              <TouchableOpacity style={s.btnDone} onPress={() => confirmAction('done')}>
                <Text style={s.btnDoneText}>Marquer terminé</Text>
              </TouchableOpacity>
              <TouchableOpacity style={s.btnCancel} onPress={() => confirmAction('cancelled')}>
                <Text style={s.btnCancelText}>Annuler</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  )
}

export default function DashboardScreen({ barberId }: { barberId: string }) {
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading]   = useState(true)
  const [selDate, setSelDate]   = useState(new Date())

  const dateStr   = (d: Date) => d.toISOString().split('T')[0]
  const dateLabel = (d: Date) => d.toLocaleDateString('fr-CH', { weekday:'long', day:'numeric', month:'long' })

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select(`id, date, slot_time, status, note,
        client:profiles(full_name, phone),
        service:services(name, price_chf, duration_min)`)
      .eq('barber_id', barberId)
      .eq('date', dateStr(selDate))
      .neq('status', 'cancelled')
      .order('slot_time')
    if (!error) setBookings((data as any) ?? [])
    setLoading(false)
  }, [barberId, selDate])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  useEffect(() => {
    const ch = supabase.channel(`dashboard:${barberId}`)
      .on('postgres_changes', { event:'*', schema:'public', table:'bookings', filter:`barber_id=eq.${barberId}` }, fetchBookings)
      .subscribe()
    return () => { supabase.removeChannel(ch) }
  }, [barberId, fetchBookings])

  function prevDay() { const d = new Date(selDate); d.setDate(d.getDate()-1); setSelDate(d) }
  function nextDay() { const d = new Date(selDate); d.setDate(d.getDate()+1); setSelDate(d) }

  const total     = bookings.reduce((sum, b) => sum + b.service.price_chf, 0)
  const confirmed = bookings.filter(b => b.status === 'confirmed' || b.status === 'done').length

  return (
    <View style={s.container}>
      {/* Navigation jour */}
      <View style={s.dayNav}>
        <TouchableOpacity onPress={prevDay} style={s.dayNavBtn}>
          <Text style={s.dayNavArrow}>←</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setSelDate(new Date())}>
          <Text style={s.dayLabel}>{dateLabel(selDate)}</Text>
          {dateStr(selDate) === dateStr(new Date()) && (
            <Text style={s.todayBadge}>Aujourd'hui</Text>
          )}
        </TouchableOpacity>
        <TouchableOpacity onPress={nextDay} style={s.dayNavBtn}>
          <Text style={s.dayNavArrow}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Stats */}
      <View style={s.stats}>
        <View style={s.statItem}>
          <Text style={s.statValue}>{bookings.length}</Text>
          <Text style={s.statLabel}>RDV total</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statValue}>{confirmed}</Text>
          <Text style={s.statLabel}>Confirmés</Text>
        </View>
        <View style={s.statDivider} />
        <View style={s.statItem}>
          <Text style={s.statValue}>{total} CHF</Text>
          <Text style={s.statLabel}>Chiffre du jour</Text>
        </View>
      </View>

      {/* Liste */}
      {loading ? (
        <ActivityIndicator color={colors.red} style={{ marginTop: 40 }} />
      ) : bookings.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📅</Text>
          <Text style={s.emptyText}>Aucun rendez-vous ce jour</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: spacing.md, paddingBottom: 40 }}>
          {bookings.map(b => <BookingCard key={b.id} booking={b} onUpdate={fetchBookings} />)}
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container:      { flex:1, backgroundColor: colors.cream },
  dayNav:         { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding: spacing.md, borderBottomWidth:1, borderBottomColor: colors.border, backgroundColor: colors.white },
  dayNavBtn:      { padding: spacing.sm },
  dayNavArrow:    { color: colors.red, fontSize:20 },
  dayLabel:       { color: colors.text, fontSize:15, textAlign:'center', fontWeight:'500' },
  todayBadge:     { color: colors.red, fontSize:11, letterSpacing:1, textAlign:'center', marginTop:2 },
  stats:          { flexDirection:'row', backgroundColor: colors.white, margin: spacing.md, borderRadius: radius.lg, padding: spacing.md, borderWidth:1, borderColor: colors.border },
  statItem:       { flex:1, alignItems:'center' },
  statValue:      { color: colors.red, fontSize:20, fontWeight:'700', marginBottom:4 },
  statLabel:      { color: colors.textMuted, fontSize:11, letterSpacing:1 },
  statDivider:    { width:1, backgroundColor: colors.border, marginHorizontal: spacing.sm },
  card:           { backgroundColor: colors.white, borderWidth:1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm },
  cardHeader:     { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom: spacing.sm },
  slotTime:       { color: colors.red, fontSize:22, fontWeight:'700', marginBottom:2 },
  clientName:     { color: colors.text, fontSize:15, fontWeight:'500' },
  clientPhone:    { color: colors.textMuted, fontSize:12, marginTop:2 },
  badge:          { paddingVertical:4, paddingHorizontal:10, borderRadius: radius.sm },
  badgeText:      { fontSize:11, letterSpacing:1, fontWeight:'500' },
  serviceRow:     { flexDirection:'row', justifyContent:'space-between', marginBottom: spacing.sm },
  serviceName:    { color: colors.textMuted, fontSize:13 },
  serviceDetail:  { color: colors.textMuted, fontSize:13 },
  note:           { color: colors.textMuted, fontSize:12, fontStyle:'italic', marginBottom: spacing.sm },
  actions:        { flexDirection:'row', gap: spacing.sm, marginTop: spacing.sm },
  btnConfirm:     { flex:1, backgroundColor: colors.success, padding:10, alignItems:'center', borderRadius: radius.md },
  btnConfirmText: { color: colors.white, fontSize:12, letterSpacing:1, fontWeight:'500' },
  btnDone:        { flex:1, backgroundColor: colors.goldLight, padding:10, alignItems:'center', borderRadius: radius.md },
  btnDoneText:    { color: colors.goldDark, fontSize:12, letterSpacing:1, fontWeight:'500' },
  btnCancel:      { flex:1, borderWidth:1.5, borderColor: colors.red, padding:10, alignItems:'center', borderRadius: radius.md },
  btnCancelText:  { color: colors.red, fontSize:12, letterSpacing:1 },
  empty:          { flex:1, alignItems:'center', justifyContent:'center', gap: spacing.md, marginTop: 60 },
  emptyIcon:      { fontSize:40 },
  emptyText:      { color: colors.textMuted, fontSize:14, letterSpacing:1 },
})