import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native'
import { supabase } from '../../lib/supabase'

const SLOTS  = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00','18:00']
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

interface SlotState {
  time: string
  isBlocked: boolean
  isBooked: boolean
}

export default function AgendaScreen({ barberId }: { barberId: string }) {
  const today = new Date(); today.setHours(0,0,0,0)
  const [year, setYear]       = useState(today.getFullYear())
  const [month, setMonth]     = useState(today.getMonth())
  const [selDate, setSelDate] = useState<string | null>(null)
  const [slots, setSlots]     = useState<SlotState[]>([])
  const [loading, setLoading] = useState(false)
  const [saving, setSaving]   = useState<string | null>(null)

  const dateStr = (d: Date) => d.toISOString().split('T')[0]

  const fetchSlots = useCallback(async (ds: string) => {
    setLoading(true)
    const [{ data: blocked }, { data: booked }] = await Promise.all([
      supabase.from('availability').select('slot_time')
        .eq('barber_id', barberId).eq('date', ds).eq('is_blocked', true),
      supabase.from('bookings').select('slot_time')
        .eq('barber_id', barberId).eq('date', ds).neq('status', 'cancelled'),
    ])
    const blockedSet = new Set((blocked ?? []).map((r: any) => r.slot_time.slice(0,5)))
    const bookedSet  = new Set((booked  ?? []).map((r: any) => r.slot_time.slice(0,5)))
    setSlots(SLOTS.map(t => ({
      time: t,
      isBlocked: blockedSet.has(t),
      isBooked:  bookedSet.has(t),
    })))
    setLoading(false)
  }, [barberId])

  useEffect(() => { if (selDate) fetchSlots(selDate) }, [selDate, fetchSlots])

 async function blockSlot(slotTime: string) {
  console.log('blockSlot appelé', { barberId, date: selDate, slot_time: slotTime })
  
  const { error: delError } = await supabase.from('availability')
    .delete()
    .eq('barber_id', barberId)
    .eq('date', selDate!)
    .eq('slot_time', slotTime)
  console.log('delete result:', delError)

  const { error: insError } = await supabase.from('availability').insert({
    barber_id:  barberId,
    date:       selDate!,
    slot_time:  slotTime,
    is_blocked: true,
  })
  console.log('insert result:', insError)
  if (insError) Alert.alert('Erreur insert', JSON.stringify(insError))
}

  async function unblockSlot(slotTime: string) {
    const { error } = await supabase.from('availability')
      .delete()
      .eq('barber_id', barberId)
      .eq('date', selDate!)
      .eq('slot_time', slotTime)
    if (error) Alert.alert('Erreur', error.message)
  }

  async function toggleSlot(slot: SlotState) {
    if (slot.isBooked) {
      Alert.alert('Impossible', 'Ce créneau est déjà réservé par un client.')
      return
    }
    setSaving(slot.time)
    const slotTime = slot.time + ':00'
    if (slot.isBlocked) {
      await unblockSlot(slotTime)
    } else {
      await blockSlot(slotTime)
    }
    setSaving(null)
    if (selDate) fetchSlots(selDate)
  }

  async function blockFullDay() {
    if (!selDate) return
    Alert.alert('Bloquer toute la journée ?', 'Tous les créneaux libres seront bloqués.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: async () => {
        setLoading(true)
        const freeSlots = slots.filter(s => !s.isBooked && !s.isBlocked)
        for (const slot of freeSlots) {
          await blockSlot(slot.time + ':00')
        }
        fetchSlots(selDate)
      }},
    ])
  }

  async function unblockFullDay() {
    if (!selDate) return
    Alert.alert('Débloquer toute la journée ?', 'Tous les créneaux bloqués seront libérés.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: async () => {
        setLoading(true)
        await supabase.from('availability')
          .delete()
          .eq('barber_id', barberId)
          .eq('date', selDate)
          .eq('is_blocked', true)
        fetchSlots(selDate)
      }},
    ])
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y-1) }
    else setMonth(m => m-1)
    setSelDate(null)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y+1) }
    else setMonth(m => m+1)
    setSelDate(null)
  }

  const daysInMonth = new Date(year, month+1, 0).getDate()
  const firstDow    = (new Date(year, month, 1).getDay() + 6) % 7
  const selDateLabel = selDate
    ? new Date(selDate+'T12:00').toLocaleDateString('fr-CH', { weekday:'long', day:'numeric', month:'long' })
    : null

  const blockedCount = slots.filter(s => s.isBlocked).length
  const bookedCount  = slots.filter(s => s.isBooked).length
  const freeCount    = slots.filter(s => !s.isBlocked && !s.isBooked).length

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding:16, paddingBottom:60 }}>

      <View style={s.calNav}>
        <TouchableOpacity onPress={prevMonth} style={s.calNavBtn}>
          <Text style={s.calNavArrow}>←</Text>
        </TouchableOpacity>
        <Text style={s.calMonth}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={s.calNavBtn}>
          <Text style={s.calNavArrow}>→</Text>
        </TouchableOpacity>
      </View>

      <View style={s.legend}>
        <LegendItem color="#1D9E75" label="Libre" />
        <LegendItem color="#e05252" label="Bloqué" />
        <LegendItem color="#BA7517" label="Réservé" />
      </View>

      <View style={s.calRow}>
        {DAYS.map(d => <Text key={d} style={s.calDayName}>{d}</Text>)}
      </View>
      <View style={s.calGrid}>
        {Array(firstDow).fill(null).map((_, i) => <View key={'e'+i} style={s.calCell} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const d  = new Date(year, month, i+1)
          const ds = dateStr(d)
          const isPast   = d < today
          const isSunday = d.getDay() === 0
          const isSelected = ds === selDate
          const disabled = isPast || isSunday
          return (
            <TouchableOpacity
              key={ds}
              style={[s.calCell, isSelected && s.calCellSelected, disabled && s.calCellDisabled]}
              onPress={() => !disabled && setSelDate(ds)}
              disabled={disabled}
            >
              <Text style={[s.calCellText, isSelected && s.calCellTextSelected, disabled && s.calCellTextDisabled]}>
                {i+1}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {selDate && (
        <View style={{ marginTop:24 }}>
          <Text style={s.sectionTitle}>{selDateLabel}</Text>

          <View style={s.dayStats}>
            <StatPill label={`${freeCount} libre${freeCount>1?'s':''}`} color="#1D9E75" />
            <StatPill label={`${bookedCount} réservé${bookedCount>1?'s':''}`} color="#BA7517" />
            <StatPill label={`${blockedCount} bloqué${blockedCount>1?'s':''}`} color="#e05252" />
          </View>

          <View style={s.quickActions}>
            <TouchableOpacity style={s.btnBlock} onPress={blockFullDay}>
              <Text style={s.btnBlockText}>Bloquer la journée</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnUnblock} onPress={unblockFullDay}>
              <Text style={s.btnUnblockText}>Débloquer tout</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <ActivityIndicator color="#c9a96e" style={{ marginTop:16 }} />
          ) : (
            <View style={s.slotsGrid}>
              {slots.map(slot => (
                <TouchableOpacity
                  key={slot.time}
                  style={[
                    s.slot,
                    slot.isBooked  && s.slotBooked,
                    slot.isBlocked && s.slotBlocked,
                  ]}
                  onPress={() => toggleSlot(slot)}
                  disabled={saving === slot.time}
                >
                  {saving === slot.time
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <>
                        <Text style={[
                          s.slotTime,
                          slot.isBooked  && s.slotTimeBooked,
                          slot.isBlocked && s.slotTimeBlocked,
                        ]}>
                          {slot.time}
                        </Text>
                        <Text style={s.slotStatus}>
                          {slot.isBooked ? 'Réservé' : slot.isBlocked ? 'Bloqué' : 'Libre'}
                        </Text>
                      </>
                  }
                </TouchableOpacity>
              ))}
            </View>
          )}
          <Text style={s.hint}>Appuyez sur un créneau pour le bloquer ou débloquer</Text>
        </View>
      )}
    </ScrollView>
  )
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <View style={s.legendItem}>
      <View style={[s.legendDot, { backgroundColor: color }]} />
      <Text style={s.legendLabel}>{label}</Text>
    </View>
  )
}

function StatPill({ label, color }: { label: string; color: string }) {
  return (
    <View style={[s.statPill, { backgroundColor: color + '22' }]}>
      <Text style={[s.statPillText, { color }]}>{label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container:           { flex:1, backgroundColor:'#1a1a1a' },
  calNav:              { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 },
  calNavBtn:           { padding:8 },
  calNavArrow:         { color:'#c9a96e', fontSize:20 },
  calMonth:            { color:'#fff', fontSize:15, letterSpacing:1 },
  legend:              { flexDirection:'row', gap:16, marginBottom:12 },
  legendItem:          { flexDirection:'row', alignItems:'center', gap:6 },
  legendDot:           { width:8, height:8, borderRadius:4 },
  legendLabel:         { color:'#666', fontSize:12 },
  calRow:              { flexDirection:'row', marginBottom:4 },
  calDayName:          { flex:1, textAlign:'center', color:'#555', fontSize:11, letterSpacing:1 },
  calGrid:             { flexDirection:'row', flexWrap:'wrap' },
  calCell:             { width:'14.28%', aspectRatio:1, alignItems:'center', justifyContent:'center' },
  calCellSelected:     { backgroundColor:'#222', borderWidth:1, borderColor:'#c9a96e', borderRadius:4 },
  calCellDisabled:     { opacity:0.2 },
  calCellText:         { color:'#ccc', fontSize:13 },
  calCellTextSelected: { color:'#c9a96e' },
  calCellTextDisabled: { color:'#444' },
  sectionTitle:        { color:'#c9a96e', fontSize:14, letterSpacing:2, textTransform:'uppercase', marginBottom:12 },
  dayStats:            { flexDirection:'row', gap:8, marginBottom:12 },
  statPill:            { paddingVertical:4, paddingHorizontal:10, borderRadius:4 },
  statPillText:        { fontSize:12, letterSpacing:1 },
  quickActions:        { flexDirection:'row', gap:8, marginBottom:16 },
  btnBlock:            { flex:1, backgroundColor:'#e05252', padding:10, alignItems:'center', borderRadius:4 },
  btnBlockText:        { color:'#fff', fontSize:12, letterSpacing:1 },
  btnUnblock:          { flex:1, borderWidth:1, borderColor:'#1D9E75', padding:10, alignItems:'center', borderRadius:4 },
  btnUnblockText:      { color:'#1D9E75', fontSize:12, letterSpacing:1 },
  slotsGrid:           { flexDirection:'row', flexWrap:'wrap', gap:8 },
  slot:                { width:'30%', backgroundColor:'#1D9E75'+'22', borderWidth:1, borderColor:'#1D9E75', borderRadius:6, padding:10, alignItems:'center' },
  slotBooked:          { backgroundColor:'#BA7517'+'22', borderColor:'#BA7517' },
  slotBlocked:         { backgroundColor:'#e05252'+'22', borderColor:'#e05252' },
  slotTime:            { color:'#1D9E75', fontSize:15, fontWeight:'500' },
  slotTimeBooked:      { color:'#BA7517' },
  slotTimeBlocked:     { color:'#e05252' },
  slotStatus:          { color:'#666', fontSize:10, letterSpacing:1, marginTop:2 },
  hint:                { color:'#333', fontSize:11, textAlign:'center', marginTop:16, letterSpacing:1 },
})