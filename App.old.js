import 'react-native-gesture-handler';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Button,
  KeyboardAvoidingView,
  Modal,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import BottomSheet from '@gorhom/bottom-sheet';
import io from 'socket.io-client';
import axios from 'axios';

const apiBaseUrl = 'http://localhost:4000/api';
const socketServer = 'http://localhost:4000';
const verificationModes = ['email', 'sms', 'admin'];

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
  const [verificationMode, setVerificationMode] = useState('email');
  const [modalVisible, setModalVisible] = useState(false);
  const [verificationPending, setVerificationPending] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
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
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={form.password} onChangeText={(text) => setField('password', text)} />
      <TextInput style={styles.input} placeholder="Confirm Password" secureTextEntry value={form.confirmPassword} onChangeText={(text) => setField('confirmPassword', text)} />
      <TouchableOpacity style={styles.switchButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.switchButtonText}>Verification mode: {verificationMode.toUpperCase()}</Text>
      </TouchableOpacity>
      <Button title="Register" onPress={handleRegister} disabled={loading} />
    </>
  );

  const renderLogin = () => (
    <>
      <TextInput style={styles.input} placeholder="School Mail or Phone" value={form.identifier} onChangeText={(text) => setField('identifier', text)} />
      <TextInput style={styles.input} placeholder="Password" secureTextEntry value={form.password} onChangeText={(text) => setField('password', text)} />
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
              <TextInput style={styles.input} placeholder="6-digit code" keyboardType="number-pad" value={verificationCode} onChangeText={setVerificationCode} />
              <Button title="Verify Account" onPress={handleConfirmCode} disabled={loading} />
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

function AdminDashboardScreen({ token }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`${apiBaseUrl}/admin/dashboard`, { headers: { Authorization: `Bearer ${token}` } });
      setData(data);
    } catch (err) {
      console.warn('Admin dashboard failed', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  return (
    <SafeAreaView style={styles.screenContainer}>
      <Text style={styles.sectionTitle}>Admin Dashboard</Text>
      {loading ? <ActivityIndicator style={styles.loader} /> : null}
      {data ? (
        <View>
          <Text style={styles.profileText}>Students: {data.userCount}</Text>
          <Text style={styles.profileText}>Listings: {data.listingCount}</Text>
          <Text style={styles.profileText}>Pending Reports: {data.pendingReports}</Text>
          <Text style={styles.profileText}>Transactions: {data.transactionCount}</Text>
          <Text style={styles.sectionTitle}>Recent Audit Logs</Text>
          {data.logs.map((log) => (
            <View key={log._id} style={styles.itemCard}>
              <Text>{log.action}</Text>
              <Text style={styles.itemMeta}>{log.details}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text style={styles.itemMeta}>Loading admin data...</Text>
      )}
    </SafeAreaView>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) {
    return (
      <SafeAreaView style={styles.centered}>
        <ActivityIndicator />
      </SafeAreaView>
    );
  }

  if (!user) {
    return <AuthScreen onSignIn={handleSignIn} />;
  }

  return (
    <NavigationContainer>
      <Tab.Navigator screenOptions={{ headerShown: false }}>
        <Tab.Screen name="Home">{() => <HomeScreen token={token} />}</Tab.Screen>
        <Tab.Screen name="Listings">{() => <ListingsScreen token={token} />}</Tab.Screen>
        <Tab.Screen name="Transactions">{() => <TransactionsScreen token={token} />}</Tab.Screen>
        <Tab.Screen name="Profile">{() => <ProfileScreen user={user} onSignOut={handleSignOut} />}</Tab.Screen>
        <Tab.Screen name="Messages">{() => <MessageScreen token={token} />}</Tab.Screen>
        {user.role === 'admin' ? <Tab.Screen name="Admin">{() => <AdminDashboardScreen token={token} />}</Tab.Screen> : null}
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  authContainer: { flex: 1, backgroundColor: '#eef2f7' },
  authWrapper: { flex: 1 },
  authBox: { flex: 1, padding: 20 },
  authContent: { paddingBottom: 40 },
  authTitle: { fontSize: 28, fontWeight: '800', textAlign: 'center', marginBottom: 18 },
  authToggleRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: 18 },
  authToggle: { paddingVertical: 10, paddingHorizontal: 18, borderRadius: 999, backgroundColor: '#fff', marginHorizontal: 6 },
  authToggleActive: { backgroundColor: '#2e78b7' },
  authToggleText: { fontSize: 16, color: '#333' },
  authToggleTextActive: { color: '#fff', fontWeight: '700' },
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
});
