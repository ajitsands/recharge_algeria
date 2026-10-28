import React, { useState } from 'react';
import { 
  StyleSheet, Text, View, TextInput, TouchableOpacity, 
  ScrollView, SafeAreaView, StatusBar, Alert 
} from 'react-native';
import { COLORS } from './src/constants/theme';
import { OPERATORS, detectOperatorByPrefix } from './src/constants/operators';
import { api } from './src/services/api';

export default function App() {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [amount, setAmount] = useState('100');
  const [walletBalance, setWalletBalance] = useState(44905.00);
  const [detectedOp, setDetectedOp] = useState(null);
  const [loading, setLoading] = useState(false);

  const handlePhoneChange = (text) => {
    setPhoneNumber(text);
    const op = detectOperatorByPrefix(text);
    setDetectedOp(op);
  };

  const faceVal = parseFloat(amount) || 0;
  const commPct = detectedOp ? detectedOp.defaultCommission : 5.0;
  const commAmount = (faceVal * commPct) / 100;
  const netDebited = faceVal - commAmount;

  const handleRecharge = async () => {
    if (!detectedOp) {
      Alert.alert('تنبيه', 'الرجاء إدخال رقم هاتف جزائري صالح (موبيليس 06، جازي 07، أوريدو 05)');
      return;
    }
    if (netDebited > walletBalance) {
      Alert.alert('رصيد غير كافٍ', `المبلغ المطلوب بعد الخصم: ${netDebited} د.ج`);
      return;
    }

    setLoading(true);
    try {
      const res = await api.recharge({
        user_id: 2,
        phone_number: phoneNumber,
        face_value: faceVal,
        operator_id: detectedOp.id
      });

      if (res.success) {
        Alert.alert(
          'نجاح الشحن!',
          `تم الشحن بنجاح لرقم: ${phoneNumber}\nالقيمة: ${faceVal} د.ج\nالمخصوم من محفظتك: ${netDebited} د.ج\nربحك الفوري: +${commAmount} د.ج`
        );
        setWalletBalance(res.data.new_wallet_balance);
        setPhoneNumber('');
      } else {
        Alert.alert('خطأ', res.error || 'فشلت العملية');
      }
    } catch (e) {
      Alert.alert('خطأ في الاتصال', e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#00662e" />
      
      {/* Algerian Art Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>رازيق تليكوم | Razik Telecom</Text>
        <Text style={styles.headerSubtitle}>تطبيق الموزعين ونقاط البيع المعتمدة</Text>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>رصيد المحفظة المتوفر</Text>
          <Text style={styles.balanceValue}>{walletBalance.toLocaleString()} د.ج</Text>
          <Text style={styles.balanceHint}>خصم تلقائي للعمولة عند كل عملية شحن</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Recharge Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>شحن فليكسي سريع</Text>

          <Text style={styles.inputLabel}>رقم هاتف الزبون</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="0661234567"
              keyboardType="phone-pad"
              value={phoneNumber}
              onChangeText={handlePhoneChange}
            />
            {detectedOp && (
              <View style={[styles.opBadge, { backgroundColor: detectedOp.color }]}>
                <Text style={styles.opBadgeText}>{detectedOp.nameAr}</Text>
              </View>
            )}
          </View>

          {/* Quick Amounts */}
          <Text style={styles.inputLabel}>اختر المبلغ</Text>
          <View style={styles.chipsRow}>
            {['100', '200', '500', '1000', '2000'].map((val) => (
              <TouchableOpacity
                key={val}
                style={[styles.chip, amount === val && styles.chipActive]}
                onPress={() => setAmount(val)}
              >
                <Text style={[styles.chipText, amount === val && styles.chipTextActive]}>
                  {val}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Real-time Commission Breakdown */}
          <View style={styles.breakdownBox}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownText}>قيمة الشحن للزبون:</Text>
              <Text style={styles.breakdownBold}>{faceVal} د.ج</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownGreen}>نسبة عمولتك ({commPct}%):</Text>
              <Text style={styles.breakdownGreen}>-{commAmount.toFixed(2)} د.ج</Text>
            </View>
            <View style={[styles.breakdownRow, styles.breakdownDivider]}>
              <Text style={styles.breakdownTotal}>المخصوم من محفظتك:</Text>
              <Text style={styles.breakdownTotal}>{netDebited.toFixed(2)} د.ج</Text>
            </View>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[styles.submitButton, (!detectedOp || loading) && styles.submitButtonDisabled]}
            disabled={!detectedOp || loading}
            onPress={handleRecharge}
          >
            <Text style={styles.submitButtonText}>
              {loading ? 'جاري الشحن...' : `تأكيد الشحن (${netDebited.toFixed(0)} د.ج)`}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f5f9',
  },
  header: {
    backgroundColor: '#008a3e',
    padding: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#d1fae5',
    textAlign: 'center',
    marginTop: 4,
  },
  balanceCard: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 18,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
  },
  balanceLabel: {
    color: '#e2e8f0',
    fontSize: 12,
  },
  balanceValue: {
    color: '#ffffff',
    fontSize: 26,
    fontWeight: '900',
    marginVertical: 4,
  },
  balanceHint: {
    color: '#fef08a',
    fontSize: 11,
    fontWeight: '600',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 18,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 16,
    textAlign: 'right',
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 6,
    textAlign: 'right',
  },
  inputRow: {
    position: 'relative',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'right',
  },
  opBadge: {
    position: 'absolute',
    left: 10,
    top: 10,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  opBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  chipsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  chip: {
    flex: 1,
    paddingVertical: 8,
    marginHorizontal: 3,
    backgroundColor: '#f1f5f9',
    borderRadius: 10,
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: '#008a3e',
  },
  chipText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
  },
  chipTextActive: {
    color: '#ffffff',
  },
  breakdownBox: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: 14,
    padding: 14,
    marginBottom: 18,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 3,
  },
  breakdownText: {
    fontSize: 12,
    color: '#475569',
  },
  breakdownBold: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  breakdownGreen: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#059669',
  },
  breakdownDivider: {
    borderTopWidth: 1,
    borderTopColor: '#a7f3d0',
    paddingTop: 8,
    marginTop: 6,
  },
  breakdownTotal: {
    fontSize: 14,
    fontWeight: '900',
    color: '#065f46',
  },
  submitButton: {
    backgroundColor: '#008a3e',
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
    shadowColor: '#008a3e',
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDisabled: {
    backgroundColor: '#94a3b8',
    shadowOpacity: 0,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
  },
});
