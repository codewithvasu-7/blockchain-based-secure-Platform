function getErrorMessage(error) {
  if (!error) {
    return "Unknown error";
  }

  if (
    error.code === 4001 ||
    error.code === "ACTION_REJECTED"
  ) {
    return "Transaction rejected.";
  }

  if (error.reason) {
    return error.reason;
  }

  if (error.shortMessage) {
    return error.shortMessage;
  }

  if (
    error.info &&
    error.info.error &&
    error.info.error.message
  ) {
    return error.info.error.message;
  }

  if (error.message) {
    return error.message;
  }

  return "Blockchain transaction failed.";
}

module.exports = {
  getErrorMessage
};