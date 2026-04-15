// ─────────────────────────────────────────────────────────
// Jampiero BarberoShop — Thème latino rouge & or
// ─────────────────────────────────────────────────────────

export const colors = {
  // Primaires
  red:         '#C0392B',
  redDark:     '#922B21',
  redLight:    '#FADBD8',
  redMid:      '#E74C3C',

  // Accents
  gold:        '#D4AC0D',
  goldLight:   '#FCF3CF',
  goldDark:    '#9A7D0A',

  // Fonds
  cream:       '#FDF6EC',
  white:       '#FFFFFF',
  surface:     '#FEF9F2',

  // Texte
  text:        '#2C2C2C',
  textMuted:   '#7B7B7B',
  textLight:   '#BDBDBD',

  // Bordures
  border:      '#E8D5C4',
  borderLight: '#F2E8DC',

  // États
  success:     '#1D9E75',
  successLight:'#E1F5EE',
  warning:     '#BA7517',
  warningLight:'#FCF3CF',
  danger:      '#C0392B',
  dangerLight: '#FADBD8',
}

export const typography = {
  logo:    { fontFamily: 'Georgia, serif', fontStyle: 'italic' as const },
  heading: { fontFamily: 'System', fontWeight: '600' as const },
  body:    { fontFamily: 'System', fontWeight: '400' as const },
}

export const spacing = {
  xs:  4,
  sm:  8,
  md:  16,
  lg:  24,
  xl:  32,
  xxl: 48,
}

export const radius = {
  sm:  4,
  md:  8,
  lg:  12,
  xl:  16,
  full: 999,
}

// Styles réutilisables
export const shared = {
  container: {
    flex: 1,
    backgroundColor: colors.cream,
  },
  topBar: {
    backgroundColor: colors.red,
    paddingHorizontal: 20,
    paddingVertical: 16,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  topBarTitle: {
    color: colors.white,
    fontSize: 18,
    fontStyle: 'italic' as const,
    fontFamily: 'Georgia, serif' as const,
    letterSpacing: 1,
  },
  topBarBack: {
    color: colors.white,
    fontSize: 14,
    opacity: 0.9,
  },
  card: {
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  input: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    fontSize: 15,
    color: colors.text,
    marginBottom: 10,
    width: '100%' as const,
  },
  inputFocused: {
    borderColor: colors.red,
  },
  btnPrimary: {
    backgroundColor: colors.red,
    padding: 15,
    borderRadius: radius.md,
    alignItems: 'center' as const,
    width: '100%' as const,
  },
  btnPrimaryText: {
    color: colors.white,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    fontWeight: '500' as const,
  },
  btnSecondary: {
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.red,
    padding: 14,
    borderRadius: radius.md,
    alignItems: 'center' as const,
  },
  btnSecondaryText: {
    color: colors.red,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
  },
  btnGold: {
    backgroundColor: colors.gold,
    padding: 15,
    borderRadius: radius.md,
    alignItems: 'center' as const,
  },
  btnGoldText: {
    color: colors.white,
    fontSize: 13,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    fontWeight: '500' as const,
  },
  divider: {
    width: 40,
    height: 2,
    backgroundColor: colors.gold,
    marginVertical: spacing.md,
    alignSelf: 'center' as const,
  },
  sectionTitle: {
    color: colors.red,
    fontSize: 11,
    letterSpacing: 2,
    textTransform: 'uppercase' as const,
    fontWeight: '600' as const,
    marginBottom: spacing.md,
  },
  badge: (status: string) => ({
    backgroundColor:
      status === 'confirmed' ? colors.successLight :
      status === 'pending'   ? colors.warningLight :
      status === 'cancelled' ? colors.dangerLight  :
      colors.borderLight,
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: radius.sm,
  }),
  badgeText: (status: string) => ({
    fontSize: 11,
    letterSpacing: 1,
    color:
      status === 'confirmed' ? colors.success :
      status === 'pending'   ? colors.warning :
      status === 'cancelled' ? colors.danger  :
      colors.textMuted,
  }),
  bottomTabs: {
    flexDirection: 'row' as const,
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  bottomTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center' as const,
  },
  bottomTabText: {
    fontSize: 11,
    letterSpacing: 1,
    color: colors.textMuted,
    textTransform: 'uppercase' as const,
  },
  bottomTabActive: {
    color: colors.red,
    fontWeight: '600' as const,
  },
}