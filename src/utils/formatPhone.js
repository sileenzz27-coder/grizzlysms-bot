function formatPhoneNumber(phone) {
  if (!phone) return phone;
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.startsWith('1')) {
    return `+${cleaned}`;
  }
  return `+1${cleaned}`;
}

module.exports = { formatPhoneNumber };
