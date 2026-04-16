import React, { useState, useEffect, useCallback } from 'react'
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { colors, spacing, radius } from '../../theme'

const SLOTS  = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00','18:00']
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

interface SlotState { time: string; isBlocked: boolean; isBooked: boolean }

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
      supabase.from('availability').select('slot_time').eq('barber_id', barberId).eq('date', ds).eq('is_blocked', true),
      supabase.from('bookings').select('slot_time').eq('barber_id', barberId).eq('date', ds).neq('status', 'cancelled'),
    ])
    const blockedSet = new Set((blocked ?? []).map((r: any) => r.slot_time.slice(0,5)))
    const bookedSet  = new Set((booked  ?? []).map((r: any) => r.slot_time.slice(0,5)))
    setSlots(SLOTS.map(t => ({ time:t, isBlocked: blockedSet.has(t), isBooked: bookedSet.has(t) })))
    setLoading(false)
  }, [barberId])

  useEffect(() => { if (selDate) fetchSlots(selDate) }, [selDate, fetchSlots])

  async function blockSlot(slotTime: string) {
    await supabase.from('availability').delete().eq('barber_id', barberId).eq('date', selDate!).eq('slot_time', slotTime)
    const { error } = await supabase.from('availability').insert({ barber_id: barberId, date: selDate!, slot_time: slotTime, is_blocked: true })
    if (error) Alert.alert('Erreur', error.message)
  }

  async function unblockSlot(slotTime: string) {
    const { error } = await supabase.from('availability').delete().eq('barber_id', barberId).eq('date', selDate!).eq('slot_time', slotTime)
    if (error) Alert.alert('Erreur', error.message)
  }

  async function toggleSlot(slot: SlotState) {
    if (slot.isBooked) { Alert.alert('Impossible', 'Ce créneau est déjà réservé.'); return }
    setSaving(slot.time)
    if (slot.isBlocked) await unblockSlot(slot.time + ':00')
    else await blockSlot(slot.time + ':00')
    setSaving(null)
    if (selDate) fetchSlots(selDate)
  }

  async function blockFullDay() {
    if (!selDate) return
    Alert.alert('Bloquer la journée ?', 'Tous les créneaux libres seront bloqués.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: async () => {
        setLoading(true)
        for (const slot of slots.filter(s => !s.isBooked && !s.isBlocked)) await blockSlot(slot.time + ':00')
        fetchSlots(selDate)
      }},
    ])
  }

  async function unblockFullDay() {
    if (!selDate) return
    Alert.alert('Débloquer la journée ?', 'Tous les créneaux bloqués seront libérés.', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Confirmer', onPress: async () => {
        setLoading(true)
        await supabase.from('availability').delete().eq('barber_id', barberId).eq('date', selDate).eq('is_blocked', true)
        fetchSlots(selDate)
      }},
    ])
  }

  function prevMonth() { if (month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1); setSelDate(null) }
  function nextMonth() { if (month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1); setSelDate(null) }

  const daysInMonth  = new Date(year, month+1, 0).getDate()
  const firstDow     = (new Date(year, month, 1).getDay() + 6) % 7
  const selDateLabel = selDate ? new Date(selDate+'T12:00').toLocaleDateString('fr-CH', { weekday:'long', day:'numeric', month:'long' }) : null
  const blockedCount = slots.filter(s => s.isBlocked).length
  const bookedCount  = slots.filter(s => s.isBooked).length
  const freeCount    = slots.filter(s => !s.isBlocked && !s.isBooked).length

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}>

      {/* Navigation mois */}
      <View style={s.calNav}>
        <TouchableOpacity onPress={prevMonth} style={s.calNavBtn}><Text style={s.calNavArrow}>←</Text></TouchableOpacity>
        <Text style={s.calMonth}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={s.calNavBtn}><Text style={s.calNavArrow}>→</Text></TouchableOpacity>
      </View>

      {/* Légende */}
      <View style={s.legend}>
        <LegendItem color={colors.success} label="Libre" />
        <LegendItem color={colors.danger}  label="Bloqué" />
        <LegendItem color={colors.warning} label="Réservé" />
      </View>

      {/* Grille */}
      <View style={s.calCard}>
        <View style={s.calRow}>
          {DAYS.map(d => <Text key={d} style={s.calDayName}>{d}</Text>)}
        </View>
        <View style={s.calGrid}>
          {Array(firstDow).fill(null).map((_,i) => <View key={'e'+i} style={s.calCell} />)}
          {Array(daysInMonth).fill(null).map((_,i) => {
            const d  = new Date(year, month, i+1)
            const ds = dateStr(d)
            const isPast   = d < today
            const isSunday = d.getDay() === 0
            const isSelected = ds === selDate
            const disabled = isPast || isSunday
            return (
              <TouchableOpacity key={ds}
                style={[s.calCell, isSelected && s.calCellSelected, disabled && s.calCellDisabled]}
                onPress={() => !disabled && setSelDate(ds)} disabled={disabled}>
                <Text style={[s.calCellText, isSelected && s.calCellTextSelected, disabled && s.calCellTextDisabled]}>
                  {i+1}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {/* Créneaux */}
      {selDate && (
        <View style={{ marginTop: spacing.md }}>
          <Text style={s.sectionTitle}>{selDateLabel}</Text>

          <View style={s.dayStats}>
            <StatPill label={`${freeCount} libre${freeCount>1?'s':''}`}    color={colors.success} bg={colors.successLight} />
            <StatPill label={`${bookedCount} réservé${bookedCount>1?'s':''}`} color={colors.warning} bg={colors.warningLight} />
            <StatPill label={`${blockedCount} bloqué${blockedCount>1?'s':''}`} color={colors.danger}  bg={colors.dangerLight} />
          </View>

          <View style={s.quickActions}>
            <TouchableOpacity style={s.btnBlock} onPress={blockFullDay}>
              <Text style={s.btnBlockText}>Bloquer la journée</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnUnblock} onPress={unblockFullDay}>
              <Text style={s.btnUnblockText}>Débloquer tout</Text>
            </TouchableOpacity>
          </View>

          {loading ? <ActivityIndicator color={colors.red} style={{ marginTop: spacing.md }} /> : (
            <View style={s.slotsGrid}>
              {slots.map(slot => (
                <TouchableOpacity key={slot.time}
                  style={[s.slot, slot.isBooked && s.slotBooked, slot.isBlocked && s.slotBlocked]}
                  onPress={() => toggleSlot(slot)} disabled={saving === slot.time}>
                  {saving === slot.time
                    ? <ActivityIndicator size="small" color={colors.red} />
                    : <>
                        <Text style={[s.slotTime, slot.isBooked && s.slotTimeBooked, slot.isBlocked && s.slotTimeBlocked]}>
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
    <View style={{ flexDirection:'row', alignItems:'center', gap:6 }}>
      <View style={{ width:8, height:8, borderRadius:4, backgroundColor: color }} />
      <Text style={{ color: colors.textMuted, fontSize:12 }}>{label}</Text>
    </View>
  )
}

function StatPill({ label, color, bg }: { label: string; color: string; bg: string }) {
  return (
    <View style={{ paddingVertical:4, paddingHorizontal:10, borderRadius: radius.sm, backgroundColor: bg }}>
      <Text style={{ fontSize:12, letterSpacing:1, color }}>{label}</Text>
    </View>
  )
}

const s = StyleSheet.create({
  container:           { flex:1, backgroundColor: colors.cream },
  calNav:              { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: spacing.md },
  calNavBtn:           { padding: spacing.sm },
  calNavArrow:         { color: colors.red, fontSize:22 },
  calMonth:            { color: colors.text, fontSize:16, fontWeight:'600', letterSpacing:1 },
  legend:              { flexDirection:'row', gap: spacing.md, marginBottom: spacing.md },
  calCard:             { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth:1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.sm },
  calRow:              { flexDirection:'row', marginBottom:6 },
  calDayName:          { flex:1, textAlign:'center', color: colors.textMuted, fontSize:11, letterSpacing:1 },
  calGrid:             { flexDirection:'row', flexWrap:'wrap' },
  calCell:             { width:'14.28%', aspectRatio:1, alignItems:'center', justifyContent:'center' },
  calCellSelected:     { backgroundColor: colors.redLight, borderRadius: radius.sm, borderWidth:1.5, borderColor: colors.red },
  calCellDisabled:     { opacity:0.25 },
  calCellText:         { color: colors.text, fontSize:13 },
  calCellTextSelected: { color: colors.red, fontWeight:'700' },
  calCellTextDisabled: { color: colors.textLight },
  sectionTitle:        { color: colors.red, fontSize:12, letterSpacing:2, textTransform:'uppercase', fontWeight:'600', marginBottom: spacing.sm },
  dayStats:            { flexDirection:'row', gap: spacing.sm, marginBottom: spacing.md },
  quickActions:        { flexDirection:'row', gap: spacing.sm, marginBottom: spacing.md },
  btnBlock:            { flex:1, backgroundColor: colors.red, padding:10, alignItems:'center', borderRadius: radius.md },
  btnBlockText:        { color: colors.white, fontSize:12, letterSpacing:1, fontWeight:'500' },
  btnUnblock:          { flex:1, borderWidth:1.5, borderColor: colors.success, padding:10, alignItems:'center', borderRadius: radius.md },
  btnUnblockText:      { color: colors.success, fontSize:12, letterSpacing:1 },
  slotsGrid:           { flexDirection:'row', flexWrap:'wrap', gap: spacing.sm },
  slot:                { width:'30%', backgroundColor: colors.successLight, borderWidth:1.5, borderColor: colors.success, borderRadius: radius.md, padding:10, alignItems:'center' },
  slotBooked:          { backgroundColor: colors.warningLight, borderColor: colors.warning },
  slotBlocked:         { backgroundColor: colors.dangerLight, borderColor: colors.danger },
  slotTime:            { color: colors.success, fontSize:15, fontWeight:'700' },
  slotTimeBooked:      { color: colors.warning },
  slotTimeBlocked:     { color: colors.danger },
  slotStatus:          { color: colors.textMuted, fontSize:10, letterSpacing:1, marginTop:2 },
  hint:                { color: colors.textLight, fontSize:11, textAlign:'center', marginTop: spacing.md, letterSpacing:1 },
})