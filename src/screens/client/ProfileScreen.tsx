import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, ScrollView
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { colors, spacing, radius } from '../../theme'

interface Profile {
  id: string
  full_name: string
  phone: string | null
  role: 'client' | 'barber'
  created_at: string
}

export default function ProfileScreen() {
  const [profile, setProfile]   = useState<Profile | null>(null)
  const [fullName, setFullName] = useState('')
  const [phone, setPhone]       = useState('')
  const [email, setEmail]       = useState('')
  const [loading, setLoading]   = useState(true)
  const [saving, setSaving]     = useState(false)
  const [editing, setEditing]   = useState(false)
  const [focused, setFocused]   = useState<string | null>(null)

  useEffect(() => { fetchProfile() }, [])

  async function fetchProfile() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setEmail(user.email ?? '')
    const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single()
    if (data) { setProfile(data); setFullName(data.full_name ?? ''); setPhone(data.phone ?? '') }
    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    const { error } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', user.id)
    if (error) Alert.alert('Erreur', error.message)
    else { Alert.alert('Succès', 'Profil mis à jour !'); setEditing(false); fetchProfile() }
    setSaving(false)
  }

  async function signOut() {
    Alert.alert('Déconnexion', 'Voulez-vous vraiment vous déconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      { text: 'Déconnexion', style: 'destructive', onPress: () => supabase.auth.signOut() },
    ])
  }

  if (loading) return (
    <View style={s.centered}><ActivityIndicator color={colors.red} size="large" /></View>
  )

  const initials    = fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const memberSince = profile ? new Date(profile.created_at).toLocaleDateString('fr-CH', { month:'long', year:'numeric' }) : ''
  const isBarber    = profile?.role === 'barber'

  return (
    <ScrollView style={s.container} contentContainerStyle={{ paddingBottom: 60 }}>

      {/* Header */}
      <View style={s.header}>
        <View style={s.avatarWrap}>
          <View style={s.avatar}>
            <Text style={s.avatarText}>{initials || '?'}</Text>
          </View>
          {isBarber && (
            <View style={s.roleBadge}>
              <Text style={s.roleBadgeText}>✂ Coiffeur</Text>
            </View>
          )}
        </View>
        <Text style={s.name}>{fullName || 'Mon profil'}</Text>
        <Text style={s.memberSince}>Membre depuis {memberSince}</Text>
      </View>

      <View style={{ padding: spacing.md }}>
        {/* Infos personnelles */}
        <Text style={s.sectionTitle}>Informations personnelles</Text>
        <View style={s.card}>
          <Field
            label="Nom complet"
            value={fullName}
            editing={editing}
            focused={focused === 'name'}
            onFocus={() => setFocused('name')}
            onBlur={() => setFocused(null)}
            onChangeText={setFullName}
            placeholder="Prénom Nom"
          />
          <View style={s.fieldDivider} />
          <Field
            label="Téléphone"
            value={phone}
            editing={editing}
            focused={focused === 'phone'}
            onFocus={() => setFocused('phone')}
            onBlur={() => setFocused(null)}
            onChangeText={setPhone}
            placeholder="+41 79 000 00 00"
            keyboardType="phone-pad"
          />
          <View style={s.fieldDivider} />
          <Field label="Email" value={email} editing={false} />
        </View>

        {/* Boutons */}
        {editing ? (
          <View style={s.btnRow}>
            <TouchableOpacity style={s.btnSecondary} onPress={() => { setEditing(false); fetchProfile() }}>
              <Text style={s.btnSecondaryText}>Annuler</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnPrimary} onPress={saveProfile} disabled={saving}>
              {saving ? <ActivityIndicator color={colors.white} /> : <Text style={s.btnPrimaryText}>Enregistrer</Text>}
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={s.btnPrimary} onPress={() => setEditing(true)}>
            <Text style={s.btnPrimaryText}>Modifier le profil</Text>
          </TouchableOpacity>
        )}

        {/* Déconnexion */}
        <TouchableOpacity style={s.signOutBtn} onPress={signOut}>
          <Text style={s.signOutText}>Se déconnecter</Text>
        </TouchableOpacity>

        {/* Footer */}
        <Text style={s.footer}>Jampiero BarberoShop · Genève 🇩🇴</Text>
      </View>
    </ScrollView>
  )
}

function Field({ label, value, editing, focused, onFocus, onBlur, onChangeText, placeholder, keyboardType }: {
  label: string; value: string; editing: boolean; focused?: boolean
  onFocus?: () => void; onBlur?: () => void; onChangeText?: (t: string) => void
  placeholder?: string; keyboardType?: any
}) {
  return (
    <View style={s.field}>
      <Text style={s.fieldLabel}>{label}</Text>
      {editing && onChangeText ? (
        <TextInput
          style={[s.fieldInput, focused && s.fieldInputFocused]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textLight}
          onFocus={onFocus}
          onBlur={onBlur}
          keyboardType={keyboardType}
        />
      ) : (
        <Text style={s.fieldValue}>{value || '—'}</Text>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container:        { flex:1, backgroundColor: colors.cream },
  centered:         { flex:1, backgroundColor: colors.cream, alignItems:'center', justifyContent:'center' },
  header:           { backgroundColor: colors.red, paddingTop: spacing.xl, paddingBottom: spacing.xl, alignItems:'center' },
  avatarWrap:       { position:'relative', marginBottom: spacing.md },
  avatar:           { width:84, height:84, borderRadius: radius.full, backgroundColor: colors.white, alignItems:'center', justifyContent:'center', borderWidth:3, borderColor: colors.gold },
  avatarText:       { color: colors.red, fontSize:30, fontWeight:'700' },
  roleBadge:        { position:'absolute', bottom:-6, right:-6, backgroundColor: colors.gold, paddingVertical:3, paddingHorizontal:8, borderRadius: radius.full },
  roleBadgeText:    { color: colors.white, fontSize:10, fontWeight:'700' },
  name:             { color: colors.white, fontSize:20, fontWeight:'700', marginBottom:4 },
  memberSince:      { color: colors.white, fontSize:12, opacity:0.75, letterSpacing:1 },
  sectionTitle:     { color: colors.red, fontSize:11, letterSpacing:2, textTransform:'uppercase', fontWeight:'600', marginBottom: spacing.sm },
  card:             { backgroundColor: colors.white, borderWidth:1, borderColor: colors.border, borderRadius: radius.lg, padding: spacing.md, marginBottom: spacing.md },
  field:            { paddingVertical: spacing.sm },
  fieldLabel:       { color: colors.textMuted, fontSize:11, letterSpacing:1, textTransform:'uppercase', marginBottom:6 },
  fieldValue:       { color: colors.text, fontSize:15 },
  fieldInput:       { color: colors.text, fontSize:15, borderBottomWidth:1.5, borderBottomColor: colors.border, paddingBottom:6 },
  fieldInputFocused:{ borderBottomColor: colors.red },
  fieldDivider:     { height:1, backgroundColor: colors.borderLight },
  btnRow:           { flexDirection:'row', gap: spacing.sm, marginBottom: spacing.sm },
  btnPrimary:       { flex:1, backgroundColor: colors.red, padding:14, alignItems:'center', borderRadius: radius.md, marginBottom: spacing.sm },
  btnPrimaryText:   { color: colors.white, fontSize:13, letterSpacing:2, fontWeight:'500' },
  btnSecondary:     { flex:1, borderWidth:1.5, borderColor: colors.border, padding:14, alignItems:'center', borderRadius: radius.md },
  btnSecondaryText: { color: colors.textMuted, fontSize:13, letterSpacing:1 },
  signOutBtn:       { borderWidth:1, borderColor: colors.border, padding:14, alignItems:'center', borderRadius: radius.md, marginTop: spacing.sm },
  signOutText:      { color: colors.textMuted, fontSize:13, letterSpacing:1 },
  footer:           { color: colors.textLight, fontSize:11, textAlign:'center', marginTop: spacing.xl, letterSpacing:1 },
})