import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  ActivityIndicator, TouchableOpacity, Alert
} from 'react-native'
import { supabase } from '../../lib/supabase'

interface Booking {
  id: string
  date: string
  slot_time: string
  status: 'pending' | 'confirmed' | 'cancelled' | 'done'
  note: string | null
  client: { full_name: string; phone: string | null }
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

function BookingCard({ booking, onUpdate }: { booking: Booking; onUpdate: () => void }) {
  const [loading, setLoading] = useState(false)

  async function updateStatus(status: 'confirmed' | 'done' | 'cancelled') {
    setLoading(true)
    const { error } = await supabase
      .from('bookings').update({ status }).eq('id', booking.id)
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
          <Text style={s.clientName}>{booking.client.full_name}</Text>
          {booking.client.phone && (
            <Text style={s.clientPhone}>{booking.client.phone}</Text>
          )}
        </View>
        <View style={[s.badge, { backgroundColor: STATUS_COLOR[booking.status] + '22' }]}>
          <Text style={[s.badgeText, { color: STATUS_COLOR[booking.status] }]}>
            {STATUS_LABEL[booking.status]}
          </Text>
        </View>
      </View>

      <View style={s.serviceRow}>
        <Text style={s.serviceName}>{booking.service.name}</Text>
        <Text style={s.serviceDetail}>{booking.service.duration_min} min · {booking.service.price_chf} CHF</Text>
      </View>

      {booking.note && (
        <Text style={s.note}>📝 {booking.note}</Text>
      )}

      {loading ? (
        <ActivityIndicator color="#c9a96e" style={{ marginTop: 12 }} />
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

  const dateStr = (d: Date) => d.toISOString().split('T')[0]
  const dateLabel = (d: Date) => d.toLocaleDateString('fr-CH', {
    weekday: 'long', day: 'numeric', month: 'long'
  })

  const fetchBookings = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        id, date, slot_time, status, note,
        client:profiles(full_name, phone),
        service:services(name, price_chf, duration_min)
      `)
      .eq('barber_id', barberId)
      .eq('date', dateStr(selDate))
      .neq('status', 'cancelled')
      .order('slot_time')

    if (!error) setBookings((data as any) ?? [])
    setLoading(false)
  }, [barberId, selDate])

  useEffect(() => { fetchBookings() }, [fetchBookings])

  // Realtime : nouvelles réservations
  useEffect(() => {
    const channel = supabase
      .channel(`dashboard:${barberId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'bookings',
        filter: `barber_id=eq.${barberId}`,
      }, () => fetchBookings())
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [barberId, fetchBookings])

  function prevDay() { const d = new Date(selDate); d.setDate(d.getDate() - 1); setSelDate(d) }
  function nextDay() { const d = new Date(selDate); d.setDate(d.getDate() + 1); setSelDate(d) }

  const total = bookings.reduce((sum, b) => sum + b.service.price_chf, 0)
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

      {/* Stats du jour */}
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

      {/* Liste RDV */}
      {loading ? (
        <ActivityIndicator color="#c9a96e" style={{ marginTop: 40 }} />
      ) : bookings.length === 0 ? (
        <View style={s.empty}>
          <Text style={s.emptyIcon}>📅</Text>
          <Text style={s.emptyText}>Aucun rendez-vous ce jour</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 40 }}>
          {bookings.map(b => (
            <BookingCard key={b.id} booking={b} onUpdate={fetchBookings} />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container:       { flex:1, backgroundColor:'#1a1a1a' },
  dayNav:          { flexDirection:'row', alignItems:'center', justifyContent:'space-between', padding:16, borderBottomWidth:1, borderBottomColor:'#222' },
  dayNavBtn:       { padding:8 },
  dayNavArrow:     { color:'#c9a96e', fontSize:20 },
  dayLabel:        { color:'#fff', fontSize:15, textAlign:'center' },
  todayBadge:      { color:'#c9a96e', fontSize:11, letterSpacing:1, textAlign:'center', marginTop:2 },
  stats:           { flexDirection:'row', backgroundColor:'#222', margin:16, borderRadius:8, padding:16, borderWidth:1, borderColor:'#333' },
  statItem:        { flex:1, alignItems:'center' },
  statValue:       { color:'#c9a96e', fontSize:20, fontWeight:'500', marginBottom:4 },
  statLabel:       { color:'#555', fontSize:11, letterSpacing:1 },
  statDivider:     { width:1, backgroundColor:'#333', marginHorizontal:8 },
  card:            { backgroundColor:'#222', borderWidth:1, borderColor:'#333', borderRadius:8, padding:16, marginBottom:12 },
  cardHeader:      { flexDirection:'row', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 },
  slotTime:        { color:'#c9a96e', fontSize:20, fontWeight:'500', marginBottom:2 },
  clientName:      { color:'#fff', fontSize:15 },
  clientPhone:     { color:'#555', fontSize:12, marginTop:2 },
  badge:           { paddingVertical:4, paddingHorizontal:10, borderRadius:4 },
  badgeText:       { fontSize:11, letterSpacing:1 },
  serviceRow:      { flexDirection:'row', justifyContent:'space-between', marginBottom:8 },
  serviceName:     { color:'#aaa', fontSize:13 },
  serviceDetail:   { color:'#555', fontSize:13 },
  note:            { color:'#666', fontSize:12, fontStyle:'italic', marginBottom:8 },
  actions:         { flexDirection:'row', gap:8, marginTop:8 },
  btnConfirm:      { flex:1, backgroundColor:'#1D9E75', padding:10, alignItems:'center', borderRadius:4 },
  btnConfirmText:  { color:'#fff', fontSize:12, letterSpacing:1 },
  btnDone:         { flex:1, backgroundColor:'#333', padding:10, alignItems:'center', borderRadius:4 },
  btnDoneText:     { color:'#c9a96e', fontSize:12, letterSpacing:1 },
  btnCancel:       { flex:1, borderWidth:1, borderColor:'#e05252', padding:10, alignItems:'center', borderRadius:4 },
  btnCancelText:   { color:'#e05252', fontSize:12, letterSpacing:1 },
  empty:           { flex:1, alignItems:'center', justifyContent:'center', gap:12 },
  emptyIcon:       { fontSize:40 },
  emptyText:       { color:'#555', fontSize:14, letterSpacing:1 },
})