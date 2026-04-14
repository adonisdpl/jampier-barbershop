import React, { useState, useEffect } from 'react'
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, ScrollView
} from 'react-native'
import { supabase } from '../../lib/supabase'

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

  useEffect(() => { fetchProfile() }, [])

  async function fetchProfile() {
    setLoading(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    setEmail(user.email ?? '')

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (data) {
      setProfile(data)
      setFullName(data.full_name ?? '')
      setPhone(data.phone ?? '')
    }
    setLoading(false)
  }

  async function saveProfile() {
    setSaving(true)
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { error } = await supabase
      .from('profiles')
      .update({ full_name: fullName, phone })
      .eq('id', user.id)

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
    <View style={s.centered}>
      <ActivityIndicator color="#c9a96e" />
    </View>
  )

  const initials = fullName.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
  const memberSince = profile ? new Date(profile.created_at).toLocaleDateString('fr-CH', { month: 'long', year: 'numeric' }) : ''

  return (
    <ScrollView style={s.container} contentContainerStyle={{ padding: 24, paddingBottom: 60 }}>

      {/* Avatar */}
      <View style={s.avatarWrap}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{initials || '?'}</Text>
        </View>
        <Text style={s.name}>{fullName || 'Mon profil'}</Text>
        <Text style={s.memberSince}>Membre depuis {memberSince}</Text>
      </View>

      {/* Infos */}
      <View style={s.section}>
        <Text style={s.sectionTitle}>Informations personnelles</Text>

        <View style={s.field}>
          <Text style={s.fieldLabel}>Nom complet</Text>
          {editing
            ? <TextInput style={s.input} value={fullName} onChangeText={setFullName} placeholderTextColor="#555" placeholder="Prénom Nom" />
            : <Text style={s.fieldValue}>{fullName || '—'}</Text>
          }
        </View>

        <View style={s.field}>
          <Text style={s.fieldLabel}>Téléphone</Text>
          {editing
            ? <TextInput style={s.input} value={phone} onChangeText={setPhone} placeholderTextColor="#555" placeholder="+41 79 000 00 00" keyboardType="phone-pad" />
            : <Text style={s.fieldValue}>{phone || '—'}</Text>
          }
        </View>

        <View style={s.field}>
          <Text style={s.fieldLabel}>Email</Text>
          <Text style={s.fieldValue}>{email}</Text>
        </View>
      </View>

      {/* Boutons */}
      {editing ? (
        <View style={s.btnRow}>
          <TouchableOpacity style={s.btnSecondary} onPress={() => { setEditing(false); fetchProfile() }}>
            <Text style={s.btnSecondaryText}>Annuler</Text>
          </TouchableOpacity>
          <TouchableOpacity style={s.btnPrimary} onPress={saveProfile} disabled={saving}>
            {saving
              ? <ActivityIndicator color="#1a1a1a" />
              : <Text style={s.btnPrimaryText}>Enregistrer</Text>
            }
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

    </ScrollView>
  )
}

const s = StyleSheet.create({
  container:      { flex:1, backgroundColor:'#1a1a1a' },
  centered:       { flex:1, backgroundColor:'#1a1a1a', alignItems:'center', justifyContent:'center' },
  avatarWrap:     { alignItems:'center', marginBottom:32 },
  avatar:         { width:80, height:80, borderRadius:40, backgroundColor:'#222', borderWidth:2, borderColor:'#c9a96e', alignItems:'center', justifyContent:'center', marginBottom:12 },
  avatarText:     { color:'#c9a96e', fontSize:28, fontWeight:'500' },
  name:           { color:'#fff', fontSize:20, marginBottom:4 },
  memberSince:    { color:'#555', fontSize:12, letterSpacing:1 },
  section:        { backgroundColor:'#222', borderWidth:1, borderColor:'#333', borderRadius:8, padding:16, marginBottom:16 },
  sectionTitle:   { color:'#c9a96e', fontSize:11, letterSpacing:2, textTransform:'uppercase', marginBottom:16 },
  field:          { marginBottom:16 },
  fieldLabel:     { color:'#555', fontSize:11, letterSpacing:1, textTransform:'uppercase', marginBottom:6 },
  fieldValue:     { color:'#fff', fontSize:15 },
  input:          { color:'#fff', fontSize:15, borderBottomWidth:1, borderBottomColor:'#c9a96e', paddingBottom:6 },
  btnRow:         { flexDirection:'row', gap:12, marginBottom:12 },
  btnPrimary:     { flex:1, backgroundColor:'#c9a96e', padding:14, alignItems:'center', borderRadius:4 },
  btnPrimaryText: { color:'#1a1a1a', fontSize:13, letterSpacing:2 },
  btnSecondary:   { flex:1, borderWidth:1, borderColor:'#333', padding:14, alignItems:'center', borderRadius:4 },
  btnSecondaryText:{ color:'#555', fontSize:13, letterSpacing:1 },
  signOutBtn:     { marginTop:24, alignItems:'center', padding:14, borderWidth:1, borderColor:'#2a2a2a', borderRadius:4 },
  signOutText:    { color:'#555', fontSize:13, letterSpacing:1 },
})