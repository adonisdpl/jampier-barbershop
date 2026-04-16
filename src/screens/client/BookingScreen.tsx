import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { colors, spacing, radius } from '../../theme'

interface Barber  { id: string; name: string; active: boolean }
interface Service { id: string; name: string; duration_min: number; price_chf: number }

const SLOTS  = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00','18:00']
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

// ─── Étape 1 : Coiffeur ──────────────────────────────────
function StepBarber({ onSelect }: { onSelect: (b: Barber) => void }) {
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('barbers').select('*').eq('active', true)
      .then(({ data }) => { setBarbers(data ?? []); setLoading(false) })
  }, [])

  if (loading) return <ActivityIndicator color={colors.red} style={{ marginTop: 40 }} />

  return (
    <View>
      <Text style={s.stepLabel}>Choisissez votre coiffeur</Text>
      {barbers.map(b => (
        <TouchableOpacity key={b.id} style={s.selectCard} onPress={() => onSelect(b)}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{b.name[0]}</Text>
          </View>
          <Text style={s.selectCardText}>{b.name}</Text>
          <Text style={s.selectCardArrow}>→</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ─── Étape 2 : Service ───────────────────────────────────
function StepService({ onSelect }: { onSelect: (s: Service) => void }) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase.from('services').select('*').eq('active', true)
      .then(({ data }) => { setServices(data ?? []); setLoading(false) })
  }, [])

  if (loading) return <ActivityIndicator color={colors.red} style={{ marginTop: 40 }} />

  return (
    <View>
      <Text style={s.stepLabel}>Choisissez une prestation</Text>
      {services.map(sv => (
        <TouchableOpacity key={sv.id} style={s.selectCard} onPress={() => onSelect(sv)}>
          <View style={{ flex:1 }}>
            <Text style={s.selectCardText}>{sv.name}</Text>
            <Text style={s.selectCardSub}>{sv.duration_min} min · {sv.price_chf} CHF</Text>
          </View>
          <Text style={s.selectCardArrow}>→</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ─── Étape 3 : Calendrier ────────────────────────────────
function StepCalendar({ barberId, onSelect }: { barberId: string; onSelect: (date: string, slot: string) => void }) {
  const today = new Date(); today.setHours(0,0,0,0)
  const [year, setYear]       = useState(today.getFullYear())
  const [month, setMonth]     = useState(today.getMonth())
  const [selDate, setSelDate] = useState<string | null>(null)
  const [selSlot, setSelSlot] = useState<string | null>(null)
  const [takenSlots, setTaken] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  const dateStr = (d: Date) => d.toISOString().split('T')[0]

  async function pickDate(d: Date) {
    const ds = dateStr(d)
    setSelDate(ds); setSelSlot(null); setLoadingSlots(true)
    const [{ data: blocked }, { data: booked }] = await Promise.all([
      supabase.from('availability').select('slot_time').eq('barber_id', barberId).eq('date', ds).eq('is_blocked', true),
      supabase.from('bookings').select('slot_time').eq('barber_id', barberId).eq('date', ds).neq('status', 'cancelled'),
    ])
    setTaken([
      ...(blocked ?? []).map((r: any) => r.slot_time.slice(0,5)),
      ...(booked  ?? []).map((r: any) => r.slot_time.slice(0,5)),
    ])
    setLoadingSlots(false)
  }

  function prevMonth() { if(month===0){setMonth(11);setYear(y=>y-1)}else setMonth(m=>m-1); setSelDate(null); setSelSlot(null) }
  function nextMonth() { if(month===11){setMonth(0);setYear(y=>y+1)}else setMonth(m=>m+1); setSelDate(null); setSelSlot(null) }

  const daysInMonth = new Date(year, month+1, 0).getDate()
  const firstDow    = (new Date(year, month, 1).getDay() + 6) % 7

  return (
    <View>
      <Text style={s.stepLabel}>Choisissez une date</Text>
      <View style={s.calCard}>
        <View style={s.calNav}>
          <TouchableOpacity onPress={prevMonth}><Text style={s.calArrow}>←</Text></TouchableOpacity>
          <Text style={s.calMonth}>{MONTHS[month]} {year}</Text>
          <TouchableOpacity onPress={nextMonth}><Text style={s.calArrow}>→</Text></TouchableOpacity>
        </View>
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
                onPress={() => !disabled && pickDate(d)} disabled={disabled}>
                <Text style={[s.calCellText, isSelected && s.calCellTextSelected, disabled && s.calCellTextDisabled]}>
                  {i+1}
                </Text>
              </TouchableOpacity>
            )
          })}
        </View>
      </View>

      {selDate && (
        <View style={{ marginTop: spacing.md }}>
          <Text style={s.stepLabel}>Créneaux disponibles</Text>
          {loadingSlots ? <ActivityIndicator color={colors.red} /> : (
            <View style={s.slotsGrid}>
              {SLOTS.map(slot => {
                const taken    = takenSlots.includes(slot)
                const selected = slot === selSlot
                return (
                  <TouchableOpacity key={slot}
                    style={[s.slot, selected && s.slotSelected, taken && s.slotTaken]}
                    onPress={() => !taken && setSelSlot(slot)} disabled={taken}>
                    <Text style={[s.slotText, selected && s.slotTextSelected, taken && s.slotTextTaken]}>
                      {slot}
                    </Text>
                  </TouchableOpacity>
                )
              })}
            </View>
          )}
          {selSlot && (
            <TouchableOpacity style={s.btnContinue} onPress={() => onSelect(selDate, selSlot)}>
              <Text style={s.btnContinueText}>Continuer →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}

// ─── Étape 4 : Confirmation ───────────────────────────────
function StepConfirm({ barber, service, date, slot, onConfirm, onBack }: {
  barber: Barber; service: Service; date: string; slot: string
  onConfirm: () => void; onBack: () => void
}) {
  const [loading, setLoading] = useState(false)
  const dateLabel = new Date(date+'T12:00').toLocaleDateString('fr-CH', { weekday:'long', day:'numeric', month:'long' })

  async function confirm() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')
      const { error } = await supabase.from('bookings').insert({
        client_id: user.id, barber_id: barber.id, service_id: service.id,
        date, slot_time: slot+':00', status: 'pending'
      })
      if (error) throw error
      onConfirm()
    } catch (e: any) {
      Alert.alert('Erreur', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View>
      <Text style={s.stepLabel}>Confirmation</Text>
      <View style={s.summaryCard}>
        <SummaryRow label="Coiffeur"   value={barber.name} />
        <SummaryRow label="Prestation" value={`${service.name} — ${service.price_chf} CHF`} />
        <SummaryRow label="Date"       value={dateLabel} />
        <SummaryRow label="Heure"      value={slot} />
      </View>
      <TouchableOpacity style={s.btnConfirm} onPress={confirm} disabled={loading}>
        {loading ? <ActivityIndicator color={colors.white} /> : <Text style={s.btnConfirmText}>Confirmer le rendez-vous</Text>}
      </TouchableOpacity>
      <TouchableOpacity style={s.btnBack} onPress={onBack}>
        <Text style={s.btnBackText}>← Modifier</Text>
      </TouchableOpacity>
    </View>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.summaryRow}>
      <Text style={s.summaryLabel}>{label}</Text>
      <Text style={s.summaryValue}>{value}</Text>
    </View>
  )
}

// ─── Écran principal ──────────────────────────────────────
type Step = 'barber' | 'service' | 'calendar' | 'confirm' | 'done'

export default function BookingScreen() {
  const [step, setStep]       = useState<Step>('barber')
  const [barber, setBarber]   = useState<Barber | null>(null)
  const [service, setService] = useState<Service | null>(null)
  const [date, setDate]       = useState<string | null>(null)
  const [slot, setSlot]       = useState<string | null>(null)

  const steps: Step[] = ['barber','service','calendar','confirm']

  if (step === 'done') return (
    <View style={[s.container, { alignItems:'center', justifyContent:'center' }]}>
      <View style={s.doneIcon}><Text style={{ fontSize:36, color: colors.white }}>✓</Text></View>
      <Text style={s.doneTitle}>Rendez-vous confirmé !</Text>
      <Text style={s.doneSub}>Nous avons hâte de vous accueillir.</Text>
      <TouchableOpacity style={[s.btnConfirm, { marginTop: spacing.xl, width:'80%' }]} onPress={() => setStep('barber')}>
        <Text style={s.btnConfirmText}>Nouvelle réservation</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: spacing.md, paddingBottom: 60 }}>
      {/* Barre de progression */}
      <View style={s.progressBar}>
        {steps.map((st, i) => (
          <View key={st} style={[s.progressStep, steps.indexOf(step) >= i && s.progressStepActive]} />
        ))}
      </View>

      {step === 'barber'   && <StepBarber   onSelect={b  => { setBarber(b);   setStep('service')  }} />}
      {step === 'service'  && <StepService  onSelect={sv => { setService(sv); setStep('calendar') }} />}
      {step === 'calendar' && barber && (
        <StepCalendar barberId={barber.id} onSelect={(d,sl) => { setDate(d); setSlot(sl); setStep('confirm') }} />
      )}
      {step === 'confirm' && barber && service && date && slot && (
        <StepConfirm barber={barber} service={service} date={date} slot={slot}
          onConfirm={() => setStep('done')} onBack={() => setStep('calendar')} />
      )}
    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:           { flex:1, backgroundColor: colors.cream },
  progressBar:         { flexDirection:'row', gap:6, marginBottom: spacing.lg },
  progressStep:        { flex:1, height:4, backgroundColor: colors.border, borderRadius: radius.full },
  progressStepActive:  { backgroundColor: colors.red },
  stepLabel:           { color: colors.red, fontSize:12, letterSpacing:2, textTransform:'uppercase', fontWeight:'600', marginBottom: spacing.md },
  selectCard:          { flexDirection:'row', alignItems:'center', backgroundColor: colors.white, borderWidth:1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.sm },
  avatar:              { width:46, height:46, borderRadius: radius.full, backgroundColor: colors.redLight, borderWidth:2, borderColor: colors.red, alignItems:'center', justifyContent:'center', marginRight: spacing.md },
  avatarText:          { color: colors.red, fontSize:18, fontWeight:'700' },
  selectCardText:      { flex:1, color: colors.text, fontSize:15, fontWeight:'500' },
  selectCardSub:       { color: colors.textMuted, fontSize:12, marginTop:2 },
  selectCardArrow:     { color: colors.textLight, fontSize:18 },
  calCard:             { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth:1, borderColor: colors.border, padding: spacing.md, marginBottom: spacing.md },
  calNav:              { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom: spacing.md },
  calArrow:            { color: colors.red, fontSize:22, padding: spacing.sm },
  calMonth:            { color: colors.text, fontSize:15, fontWeight:'600' },
  calRow:              { flexDirection:'row', marginBottom:6 },
  calDayName:          { flex:1, textAlign:'center', color: colors.textMuted, fontSize:11, letterSpacing:1 },
  calGrid:             { flexDirection:'row', flexWrap:'wrap' },
  calCell:             { width:'14.28%', aspectRatio:1, alignItems:'center', justifyContent:'center' },
  calCellSelected:     { backgroundColor: colors.redLight, borderRadius: radius.sm, borderWidth:1.5, borderColor: colors.red },
  calCellDisabled:     { opacity:0.25 },
  calCellText:         { color: colors.text, fontSize:13 },
  calCellTextSelected: { color: colors.red, fontWeight:'700' },
  calCellTextDisabled: { color: colors.textLight },
  slotsGrid:           { flexDirection:'row', flexWrap:'wrap', gap: spacing.sm },
  slot:                { paddingVertical:10, paddingHorizontal:14, borderWidth:1.5, borderColor: colors.border, borderRadius: radius.md, backgroundColor: colors.white },
  slotSelected:        { backgroundColor: colors.redLight, borderColor: colors.red },
  slotTaken:           { opacity:0.3, backgroundColor: colors.cream },
  slotText:            { color: colors.text, fontSize:13, fontWeight:'500' },
  slotTextSelected:    { color: colors.red },
  slotTextTaken:       { textDecorationLine:'line-through', color: colors.textLight },
  btnContinue:         { backgroundColor: colors.red, padding:14, alignItems:'center', borderRadius: radius.md, marginTop: spacing.lg },
  btnContinueText:     { color: colors.white, fontSize:13, letterSpacing:2, fontWeight:'500' },
  summaryCard:         { backgroundColor: colors.white, borderWidth:1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  summaryRow:          { flexDirection:'row', justifyContent:'space-between', paddingVertical: spacing.sm, borderBottomWidth:1, borderBottomColor: colors.borderLight },
  summaryLabel:        { color: colors.textMuted, fontSize:13 },
  summaryValue:        { color: colors.text, fontSize:13, fontWeight:'500', flex:1, textAlign:'right', marginLeft: spacing.sm },
  btnConfirm:          { backgroundColor: colors.red, padding:15, alignItems:'center', borderRadius: radius.md },
  btnConfirmText:      { color: colors.white, fontSize:13, letterSpacing:2, fontWeight:'500' },
  btnBack:             { alignItems:'center', marginTop: spacing.md, padding: spacing.sm },
  btnBackText:         { color: colors.textMuted, fontSize:13 },
  doneIcon:            { width:80, height:80, borderRadius: radius.full, backgroundColor: colors.red, alignItems:'center', justifyContent:'center', marginBottom: spacing.lg },
  doneTitle:           { color: colors.text, fontSize:22, fontWeight:'700', marginBottom: spacing.sm },
  doneSub:             { color: colors.textMuted, fontSize:14 },
})