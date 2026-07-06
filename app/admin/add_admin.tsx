
import { Feather, Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
    ActivityIndicator, Alert, Animated, Modal, Platform,
    Pressable, ScrollView, StatusBar, StyleSheet,
    Text, TextInput, TouchableOpacity, View, useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Sidebar from './components/sidebar';
import SidebarWeb from './components/SidebarWeb';

const API        = 'http://10.254.25.118:2000';
const BREAKPOINT = 768;

const C = {
  bg: '#f1f5f9', bgWeb: '#f8fafc', card: '#ffffff',
  text: '#111827', muted: '#6b7280', faint: '#9ca3af',
  border: '#e5e7eb', borderSoft: '#f3f4f6',
  primary: '#6366f1', primarySoft: '#ede9fe', primaryDeep: '#7c3aed',
  green: '#10b981', greenSoft: '#d1fae5', greenSoftDeep: '#065f46',
  red: '#dc2626', redSoft: '#fee2e2',
  amber: '#f59e0b', amberSoft: '#fef3c7', amberDeep: '#b45309',
};

const ROLE_META: Record<string, { bg: string; text: string; label: string }> = {
  super_admin: { bg: '#EDE9FE', text: '#6D28D9', label: 'Super Admin' },
  admin:       { bg: '#DCFCE7', text: '#15803D', label: 'Admin' },
};

const initials  = (name = '') => name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();
const formatDate = (d: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
};

// ═══════════════════════════════════════════════════════════════════
// ROOT
// ═══════════════════════════════════════════════════════════════════
export default function AdminsScreen() {
  const { width } = useWindowDimensions();
  const router    = useRouter();

  const [admins,         setAdmins]         = useState<any[]>([]);
  const [deleteRequests, setDeleteRequests] = useState<any[]>([]);
  const [loading,        setLoading]        = useState(true);
  const [showModal,      setShowModal]      = useState(false);
  const [editTarget,     setEditTarget]     = useState<any>(null);
  const [drawerOpen,     setDrawerOpen]     = useState(false);
  const [currentAdmin,   setCurrentAdmin]   = useState<any>(null);
  const translateX = useRef(new Animated.Value(-300)).current;

  const [name, setName]         = useState('');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone]       = useState('');
  const [role, setRole]         = useState<'admin' | 'super_admin'>('admin');
  const [saving, setSaving]     = useState(false);

  useEffect(() => {
    fetchAdmins();
    AsyncStorage.getItem('admin').then(data => { if (data) setCurrentAdmin(JSON.parse(data)); });
  }, []);

  const fetchAdmins = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/admin/admins`);
      if (res.data.success) setAdmins(res.data.data);
    } catch { Alert.alert('Error', 'Failed to load admins'); }
    finally { setLoading(false); }
  };

  const fetchDeleteRequests = async () => {
    try {
      const res = await axios.get(`${API}/admin/delete-requests`);
      if (res.data.success) setDeleteRequests(res.data.data);
    } catch { console.log('delete requests fetch failed'); }
  };

  useEffect(() => {
    if (currentAdmin?.role === 'super_admin') fetchDeleteRequests();
  }, [currentAdmin]);

  // ── drawer ──────────────────────────────────────────────────────
  const openDrawer  = () => { setDrawerOpen(true); Animated.timing(translateX, { toValue: 0, duration: 250, useNativeDriver: true }).start(); };
  const closeDrawer = () => { Animated.timing(translateX, { toValue: -300, duration: 200, useNativeDriver: true }).start(() => setDrawerOpen(false)); };
  const handleMenu  = (route: string) => {
    closeDrawer();
    if (route === 'logout') {
      const doLogout = () => router.replace('/loginscreen');
      Platform.OS === 'web'
        ? window.confirm('Logout?') && doLogout()
        : Alert.alert('Logout', 'Are you sure?', [{ text: 'Cancel', style: 'cancel' }, { text: 'Logout', onPress: doLogout }]);
      return;
    }
    router.push(`/admin/${route}` as any);
  };

  // ── modal ────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditTarget(null);
    setName(''); setEmail(''); setPassword(''); setPhone(''); setRole('admin');
    setShowModal(true);
  };
  const openEdit = (admin: any) => {
    setEditTarget(admin);
    setName(admin.name); setEmail(admin.email);
    setPassword(''); setPhone(admin.phone || ''); setRole(admin.role);
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!name.trim() || !email.trim()) { Alert.alert('Validation', 'Name and email required'); return; }
    if (!editTarget && !password.trim()) { Alert.alert('Validation', 'Password required for new admin'); return; }
    const isSelfEdit = editTarget && String(editTarget.id) === String(currentAdmin?.id);
    if (currentAdmin?.role !== 'super_admin' && !isSelfEdit) {
      Alert.alert('Permission Denied', 'Sirf apna account edit kar sakte hain.'); return;
    }
    setSaving(true);
    try {
      if (editTarget) {
        await axios.put(`${API}/admin/admins/${editTarget.id}`, { name, email, phone, role, requester_id: currentAdmin?.id, ...(password ? { password } : {}) });
        const msg = 'Admin updated ✅';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Success', msg);
      } else {
        await axios.post(`${API}/admin/admins`, { name, email, password, phone, role });
        const msg = 'Admin created ✅';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Success', msg);
      }
      setShowModal(false); fetchAdmins();
    } catch { Alert.alert('Error', 'Failed to save admin'); }
    finally { setSaving(false); }
  };

  const handleDelete = (id: number, adminName: string) => {
    if (currentAdmin?.role !== 'super_admin') { Alert.alert('Permission Denied', 'Only Super Admin can delete account.'); return; }
    const doDelete = async () => {
      try { await axios.delete(`${API}/admin/admins/${id}?requester_id=${currentAdmin?.id}`); fetchAdmins(); }
      catch { Alert.alert('Error', 'Failed to delete'); }
    };
    Platform.OS === 'web'
      ? window.confirm(`Delete "${adminName}"?`) && doDelete()
      : Alert.alert('Delete', `Delete "${adminName}"?`, [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: doDelete }]);
  };

  // ── Admin apna delete request bheje ─────────────────────────────
  const handleRequestDelete = async () => {
    const doRequest = async () => {
      try {
        const res = await axios.post(`${API}/admin/delete-request`, { requester_id: currentAdmin?.id });
        const msg = res.data.message || 'Request sent';
        Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Done', msg);
      } catch { Alert.alert('Error', 'Failed to send request'); }
    };
    Platform.OS === 'web'
      ? window.confirm('Send request to Super Admin?') && doRequest()
      : Alert.alert('Request Delete', 'Send request to Super Admin?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Send Request', onPress: doRequest },
        ]);
  };

  // ── Super admin approve/reject ───────────────────────────────────
  const handleApproveRequest = async (requestId: number, status: 'Approved' | 'Rejected', requesterId: number) => {
    try {
      await axios.put(`${API}/admin/delete-request/${requestId}`, { status, requester_id: requesterId });
      const msg = status === 'Approved' ? 'Admin deleted ✅' : 'Request rejected';
      Platform.OS === 'web' ? window.alert(msg) : Alert.alert('Done', msg);
      fetchAdmins(); fetchDeleteRequests();
    } catch { Alert.alert('Error', 'Failed'); }
  };

  if (loading) {
    return <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: C.bg }}><ActivityIndicator size="large" color={C.primary} /></View>;
  }

  const isWeb        = width >= BREAKPOINT;
  const isSuperAdmin = currentAdmin?.role === 'super_admin';
  const canManage    = isSuperAdmin;

  const modalProps = {
    visible: showModal, onClose: () => setShowModal(false),
    editTarget, name, email, password, phone, role,
    setName, setEmail, setPassword, setPhone, setRole,
    onSave: handleSave, saving,
    isSuperAdminUser: isSuperAdmin,
  };

  if (isWeb) {
    return (
      <WebLayout
        admins={admins} handleMenu={handleMenu}
        onAdd={openCreate} onEdit={openEdit} onDelete={handleDelete}
        onRequestDelete={handleRequestDelete}
        deleteRequests={deleteRequests}
        onApproveRequest={handleApproveRequest}
        modalProps={modalProps} currentAdmin={currentAdmin}
        canManage={canManage} isSuperAdmin={isSuperAdmin}
      />
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      <MobileLayout
        admins={admins}
        openDrawer={openDrawer} drawerOpen={drawerOpen}
        translateX={translateX} closeDrawer={closeDrawer} handleMenu={handleMenu}
        onAdd={openCreate} onEdit={openEdit} onDelete={handleDelete}
        onRequestDelete={handleRequestDelete}
        deleteRequests={deleteRequests}
        onApproveRequest={handleApproveRequest}
        modalProps={modalProps} currentAdmin={currentAdmin}
        canManage={canManage} isSuperAdmin={isSuperAdmin}
      />
    </SafeAreaView>
  );
}

// ═══════════════════════════════════════════════════════════════════
// DELETE REQUESTS PANEL (super admin ke liye)
// ═══════════════════════════════════════════════════════════════════
function DeleteRequestsPanel({ requests, onApprove }: { requests: any[]; onApprove: (id: number, status: 'Approved'|'Rejected', reqId: number) => void }) {
  if (requests.length === 0) return null;
  return (
    <View style={dr.panel}>
      <View style={dr.panelHeader}>
        <Ionicons name="alert-circle-outline" size={18} color={C.amber} />
        <Text style={dr.panelTitle}>Pending Delete Requests</Text>
        <View style={dr.countBadge}><Text style={dr.countText}>{requests.length}</Text></View>
      </View>
      {requests.map(req => (
        <View key={req.id} style={dr.requestCard}>
          <View style={dr.requestInfo}>
            <LinearGradient colors={['#6366f1','#8b5cf6']} style={dr.reqAvatar}>
              <Text style={dr.reqAvatarText}>{initials(req.name)}</Text>
            </LinearGradient>
            <View style={{ flex: 1 }}>
              <Text style={dr.reqName}>{req.name}</Text>
              <Text style={dr.reqEmail}>{req.email}</Text>
              <Text style={dr.reqMeta}>{formatDate(req.created_at)} · {(ROLE_META[req.role]||ROLE_META.admin).label}</Text>
            </View>
          </View>
          <View style={dr.reqActions}>
            <TouchableOpacity style={dr.approveBtn} onPress={() => onApprove(req.id, 'Approved', req.requester_id)}>
              <Feather name="check" size={14} color="#fff" />
              <Text style={dr.approveTxt}>Approve</Text>
            </TouchableOpacity>
            <TouchableOpacity style={dr.rejectBtn} onPress={() => onApprove(req.id, 'Rejected', req.requester_id)}>
              <Feather name="x" size={14} color={C.red} />
              <Text style={dr.rejectTxt}>Reject</Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}
    </View>
  );
}

const dr = StyleSheet.create({
  panel:       { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 16, borderLeftWidth: 3, borderLeftColor: C.amber },
  panelHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  panelTitle:  { fontSize: 14, fontWeight: '700', color: C.text, flex: 1 },
  countBadge:  { backgroundColor: C.amberSoft, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  countText:   { fontSize: 11, fontWeight: '700', color: C.amberDeep },
  requestCard: { backgroundColor: '#f8fafc', borderRadius: 12, padding: 12, marginBottom: 8 },
  requestInfo: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  reqAvatar:   { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  reqAvatarText: { color: '#fff', fontWeight: '700', fontSize: 13 },
  reqName:     { fontSize: 14, fontWeight: '700', color: C.text },
  reqEmail:    { fontSize: 12, color: C.muted, marginTop: 1 },
  reqMeta:     { fontSize: 11, color: C.faint, marginTop: 2 },
  reqActions:  { flexDirection: 'row', gap: 8 },
  approveBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: C.green, borderRadius: 10, paddingVertical: 9 },
  approveTxt:  { color: '#fff', fontWeight: '700', fontSize: 13 },
  rejectBtn:   { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, backgroundColor: C.redSoft, borderRadius: 10, paddingVertical: 9 },
  rejectTxt:   { color: C.red, fontWeight: '700', fontSize: 13 },
});

// ═══════════════════════════════════════════════════════════════════
// MOBILE LAYOUT
// ═══════════════════════════════════════════════════════════════════
function MobileLayout({ admins, openDrawer, drawerOpen, translateX, closeDrawer, handleMenu,
  onAdd, onEdit, onDelete, onRequestDelete, deleteRequests, onApproveRequest,
  modalProps, currentAdmin, canManage, isSuperAdmin }: any) {
  return (
    <View style={{ flex: 1 }}>
      <StatusBar barStyle="light-content" />
      <View style={s.topBar}>
        <TouchableOpacity onPress={openDrawer}><Feather name="menu" size={24} color="#000" /></TouchableOpacity>
        <Text style={s.topTitle}>Manage Admins</Text>
        {canManage
          ? <TouchableOpacity onPress={onAdd} style={{ backgroundColor: C.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 7 }}>
              <Text style={{ color: '#fff', fontWeight: '700', fontSize: 13 }}>+ Add</Text>
            </TouchableOpacity>
          : <View style={{ width: 60 }} />}
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <LinearGradient colors={['#6366f1', '#8b5cf6']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.mHero}>
          <Text style={s.mHeroWelcome}>Admin Management</Text>
          <Text style={s.mHeroName}>All Admins ({admins.length})</Text>
          <Text style={s.mHeroDate}>Manage roles · reset passwords · add new admins</Text>
        </LinearGradient>

        <View style={s.mStripWrap}>
          <View style={s.mStrip}>
            <StripItem value={admins.length} label="Total" color={C.primary} />
            <View style={s.mStripDivider} />
            <StripItem value={admins.filter((a: any) => a.role === 'super_admin').length} label="Super Admin" color="#7c3aed" />
            <View style={s.mStripDivider} />
            <StripItem value={admins.filter((a: any) => a.role === 'admin').length} label="Admin" color={C.green} />
          </View>
        </View>

        <View style={{ paddingHorizontal: 14, marginTop: 20, gap: 12 }}>
          {/* Delete requests panel — super admin ke liye */}
          {isSuperAdmin && (
            <DeleteRequestsPanel requests={deleteRequests} onApprove={onApproveRequest} />
          )}

          {admins.map((admin: any) => (
            <AdminCard
              key={admin.id} admin={admin}
              onEdit={onEdit} onDelete={onDelete}
              onRequestDelete={onRequestDelete}
              currentAdmin={currentAdmin}
              canManage={canManage}
            />
          ))}
        </View>
      </ScrollView>

      <AdminModal {...modalProps} />
      <Sidebar drawerOpen={drawerOpen} translateX={translateX} closeDrawer={closeDrawer} handleMenu={handleMenu} />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// WEB LAYOUT
// ═══════════════════════════════════════════════════════════════════
function WebLayout({ admins, handleMenu, onAdd, onEdit, onDelete, onRequestDelete,
  deleteRequests, onApproveRequest, modalProps, currentAdmin, canManage, isSuperAdmin }: any) {
  const [search, setSearch] = useState('');
  const filtered = admins.filter((a: any) =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <View style={s.wRoot}>
      <SidebarWeb handleMenu={handleMenu} />

      <ScrollView style={{ flex: 1 }} contentContainerStyle={s.wMain} showsVerticalScrollIndicator={false}>

        <View style={s.wTopBar}>
          <View>
            <Text style={s.wPageTitle}>Admin Management</Text>
            <Text style={s.wPageSub}>Add, edit or remove admin accounts and roles</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 10, alignItems: 'center' }}>
            {/* Normal admin apna delete request bhej sakta hai */}
            {!isSuperAdmin && (
              <TouchableOpacity
                onPress={onRequestDelete}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: C.redSoft, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: '#fca5a5' }}
              >
                <Feather name="trash-2" size={14} color={C.red} />
                <Text style={{ color: C.red, fontWeight: '700', fontSize: 13 }}>Request Account Delete</Text>
              </TouchableOpacity>
            )}
            {canManage && (
              <TouchableOpacity onPress={onAdd} style={s.wAddBtn}>
                <Feather name="plus" size={16} color="#fff" />
                <Text style={s.wAddBtnText}>Add Admin</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* KPI row */}
        <View style={s.wKpiRow}>
          {[
            { label: 'Total Admins', value: admins.length,                                            icon: 'shield', color: '#EEF2FF', tc: '#4F46E5' },
            { label: 'Super Admins', value: admins.filter((a: any) => a.role==='super_admin').length, icon: 'star',   color: '#F3E8FF', tc: '#7C3AED' },
            { label: 'Admins',       value: admins.filter((a: any) => a.role==='admin').length,       icon: 'user',   color: '#DCFCE7', tc: '#16A34A' },
            { label: 'Delete Reqs',  value: deleteRequests.length,                                    icon: 'trash-2',color: '#FEF3C7', tc: '#D97706' },
          ].map((k, i) => (
            <View key={i} style={[s.wCard, { flex: 1 }]}>
              <View style={[s.wKpiIcon, { backgroundColor: k.color, marginBottom: 12 }]}>
                <Feather name={k.icon as any} size={20} color={k.tc} />
              </View>
              <Text style={[s.wKpiValue, { color: k.tc }]}>{k.value}</Text>
              <Text style={s.wKpiLabel}>{k.label}</Text>
            </View>
          ))}
        </View>

        {/* Delete requests panel — super admin ke liye */}
        {isSuperAdmin && deleteRequests.length > 0 && (
          <DeleteRequestsPanel requests={deleteRequests} onApprove={onApproveRequest} />
        )}

        {/* Table */}
        <View style={s.wCard}>
          <View style={s.wTableHead}>
            <Text style={s.wTableTitle}>All Admins</Text>
            <View style={s.wSearchBox}>
              <Feather name="search" size={14} color={C.faint} />
              <TextInput placeholder="Search admins..." placeholderTextColor={C.faint} value={search} onChangeText={setSearch} style={s.wSearchInput} />
            </View>
          </View>

          <View style={s.wColHead}>
            <Text style={[s.wColText, { flex: 2 }]}>Name</Text>
            <Text style={[s.wColText, { flex: 2 }]}>Email</Text>
            <Text style={[s.wColText, { flex: 1 }]}>Phone</Text>
            <Text style={[s.wColText, { flex: 1 }]}>Role</Text>
            <Text style={[s.wColText, { flex: 1 }]}>Last Login</Text>
            <Text style={[s.wColText, { flex: 1, textAlign: 'right' }]}>Actions</Text>
          </View>

          {filtered.length === 0 ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <Feather name="inbox" size={28} color={C.faint} />
              <Text style={{ color: C.muted, marginTop: 8, fontSize: 13 }}>No admins found</Text>
            </View>
          ) : filtered.map((admin: any, i: number) => {
            const rm = ROLE_META[admin.role] || ROLE_META.admin;
            const isSelf = String(currentAdmin?.id) === String(admin.id);
            return (
              <View key={admin.id} style={[s.wRow, i % 2 === 1 && { backgroundColor: '#fafafa' }]}>
                <View style={[s.wRowCell, { flex: 2 }]}>
                  <LinearGradient colors={['#6366f1','#8b5cf6']} style={s.wRowAvatar}>
                    <Text style={s.wRowAvatarText}>{initials(admin.name)}</Text>
                  </LinearGradient>
                  <Text style={s.wRowName}>{admin.name}</Text>
                  {isSelf && <View style={{ backgroundColor: C.primarySoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}><Text style={{ fontSize: 9, color: C.primary, fontWeight: '700' }}>YOU</Text></View>}
                </View>
                <Text style={[s.wRowMeta, { flex: 2 }]} numberOfLines={1}>{admin.email}</Text>
                <Text style={[s.wRowMeta, { flex: 1 }]}>{admin.phone || '—'}</Text>
                <View style={{ flex: 1 }}>
                  <View style={[s.roleBadge, { backgroundColor: rm.bg }]}>
                    <Text style={[s.roleBadgeText, { color: rm.text }]}>{rm.label}</Text>
                  </View>
                </View>
                <Text style={[s.wRowMeta, { flex: 1 }]}>{formatDate(admin.last_login)}</Text>
                <View style={[s.wRowActions, { flex: 1 }]}>
                  {(canManage || isSelf) ? (
                    <Pressable onPress={() => onEdit(admin)} style={s.wActionIconBtn}>
                      <Feather name="edit-2" size={14} color={C.primary} />
                    </Pressable>
                  ) : (
                    <View style={[s.wActionIconBtn, { opacity: 0.25 }]}><Feather name="lock" size={14} color={C.faint} /></View>
                  )}
                  {canManage ? (
                    <Pressable onPress={() => onDelete(admin.id, admin.name)} style={[s.wActionIconBtn, { backgroundColor: C.redSoft }]}>
                      <Feather name="trash-2" size={14} color={C.red} />
                    </Pressable>
                  ) : isSelf ? (
                    // Normal admin apna request bhej sakta hai
                    <Pressable onPress={onRequestDelete} style={[s.wActionIconBtn, { backgroundColor: C.amberSoft }]}>
                      <Feather name="send" size={14} color={C.amberDeep} />
                    </Pressable>
                  ) : (
                    <View style={[s.wActionIconBtn, { opacity: 0.25 }]}><Feather name="lock" size={14} color={C.faint} /></View>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      <AdminModal {...modalProps} />
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ADMIN CARD (mobile)
// ═══════════════════════════════════════════════════════════════════
function AdminCard({ admin, onEdit, onDelete, onRequestDelete, currentAdmin, canManage }: any) {
  const rm     = ROLE_META[admin.role] || ROLE_META.admin;
  const isSelf = !!currentAdmin && String(currentAdmin.id) === String(admin.id);
  return (
    <View style={s.adminCard}>
      <View style={s.adminCardTop}>
        <LinearGradient colors={['#6366f1','#8b5cf6']} style={s.adminAvatar}>
          <Text style={s.adminAvatarText}>{initials(admin.name)}</Text>
        </LinearGradient>
        <View style={{ flex: 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text style={s.adminName}>{admin.name}</Text>
            {isSelf && <View style={{ backgroundColor: C.primarySoft, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 }}><Text style={{ fontSize: 9, color: C.primary, fontWeight: '700' }}>YOU</Text></View>}
          </View>
          <Text style={s.adminEmail}>{admin.email}</Text>
        </View>
        <View style={[s.roleBadge, { backgroundColor: rm.bg }]}>
          <Text style={[s.roleBadgeText, { color: rm.text }]}>{rm.label}</Text>
        </View>
      </View>

      <View style={s.adminCardMeta}>
        {admin.phone ? <View style={s.adminMetaItem}><Feather name="phone" size={12} color={C.muted} /><Text style={s.adminMetaText}>{admin.phone}</Text></View> : null}
        <View style={s.adminMetaItem}><Feather name="clock" size={12} color={C.muted} /><Text style={s.adminMetaText}>Last login: {formatDate(admin.last_login)}</Text></View>
        <View style={s.adminMetaItem}><Feather name="calendar" size={12} color={C.muted} /><Text style={s.adminMetaText}>Added: {formatDate(admin.created_at)}</Text></View>
      </View>

      <View style={s.adminCardActions}>
        {/* Edit */}
        {(canManage || isSelf) ? (
          <TouchableOpacity style={s.adminEditBtn} onPress={() => onEdit(admin)}>
            <Feather name="edit-2" size={14} color={C.primary} />
            <Text style={[s.adminBtnText, { color: C.primary }]}>Edit</Text>
          </TouchableOpacity>
        ) : (
          <View style={[s.adminEditBtn, { opacity: 0.3 }]}>
            <Feather name="lock" size={14} color={C.muted} />
            <Text style={[s.adminBtnText, { color: C.muted }]}>No Access</Text>
          </View>
        )}

        {/* Delete / Request Delete */}
        {canManage ? (
          <TouchableOpacity style={s.adminDeleteBtn} onPress={() => onDelete(admin.id, admin.name)}>
            <Feather name="trash-2" size={14} color={C.red} />
            <Text style={[s.adminBtnText, { color: C.red }]}>Delete</Text>
          </TouchableOpacity>
        ) : isSelf ? (
          // Normal admin apna account delete karne ki request bhej sakta hai
          <TouchableOpacity style={[s.adminDeleteBtn, { backgroundColor: C.amberSoft }]} onPress={onRequestDelete}>
            <Feather name="send" size={14} color={C.amberDeep} />
            <Text style={[s.adminBtnText, { color: C.amberDeep }]}>Request Delete</Text>
          </TouchableOpacity>
        ) : (
          <View style={[s.adminDeleteBtn, { opacity: 0.3 }]}>
            <Feather name="lock" size={14} color={C.muted} />
            <Text style={[s.adminBtnText, { color: C.muted }]}>No Access</Text>
          </View>
        )}
      </View>
    </View>
  );
}

// ═══════════════════════════════════════════════════════════════════
// ADMIN MODAL
// ═══════════════════════════════════════════════════════════════════
function AdminModal({ visible, onClose, editTarget, name, email, password, phone, role,
  setName, setEmail, setPassword, setPhone, setRole, onSave, saving, isSuperAdminUser }: any) {
  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={s.modalBg}>
        <View style={s.modalBox}>
          <View style={s.modalHeader}>
            <Text style={s.modalTitle}>{editTarget ? 'Edit Admin' : 'Add New Admin'}</Text>
            <TouchableOpacity onPress={onClose}><Feather name="x" size={22} color={C.muted} /></TouchableOpacity>
          </View>
          <ScrollView showsVerticalScrollIndicator={false}>
            <Text style={s.fieldLabel}>Full Name *</Text>
            <TextInput style={s.input} placeholder="Enter full name" value={name} onChangeText={setName} />
            <Text style={s.fieldLabel}>Email *</Text>
            <TextInput style={s.input} placeholder="admin@example.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <Text style={s.fieldLabel}>{editTarget ? 'New Password (blank = keep)' : 'Password *'}</Text>
            <TextInput style={s.input} placeholder={editTarget ? '••••••••' : 'Enter password'} value={password} onChangeText={setPassword} secureTextEntry />
            <Text style={s.fieldLabel}>Phone</Text>
            <TextInput style={s.input} placeholder="+91 99999 99999" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
            <Text style={s.fieldLabel}>Role *</Text>
            {isSuperAdminUser ? (
              <View style={s.roleRow}>
                {(['admin','super_admin'] as const).map(r => {
                  const sel = role === r;
                  return (
                    <TouchableOpacity key={r} style={[s.roleOption, sel && { backgroundColor: C.primary, borderColor: C.primary }]} onPress={() => setRole(r)}>
                      <Ionicons name={r==='super_admin'?'star':'shield-checkmark-outline'} size={16} color={sel?'#fff':C.muted} />
                      <Text style={[s.roleOptionText, sel && { color: '#fff' }]}>{r==='super_admin'?'Super Admin':'Admin'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={[s.roleOption, { backgroundColor: C.primarySoft, borderColor: C.primary, justifyContent: 'center' }]}>
                <Ionicons name={role==='super_admin'?'star':'shield-checkmark-outline'} size={16} color={C.primary} />
                <Text style={[s.roleOptionText, { color: C.primary }]}>{role==='super_admin'?'Super Admin':'Admin'}</Text>
              </View>
            )}
          </ScrollView>
          <View style={s.modalBtnRow}>
            <TouchableOpacity style={s.cancelBtn} onPress={onClose}><Text style={s.cancelText}>Cancel</Text></TouchableOpacity>
            <TouchableOpacity style={s.saveBtn} onPress={onSave} disabled={saving}>
              {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={s.saveText}>{editTarget?'Update':'Create'}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
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

// ═══════════════════════════════════════════════════════════════════
// STYLES
// ═══════════════════════════════════════════════════════════════════
const s = StyleSheet.create({
  topBar:       { height: 65, backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, elevation: 3 },
  topTitle:     { fontSize: 17, fontWeight: '700', color: C.text },
  mHero:        { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 70 },
  mHeroWelcome: { color: '#fff', fontSize: 13, opacity: 0.85, marginBottom: 2 },
  mHeroName:    { color: '#fff', fontSize: 24, fontWeight: '700', letterSpacing: -0.5 },
  mHeroDate:    { color: '#fff', fontSize: 12, opacity: 0.75, marginTop: 6 },
  mStripWrap:   { paddingHorizontal: 14, marginTop: -50 },
  mStrip:       { backgroundColor: '#fff', borderRadius: 18, padding: 14, flexDirection: 'row', alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 12, elevation: 4 },
  mStripDivider:{ width: 1, height: 28, backgroundColor: C.border },
  stripValue:   { fontSize: 20, fontWeight: '700' },
  stripLabel:   { fontSize: 10, color: C.muted, marginTop: 2 },
  adminCard:       { backgroundColor: '#fff', borderRadius: 18, padding: 16, elevation: 2 },
  adminCardTop:    { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  adminAvatar:     { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  adminAvatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  adminName:       { fontSize: 15, fontWeight: '700', color: C.text },
  adminEmail:      { fontSize: 12, color: C.muted, marginTop: 2 },
  adminCardMeta:   { gap: 6, marginBottom: 14 },
  adminMetaItem:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  adminMetaText:   { fontSize: 12, color: C.muted },
  adminCardActions:{ flexDirection: 'row', gap: 10, borderTopWidth: 1, borderTopColor: C.borderSoft, paddingTop: 12 },
  adminEditBtn:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.primarySoft, borderRadius: 10, paddingVertical: 10 },
  adminDeleteBtn:  { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: C.redSoft, borderRadius: 10, paddingVertical: 10 },
  adminBtnText:    { fontSize: 13, fontWeight: '700' },
  roleBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  roleBadgeText: { fontSize: 11, fontWeight: '700' },
  modalBg:       { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', padding: 20 },
  modalBox:      { backgroundColor: '#fff', borderRadius: 24, padding: 22, maxHeight: '90%' },
  modalHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle:    { fontSize: 20, fontWeight: '800', color: C.text },
  fieldLabel:    { fontSize: 12, fontWeight: '700', color: C.muted, marginBottom: 6, marginTop: 12 },
  input:         { backgroundColor: '#f8fafc', borderRadius: 12, paddingHorizontal: 14, height: 50, fontSize: 14, color: C.text, borderWidth: 1, borderColor: C.border },
  roleRow:       { flexDirection: 'row', gap: 10, marginTop: 4 },
  roleOption:    { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 12, borderRadius: 12, borderWidth: 1.5, borderColor: C.border, backgroundColor: '#f8fafc' },
  roleOptionText:{ fontSize: 13, fontWeight: '700', color: C.muted },
  modalBtnRow:   { flexDirection: 'row', gap: 10, marginTop: 20 },
  cancelBtn:     { flex: 1, backgroundColor: C.borderSoft, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  cancelText:    { fontWeight: '700', color: C.text },
  saveBtn:       { flex: 1, backgroundColor: C.primary, paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  saveText:      { fontWeight: '700', color: '#fff', fontSize: 15 },
  wRoot:         { flex: 1, flexDirection: 'row', backgroundColor: C.bgWeb },
  wMain:         { padding: 24, gap: 16 },
  wTopBar:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  wPageTitle:    { fontSize: 24, fontWeight: '800', color: C.text, letterSpacing: -0.5 },
  wPageSub:      { fontSize: 13, color: C.muted, marginTop: 4 },
  wAddBtn:       { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: C.primary, paddingHorizontal: 18, paddingVertical: 10, borderRadius: 12 },
  wAddBtnText:   { color: '#fff', fontWeight: '700', fontSize: 14 },
  wKpiRow:       { flexDirection: 'row', gap: 12 },
  wCard:         { backgroundColor: '#fff', borderRadius: 16, padding: 18, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 3, elevation: 1 },
  wKpiIcon:      { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  wKpiValue:     { fontSize: 28, fontWeight: '800', letterSpacing: -0.5 },
  wKpiLabel:     { fontSize: 12, color: C.muted, marginTop: 4, fontWeight: '500' },
  wTableHead:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  wTableTitle:   { fontSize: 16, fontWeight: '700', color: C.text },
  wSearchBox:    { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#f8fafc', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: C.border, minWidth: 220 },
  wSearchInput:  { flex: 1, fontSize: 13, color: C.text, outlineStyle: 'none' } as any,
  wColHead:      { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 12, backgroundColor: '#f8fafc', borderRadius: 10, marginBottom: 4 },
  wColText:      { fontSize: 11, fontWeight: '700', color: C.faint, textTransform: 'uppercase', letterSpacing: 0.5 },
  wRow:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderRadius: 8 },
  wRowCell:      { flexDirection: 'row', alignItems: 'center', gap: 10 },
  wRowAvatar:    { width: 34, height: 34, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  wRowAvatarText:{ color: '#fff', fontSize: 12, fontWeight: '700' },
  wRowName:      { fontSize: 13, fontWeight: '600', color: C.text },
  wRowMeta:      { fontSize: 13, color: C.muted },
  wRowActions:   { flexDirection: 'row', justifyContent: 'flex-end', gap: 8 },
  wActionIconBtn:{ width: 32, height: 32, backgroundColor: C.primarySoft, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});
