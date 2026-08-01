class PrintError extends Error {
  constructor(message, statusCode = 500, code = 'PRINT_ERROR') {
    super(message);
    this.name = 'PrintError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

module.exports = { PrintError };
