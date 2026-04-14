import React, { useState, useEffect } from 'react'
import {
  View, Text, TouchableOpacity, StyleSheet,
  ScrollView, ActivityIndicator, Alert
} from 'react-native'
import { supabase } from '../../lib/supabase'

// ─── Types ────────────────────────────────────────────────
interface Barber   { id: string; name: string; active: boolean }
interface Service  { id: string; name: string; duration_min: number; price_chf: number }

const SLOTS = ['09:00','10:00','11:00','12:00','14:00','15:00','16:00','17:00','18:00']
const MONTHS = ['Janvier','Février','Mars','Avril','Mai','Juin','Juillet','Août','Septembre','Octobre','Novembre','Décembre']
const DAYS   = ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim']

// ─── Étape 1 : Choix du coiffeur ─────────────────────────
function StepBarber({ onSelect }: { onSelect: (b: Barber) => void }) {
  const [barbers, setBarbers] = useState<Barber[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.from('barbers').select('*').eq('active', true)
      .then(({ data }) => { setBarbers(data ?? []); setLoading(false) })
  }, [])

  if (loading) return <ActivityIndicator color="#c9a96e" style={{ marginTop: 40 }} />

  return (
    <View>
      <Text style={s.stepTitle}>Choisissez votre coiffeur</Text>
      {barbers.map(b => (
        <TouchableOpacity key={b.id} style={s.card} onPress={() => onSelect(b)}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{b.name[0]}</Text>
          </View>
          <Text style={s.cardText}>{b.name}</Text>
          <Text style={s.arrow}>→</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ─── Étape 2 : Choix de la prestation ────────────────────
function StepService({ onSelect }: { onSelect: (s: Service) => void }) {
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading]   = useState(true)

  useEffect(() => {
    supabase.from('services').select('*').eq('active', true)
      .then(({ data }) => { setServices(data ?? []); setLoading(false) })
  }, [])

  if (loading) return <ActivityIndicator color="#c9a96e" style={{ marginTop: 40 }} />

  return (
    <View>
      <Text style={s.stepTitle}>Choisissez une prestation</Text>
      {services.map(sv => (
        <TouchableOpacity key={sv.id} style={s.card} onPress={() => onSelect(sv)}>
          <View style={{ flex: 1 }}>
            <Text style={s.cardText}>{sv.name}</Text>
            <Text style={s.cardSub}>{sv.duration_min} min · {sv.price_chf} CHF</Text>
          </View>
          <Text style={s.arrow}>→</Text>
        </TouchableOpacity>
      ))}
    </View>
  )
}

// ─── Étape 3 : Calendrier + créneaux ─────────────────────
function StepCalendar({ barberId, onSelect }: {
  barberId: string
  onSelect: (date: string, slot: string) => void
}) {
  const today = new Date(); today.setHours(0,0,0,0)
  const [year, setYear]       = useState(today.getFullYear())
  const [month, setMonth]     = useState(today.getMonth())
  const [selDate, setSelDate] = useState<string | null>(null)
  const [selSlot, setSelSlot] = useState<string | null>(null)
  const [takenSlots, setTaken] = useState<string[]>([])
  const [loadingSlots, setLoadingSlots] = useState(false)

  function dateStr(d: Date) {
    return d.toISOString().split('T')[0]
  }

  async function pickDate(d: Date) {
    const ds = dateStr(d)
    setSelDate(ds); setSelSlot(null); setLoadingSlots(true)
    const [{ data: blocked }, { data: booked }] = await Promise.all([
      supabase.from('availability').select('slot_time')
        .eq('barber_id', barberId).eq('date', ds).eq('is_blocked', true),
      supabase.from('bookings').select('slot_time')
        .eq('barber_id', barberId).eq('date', ds).neq('status', 'cancelled'),
    ])
    const taken = [
      ...(blocked ?? []).map((r: any) => r.slot_time.slice(0,5)),
      ...(booked  ?? []).map((r: any) => r.slot_time.slice(0,5)),
    ]
    setTaken(taken); setLoadingSlots(false)
  }

  function prevMonth() {
    if (month === 0) { setMonth(11); setYear(y => y - 1) }
    else setMonth(m => m - 1)
    setSelDate(null); setSelSlot(null)
  }
  function nextMonth() {
    if (month === 11) { setMonth(0); setYear(y => y + 1) }
    else setMonth(m => m + 1)
    setSelDate(null); setSelSlot(null)
  }

  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow    = (new Date(year, month, 1).getDay() + 6) % 7 // lundi = 0

  return (
    <View>
      <Text style={s.stepTitle}>Choisissez une date</Text>

      {/* Navigation mois */}
      <View style={s.calNav}>
        <TouchableOpacity onPress={prevMonth} style={s.calNavBtn}>
          <Text style={s.calNavText}>←</Text>
        </TouchableOpacity>
        <Text style={s.calMonth}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={nextMonth} style={s.calNavBtn}>
          <Text style={s.calNavText}>→</Text>
        </TouchableOpacity>
      </View>

      {/* Jours de la semaine */}
      <View style={s.calRow}>
        {DAYS.map(d => <Text key={d} style={s.calDayName}>{d}</Text>)}
      </View>

      {/* Grille */}
      <View style={s.calGrid}>
        {Array(firstDow).fill(null).map((_, i) => <View key={'e'+i} style={s.calCell} />)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const d = new Date(year, month, i + 1)
          const ds = dateStr(d)
          const isPast   = d < today
          const isSunday = d.getDay() === 0
          const isSelected = ds === selDate
          const disabled = isPast || isSunday

          return (
            <TouchableOpacity
              key={ds}
              style={[s.calCell, isSelected && s.calCellSelected, disabled && s.calCellDisabled]}
              onPress={() => !disabled && pickDate(d)}
              disabled={disabled}
            >
              <Text style={[s.calCellText, isSelected && s.calCellTextSelected, disabled && s.calCellTextDisabled]}>
                {i + 1}
              </Text>
            </TouchableOpacity>
          )
        })}
      </View>

      {/* Créneaux */}
      {selDate && (
        <View style={{ marginTop: 20 }}>
          <Text style={s.stepTitle}>Créneaux disponibles</Text>
          {loadingSlots
            ? <ActivityIndicator color="#c9a96e" />
            : (
              <View style={s.slotsGrid}>
                {SLOTS.map(slot => {
                  const taken    = takenSlots.includes(slot)
                  const selected = slot === selSlot
                  return (
                    <TouchableOpacity
                      key={slot}
                      style={[s.slot, selected && s.slotSelected, taken && s.slotTaken]}
                      onPress={() => !taken && setSelSlot(slot)}
                      disabled={taken}
                    >
                      <Text style={[s.slotText, selected && s.slotTextSelected, taken && s.slotTextTaken]}>
                        {slot}
                      </Text>
                    </TouchableOpacity>
                  )
                })}
              </View>
            )
          }
          {selSlot && (
            <TouchableOpacity style={s.confirmBtn} onPress={() => onSelect(selDate, selSlot)}>
              <Text style={s.confirmBtnText}>Continuer →</Text>
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
  const d = new Date(date + 'T12:00')
  const dateLabel = d.toLocaleDateString('fr-CH', { weekday:'long', day:'numeric', month:'long' })

  async function confirm() {
    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error('Non connecté')
      const { error } = await supabase.from('bookings').insert({
        client_id:  user.id,
        barber_id:  barber.id,
        service_id: service.id,
        date, slot_time: slot + ':00', status: 'pending'
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
      <Text style={s.stepTitle}>Confirmation</Text>
      <View style={s.summaryBox}>
        <Row label="Coiffeur"    value={barber.name} />
        <Row label="Prestation"  value={`${service.name} — ${service.price_chf} CHF`} />
        <Row label="Date"        value={dateLabel} />
        <Row label="Heure"       value={slot} />
      </View>
      <TouchableOpacity style={s.confirmBtn} onPress={confirm} disabled={loading}>
        {loading
          ? <ActivityIndicator color="#1a1a1a" />
          : <Text style={s.confirmBtnText}>Confirmer le rendez-vous</Text>
        }
      </TouchableOpacity>
      <TouchableOpacity style={s.backBtn} onPress={onBack}>
        <Text style={s.backBtnText}>← Modifier</Text>
      </TouchableOpacity>
    </View>
  )
}

function Row({ label, value }: { label: string; value: string }) {
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

  const stepLabels: Record<Step, string> = {
    barber: '1. Coiffeur', service: '2. Prestation',
    calendar: '3. Date', confirm: '4. Confirmation', done: 'done'
  }

  if (step === 'done') return (
    <View style={[s.container, { justifyContent:'center', alignItems:'center' }]}>
      <Text style={{ fontSize: 48, marginBottom: 16 }}>✓</Text>
      <Text style={s.stepTitle}>Rendez-vous confirmé !</Text>
      <Text style={s.cardSub}>Vous recevrez un rappel avant votre RDV.</Text>
      <TouchableOpacity style={[s.confirmBtn, { marginTop: 32 }]} onPress={() => setStep('barber')}>
        <Text style={s.confirmBtnText}>Nouvelle réservation</Text>
      </TouchableOpacity>
    </View>
  )

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>
      {/* Barre de progression */}
      {step !== 'done' && (
        <View style={s.progressBar}>
          {(['barber','service','calendar','confirm'] as Step[]).map(st => (
            <View key={st} style={[s.progressStep, step === st && s.progressStepActive]} />
          ))}
        </View>
      )}

      {step === 'barber'   && <StepBarber   onSelect={b  => { setBarber(b);   setStep('service')  }} />}
      {step === 'service'  && <StepService  onSelect={sv => { setService(sv); setStep('calendar') }} />}
      {step === 'calendar' && barber && (
        <StepCalendar barberId={barber.id} onSelect={(d, sl) => { setDate(d); setSlot(sl); setStep('confirm') }} />
      )}
      {step === 'confirm' && barber && service && date && slot && (
        <StepConfirm
          barber={barber} service={service} date={date} slot={slot}
          onConfirm={() => setStep('done')}
          onBack={() => setStep('calendar')}
        />
      )}
    </ScrollView>
  )
}

// ─── Styles ───────────────────────────────────────────────
const s = StyleSheet.create({
  container:          { flex:1, backgroundColor:'#1a1a1a' },
  stepTitle:          { color:'#c9a96e', fontSize:16, letterSpacing:2, textTransform:'uppercase', marginBottom:16 },
  card:               { flexDirection:'row', alignItems:'center', backgroundColor:'#222', borderWidth:1, borderColor:'#333', padding:16, borderRadius:8, marginBottom:10 },
  avatar:             { width:44, height:44, borderRadius:22, backgroundColor:'#333', borderWidth:1, borderColor:'#c9a96e', alignItems:'center', justifyContent:'center', marginRight:14 },
  avatarText:         { color:'#c9a96e', fontSize:18 },
  cardText:           { color:'#fff', fontSize:15, flex:1 },
  cardSub:            { color:'#666', fontSize:12, marginTop:2 },
  arrow:              { color:'#555', fontSize:18 },
  calNav:             { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:12 },
  calNavBtn:          { padding:8 },
  calNavText:         { color:'#c9a96e', fontSize:20 },
  calMonth:           { color:'#fff', fontSize:15, letterSpacing:1 },
  calRow:             { flexDirection:'row', marginBottom:4 },
  calDayName:         { flex:1, textAlign:'center', color:'#555', fontSize:11, letterSpacing:1 },
  calGrid:            { flexDirection:'row', flexWrap:'wrap' },
  calCell:            { width:'14.28%', aspectRatio:1, alignItems:'center', justifyContent:'center', borderWidth:0.5, borderColor:'transparent' },
  calCellSelected:    { backgroundColor:'#1a1a1a', borderColor:'#c9a96e', borderRadius:4 },
  calCellDisabled:    { opacity:0.2 },
  calCellText:        { color:'#ccc', fontSize:13 },
  calCellTextSelected:{ color:'#c9a96e', fontWeight:'500' },
  calCellTextDisabled:{ color:'#444' },
  slotsGrid:          { flexDirection:'row', flexWrap:'wrap', gap:8 },
  slot:               { paddingVertical:10, paddingHorizontal:14, borderWidth:1, borderColor:'#333', borderRadius:4, backgroundColor:'#222' },
  slotSelected:       { backgroundColor:'#1a1a1a', borderColor:'#c9a96e' },
  slotTaken:          { opacity:0.25, backgroundColor:'#111' },
  slotText:           { color:'#ccc', fontSize:13 },
  slotTextSelected:   { color:'#c9a96e' },
  slotTextTaken:      { color:'#333', textDecorationLine:'line-through' },
  confirmBtn:         { backgroundColor:'#c9a96e', padding:16, alignItems:'center', borderRadius:4, marginTop:24 },
  confirmBtnText:     { color:'#1a1a1a', fontSize:14, letterSpacing:2 },
  backBtn:            { alignItems:'center', marginTop:14 },
  backBtnText:        { color:'#555', fontSize:13 },
  summaryBox:         { backgroundColor:'#222', borderWidth:1, borderColor:'#333', borderRadius:8, padding:16, gap:12 },
  summaryRow:         { flexDirection:'row', justifyContent:'space-between' },
  summaryLabel:       { color:'#666', fontSize:13 },
  summaryValue:       { color:'#fff', fontSize:13, textAlign:'right', flex:1, marginLeft:12 },
  progressBar:        { flexDirection:'row', gap:6, marginBottom:28 },
  progressStep:       { flex:1, height:3, backgroundColor:'#333', borderRadius:2 },
  progressStepActive: { backgroundColor:'#c9a96e' },
})