import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { api } from './services/api';

const formatAmount = (value) => `${Number(value || 0).toLocaleString()} DZD`;

export default function CollectionAgentApp({ onBack }) {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [session, setSession] = useState(null);
  const [dealers, setDealers] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedDealer, setSelectedDealer] = useState(null);
  const [dealerSearch, setDealerSearch] = useState('');
  const [amount, setAmount] = useState('');
  const [confirmation, setConfirmation] = useState(null);
  const [customerCodeVisible, setCustomerCodeVisible] = useState(false);
  const [confirmationCode, setConfirmationCode] = useState('');
  const [loading, setLoading] = useState(false);

  const filteredDealers = useMemo(() => {
    const query = dealerSearch.trim().toLowerCase();
    if (!query) return dealers;
    return dealers.filter((dealer) =>
      [dealer.full_name, dealer.business_name, dealer.phone, dealer.wilaya]
        .some((value) => String(value || '').toLowerCase().includes(query))
    );
  }, [dealers, dealerSearch]);

  const refreshData = async (token = session?.token) => {
    if (!token) return;
    const [dealerRes, historyRes] = await Promise.all([
      api.collectionDealers(token),
      api.collectionHistory(token)
    ]);
    if (!dealerRes.success) throw new Error(dealerRes.error || 'Could not load dealer list.');
    if (!historyRes.success) throw new Error(historyRes.error || 'Could not load collection history.');
    setDealers(dealerRes.dealers || []);
    setHistory(historyRes.transactions || []);
    if (selectedDealer) {
      const currentDealer = (dealerRes.dealers || []).find((item) => item.id === selectedDealer.id);
      setSelectedDealer(currentDealer || null);
    }
  };

  useEffect(() => {
    if (!session?.token) return undefined;
    refreshData().catch((error) => Alert.alert('Unable to refresh', error.message));
    const timer = setInterval(() => {
      refreshData().catch((error) => console.warn('Collection app refresh failed:', error.message));
    }, 30000);
    return () => clearInterval(timer);
  }, [session?.token, selectedDealer?.id]);

  const handleLogin = async () => {
    if (!credentials.username.trim() || !credentials.password) {
      Alert.alert('Sign in', 'Enter your username and password.');
      return;
    }
    setLoading(true);
    try {
      const result = await api.login(credentials);
      if (!result.success) {
        Alert.alert('Sign in failed', result.error || 'Please check your credentials.');
      } else if (result.user?.role !== 'collection_agent') {
        Alert.alert('Account type', 'This mobile app is for collection agent accounts.');
      } else {
        setSession({ token: result.token, user: result.user });
      }
    } catch (error) {
      Alert.alert('Connection error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const startCollection = async () => {
    const paymentAmount = Number(amount);
    if (!selectedDealer) {
      Alert.alert('Select a shop', 'Choose the dealer or shopkeeper paying cash.');
      return;
    }
    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      Alert.alert('Invalid amount', 'Enter the amount of cash received.');
      return;
    }

    setLoading(true);
    try {
      const result = await api.createCollection({ dealer_id: selectedDealer.id, amount: paymentAmount }, session.token);
      if (!result.success) {
        Alert.alert('Collection not started', result.error || 'Please try again.');
        return;
      }
      setConfirmation(result.collection);
      setCustomerCodeVisible(true);
      setConfirmationCode('');
      Alert.alert(
        'Customer confirmation',
        `Hand the phone to ${selectedDealer.full_name} to review the amount and confirmation code.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Connection error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const confirmCollection = async () => {
    if (!confirmation || !/^\d{6}$/.test(confirmationCode)) {
      Alert.alert('Confirmation code', 'Enter the six-digit code provided by the shopkeeper.');
      return;
    }
    setLoading(true);
    try {
      const result = await api.confirmCollection({
        collection_id: confirmation.id,
        confirmation_code: confirmationCode
      }, session.token);
      if (!result.success) {
        Alert.alert('Could not confirm payment', result.error || 'Check the code and try again.');
        return;
      }
      Alert.alert('Payment recorded', `${formatAmount(result.amount)} collected. Remaining debt: ${formatAmount(result.outstanding_debt)}.`);
      setConfirmation(null);
      setCustomerCodeVisible(false);
      setConfirmationCode('');
      setAmount('');
      await refreshData();
    } catch (error) {
      Alert.alert('Connection error', error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!session) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#006b36" />
        <KeyboardAvoidingView style={styles.fill} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <Text style={styles.brand}>Razik Telecom</Text>
            <Text style={styles.subtitle}>Cash Collection Agent</Text>
          </View>
          <View style={styles.loginCard}>
            <Text style={styles.title}>Agent sign in</Text>
            <Text style={styles.label}>Username or phone</Text>
            <TextInput
              style={styles.input}
              autoCapitalize="none"
              value={credentials.username}
              onChangeText={(username) => setCredentials((current) => ({ ...current, username }))}
              placeholder="Your agent username"
              editable={!loading}
            />
            <Text style={styles.label}>Password</Text>
            <TextInput
              style={styles.input}
              secureTextEntry
              value={credentials.password}
              onChangeText={(password) => setCredentials((current) => ({ ...current, password }))}
              placeholder="Password"
              editable={!loading}
              onSubmitEditing={handleLogin}
            />
            <TouchableOpacity style={styles.primaryButton} onPress={handleLogin} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Sign in</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backText}>Back to dealer app</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#006b36" />
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.brand}>Cash Collection</Text>
            <Text style={styles.subtitle}>Signed in as {session.user.full_name}</Text>
          </View>
          <TouchableOpacity onPress={() => setSession(null)} style={styles.logoutButton}>
            <Text style={styles.logoutText}>Sign out</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>Collect dealer payment</Text>
          <Text style={styles.label}>Find dealer / shopkeeper</Text>
          <TextInput
            style={styles.input}
            value={selectedDealer ? `${selectedDealer.full_name}${selectedDealer.business_name ? ` · ${selectedDealer.business_name}` : ''}` : dealerSearch}
            onChangeText={(text) => {
              setSelectedDealer(null);
              setDealerSearch(text);
            }}
            placeholder="Search name, shop, phone or wilaya"
          />
          {!selectedDealer && (
            <View style={styles.dealerList}>
              {filteredDealers.slice(0, 6).map((dealer) => (
                <TouchableOpacity
                  key={dealer.id}
                  style={styles.dealerOption}
                  onPress={() => {
                    setSelectedDealer(dealer);
                    setDealerSearch('');
                    setAmount(dealer.outstanding_debt > 0 ? String(dealer.outstanding_debt) : '');
                  }}
                >
                  <Text style={styles.dealerName}>{dealer.full_name}</Text>
                  <Text style={styles.dealerMeta}>{dealer.business_name || dealer.phone}</Text>
                </TouchableOpacity>
              ))}
              {filteredDealers.length === 0 && <Text style={styles.emptyText}>No active dealers found.</Text>}
            </View>
          )}

          {selectedDealer && (
            <View style={styles.balancePanel}>
              <TouchableOpacity
                onPress={() => {
                  setSelectedDealer(null);
                  setAmount('');
                  setConfirmation(null);
                }}
              >
                <Text style={styles.changeDealer}>Change selected shop</Text>
              </TouchableOpacity>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Wallet balance</Text>
                <Text style={styles.balanceValue}>{formatAmount(selectedDealer.wallet_balance)}</Text>
              </View>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Credit limit</Text>
                <Text style={styles.balanceValue}>{formatAmount(selectedDealer.credit_limit)}</Text>
              </View>
              <View style={[styles.balanceRow, styles.debtRow]}>
                <Text style={styles.debtLabel}>Outstanding vendor debt</Text>
                <Text style={styles.debtValue}>{formatAmount(selectedDealer.outstanding_debt)}</Text>
              </View>
            </View>
          )}

          {!confirmation && selectedDealer && (
            <>
              <Text style={styles.label}>Cash received (DZD)</Text>
              <TextInput
                style={styles.input}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                placeholder="Enter full or partial amount"
              />
              <Text style={styles.hint}>Payment cannot exceed the shop's outstanding debt.</Text>
              <TouchableOpacity style={styles.primaryButton} onPress={startCollection} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Create customer confirmation code</Text>}
              </TouchableOpacity>
            </>
          )}

          {confirmation && (
            <View style={styles.confirmPanel}>
              {customerCodeVisible ? (
                <>
                  <Text style={styles.confirmTitle}>Shopkeeper: review your cash payment</Text>
                  <Text style={styles.dealerName}>{confirmation.dealer_name}{confirmation.business_name ? ` · ${confirmation.business_name}` : ''}</Text>
                  <Text style={styles.customerAmount}>{formatAmount(confirmation.amount)}</Text>
                  <Text style={styles.hint}>If this amount is correct, share this one-time code with the collection agent. It expires in 10 minutes.</Text>
                  <Text style={styles.code}>{confirmation.confirmation_code}</Text>
                  <TouchableOpacity style={styles.primaryButton} onPress={() => setCustomerCodeVisible(false)}>
                    <Text style={styles.primaryButtonText}>I have shared the code with the agent</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.confirmTitle}>Enter the six-digit code from the shopkeeper</Text>
                  <Text style={styles.hint}>{formatAmount(confirmation.amount)} · {confirmation.transaction_ref}</Text>
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    value={confirmationCode}
                    onChangeText={(value) => setConfirmationCode(value.replace(/\D/g, '').slice(0, 6))}
                    keyboardType="number-pad"
                    maxLength={6}
                    placeholder="000000"
                  />
                  <TouchableOpacity style={styles.primaryButton} onPress={confirmCollection} disabled={loading}>
                    {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.primaryButtonText}>Confirm cash payment</Text>}
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.cancelButton} onPress={() => { setConfirmation(null); setCustomerCodeVisible(false); setConfirmationCode(''); }}>
                    <Text style={styles.cancelText}>Cancel this collection</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.historyHeader}>
            <Text style={styles.title}>Recent confirmed collections</Text>
            <TouchableOpacity onPress={() => refreshData().catch((error) => Alert.alert('Unable to refresh', error.message))}>
              <Text style={styles.changeDealer}>Refresh</Text>
            </TouchableOpacity>
          </View>
          {history.length === 0 ? (
            <Text style={styles.emptyText}>No confirmed collections yet.</Text>
          ) : history.slice(0, 10).map((item) => (
            <View key={item.id} style={styles.historyRow}>
              <View style={styles.historyDetails}>
                <Text style={styles.dealerName}>{item.dealer_name}{item.business_name ? ` · ${item.business_name}` : ''}</Text>
                <Text style={styles.dealerMeta}>{item.transaction_ref} · {item.confirmed_at || item.created_at}</Text>
              </View>
              <Text style={styles.historyAmount}>{formatAmount(item.amount)}</Text>
            </View>
          ))}
        </View>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Text style={styles.backText}>Back to dealer app</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  container: { flex: 1, backgroundColor: '#f1f5f9' },
  header: { backgroundColor: '#008a3e', padding: 20, borderBottomLeftRadius: 24, borderBottomRightRadius: 24 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  brand: { color: '#fff', fontSize: 21, fontWeight: '900' },
  subtitle: { color: '#d1fae5', marginTop: 4, fontSize: 13 },
  content: { padding: 16, paddingBottom: 36 },
  loginCard: { margin: 16, marginTop: 28, padding: 20, borderRadius: 18, backgroundColor: '#fff' },
  card: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 16, elevation: 2 },
  title: { color: '#0f172a', fontSize: 17, fontWeight: '800', marginBottom: 14 },
  label: { color: '#475569', fontWeight: '700', fontSize: 12, marginTop: 12, marginBottom: 6 },
  input: { borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11, backgroundColor: '#f8fafc', color: '#0f172a', fontSize: 15 },
  primaryButton: { backgroundColor: '#008a3e', borderRadius: 12, padding: 14, alignItems: 'center', marginTop: 16, minHeight: 48, justifyContent: 'center' },
  primaryButtonText: { color: '#fff', fontSize: 14, fontWeight: '800', textAlign: 'center' },
  backButton: { alignItems: 'center', padding: 13 },
  backText: { color: '#475569', fontWeight: '700' },
  dealerList: { borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, marginTop: 5, maxHeight: 240 },
  dealerOption: { padding: 12, borderBottomWidth: 1, borderBottomColor: '#e2e8f0' },
  dealerName: { color: '#0f172a', fontWeight: '800', fontSize: 13 },
  dealerMeta: { color: '#64748b', fontSize: 11, marginTop: 4 },
  emptyText: { color: '#64748b', fontSize: 13, paddingVertical: 10 },
  balancePanel: { backgroundColor: '#f8fafc', borderWidth: 1, borderColor: '#e2e8f0', borderRadius: 12, padding: 12, marginTop: 12 },
  balanceRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 7 },
  balanceLabel: { color: '#475569', fontSize: 12 },
  balanceValue: { color: '#0f172a', fontWeight: '700', fontSize: 12 },
  debtRow: { borderTopWidth: 1, borderTopColor: '#cbd5e1', marginTop: 5, paddingTop: 10 },
  debtLabel: { color: '#b42318', fontSize: 12, fontWeight: '800' },
  debtValue: { color: '#b42318', fontWeight: '900', fontSize: 14 },
  changeDealer: { color: '#007a37', fontWeight: '800', fontSize: 12 },
  hint: { color: '#64748b', fontSize: 11, marginTop: 7, lineHeight: 16 },
  confirmPanel: { backgroundColor: '#f0fdf4', borderColor: '#86efac', borderWidth: 1, borderRadius: 14, padding: 14, marginTop: 16 },
  confirmTitle: { textAlign: 'center', color: '#166534', fontWeight: '800', fontSize: 14 },
  customerAmount: { textAlign: 'center', color: '#14532d', fontSize: 24, fontWeight: '900', marginTop: 10 },
  code: { textAlign: 'center', color: '#14532d', fontSize: 34, fontWeight: '900', letterSpacing: 8, marginVertical: 12 },
  codeInput: { fontSize: 22, textAlign: 'center', letterSpacing: 8 },
  cancelButton: { alignItems: 'center', padding: 12, marginTop: 4 },
  cancelText: { color: '#b42318', fontWeight: '700' },
  historyHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  historyRow: { borderTopWidth: 1, borderTopColor: '#e2e8f0', paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
  historyDetails: { flex: 1 },
  historyAmount: { color: '#007a37', fontWeight: '900', fontSize: 13 },
  logoutButton: { borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.18)', paddingHorizontal: 12, paddingVertical: 9 },
  logoutText: { color: '#fff', fontWeight: '700', fontSize: 12 }
});
