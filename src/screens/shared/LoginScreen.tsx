import React, { useState } from 'react'
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, ActivityIndicator, Alert,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native'
import { supabase } from '../../lib/supabase'
import { colors, spacing, radius } from '../../theme'

export default function LoginScreen() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [isLogin, setIsLogin]   = useState(true)
  const [loading, setLoading]   = useState(false)
  const [focusedInput, setFocusedInput] = useState<string | null>(null)

  async function handleAuth() {
    if (!email || !password) { Alert.alert('Champs manquants', 'Remplissez tous les champs.'); return }
    setLoading(true)
    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw error
      } else {
        if (!fullName) { Alert.alert('Champs manquants', 'Entrez votre prénom et nom.'); return }
        const { error } = await supabase.auth.signUp({
          email, password,
          options: { data: { full_name: fullName } }
        })
        if (error) throw error
        Alert.alert('Compte créé !', 'Vous pouvez maintenant vous connecter.')
      }
    } catch (e: any) {
      Alert.alert('Erreur', e.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={s.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">

        {/* Logo */}
        <View style={s.logoWrap}>
          <View style={s.logoIcon}>
            <Text style={s.logoScissors}>✂</Text>
          </View>
          <Text style={s.logoText}>Jampiero</Text>
          <Text style={s.logoSub}>BarberoShop</Text>
          <View style={s.divider} />
        </View>

        {/* Formulaire */}
        <View style={s.form}>
          {!isLogin && (
            <TextInput
              style={[s.input, focusedInput === 'name' && s.inputFocused]}
              placeholder="Prénom et nom"
              placeholderTextColor={colors.textLight}
              value={fullName}
              onChangeText={setFullName}
              autoCapitalize="words"
              onFocus={() => setFocusedInput('name')}
              onBlur={() => setFocusedInput(null)}
            />
          )}
          <TextInput
            style={[s.input, focusedInput === 'email' && s.inputFocused]}
            placeholder="Adresse email"
            placeholderTextColor={colors.textLight}
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            onFocus={() => setFocusedInput('email')}
            onBlur={() => setFocusedInput(null)}
          />
          <TextInput
            style={[s.input, focusedInput === 'pwd' && s.inputFocused]}
            placeholder="Mot de passe"
            placeholderTextColor={colors.textLight}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            onFocus={() => setFocusedInput('pwd')}
            onBlur={() => setFocusedInput(null)}
          />

          <TouchableOpacity style={s.btnPrimary} onPress={handleAuth} disabled={loading}>
            {loading
              ? <ActivityIndicator color={colors.white} />
              : <Text style={s.btnPrimaryText}>{isLogin ? 'Se connecter' : 'Créer un compte'}</Text>
            }
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={s.toggle}>
            <Text style={s.toggleText}>
              {isLogin ? "Pas encore de compte ? " : "Déjà un compte ? "}
              <Text style={s.toggleLink}>{isLogin ? "S'inscrire" : "Se connecter"}</Text>
            </Text>
          </TouchableOpacity>
        </View>

        {/* Footer */}
        <Text style={s.footer}>República Dominicana 🇩🇴</Text>

      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  container:      { flex:1, backgroundColor: colors.cream },
  scroll:         { flexGrow:1, alignItems:'center', justifyContent:'center', padding: spacing.xl },
  logoWrap:       { alignItems:'center', marginBottom: spacing.lg },
  logoIcon:       { width:72, height:72, backgroundColor: colors.red, borderRadius: radius.xl, alignItems:'center', justifyContent:'center', marginBottom: spacing.md },
  logoScissors:   { fontSize:32, color: colors.white },
  logoText:       { fontSize:30, color: colors.redDark, fontStyle:'italic', letterSpacing:2, fontFamily:'Georgia' },
  logoSub:        { fontSize:11, color: colors.gold, letterSpacing:5, textTransform:'uppercase', marginTop:4 },
  divider:        { width:48, height:2, backgroundColor: colors.gold, marginTop: spacing.md },
  form:           { width:'100%' },
  input:          { backgroundColor: colors.white, borderWidth:1.5, borderColor: colors.border, borderRadius: radius.md, padding:14, fontSize:15, color: colors.text, marginBottom:10, width:'100%' },
  inputFocused:   { borderColor: colors.red },
  btnPrimary:     { backgroundColor: colors.red, padding:15, borderRadius: radius.md, alignItems:'center', marginTop: spacing.sm },
  btnPrimaryText: { color: colors.white, fontSize:13, letterSpacing:2, textTransform:'uppercase', fontWeight:'500' },
  toggle:         { alignItems:'center', marginTop: spacing.lg },
  toggleText:     { color: colors.textMuted, fontSize:13 },
  toggleLink:     { color: colors.red, fontWeight:'500' },
  footer:         { color: colors.textLight, fontSize:12, marginTop: spacing.xl, letterSpacing:1 },
})