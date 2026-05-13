import 'react-native-gesture-handler';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BottomSheet from '@gorhom/bottom-sheet';
import io from 'socket.io-client';
import axios from 'axios';
import Constants from 'expo-constants';

const getApiBaseUrl = () => {
  // 1. Prioritize the live Render URL
  const RENDER_URL = 'https://regent-nexus-backend.onrender.com/api';
  
  // If you are in production or want to test the live server, return this immediately
  return RENDER_URL;

};

const apiBaseUrl = getApiBaseUrl();
const socketServer = apiBaseUrl.replace(/\/api$/, '');
const verificationModes = ['email', 'sms', 'admin'];

function MainContent({ token, user, onSignOut, currentScreen }) {

  const renderScreen = () => {
    switch (currentScreen) {
      case 'Home':
        return <HomeScreen token={token} />;
      case 'Listings':
        return <ListingsScreen token={token} />;
      case 'Transactions':
        return <TransactionsScreen token={token} />;
      case 'Profile':
        return <ProfileScreen user={user} onSignOut={onSignOut} />;
      case 'Messages':
        return <MessageScreen token={token} />;
      case 'Admin':
        return user.role === 'admin' ? <AdminDashboardScreen token={token} /> : <HomeScreen token={token} />;
      default:
        return <HomeScreen token={token} />;
    }
  };

  return (
    <SafeAreaView style={{ flex: 1 }}>
      {renderScreen()}
    </SafeAreaView>
  );
}

function BottomNavigation({ token, user, onNavigate }) {
  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ['10%', '50%'], []);

  const navigationItems = [
    { name: 'Home', icon: 'Home' },
    { name: 'Listings', icon: 'List' },
    { name: 'Transactions', icon: 'Trans' },
    { name: 'Profile', icon: 'Profile' },
    { name: 'Messages', icon: 'Chat' },
    ...(user.role === 'admin' ? [{ name: 'Admin', icon: 'Admin' }] : []),
  ];

  return (
    <BottomSheet
      ref={sheetRef}
      index={0}
      snapPoints={snapPoints}
      backgroundStyle={{ backgroundColor: '#fff' }}
    >
      <View style={styles.bottomSheetContent}>
        <Text style={styles.bottomSheetTitle}>Navigation</Text>
        <View style={styles.navigationGrid}>
          {navigationItems.map((item) => (
            <TouchableOpacity
              key={item.name}
              style={styles.navItem}
              onPress={() => onNavigate(item.name)}
            >
              <Text style={styles.navIcon}>{item.icon}</Text>
              <Text style={styles.navText}>{item.name}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </BottomSheet>
  );
}

function AdminDashboardScreen({ token }) {
  const [overview, setOverview] = useState({ users: 0, listings: 0, reports: 0 });
  const [reports, setReports] = useState([]);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview();
  }, []);

  const fetchOverview = async () => {
    try {
      const { data } = await axios.get(`${apiBaseUrl}/admin/overview`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOverview(data.overview);
      setReports(data.reports);
      setLogs(data.logs);
    } catch (err) {
      if (err.response?.status === 403) {
        alert('Access denied. Please log in again.');
        // Redirect to login would be handled by parent
      } else {
        console.error('Failed to fetch admin data:', err);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleReportAction = async (reportId, action) => {
    try {
      await axios.post(`${apiBaseUrl}/admin/reports/${reportId}/${action}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchOverview(); // Refresh data
    } catch (err) {
      console.error(`Failed to ${action} report:`, err);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screenContainer}>
      <ScrollView>
        <Text style={styles.sectionTitle}>Admin Dashboard</Text>

        {/* Stats Grid */}
        <View style={styles.statsGrid}>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{overview.users}</Text>
            <Text style={styles.statLabel}>Total Users</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{overview.listings}</Text>
            <Text style={styles.statLabel}>Active Listings</Text>
          </View>
          <View style={styles.statBox}>
            <Text style={styles.statNumber}>{overview.reports}</Text>
            <Text style={styles.statLabel}>Pending Reports</Text>
          </View>
        </View>

        {/* Report List */}
        <Text style={styles.sectionTitle}>Pending Reports</Text>
        {reports.map((report) => (
          <View key={report._id} style={styles.itemCard}>
            <Text style={styles.itemName}>{report.title}</Text>
            <Text style={styles.itemMeta}>{report.description}</Text>
            <View style={styles.reportActions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.acceptButton]}
                onPress={() => handleReportAction(report._id, 'accept')}
              >
                <Text style={styles.actionButtonText}>Accept</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionButton, styles.rejectButton]}
                onPress={() => handleReportAction(report._id, 'reject')}
              >
                <Text style={styles.actionButtonText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        ))}

        {/* System Logs */}
        <Text style={styles.sectionTitle}>Audit Trail</Text>
        <ScrollView style={styles.logsContainer}>
          {logs.map((log, index) => (
            <Text key={index} style={styles.logEntry}>{log.message}</Text>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

function AuthScreen({ onSignIn }) {
  const [authMode, setAuthMode] = useState('login');
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    schoolId: '',
    schoolMail: '',
    phone: '',
    password: '',
    confirmPassword: '',
    identifier: '',
  });
  const [verificationMode, setVerificationMode] = useState('admin');
  const [modalVisible, setModalVisible] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const setField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

  const handleRegister = async () => {
    if (!form.firstName || !form.lastName || !form.schoolId || !form.schoolMail || !form.phone || !form.password) {
      setMessage('Please fill all required fields.');
      return;
    }
    if (form.password !== form.confirmPassword) {
      setMessage('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${apiBaseUrl}/auth/register`, {
        firstName: form.firstName,
        lastName: form.lastName,
        schoolId: form.schoolId,
        schoolMail: form.schoolMail,
        phone: form.phone,
        password: form.password,
        verificationMode,
      });
      setVerificationPending(true);
      setMessage(data.message || 'Verification required.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!form.identifier || !form.password) {
      setMessage('Enter school email or phone and password.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${apiBaseUrl}/auth/login`, {
        identifier: form.identifier,
        password: form.password,
      });
      onSignIn(data.token, data.user);
    } catch (err) {
      const response = err.response?.data;
      if (response?.needsVerification) {
        setVerificationPending(true);
        setMessage('Account not verified. Enter the code sent to your chosen channel.');
      } else {
        setMessage(response?.message || 'Login failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const requestVerification = async () => {
    const identifier = authMode === 'login' ? form.identifier : form.schoolMail;
    if (!identifier) {
      setMessage('Enter your email or phone before requesting verification.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${apiBaseUrl}/auth/request-verification`, {
        identifier,
        mode: verificationMode,
      });
      setVerificationPending(true);
      setMessage(data.message);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to request verification');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmCode = async () => {
    const identifier = authMode === 'login' ? form.identifier : form.schoolMail;
    if (!identifier || !verificationCode) {
      setMessage('Provide both identifier and verification code.');
      return;
    }

    setLoading(true);
    try {
      const { data } = await axios.post(`${apiBaseUrl}/auth/confirm-verification`, {
        identifier,
        code: verificationCode,
      });
      onSignIn(data.token, data.user);
      setVerificationPending(false);
      setMessage('Verified successfully.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const renderRegister = () => (
    <>
      <TextInput style={styles.input} placeholder="First Name" value={form.firstName} onChangeText={(text) => setField('firstName', text)} />
      <TextInput style={styles.input} placeholder="Last Name" value={form.lastName} onChangeText={(text) => setField('lastName', text)} />
      <TextInput style={styles.input} placeholder="School ID" value={form.schoolId} onChangeText={(text) => setField('schoolId', text)} />
      <TextInput style={styles.input} placeholder="School Mail" keyboardType="email-address" value={form.schoolMail} onChangeText={(text) => setField('schoolMail', text)} />
      <TextInput style={styles.input} placeholder="Phone Number" keyboardType="phone-pad" value={form.phone} onChangeText={(text) => setField('phone', text)} />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={form.password}
          onChangeText={(text) => setField('password', text)}
        />
        <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.passwordToggle}>
          <Text style={styles.passwordToggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Confirm Password"
          secureTextEntry={!showConfirmPassword}
          value={form.confirmPassword}
          onChangeText={(text) => setField('confirmPassword', text)}
        />
        <TouchableOpacity onPress={() => setShowConfirmPassword((prev) => !prev)} style={styles.passwordToggle}>
          <Text style={styles.passwordToggleText}>{showConfirmPassword ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.modeButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.modeButtonText}>Verification mode: {verificationMode.toUpperCase()}</Text>
      </TouchableOpacity>
      <Button title="Register" onPress={handleRegister} disabled={loading} />
    </>
  );

  const renderLogin = () => (
    <>
      <TextInput style={styles.input} placeholder="School Mail or Phone" value={form.identifier} onChangeText={(text) => setField('identifier', text)} />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Password"
          secureTextEntry={!showPassword}
          value={form.password}
          onChangeText={(text) => setField('password', text)}
        />
        <TouchableOpacity onPress={() => setShowPassword((prev) => !prev)} style={styles.passwordToggle}>
          <Text style={styles.passwordToggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
        </TouchableOpacity>
      </View>
      <Button title="Login" onPress={handleLogin} disabled={loading} />
      <TouchableOpacity onPress={requestVerification} style={styles.ghostButton}>
        <Text style={styles.ghostButtonText}>Send Verification Code</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <SafeAreaView style={styles.authContainer}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.authWrapper}>
        <ScrollView style={styles.authBox} contentContainerStyle={styles.authContent}>
          <Text style={styles.authTitle}>Regent Nexus</Text>
          <View style={styles.authToggleRow}>
            {['login', 'register'].map((mode) => (
              <TouchableOpacity
                key={mode}
                style={[styles.authToggle, authMode === mode && styles.authToggleActive]}
                onPress={() => {
                  setAuthMode(mode);
                  setMessage('');
                  setVerificationPending(false);
                }}
              >
                <Text style={[styles.authToggleText, authMode === mode && styles.authToggleTextActive]}>{mode === 'login' ? 'Login' : 'Register'}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {verificationPending ? (
            <>
              <Text style={styles.sectionTitle}>Enter verification code</Text>
              <View style={styles.verificationBox}>
                <Text style={styles.verificationText}>A code has been sent to your chosen address.</Text>
                <TextInput style={styles.input} placeholder="6-digit code" keyboardType="number-pad" value={verificationCode} onChangeText={setVerificationCode} />
                <Button title="Verify Account" onPress={handleConfirmCode} disabled={loading} />
              </View>
            </>
          ) : authMode === 'login' ? (
            renderLogin()
          ) : (
            renderRegister()
          )}

          {message ? <Text style={styles.messageText}>{message}</Text> : null}
          {loading ? <ActivityIndicator style={styles.loader} /> : null}
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Choose verification mode</Text>
            {verificationModes.map((mode) => (
              <TouchableOpacity key={mode} style={styles.modalOption} onPress={() => { setVerificationMode(mode); setModalVisible(false); }}>
                <Text style={styles.modalText}>{mode.toUpperCase()}</Text>
              </TouchableOpacity>
            ))}
            <Button title="Close" onPress={() => setModalVisible(false)} />
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function HomeScreen({ token }) {
  const [listings, setListings] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedListing, setSelectedListing] = useState(null);
  const sheetRef = useRef(null);
  const snapPoints = useMemo(() => ['25%', '55%'], []);
  const [loading, setLoading] = useState(false);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const query = search ? `?q=${encodeURIComponent(search)}` : '';
      const { data } = await axios.get(`${apiBaseUrl}/listings${query}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setListings(data);
    } catch (err) {
      console.warn('Fetch listings failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const openSheet = (item) => {
    setSelectedListing(item);
    sheetRef.current?.expand();
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <Text style={styles.sectionTitle}>Marketplace</Text>
      <TextInput
        style={styles.input}
        placeholder="Search items or services"
        value={search}
        onChangeText={setSearch}
        onSubmitEditing={fetchListings}
      />
      <Button title="Search" onPress={fetchListings} />
      {loading ? <ActivityIndicator style={styles.loader} /> : null}
      <ScrollView contentContainerStyle={styles.listingContainer}>
        {listings.map((item) => (
          <TouchableOpacity key={item._id} style={styles.itemCard} onPress={() => openSheet(item)}>
            <Text style={styles.itemName}>{item.title}</Text>
            <Text style={styles.itemMeta}>{item.category} • {item.type}</Text>
            <Text style={styles.itemMeta}>${item.price.toFixed(2)}</Text>
            <Text numberOfLines={2} style={styles.itemNote}>{item.note || 'No note provided'}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <BottomSheet ref={sheetRef} index={-1} snapPoints={snapPoints} enablePanDownToClose>
        {selectedListing ? (
          <View style={styles.sheetContent}>
            <Text style={styles.sectionTitle}>{selectedListing.title}</Text>
            <Text>Owner: {selectedListing.owner?.firstName} {selectedListing.owner?.lastName}</Text>
            <Text>Category: {selectedListing.category}</Text>
            <Text>Type: {selectedListing.type}</Text>
            <Text>Price: ${selectedListing.price.toFixed(2)}</Text>
            <Text style={styles.itemNote}>{selectedListing.note}</Text>
          </View>
        ) : (
          <Text style={styles.sheetContent}>Select a listing to view details.</Text>
        )}
      </BottomSheet>
    </SafeAreaView>
  );
}

function ListingsScreen({ token }) {
  const [listings, setListings] = useState([]);
  const [form, setForm] = useState({ title: '', description: '', category: '', type: 'item', note: '', price: '' });
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const fetchListings = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${apiBaseUrl}/listings?mine=true`, { headers: { Authorization: `Bearer ${token}` } });
      setListings(data);
    } catch (err) {
      console.warn('Fetch my listings failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handlePublish = async () => {
    if (!form.title || !form.description || !form.price) {
      setMessage('Title, description and price are required.');
      return;
    }
    setLoading(true);
    try {
      await axios.post(
        `${apiBaseUrl}/listings`,
        { ...form, price: parseFloat(form.price) || 0 },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setMessage('Listing published successfully.');
      setForm({ title: '', description: '', category: '', type: 'item', note: '', price: '' });
      fetchListings();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to publish listing');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id) => {
    setLoading(true);
    try {
      await axios.delete(`${apiBaseUrl}/listings/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage('Listing removed.');
      fetchListings();
    } catch (err) {
      setMessage(err.response?.data?.message || 'Unable to remove listing');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screenContainer}>
      <Text style={styles.sectionTitle}>Create Listing</Text>
      <ScrollView style={styles.formCard}>
        <TextInput style={styles.input} placeholder="Title" value={form.title} onChangeText={(text) => setForm((prev) => ({ ...prev, title: text }))} />
        <TextInput style={styles.input} placeholder="Description" value={form.description} onChangeText={(text) => setForm((prev) => ({ ...prev, description: text }))} />
        <TextInput style={styles.input} placeholder="Category" value={form.category} onChangeText={(text) => setForm((prev) => ({ ...prev, category: text }))} />
        <TextInput style={styles.input} placeholder="Note" value={form.note} onChangeText={(text) => setForm((prev) => ({ ...prev, note: text }))} />
        <TextInput style={styles.input} placeholder="Price" keyboardType="numeric" value={form.price} onChangeText={(text) => setForm((prev) => ({ ...prev, price: text }))} />
        <View style={styles.typeRow}>
          {['item', 'service'].map((type) => (
            <TouchableOpacity key={type} style={[styles.typeButton, form.type === type && styles.typeButtonActive]} onPress={() => setForm((prev) => ({ ...prev, type }))}>
              <Text style={[styles.typeText, form.type === type && styles.typeTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Button title="Publish Listing" onPress={handlePublish} disabled={loading} />
        {message ? <Text style={styles.messageText}>{message}</Text> : null}
        {loading ? <ActivityIndicator style={styles.loader} /> : null}
      </ScrollView>
      <Text style={styles.sectionTitle}>My Listings</Text>
      <ScrollView contentContainerStyle={styles.listingContainer}>
        {listings.map((item) => (
          <View key={item._id} style={styles.itemCard}>
            <Text style={styles.itemName}>{item.title}</Text>
            <Text style={styles.itemMeta}>{item.category} • {item.type}</Text>
            <Text style={styles.itemMeta}>${item.price.toFixed(2)}</Text>
            <Button title="Remove" onPress={() => handleRemove(item._id)} />
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function TransactionsScreen({ token }) {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${apiBaseUrl}/transactions`, { headers: { Authorization: `Bearer ${token}` } });
      setTransactions(data);
    } catch (err) {
      console.warn('Fetch transactions failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <SafeAreaView style={styles.screenContainer}>
      <Text style={styles.sectionTitle}>Transaction History</Text>
      {loading ? <ActivityIndicator style={styles.loader} /> : null}
      <ScrollView contentContainerStyle={styles.listingContainer}>
        {transactions.map((tx) => (
          <View key={tx._id} style={styles.itemCard}>
            <Text style={styles.itemName}>${tx.amount.toFixed(2)}</Text>
            <Text style={styles.itemMeta}>Status: {tx.status}</Text>
            <Text style={styles.itemMeta}>Seller: {tx.seller?.firstName} {tx.seller?.lastName}</Text>
            <Text style={styles.itemNote}>{tx.listing?.title || 'Listing details unavailable'}</Text>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

function ProfileScreen({ user, onSignOut }) {
  return (
    <SafeAreaView style={styles.screenContainer}>
      <Text style={styles.sectionTitle}>Profile</Text>
      <Text style={styles.profileText}>Name: {user.firstName} {user.lastName}</Text>
      <Text style={styles.profileText}>School ID: {user.schoolId}</Text>
      <Text style={styles.profileText}>Email: {user.schoolMail}</Text>
      <Text style={styles.profileText}>Phone: {user.phone}</Text>
      <Text style={styles.profileText}>Role: {user.role}</Text>
      <Text style={styles.profileText}>Verified: {user.verified ? 'Yes' : 'No'}</Text>
      <Button title="Sign Out" onPress={onSignOut} />
    </SafeAreaView>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentScreen, setCurrentScreen] = useState('Home');

  useEffect(() => {
    (async () => {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    })();
  }, []);

  const handleSignIn = async (newToken, newUser) => {
    await AsyncStorage.setItem('token', newToken);
    await AsyncStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const handleSignOut = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <SafeAreaProvider>
      {loading ? (
        <SafeAreaView style={styles.centered}>
          <ActivityIndicator />
        </SafeAreaView>
      ) : !user ? (
        <AuthScreen onSignIn={handleSignIn} />
      ) : (
        <View style={{ flex: 1 }}>
          <MainContent token={token} user={user} onSignOut={handleSignOut} currentScreen={currentScreen} />
          <BottomNavigation token={token} user={user} onNavigate={setCurrentScreen} />
        </View>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  authContainer: { flex: 1, backgroundColor: '#eef2f7' },
  authWrapper: { flex: 1 },
  authBox: { flex: 1, padding: 22, backgroundColor: '#fff', margin: 32, borderRadius: 28, borderWidth: 1, borderColor: '#e5e7eb', shadowColor: '#000', shadowOpacity: 0.06, shadowRadius: 20, elevation: 4 },
  authContent: { paddingBottom: 40 },
  authTitle: { fontSize: 30, fontWeight: '800', textAlign: 'center', marginBottom: 20, color: '#1d4ed8' },
  authToggleRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 20 },
  authToggle: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, backgroundColor: '#f8fafc', marginHorizontal: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  authToggleActive: { backgroundColor: '#2e78b7', borderColor: '#2e78b7' },
  authToggleText: { fontSize: 16, color: '#475569' },
  authToggleTextActive: { color: '#fff', fontWeight: '700' },
  modeButton: { paddingVertical: 14, alignItems: 'center', backgroundColor: '#eef2ff', borderRadius: 20, marginBottom: 16, borderWidth: 1, borderColor: '#c7d2fe' },
  modeButtonText: { color: '#4338ca', fontWeight: '700' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f8fafc', borderRadius: 16, borderColor: '#e2e8f0', borderWidth: 1, marginBottom: 12 },
  passwordInput: { flex: 1, padding: 14, color: '#0f172a' },
  passwordToggle: { paddingHorizontal: 16, justifyContent: 'center' },
  passwordToggleText: { color: '#475569', fontWeight: '700' },
  verificationBox: { backgroundColor: '#f8fafc', borderRadius: 20, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  verificationText: { fontSize: 14, color: '#475569', marginBottom: 12 },
  authCategory: { backgroundColor: '#f1f5f9', borderRadius: 24, padding: 16, marginBottom: 18 },
  authCategoryText: { color: '#334155', fontSize: 14, marginBottom: 8 },

  screenContainer: { flex: 1, backgroundColor: '#f8f8f8', padding: 12 },
  sectionTitle: { fontSize: 22, fontWeight: '700', marginVertical: 8 },
  input: { backgroundColor: '#fff', borderRadius: 12, borderColor: '#dfe3ea', borderWidth: 1, padding: 12, marginBottom: 10 },
  itemCard: { backgroundColor: '#fff', borderRadius: 12, marginBottom: 10, padding: 14, borderWidth: 1, borderColor: '#dde4eb' },
  itemName: { fontSize: 17, fontWeight: '700' },
  itemMeta: { color: '#555', marginTop: 4 },
  itemNote: { color: '#444', marginTop: 8 },
  sheetContent: { padding: 16 },
  chatList: { flex: 1, marginBottom: 8 },
  chatBubble: { backgroundColor: '#e2efff', marginVertical: 4, padding: 10, borderRadius: 10 },
  chatUser: { fontWeight: '700', marginBottom: 2 },
  chatInputContainer: { flexDirection: 'row', alignItems: 'center' },
  chatInput: { flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginRight: 8, backgroundColor: '#fff' },
  listingContainer: { paddingBottom: 20 },
  formCard: { marginBottom: 16 },
  typeRow: { flexDirection: 'row', marginBottom: 10 },
  typeButton: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#fff', borderWidth: 1, borderColor: '#ccc', marginRight: 8, alignItems: 'center' },
  typeButtonActive: { borderColor: '#2e78b7', backgroundColor: '#dce8f8' },
  typeText: { color: '#333', fontWeight: '600' },
  typeTextActive: { color: '#1a3f79' },
  messageText: { color: '#b02a37', marginTop: 10 },
  loader: { marginTop: 12 },
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', padding: 20 },
  modalContent: { backgroundColor: '#fff', borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, fontWeight: '700', marginBottom: 14 },
  modalOption: { paddingVertical: 14, borderBottomColor: '#eee', borderBottomWidth: 1 },
  modalText: { fontSize: 16 },
  ghostButton: { marginTop: 12, alignItems: 'center' },
  ghostButtonText: { color: '#2e78b7', fontWeight: '700' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  bottomSheetContent: { padding: 20 },
  bottomSheetTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  navigationGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-around' },
  navItem: { alignItems: 'center', margin: 10, padding: 10, backgroundColor: '#f0f0f0', borderRadius: 10, width: 80 },
  navIcon: { fontSize: 24, marginBottom: 5 },
  navText: { fontSize: 12, textAlign: 'center' },
  statsGrid: { flexDirection: 'row', justifyContent: 'space-around', marginBottom: 20 },
  statBox: { backgroundColor: '#fff', borderRadius: 10, padding: 20, alignItems: 'center', shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 5, elevation: 3, width: '30%' },
  statNumber: { fontSize: 24, fontWeight: 'bold', color: '#2e78b7' },
  statLabel: { fontSize: 12, color: '#666', marginTop: 5 },
  reportActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  actionButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 5, flex: 1, marginHorizontal: 5 },
  acceptButton: { backgroundColor: '#4CAF50' },
  rejectButton: { backgroundColor: '#f44336' },
  actionButtonText: { color: '#fff', textAlign: 'center', fontWeight: 'bold' },
  logsContainer: { maxHeight: 200 },
  logEntry: { fontSize: 12, color: '#666', marginBottom: 5 },
});
