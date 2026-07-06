import { Feather, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Alert, Animated, Image, Modal,
  Platform, Pressable, ScrollView, StatusBar,
  StyleSheet, Text, TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import SidebarWeb from "./components/SidebarWeb";
import Sidebar from "./components/sidebar";

const API        = 'http://10.232.80.175:2000';
const BREAKPOINT = 768;

const C = {
  bg: '#f1f5f9', bgWeb: '#f8fafc', card: '#ffffff',
  text: '#111827', muted: '#6b7280', faint: '#9ca3af',
  border: '#e5e7eb', borderSoft: '#f3f4f6',
  primary: '#6366f1', primarySoft: '#ede9fe', primaryDeep: '#7c3aed',
  amber: '#f59e0b', amberDeep: '#b45309', amberSoft: '#fef3c7', amberSoftDeep: '#fde68a',
  green: '#10b981', greenDeep: '#059669', greenSoft: '#d1fae5', greenSoftDeep: '#065f46',
  red: '#dc2626', redSoft: '#fee2e2',
  orange: '#ea580c', orangeSoft: '#ffedd5',
};

const AVATAR_COLORS: [string, string][] = [
  ['#fbbf24', '#f59e0b'], ['#60a5fa', '#3b82f6'],
  ['#f472b6', '#ec4899'], ['#34d399', '#10b981'],
  ['#a78bfa', '#8b5cf6'], ['#fb923c', '#f97316'],
];
const avatarGradient = (name = ''): [string, string] =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];
const initials = (name = '') =>
  name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

const ACTIVITY_BARS = [
  { d: 'M', h: 40 }, { d: 'T', h: 60 }, { d: 'W', h: 35 },
  { d: 'T', h: 75 }, { d: 'F', h: 90, active: true, value: 6 },
  { d: 'S', h: 55 }, { d: 'S', h: 65 },
];

// ── Admin Avatar ──────────────────────────────────────────────────
function AdminAvatar({ admin, size = 36 }: { admin: any; size?: number }) {
  const displayName = admin?.name ?? admin?.full_name ?? '';
  const [c1, c2] = displayName ? avatarGradient(displayName) : ['#6366f1', '#8b5cf6'];
  const label = displayName ? initials(displayName) : 'AD';
  return (
    <LinearGradient colors={[c1, c2]} style={{ width: size, height: size, borderRadius: size / 2, alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ color: '#fff', fontSize: size * 0.33, fontWeight: '700' }}>{label}</Text>
    </LinearGradient>
  );
}

// ── Profile Modal ─────────────────────────────────────────────────
function ProfileModal({ visible, onClose, admin, router }: any) {
  if (!admin) return null;
  const rm = admin.role === 'super_admin'
    ? { bg: '#EDE9FE', text: '#6D28D9', label: 'Super Admin' }
    : { bg: '#DCFCE7', text: '#15803D', label: 'Admin' };
  const [c1, c2] = avatarGradient(admin.name || '');

  const handleLogout = () => {
    onClose();
    const doLogout = async () => {
      await AsyncStorage.multiRemove(['admin', 'user', 'adminData']);
      router.replace('/loginscreen');
    };
    Platform.OS === 'web'
      ? window.confirm('Logout karna chahte ho?') && doLogout()
      : Alert.alert('Logout', 'Are you sure?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Logout', style: 'destructive', onPress: doLogout },
        ]);
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <Pressable style={pm.overlay} onPress={onClose}>
        <Pressable style={pm.card} onPress={() => {}}>
          <LinearGradient colors={[c1, c2]} style={pm.avatar}>
            <Text style={pm.avatarText}>{initials(admin?.name ?? admin?.full_name ?? "")}</Text>
          </LinearGradient>
          <Text style={pm.name}>{admin?.name ?? admin?.full_name}</Text>
          <Text style={pm.email}>{admin.email}</Text>
          <View style={[pm.roleBadge, { backgroundColor: rm.bg }]}>
            <Text style={[pm.roleText, { color: rm.text }]}>{rm.label}</Text>
          </View>
          <View style={pm.divider} />
          {admin.phone ? (
            <View style={pm.infoRow}>
              <Feather name="phone" size={14} color={C.muted} />
              <Text style={pm.infoText}>{admin.phone}</Text>
            </View>
          ) : null}
          <View style={pm.infoRow}>
            <Feather name="shield" size={14} color={C.muted} />
            <Text style={pm.infoText}>ID: #{admin.id}</Text>
          </View>
          <View style={pm.divider} />
          <TouchableOpacity style={pm.logoutBtn} onPress={handleLogout}>
            <Feather name="log-out" size={15} color={C.red} />
            <Text style={pm.logoutText}>Logout</Text>
          </TouchableOpacity>
          <TouchableOpacity style={pm.closeBtn} onPress={onClose}>
            <Text style={pm.closeBtnText}>Close</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const pm = StyleSheet.create({
  overlay:      { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  card:         { backgroundColor: '#fff', borderRadius: 24, padding: 24, width: '100%', maxWidth: 340, alignItems: 'center' },
  avatar:       { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarText:   { color: '#fff', fontSize: 26, fontWeight: '800' },
  name:         { fontSize: 20, fontWeight: '800', color: C.text, marginBottom: 4 },
  email:        { fontSize: 13, color: C.muted, marginBottom: 12 },
  roleBadge:    { paddingHorizontal: 14, paddingVertical: 5, borderRadius: 10, marginBottom: 16 },
  roleText:     { fontSize: 12, fontWeight: '700' },
  divider:      { width: '100%', height: 1, backgroundColor: C.borderSoft, marginVertical: 12 },
  infoRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, alignSelf: 'flex-start', marginBottom: 8 },
  infoText:     { fontSize: 13, color: C.muted },
  logoutBtn:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.redSoft, paddingVertical: 12, paddingHorizontal: 24, borderRadius: 14, marginTop: 4, width: '100%', justifyContent: 'center' },
  logoutText:   { color: C.red, fontWeight: '700', fontSize: 14 },
  closeBtn:     { marginTop: 10, paddingVertical: 10, width: '100%', alignItems: 'center' },
  closeBtnText: { color: C.muted, fontSize: 13, fontWeight: '600' },
});

// ═══════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════
export default function Dashboard() {
  const { width } = useWindowDimensions();
  const router    = useRouter();

  const [stats,         setStats]         = useState<any>({});
  const [recentMembers, setRecentMembers] = useState<any[]>([]);
  const [recentJobs,    setRecentJobs]    = useState<any[]>([]);
  const [loading,       setLoading]       = useState(true);
  const [drawerOpen,    setDrawerOpen]    = useState(false);
  const [currentAdmin,  setCurrentAdmin]  = useState<any>(null);
  const [profileOpen,   setProfileOpen]   = useState(false);
  const translateX = useRef(new Animated.Value(-300)).current;

  useEffect(() => {
    fetchAll();
    loadAdmin();
  }, []);

  // Login screen dono user aur admin ko 'user' key mein save karta hai
  const loadAdmin = async () => {
    try {
      const raw = await AsyncStorage.getItem('admin');
      if (raw) {
        const parsed = JSON.parse(raw);
        // Admin object: { id, name, email, role: 'admin' }
        // User object:  { id, full_name, email, role: 'user' }
        if (parsed?.role === 'admin' || parsed?.name) {
          setCurrentAdmin(parsed);
        }
      }
    } catch (e) {
      console.log('loadAdmin error:', e);
    }
  };

  const fetchAll = async () => {
    try {
      const [s, m, j] = await Promise.allSettled([
        axios.get(`${API}/admin/stats`),
        axios.get(`${API}/admin/members?limit=5`),
        axios.get(`${API}/jobs`),
      ]);
      if (s.status === 'fulfilled' && s.value.data.success) setStats(s.value.data.data);
      if (m.status === 'fulfilled' && m.value.data.success) setRecentMembers(m.value.data.data.slice(0, 4));
      if (j.status === 'fulfilled' && j.value.data.success) setRecentJobs(j.value.data.jobs.slice(0, 3));
    } catch (e) { console.log(e); }
    finally { setLoading(false); }
  };

  const openDrawer = () => {
    setDrawerOpen(true);
    Animated.timing(translateX, { toValue: 0, duration: 250, useNativeDriver: true }).start();
  };
  const closeDrawer = () => {
    Animated.timing(translateX, { toValue: -300, duration: 200, useNativeDriver: true })
      .start(() => setDrawerOpen(false));
  };
  const handleMenu = (route: string) => {
    closeDrawer();
    if (route === 'logout') {
      const doLogout = async () => {
        await AsyncStorage.multiRemove(['admin', 'adminData', 'adminUser', 'currentAdmin']);
        router.replace('/loginscreen');
      };
      Platform.OS === 'web'
        ? window.confirm('Are you sure you want to logout?') && doLogout()
        : Alert.alert('Logout', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Logout', onPress: doLogout },
          ]);
      return;
    }
    router.push(`/admin/${route}` as any);
  };

  const STAT_CARDS = [
    { label: 'Total Members',    value: stats.total_members   ?? '—', icon: 'people-outline',     color: '#EEF2FF', tc: '#4F46E5' },
    { label: 'Pending Approval', value: stats.pending_members ?? '—', icon: 'time-outline',        color: '#FEF3C7', tc: '#D97706' },
    { label: 'Total Events',     value: stats.total_events    ?? '—', icon: 'calendar-outline',    color: '#DCFCE7', tc: '#16A34A' },
    { label: 'Active Jobs',      value: stats.active_jobs     ?? '—', icon: 'briefcase-outline',   color: '#FEE2E2', tc: '#DC2626' },
    { label: 'Forum Posts',      value: stats.total_posts     ?? '—', icon: 'chatbubbles-outline', color: '#F3E8FF', tc: '#7C3AED' },
    {
      label: 'Contributions',
      value: stats.total_donations != null ? `₹${Number(stats.total_donations).toLocaleString()}` : '—',
      icon: 'heart-outline', color: '#FEF9C3', tc: '#CA8A04',
    },
  ];

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}>
        <ActivityIndicator size="large" color={C.primary} />
      </View>
    );
  }

  const isWeb = width >= BREAKPOINT;
  return (
    <>
      {isWeb
        ? <WebLayout
            stats={STAT_CARDS} recentMembers={recentMembers} recentJobs={recentJobs}
            router={router} statsRaw={stats} handleMenu={handleMenu}
            currentAdmin={currentAdmin} onProfilePress={() => setProfileOpen(true)}
          />
        : (
          <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
            <MobileLayout
              stats={STAT_CARDS} recentMembers={recentMembers} recentJobs={recentJobs}
              statsRaw={stats} router={router}
              openDrawer={openDrawer} drawerOpen={drawerOpen}
              translateX={translateX} closeDrawer={closeDrawer} handleMenu={handleMenu}
              currentAdmin={currentAdmin} onProfilePress={() => setProfileOpen(true)}
            />
          </SafeAreaView>
        )
      }
      <ProfileModal
        visible={profileOpen}
        onClose={() => setProfileOpen(false)}
        admin={currentAdmin}
        router={router}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════
// MOBILE LAYOUT
// ═══════════════════════════════════════════════════════════════════
function MobileLayout({ stats, recentMembers, recentJobs, statsRaw, router,
  openDrawer, drawerOpen, translateX, closeDrawer, handleMenu, currentAdmin, onProfilePress }: any) {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <View style={s.topBar}>
        <TouchableOpacity onPress={openDrawer}>
          <Feather name="menu" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={s.topTitle}>Alumni Admin</Text>
        <TouchableOpacity onPress={onProfilePress}>
          <AdminAvatar admin={currentAdmin} size={36} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#6366f1', '#8b5cf6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.mHero}>
          <Text style={s.mHeroWelcome}>Welcome back,</Text>
          <Text style={s.mHeroName}>{(currentAdmin?.name ?? currentAdmin?.full_name ?? 'Admin').split(' ')[0]} 👋</Text>
          <Text style={s.mHeroDate}>{new Date().toDateString()} · {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
        </LinearGradient>

        <View style={s.mStripWrap}>
          <View style={s.mStrip}>
            <StripItem value={statsRaw.total_members   ?? 0} label="Members" color={C.primary} />
            <View style={s.mStripDivider} />
            <StripItem value={statsRaw.pending_members ?? 0} label="Pending" color={C.amber} />
            <View style={s.mStripDivider} />
            <StripItem value={statsRaw.total_events    ?? 0} label="Events"  color={C.green} />
          </View>
        </View>

        <View style={{ paddingHorizontal: 14, marginTop: 16 }}>
          <LinearGradient colors={[C.amberSoft, C.amberSoftDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.mContribCard}>
            <View style={{ flex: 1 }}>
              <Text style={s.mContribLabel}>TOTAL CONTRIBUTIONS</Text>
              <Text style={s.mContribValue}>
                ₹{Number(statsRaw.total_donations ?? 0).toLocaleString()}
                <Text style={s.mContribValueSmall}>.00</Text>
              </Text>
              <Text style={s.mContribTrend}>↑ 12% this month</Text>
            </View>
            <View style={s.mContribIcon}><Feather name="heart" size={24} color={C.amberDeep} /></View>
          </LinearGradient>
        </View>

        <View style={s.mMiniRow}>
          <MiniStat icon={<MaterialCommunityIcons name="briefcase-outline" size={18} color={C.red} />} iconBg={C.redSoft} accent={C.red} value={statsRaw.active_jobs ?? 0} label="Active Jobs" />
          <MiniStat icon={<Feather name="message-circle" size={18} color={C.primaryDeep} />} iconBg={C.primarySoft} accent={C.primaryDeep} value={statsRaw.total_posts ?? 0} label="Forum Posts" />
        </View>

        <SectionRow title="Quick Actions" />
        <View style={s.quickRow}>
          {[
            { label: 'Approve\nMembers', route: 'members', icon: 'person-add-outline', color: '#4F46E5' },
            { label: 'Create\nEvent',    route: 'event',   icon: 'calendar-outline',   color: '#16A34A' },
            { label: 'Review\nForum',    route: 'forum',   icon: 'flag-outline',        color: '#DC2626' },
            { label: 'View\nJobs',       route: 'jobs',    icon: 'briefcase-outline',   color: '#D97706' },
          ].map((q, i) => (
            <TouchableOpacity key={i} style={s.quickCard} onPress={() => router.push(`/admin/${q.route}` as any)}>
              <View style={[s.quickIcon, { backgroundColor: q.color + '20' }]}>
                <Ionicons name={q.icon as any} size={22} color={q.color} />
              </View>
              <Text style={s.quickLabel}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <SectionRow title="Activity Overview" badge="7 DAYS" />
        <View style={s.mChartCard}><Chart /></View>

        <SectionRow title="Recent Members" cta="View all →" />
        <View style={s.listCard}>
          {recentMembers.slice(0, 3).map((m: any, i: number) => (
            <MemberRow key={m.id || i} member={m} divider={i > 0} />
          ))}
          <TouchableOpacity style={s.viewAllBtn} onPress={() => router.push('/admin/members' as any)}>
            <Text style={s.viewAllText}>View All Members →</Text>
          </TouchableOpacity>
        </View>

        <SectionRow title="Recent Jobs" cta="View all →" />
        <View style={s.listCard}>
          {recentJobs.map((j: any, i: number) => (
            <JobRow key={j.id || i} job={j} divider={i > 0} />
          ))}
          <TouchableOpacity style={s.viewAllBtn} onPress={() => router.push('/admin/jobs' as any)}>
            <Text style={s.viewAllText}>View All Jobs →</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <Sidebar drawerOpen={drawerOpen} translateX={translateX} closeDrawer={closeDrawer} handleMenu={handleMenu} />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// WEB LAYOUT
// ═══════════════════════════════════════════════════════════════════
function WebLayout({ stats, recentMembers, recentJobs, router, statsRaw, handleMenu, currentAdmin, onProfilePress }: any) {
  return (
    <View style={s.wRoot}>
      <SidebarWeb handleMenu={handleMenu} />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.wMain} showsVerticalScrollIndicator={false}>
        <View style={s.wTopBar}>
          <View>
            <Text style={s.wPageTitle}>Dashboard</Text>
            <Text style={s.wPageSub}>Welcome back, {currentAdmin?.name ?? currentAdmin?.full_name ?? 'Admin'} — {new Date().toDateString()}</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            
            <TouchableOpacity onPress={onProfilePress}>
              <AdminAvatar admin={currentAdmin} size={36} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={s.wKpiRow}>
          {stats.map((k: any, i: number) => (
            <View key={i} style={[s.wCard, { flex: 1 }]}>
              <View style={s.wKpiTop}>
                <View style={[s.wKpiIcon, { backgroundColor: k.color }]}>
                  <Ionicons name={k.icon as any} size={20} color={k.tc} />
                </View>
              </View>
              <Text style={[s.wKpiValue, { color: k.tc }]}>{k.value}</Text>
              <Text style={s.wKpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        <View style={s.wMidGrid}>
          <View style={{ flex: 2 }}>
            <View style={s.wCard}>
              <View style={s.wChartHead}>
                <View>
                  <Text style={s.wCardTitle}>Activity Overview</Text>
                  <Text style={s.wCardSub}>Member registrations · last 7 days</Text>
                </View>
                <View style={s.wTabs}>
                  <View style={[s.wTab, s.wTabActive]}><Text style={s.wTabTextActive}>Week</Text></View>
                  <View style={s.wTab}><Text style={s.wTabText}>Month</Text></View>
                  <View style={s.wTab}><Text style={s.wTabText}>Year</Text></View>
                </View>
              </View>
              <Chart height={160} />
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <LinearGradient colors={[C.amberSoft, C.amberSoftDeep]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[s.wCard, { padding: 18 }]}>
              <Text style={s.wContribLabel}>TOTAL CONTRIBUTIONS</Text>
              <Text style={s.wContribValue}>
                ₹{Number(statsRaw.total_donations ?? 0).toLocaleString()}
                <Text style={{ fontSize: 16, fontWeight: '600' }}>.00</Text>
              </Text>
              <Text style={s.wContribTrend}>↑ 12% vs last month</Text>
              <View style={s.wContribRow}>
                <Text style={s.wContribRowLabel}>Total Members</Text>
                <Text style={s.wContribRowValue}>{statsRaw.total_members ?? 0}</Text>
              </View>
              <View style={s.wContribRow}>
                <Text style={s.wContribRowLabel}>Active Jobs</Text>
                <Text style={s.wContribRowValue}>{statsRaw.active_jobs ?? 0}</Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        <View style={s.wBottomGrid}>
          <View style={[s.wCard, { flex: 1 }]}>
            <Text style={s.wCardTitle}>Quick Actions</Text>
            <View style={s.wActionsGrid}>
              {[
                { icon: 'user-plus', bg: '#7c3aed', soft: '#faf5ff', title: 'Approve',   sub: `${statsRaw.pending_members ?? 0} pending`, route: 'members' },
                { icon: 'calendar',  bg: '#059669', soft: '#ecfdf5', title: 'New Event', sub: 'Create now',                               route: 'event'   },
                { icon: 'flag',      bg: '#dc2626', soft: '#fef2f2', title: 'Forum',     sub: 'Review posts',                             route: 'forum'   },
                { icon: 'briefcase', bg: '#ea580c', soft: '#fff7ed', title: 'Jobs',      sub: `${statsRaw.active_jobs ?? 0} active`,       route: 'jobs'    },
              ].map((a, i) => (
                <Pressable key={i} style={[s.wActionRow, { backgroundColor: a.soft }]} onPress={() => router.push(`/admin/${a.route}` as any)}>
                  <View style={[s.wActionIcon, { backgroundColor: a.bg }]}>
                    <Feather name={a.icon as any} size={16} color="#fff" />
                  </View>
                  <View>
                    <Text style={s.wActionTitle}>{a.title}</Text>
                    <Text style={s.wActionSub}>{a.sub}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={[s.wCard, { flex: 1 }]}>
            <View style={s.wCardHead}>
              <Text style={s.wCardTitle}>Recent Members</Text>
              <TouchableOpacity onPress={() => router.push('/admin/members' as any)}>
                <Text style={s.wCardCta}>View all →</Text>
              </TouchableOpacity>
            </View>
            {recentMembers.map((m: any, i: number) => (
              <MemberRow key={m.id || i} member={m} compact divider={i > 0} />
            ))}
          </View>

          <View style={[s.wCard, { flex: 1 }]}>
            <View style={s.wCardHead}>
              <Text style={s.wCardTitle}>Recent Jobs</Text>
              <TouchableOpacity onPress={() => router.push('/admin/jobs' as any)}>
                <Text style={s.wCardCta}>View all →</Text>
              </TouchableOpacity>
            </View>
            {recentJobs.map((j: any, i: number) => (
              <JobRow key={j.id || i} job={j} compact divider={i > 0} />
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// SHARED PIECES
// ═══════════════════════════════════════════════════════════════════
function Chart({ height = 80 }: { height?: number }) {
  return (
    <View>
      <View style={[s.chartRow, { height }]}>
        {ACTIVITY_BARS.map((b, i) => (
          <View key={i} style={s.barCol}>
            {b.active && b.value != null && (
              <View style={s.barValuePill}><Text style={s.barValueText}>{b.value}</Text></View>
            )}
            <View style={[s.bar, { height: `${b.h}%` as any, backgroundColor: b.active ? C.primary : C.primarySoft }]} />
          </View>
        ))}
      </View>
      <View style={s.barLabels}>
        {ACTIVITY_BARS.map((b, i) => (
          <Text key={i} style={[s.barLabel, b.active && { color: C.primary, fontWeight: '700' }]}>{b.d}</Text>
        ))}
      </View>
    </View>
  );
}

function StripItem({ value, label, color }: any) {
  return (
    <View style={{ flex: 1, alignItems: 'center' }}>
      <Text style={[s.stripValue, { color }]}>{value}</Text>
      <Text style={s.stripLabel}>{label}</Text>
    </View>
  );
}

function MiniStat({ icon, iconBg, accent, value, label }: any) {
  return (
    <View style={[s.miniStat, { borderLeftColor: accent }]}>
      <View style={[s.miniStatIcon, { backgroundColor: iconBg }]}>{icon}</View>
      <Text style={[s.miniStatValue, { color: accent }]}>{value}</Text>
      <Text style={s.miniStatLabel}>{label}</Text>
    </View>
  );
}

function SectionRow({ title, cta, badge }: any) {
  return (
    <View style={s.sectionRow}>
      <Text style={s.sectionTitle}>{title}</Text>
      {cta   && <Text style={s.sectionCta}>{cta}</Text>}
      {badge && <View style={s.sectionBadge}><Text style={s.sectionBadgeText}>{badge}</Text></View>}
    </View>
  );
}

function MemberRow({ member, divider, compact }: any) {
  const [c1, c2] = avatarGradient(member.full_name || '');
  return (
    <View style={[compact ? s.memberRowCompact : s.memberRow, divider && { borderTopWidth: 1, borderTopColor: C.borderSoft }]}>
      {member.profile_photo
        ? <Image source={{ uri: `${API}/uploads/${member.profile_photo}` }} style={compact ? s.memberAvatarSm : s.memberAvatarImg} />
        : <LinearGradient colors={[c1, c2]} style={compact ? s.memberAvatarSm : s.memberAvatar}>
            <Text style={[s.memberInitials, compact && { fontSize: 11 }]}>{initials(member.full_name)}</Text>
          </LinearGradient>
      }
      <View style={{ flex: 1 }}>
        <Text style={s.memberName}>{member.full_name}</Text>
        <Text style={s.memberMeta}>{member.programme} · {member.batch_year}</Text>
      </View>
      {compact
        ? <View style={[s.onlineSmDot, { backgroundColor: member.approved ? C.green : '#d1d5db' }]} />
        : <View style={[s.statusBadge, { backgroundColor: member.approved ? C.greenSoft : C.amberSoft }]}>
            <Text style={[s.statusBadgeText, { color: member.approved ? C.greenSoftDeep : C.amberDeep }]}>
              {member.approved ? 'APPROVED' : 'PENDING'}
            </Text>
          </View>
      }
    </View>
  );
}

function JobRow({ job, divider, compact }: any) {
  return (
    <View style={[compact ? s.memberRowCompact : s.memberRow, divider && { borderTopWidth: 1, borderTopColor: C.borderSoft }]}>
      <View style={[s.jobIconBox, { backgroundColor: '#EDE9FE' }]}>
        <Ionicons name="briefcase-outline" size={18} color="#6D28D9" />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={s.memberName} numberOfLines={1}>{job.title}</Text>
        <Text style={s.memberMeta}>{job.company} · {job.location}</Text>
      </View>
      {!compact && (
        <View style={[s.statusBadge, { backgroundColor: job.is_closed ? '#F1F5F9' : C.greenSoft }]}>
          <Text style={[s.statusBadgeText, { color: job.is_closed ? C.muted : C.greenSoftDeep }]}>
            {job.is_closed ? 'CLOSED' : 'ACTIVE'}
          </Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  topBar:           { height: 65, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, elevation: 3 },
  topTitle:         { fontSize: 18, fontWeight: '700' },
  mHero:            { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 70 },
  mHeroWelcome:     { color: '#fff', fontSize: 13, opacity: 0.85, marginBottom: 2 },
  mHeroName:        { color: '#fff', fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  mHeroDate:        { color: '#fff', fontSize: 12, opacity: 0.75, marginTop: 6 },
  mStripWrap:       { paddingHorizontal: 14, marginTop: -50 },
  mStrip:           { backgroundColor: '#fff', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 },
  mStripDivider:    { width: 1, height: 28, backgroundColor: '#e5e7eb' },
  mContribCard:     { borderRadius: 18, padding: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  mContribLabel:    { fontSize: 11, color: C.amberDeep, fontWeight: '600', letterSpacing: 0.5 },
  mContribValue:    { fontSize: 26, fontWeight: '800', color: '#78350f', marginTop: 4, letterSpacing: -0.5 },
  mContribValueSmall:{ fontSize: 14, fontWeight: '600' },
  mContribTrend:    { fontSize: 11, color: C.amberDeep, marginTop: 2 },
  mContribIcon:     { width: 48, height: 48, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  mMiniRow:         { flexDirection: 'row', gap: 10, paddingHorizontal: 14, marginTop: 16 },
  mChartCard:       { marginHorizontal: 14, backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  quickRow:         { flexDirection: 'row', flexWrap: 'wrap', gap: 12, paddingHorizontal: 14, marginBottom: 4 },
  quickCard:        { width: '47%', backgroundColor: '#fff', borderRadius: 18, padding: 16, alignItems: 'center', elevation: 2 },
  quickIcon:        { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center', marginBottom: 10 },
  quickLabel:       { fontSize: 13, fontWeight: '700', color: '#0F172A', textAlign: 'center' },
  listCard:         { backgroundColor: '#fff', borderRadius: 18, overflow: 'hidden', marginHorizontal: 14, marginBottom: 20, elevation: 2 },
  memberRow:        { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 },
  memberRowCompact: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8 },
  memberAvatar:     { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  memberAvatarSm:   { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
  memberAvatarImg:  { width: 36, height: 36, borderRadius: 18 },
  memberInitials:   { color: '#fff', fontWeight: '700', fontSize: 13 },
  memberName:       { fontSize: 13, fontWeight: '600', color: C.text },
  memberMeta:       { fontSize: 11, color: C.muted, marginTop: 1 },
  onlineSmDot:      { width: 8, height: 8, borderRadius: 4 },
  statusBadge:      { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  statusBadgeText:  { fontSize: 9, fontWeight: '700' },
  jobIconBox:       { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  viewAllBtn:       { padding: 14, alignItems: 'center', borderTopWidth: 0.5, borderTopColor: '#F1F5F9' },
  viewAllText:      { color: C.primary, fontWeight: '700', fontSize: 14 },
  wRoot:            { flex: 1, flexDirection: 'row', backgroundColor: C.bgWeb },
  wMain:            { padding: 24, gap: 12 },
  wTopBar:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  wPageTitle:       { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  wPageSub:         { fontSize: 13, color: C.muted, marginTop: 4 },
  wIconBtn:         { width: 36, height: 36, backgroundColor: '#fff', borderRadius: 10, borderWidth: 1, borderColor: C.border, alignItems: 'center', justifyContent: 'center' },
  wNotifDot:        { position: 'absolute', top: 8, right: 8, width: 6, height: 6, backgroundColor: '#ef4444', borderRadius: 3 },
  wCard:            { backgroundColor: '#fff', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  wKpiRow:          { flexDirection: 'row', gap: 12 },
  wKpiTop:          { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  wKpiIcon:         { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  wKpiValue:        { fontSize: 30, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  wKpiLabel:        { fontSize: 12, color: C.muted, marginTop: 6, fontWeight: '500' },
  wMidGrid:         { flexDirection: 'row', gap: 12 },
  wBottomGrid:      { flexDirection: 'row', gap: 12 },
  wChartHead:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  wCardTitle:       { fontSize: 15, fontWeight: '700', color: C.text },
  wCardSub:         { fontSize: 12, color: C.muted, marginTop: 2 },
  wTabs:            { flexDirection: 'row', gap: 4 },
  wTab:             { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  wTabActive:       { backgroundColor: C.primary },
  wTabText:         { fontSize: 11, color: C.muted, fontWeight: '600' },
  wTabTextActive:   { fontSize: 11, color: '#fff', fontWeight: '600' },
  wContribLabel:    { fontSize: 11, color: '#92400e', fontWeight: '700', letterSpacing: 0.5 },
  wContribValue:    { fontSize: 32, fontWeight: '800', color: '#78350f', marginTop: 6, letterSpacing: -0.8 },
  wContribTrend:    { fontSize: 11, color: '#92400e', marginBottom: 14, marginTop: 2 },
  wContribRow:      { backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: 10, padding: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  wContribRowLabel: { fontSize: 12, color: '#78350f', fontWeight: '600' },
  wContribRowValue: { fontSize: 12, color: '#78350f', fontWeight: '800' },
  wActionsGrid:     { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  wActionRow:       { width: '48%', borderRadius: 10, padding: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  wActionIcon:      { width: 32, height: 32, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  wActionTitle:     { fontSize: 12, fontWeight: '700', color: C.text },
  wActionSub:       { fontSize: 10, color: C.muted, marginTop: 1 },
  wCardHead:        { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  wCardCta:         { fontSize: 11, color: C.primary, fontWeight: '700' },
  stripValue:       { fontSize: 20, fontWeight: '700' },
  stripLabel:       { fontSize: 10, color: C.muted, marginTop: 2 },
  miniStat:         { flex: 1, backgroundColor: '#fff', borderRadius: 14, padding: 14, borderLeftWidth: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  miniStatIcon:     { width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  miniStatValue:    { fontSize: 24, fontWeight: '700', lineHeight: 24 },
  miniStatLabel:    { fontSize: 11, color: C.muted, marginTop: 4, fontWeight: '500' },
  sectionRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, marginTop: 18, marginBottom: 10 },
  sectionTitle:     { fontSize: 13, fontWeight: '700', color: C.text, letterSpacing: -0.2 },
  sectionCta:       { fontSize: 11, color: C.primary, fontWeight: '600' },
  sectionBadge:     { backgroundColor: C.borderSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8 },
  sectionBadgeText: { fontSize: 10, color: C.muted, fontWeight: '600' },
  chartRow:         { flexDirection: 'row', alignItems: 'flex-end', gap: 14, paddingHorizontal: 4 },
  barCol:           { flex: 1, height: '100%', justifyContent: 'flex-end', alignItems: 'center', position: 'relative' },
  bar:              { width: '100%', borderTopLeftRadius: 6, borderTopRightRadius: 6 },
  barValuePill:     { position: 'absolute', top: -10, backgroundColor: C.text, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  barValueText:     { color: '#fff', fontSize: 10, fontWeight: '700' },
  barLabels:        { flexDirection: 'row', marginTop: 8, paddingHorizontal: 4, gap: 14 },
  barLabel:         { flex: 1, textAlign: 'center', fontSize: 10, color: C.faint },
});